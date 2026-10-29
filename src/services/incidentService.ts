// JalRakshak — Incident Database & Realtime Service
// Bridges Supabase PostgreSQL backend with the reactive client store

import { supabase } from '../lib/supabase';
import type { Incident, StatusEntry, HazardCategory, Severity, IncidentStatus, VerificationStatus } from '../data/types';
import {
  getIncidents as getLocalIncidents,
  addIncident as addLocalIncident,
  updateIncidentStatus as updateLocalIncidentStatus,
  updateIncidentVerification as updateLocalIncidentVerification,
  generateIncidentId,
} from '../data/store';
import { uploadIncidentPhoto, deleteIncidentPhoto } from './storageService';

/**
 * Transforms a Supabase incident row and its history entries into the frontend Incident model.
 */
export function mapRowToIncident(row: any, historyEntries: StatusEntry[] = []): Incident {
  return {
    id: row.id,
    category: row.category as HazardCategory,
    severity: row.severity as Severity,
    title: row.title,
    description: row.description,
    location: {
      road: row.road,
      area: row.area,
      coordinates: {
        lat: Number(row.latitude),
        lng: Number(row.longitude),
      },
    },
    observedAt: row.observed_at,
    lastVerifiedAt: row.last_verified_at,
    reportedAt: row.reported_at,
    status: row.status as IncidentStatus,
    verification: row.verification as VerificationStatus,
    source: (row.reporter_id ? 'community' : (row.is_historical ? 'survey' : 'community')),
    isHistorical: Boolean(row.is_historical),
    isActive: Boolean(row.is_active),
    reporterAlias: row.reporter_alias || 'Anonymous Citizen',
    photoPlaceholder: Boolean(row.photo_url || row.photo_storage_path),
    photoDataUrl: row.photo_url || undefined,
    statusHistory: historyEntries.length > 0 ? historyEntries : [
      {
        status: row.status as IncidentStatus,
        timestamp: row.reported_at || row.created_at,
        actor: row.reporter_alias || 'Initial Report',
      }
    ],
  };
}

/**
 * Fetches incidents from Supabase if configured, or falls back to local storage store.
 */
export async function fetchIncidents(): Promise<Incident[]> {
  if (!supabase) {
    return getLocalIncidents();
  }

  try {
    const { data: incidentRows, error: incidentErr } = await (supabase as any)
      .from('incidents')
      .select('*')
      .order('reported_at', { ascending: false });

    if (incidentErr) {
      console.error('Supabase fetchIncidents error:', incidentErr.message);
      throw new Error(`Failed to fetch incidents from database: ${incidentErr.message}`);
    }

    if (!incidentRows) {
      return [];
    }

    // Fetch related status history
    const { data: historyRows } = await (supabase as any)
      .from('incident_status_history')
      .select('*')
      .order('timestamp', { ascending: true });

    const historyByIncident = ((historyRows as any[]) || []).reduce<Record<string, StatusEntry[]>>((acc, h: any) => {
      if (!acc[h.incident_id]) acc[h.incident_id] = [];
      acc[h.incident_id].push({
        status: h.status as IncidentStatus,
        timestamp: h.timestamp,
        actor: h.actor_name,
        note: h.note || undefined,
      });
      return acc;
    }, {});

    return (incidentRows as any[]).map((row: any) => mapRowToIncident(row, historyByIncident[row.id] || []));
  } catch (err) {
    console.warn('Network error in fetchIncidents, using local store:', err);
    return getLocalIncidents();
  }
}

export interface CreateIncidentParams {
  category: HazardCategory;
  severity: Severity;
  road: string;
  area: string;
  description: string;
  title?: string;
  observedAt?: string;
  coordinates?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  reporterId?: string | null;
  reporterUserId?: string | null;
  reporterAlias?: string;
  photoFile?: File | null;
}

/**
 * Creates an incident in Supabase (including photo upload) and updates the local store.
 */
export async function createIncident(
  params: CreateIncidentParams,
  photoFile?: File
): Promise<{ incident: Incident | null; error: string | null }> {
  const id = generateIncidentId();
  const now = new Date().toISOString();
  let photoUrl: string | null = null;
  let photoStoragePath: string | null = null;
  const targetPhoto = photoFile || params.photoFile;
  const lat = params.coordinates?.lat ?? params.latitude ?? 28.6139;
  const lng = params.coordinates?.lng ?? params.longitude ?? 77.2090;
  const reporterId = params.reporterUserId ?? params.reporterId ?? null;
  const title = params.title || `${params.category.replace('_', ' ').toUpperCase()} on ${params.road}`;

  // 1. Upload photo if provided
  if (targetPhoto) {
    const uploadResult = await uploadIncidentPhoto(targetPhoto, id);
    if (uploadResult.error) {
      return { incident: null, error: uploadResult.error };
    }
    photoUrl = uploadResult.url;
    photoStoragePath = uploadResult.path;
  }

  // 2. Prepare model
  const newIncident: Incident = {
    id,
    category: params.category,
    severity: params.severity,
    title,
    description: params.description,
    location: {
      road: params.road,
      area: params.area,
      coordinates: {
        lat,
        lng,
      },
    },
    observedAt: params.observedAt ? new Date(params.observedAt).toISOString() : now,
    lastVerifiedAt: now,
    reportedAt: now,
    status: 'reported',
    verification: 'unverified',
    source: 'community',
    isHistorical: false,
    isActive: true,
    reporterAlias: params.reporterAlias || 'Demo Citizen',
    photoPlaceholder: Boolean(photoUrl),
    photoDataUrl: photoUrl || undefined,
    statusHistory: [
      {
        status: 'reported',
        timestamp: now,
        actor: params.reporterAlias || 'Citizen Reporter',
        note: 'Initial community submission',
      }
    ],
  };

  // 3. Save to Supabase if configured
  if (supabase) {
    try {
      const { error: insertErr } = await (supabase as any).from('incidents').insert({
        id,
        title: newIncident.title,
        description: newIncident.description,
        category: newIncident.category,
        severity: newIncident.severity,
        status: newIncident.status,
        verification: newIncident.verification,
        road: newIncident.location.road,
        area: newIncident.location.area,
        latitude: newIncident.location.coordinates.lat,
        longitude: newIncident.location.coordinates.lng,
        observed_at: newIncident.observedAt,
        last_verified_at: newIncident.lastVerifiedAt,
        reported_at: newIncident.reportedAt,
        reporter_id: reporterId,
        reporter_alias: newIncident.reporterAlias || 'Citizen Reporter',
        photo_url: photoUrl,
        photo_storage_path: photoStoragePath,
        is_historical: false,
        is_active: true,
      });

      if (insertErr) {
        // Cleanup photo if database insert fails
        if (photoStoragePath) {
          await deleteIncidentPhoto(photoStoragePath);
        }
        return { incident: null, error: `Database insert failed: ${insertErr.message}` };
      }

      // Record initial status history
      await (supabase as any).from('incident_status_history').insert({
        incident_id: id,
        status: 'reported',
        previous_status: null,
        actor_id: reporterId,
        actor_name: newIncident.reporterAlias || 'Citizen Reporter',
        note: 'Initial submission',
      });
    } catch (err: any) {
      if (photoStoragePath) {
        await deleteIncidentPhoto(photoStoragePath);
      }
      return { incident: null, error: err?.message || 'Failed to submit incident to database.' };
    }
  }

  // 4. Update local store cache and notify listeners
  addLocalIncident(newIncident);
  return { incident: newIncident, error: null };
}

/**
 * Updates an incident's lifecycle status in Supabase atomically via RPC and syncs with local store.
 */
export async function updateIncidentStatusBackend(
  incidentId: string,
  newStatus: IncidentStatus,
  actorName: string,
  note?: string,
  actorId?: string | null
): Promise<{ updated: Incident | null; error: string | null }> {
  const isDeactivated = newStatus === 'resolution_verified' || newStatus === 'outdated';
  const now = new Date().toISOString();

  if (supabase) {
    try {
      // 1. Attempt atomic transactional RPC update
      const { error: rpcErr } = await (supabase as any).rpc(
        'update_incident_status_atomic',
        {
          p_incident_id: incidentId,
          p_new_status: newStatus,
          p_note: note || null,
        }
      );

      if (rpcErr) {
        // Fallback for database instances where RPC migration hasn't been executed
        if (rpcErr.message && rpcErr.message.includes('function') && rpcErr.message.includes('does not exist')) {
          const { error: updateErr } = await (supabase as any)
            .from('incidents')
            .update({
              status: newStatus,
              is_active: !isDeactivated,
              last_verified_at: now,
            })
            .eq('id', incidentId);

          if (updateErr) {
            return { updated: null, error: `Database update failed: ${updateErr.message}` };
          }

          const { error: historyErr } = await (supabase as any).from('incident_status_history').insert({
            incident_id: incidentId,
            status: newStatus,
            actor_id: actorId || null,
            actor_name: actorName,
            note: note || null,
            timestamp: now,
          });

          if (historyErr) {
            console.warn('Status history insert failed:', historyErr.message);
          }
        } else {
          return { updated: null, error: rpcErr.message };
        }
      }
    } catch (err: any) {
      return { updated: null, error: err?.message || 'Network error updating incident status.' };
    }
  }

  const localUpdated = updateLocalIncidentStatus(incidentId, newStatus, actorName, note);
  return { updated: localUpdated || null, error: null };
}

/**
 * Updates incident verification in Supabase and syncs with local store.
 */
export async function updateIncidentVerificationBackend(
  incidentId: string,
  verification: VerificationStatus,
  actorName: string
): Promise<{ updated: Incident | null; error: string | null }> {
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { error: verifyErr } = await (supabase as any)
        .from('incidents')
        .update({
          verification,
          last_verified_at: now,
        })
        .eq('id', incidentId);

      if (verifyErr) {
        return { updated: null, error: `Database update failed: ${verifyErr.message}` };
      }
    } catch (err: any) {
      return { updated: null, error: err?.message || 'Network error updating verification.' };
    }
  }

  const localUpdated = updateLocalIncidentVerification(incidentId, verification, actorName);
  return { updated: localUpdated || null, error: null };
}

/**
 * Subscribes to Realtime updates on the `incidents` table.
 */
export function subscribeToIncidentsRealtime(onUpdate: () => void): { unsubscribe: () => void } {
  if (!supabase) {
    return { unsubscribe: () => {} };
  }

  const client = supabase;
  const channel = client
    .channel('public:incidents')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'incidents' },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}
