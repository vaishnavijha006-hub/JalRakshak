import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage in global scope before importing store if not present
const storageMap = new Map<string, string>();
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => storageMap.set(key, String(value)),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
    get length() { return storageMap.size; },
    key: (_i: number) => null,
  };
}

import {
  getIncidents,
  getIncidentById,
  addIncident,
  updateIncidentStatus,
  updateIncidentVerification,
  generateIncidentId,
  getMetrics,
  resetDemoData,
} from '../src/data/store';
import type { Incident } from '../src/data/types';

describe('Store Operations & Persistence', () => {
  beforeEach(() => {
    resetDemoData();
  });

  it('initializes store with demo incidents', () => {
    const list = getIncidents();
    assert.ok(list.length >= 8, `Expected at least 8 demo incidents, found ${list.length}`);
    const first = getIncidentById(list[0].id);
    assert.ok(first, 'Expected to retrieve first incident by id');
    assert.equal(first?.id, list[0].id);
  });

  it('generates sequential incident IDs correctly', () => {
    const nextId = generateIncidentId();
    assert.match(nextId, /^INC-\d{3,}$/, 'Generated ID should match INC-XXX format');
  });

  it('adds a new incident, prepends to list, and persists to localStorage', () => {
    const beforeCount = getIncidents().length;
    const newId = generateIncidentId();
    const now = new Date().toISOString();

    const newIncident: Incident = {
      id: newId,
      category: 'pothole',
      severity: 'high',
      title: 'Deep pothole near Pragati Maidan Gate 4',
      description: 'Severe pothole approximately 25cm deep on carriageway.',
      location: {
        road: 'Mathura Road',
        area: 'Pragati Maidan',
        coordinates: { lat: 28.6167, lng: 77.2467 },
      },
      observedAt: now,
      lastVerifiedAt: now,
      reportedAt: now,
      status: 'reported',
      verification: 'unverified',
      source: 'community',
      isHistorical: false,
      isActive: true,
      reporterAlias: 'Test User',
      photoPlaceholder: true,
      photoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      statusHistory: [
        { status: 'reported', timestamp: now, actor: 'Test User', note: 'Automated test submission' },
      ],
    };

    addIncident(newIncident);

    const afterList = getIncidents();
    assert.equal(afterList.length, beforeCount + 1, 'Incident list should grow by 1');
    assert.equal(afterList[0].id, newId, 'Newly added incident should be prepended');
    assert.equal(afterList[0].photoDataUrl, newIncident.photoDataUrl, 'Photo data URL should be preserved');

    // Verify localStorage persistence
    const storedRaw = globalThis.localStorage.getItem('jalrakshak_incidents');
    assert.ok(storedRaw, 'Incidents should be saved to localStorage');
    const stored = JSON.parse(storedRaw!);
    assert.equal(stored[0].id, newId);
  });

  it('updates incident status and records history', () => {
    const incidents = getIncidents();
    const target = incidents[0];
    const initialHistoryLen = target.statusHistory.length;

    const updated = updateIncidentStatus(
      target.id,
      'under_verification',
      'Test Reviewer',
      'Verification initiated by test suite'
    );

    assert.ok(updated, 'Update should return the updated incident');
    assert.equal(updated?.status, 'under_verification');
    assert.equal(updated?.statusHistory.length, initialHistoryLen + 1);

    const lastEntry = updated!.statusHistory[updated!.statusHistory.length - 1];
    assert.equal(lastEntry.status, 'under_verification');
    assert.equal(lastEntry.actor, 'Test Reviewer');
    assert.equal(lastEntry.note, 'Verification initiated by test suite');
  });

  it('marks incident isActive: false when status reaches resolution_verified or outdated', () => {
    const incidents = getIncidents();
    const target = incidents.find(i => i.isActive);
    assert.ok(target, 'Need an active incident to test deactivation');

    const updated = updateIncidentStatus(
      target!.id,
      'resolution_verified',
      'Municipal Field Inspector',
      'Repair verified in field'
    );

    assert.equal(updated?.isActive, false, 'resolution_verified incident must be marked inactive');
  });

  it('updates incident verification status and timestamp', () => {
    const incidents = getIncidents();
    const target = incidents[0];

    const updated = updateIncidentVerification(target.id, 'verified', 'Test Inspector');
    assert.equal(updated?.verification, 'verified');
    assert.ok(new Date(updated!.lastVerifiedAt).getTime() > 0);
  });

  it('computes metrics accurately from current incident data', () => {
    const metrics = getMetrics();
    const all = getIncidents();
    const active = all.filter(i => i.isActive);

    assert.equal(metrics.totalHazards, all.length);
    assert.equal(
      metrics.activeWaterlogging,
      active.filter(i => i.category === 'waterlogging').length
    );
    assert.equal(
      metrics.pendingVerification,
      active.filter(i => i.verification === 'unverified').length
    );
  });
});
