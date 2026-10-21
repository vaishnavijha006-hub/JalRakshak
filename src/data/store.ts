// JalRakshak — Data Store with localStorage persistence
import type { Incident, HiddenHazard, RoutePlan, MetricSummary, FilterState } from './types';
import { DEMO_INCIDENTS, DEMO_HIDDEN_HAZARDS, DEMO_ROUTES } from './incidents';

const STORAGE_KEYS = {
  incidents: 'jalrakshak_incidents',
  hiddenHazards: 'jalrakshak_hidden_hazards',
  routes: 'jalrakshak_routes',
  userReports: 'jalrakshak_user_reports',
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch { /* ignore parse errors */ }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

// Initialize store
let incidents: Incident[] = loadFromStorage(STORAGE_KEYS.incidents, DEMO_INCIDENTS);
let hiddenHazards: HiddenHazard[] = loadFromStorage(STORAGE_KEYS.hiddenHazards, DEMO_HIDDEN_HAZARDS);
let routes: RoutePlan[] = loadFromStorage(STORAGE_KEYS.routes, DEMO_ROUTES);

// Persist initial data if not already stored
if (!localStorage.getItem(STORAGE_KEYS.incidents)) {
  saveToStorage(STORAGE_KEYS.incidents, incidents);
}

// === READ operations ===

export function getIncidents(): Incident[] {
  return [...incidents];
}

export function getIncidentById(id: string): Incident | undefined {
  return incidents.find(inc => inc.id === id);
}

export function getHiddenHazards(): HiddenHazard[] {
  return [...hiddenHazards];
}

export function getRoutes(): RoutePlan[] {
  return [...routes];
}

export function getRoutePlanById(id: string): RoutePlan | undefined {
  return routes.find(r => r.id === id);
}

// === COMPUTED metrics ===

export function getMetrics(): MetricSummary {
  const active = incidents.filter(i => i.isActive);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  return {
    totalHazards: incidents.length,
    activeWaterlogging: active.filter(i => i.category === 'waterlogging').length,
    hiddenHazards: hiddenHazards.length,
    pendingVerification: active.filter(i => i.verification === 'unverified').length,
    resolvedThisWeek: incidents.filter(i =>
      i.status === 'resolution_verified' &&
      i.lastVerifiedAt >= weekAgo
    ).length,
    criticalAlerts: active.filter(i => i.severity === 'critical').length,
  };
}

// === FILTER operations ===

export function filterIncidents(filters: Partial<FilterState>): Incident[] {
  let result = [...incidents];

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    result = result.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.location.road.toLowerCase().includes(q) ||
      i.location.area.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  }

  if (filters.categories && filters.categories.length > 0) {
    result = result.filter(i => filters.categories!.includes(i.category));
  }

  if (filters.verificationStatuses && filters.verificationStatuses.length > 0) {
    result = result.filter(i => filters.verificationStatuses!.includes(i.verification));
  }

  if (filters.incidentStatuses && filters.incidentStatuses.length > 0) {
    result = result.filter(i => filters.incidentStatuses!.includes(i.status));
  }

  if (filters.showHistorical === true && !filters.showActive) {
    result = result.filter(i => i.isHistorical);
  } else if (filters.showActive === true && !filters.showHistorical) {
    result = result.filter(i => !i.isHistorical && i.isActive);
  }

  if (filters.showResolved === false) {
    result = result.filter(i => i.status !== 'resolution_verified' && i.status !== 'outdated');
  }

  return result;
}

// === WRITE operations ===

export function addIncident(incident: Incident): void {
  incidents = [incident, ...incidents];
  saveToStorage(STORAGE_KEYS.incidents, incidents);
}

export function updateIncidentStatus(
  id: string,
  status: Incident['status'],
  actor: string,
  note?: string
): Incident | undefined {
  const idx = incidents.findIndex(i => i.id === id);
  if (idx === -1) return undefined;

  const updated = { ...incidents[idx] };
  updated.status = status;
  updated.statusHistory = [
    ...updated.statusHistory,
    { status, timestamp: new Date().toISOString(), actor, note },
  ];

  if (status === 'resolution_verified' || status === 'outdated') {
    updated.isActive = false;
  }
  updated.lastVerifiedAt = new Date().toISOString();

  incidents = [...incidents];
  incidents[idx] = updated;
  saveToStorage(STORAGE_KEYS.incidents, incidents);
  return updated;
}

export function updateIncidentVerification(
  id: string,
  verification: Incident['verification'],
  _actor: string
): Incident | undefined {
  const idx = incidents.findIndex(i => i.id === id);
  if (idx === -1) return undefined;

  const updated = { ...incidents[idx] };
  updated.verification = verification;
  updated.lastVerifiedAt = new Date().toISOString();

  incidents = [...incidents];
  incidents[idx] = updated;
  saveToStorage(STORAGE_KEYS.incidents, incidents);
  return updated;
}

// === RESET ===

export function resetDemoData(): void {
  incidents = [...DEMO_INCIDENTS];
  hiddenHazards = [...DEMO_HIDDEN_HAZARDS];
  routes = [...DEMO_ROUTES];
  saveToStorage(STORAGE_KEYS.incidents, incidents);
  saveToStorage(STORAGE_KEYS.hiddenHazards, hiddenHazards);
  saveToStorage(STORAGE_KEYS.routes, routes);
  localStorage.removeItem(STORAGE_KEYS.userReports);
}

// === Utility: generate next ID ===

export function generateIncidentId(): string {
  const maxNum = incidents.reduce((max, inc) => {
    const match = inc.id.match(/INC-(\d+)/);
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0);
  return `INC-${String(maxNum + 1).padStart(3, '0')}`;
}
