import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePhotoFile, generateStoragePath } from '../src/services/storageService';
import { mapRowToIncident, fetchIncidents, createIncident, updateIncidentStatusBackend, updateIncidentVerificationBackend } from '../src/services/incidentService';
import { signUpWithEmail, signInWithEmail, signOutUser, fetchProfile } from '../src/services/authService';

describe('Storage Service', () => {
  it('validates supported photo MIME types within 5MB limit', () => {
    const validJpg = new File(['test image data'], 'pothole.jpg', { type: 'image/jpeg' });
    const validPng = new File(['test image data'], 'waterlog.png', { type: 'image/png' });
    const validWebp = new File(['test image data'], 'hazard.webp', { type: 'image/webp' });

    assert.deepEqual(validatePhotoFile(validJpg), { valid: true });
    assert.deepEqual(validatePhotoFile(validPng), { valid: true });
    assert.deepEqual(validatePhotoFile(validWebp), { valid: true });
  });

  it('rejects unsupported file formats', () => {
    const pdfFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
    const exeFile = new File(['MZ'], 'malware.exe', { type: 'application/x-msdownload' });
    const textFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    const pdfRes = validatePhotoFile(pdfFile);
    assert.equal(pdfRes.valid, false);
    assert.match(pdfRes.error || '', /Unsupported file type/);

    const exeRes = validatePhotoFile(exeFile);
    assert.equal(exeRes.valid, false);

    const txtRes = validatePhotoFile(textFile);
    assert.equal(txtRes.valid, false);
  });

  it('rejects image files exceeding 5MB size limit', () => {
    // Mock a 6MB file
    const largeFile = {
      name: 'large.jpg',
      type: 'image/jpeg',
      size: 6 * 1024 * 1024,
    } as unknown as File;

    const res = validatePhotoFile(largeFile);
    assert.equal(res.valid, false);
    assert.match(res.error || '', /Photo exceeds 5 MB/);
  });

  it('generates unique collision-resistant storage paths with normalized filenames', () => {
    const path1 = generateStoragePath('INC-001', 'My Pothole Photo.JPEG');
    const path2 = generateStoragePath('INC-001', 'My Pothole Photo.JPEG');

    assert.ok(path1.startsWith('incidents/INC-001/'));
    assert.ok(path1.endsWith('.jpeg'));
    // Path should sanitize spaces and special characters
    assert.ok(!path1.includes(' '));
    // Repeated calls generate distinct timestamps/entropy
    assert.notEqual(path1, path2);
  });

  it('safely handles deleteIncidentPhoto in demo mode without error', async () => {
    const { deleteIncidentPhoto } = await import('../src/services/storageService');
    const result = await deleteIncidentPhoto('local_demo_123_test.jpg');
    assert.equal(result, true);
  });
});

describe('Incident Service & Row Mapping', () => {
  it('maps Supabase PostgreSQL row to frontend Incident interface accurately', () => {
    const mockRow = {
      id: 'INC-999',
      title: 'Waterlogging on Ring Road',
      category: 'waterlogging',
      severity: 'critical',
      road: 'Ring Road',
      area: 'Lajpat Nagar',
      latitude: '28.5700',
      longitude: '77.2400',
      description: 'Severe 2-foot water accumulation blocking left two lanes.',
      reported_at: '2026-07-15T10:00:00Z',
      observed_at: '2026-07-15T09:30:00Z',
      last_verified_at: '2026-07-15T10:30:00Z',
      status: 'under_verification',
      verification: 'verified',
      reporter_alias: 'Citizen Priya',
      reporter_id: 'user-uuid-123',
      photo_url: 'https://example.supabase.co/storage/v1/object/public/incident-photos/pothole.jpg',
      is_historical: false,
      is_active: true,
    };

    const incident = mapRowToIncident(mockRow);

    assert.equal(incident.id, 'INC-999');
    assert.equal(incident.category, 'waterlogging');
    assert.equal(incident.severity, 'critical');
    assert.equal(incident.title, 'Waterlogging on Ring Road');
    assert.equal(incident.location.road, 'Ring Road');
    assert.equal(incident.location.area, 'Lajpat Nagar');
    assert.equal(incident.location.coordinates.lat, 28.57);
    assert.equal(incident.location.coordinates.lng, 77.24);
    assert.equal(incident.status, 'under_verification');
    assert.equal(incident.verification, 'verified');
    assert.equal(incident.source, 'community');
    assert.equal(incident.isActive, true);
    assert.equal(incident.isHistorical, false);
    assert.equal(incident.reporterAlias, 'Citizen Priya');
    assert.equal(incident.photoPlaceholder, true);
    assert.equal(incident.photoDataUrl, 'https://example.supabase.co/storage/v1/object/public/incident-photos/pothole.jpg');
    assert.equal(incident.statusHistory.length, 1);
    assert.equal(incident.statusHistory[0].status, 'under_verification');
  });

  it('gracefully falls back to local store when Supabase is unconfigured', async () => {
    const incidents = await fetchIncidents();
    assert.ok(Array.isArray(incidents));
    assert.ok(incidents.length > 0);
    assert.ok(incidents.some(i => i.id === 'INC-001'));
  });

  it('updates incident status in local store and status history', async () => {
    const res = await updateIncidentStatusBackend('INC-001', 'repair_reported', 'QA Tester', 'Repair crew on site');
    assert.equal(res.error, null);
    assert.ok(res.updated);
    assert.equal(res.updated.status, 'repair_reported');

    const lastEntry = res.updated.statusHistory[res.updated.statusHistory.length - 1];
    assert.equal(lastEntry.status, 'repair_reported');
    assert.equal(lastEntry.actor, 'QA Tester');
    assert.equal(lastEntry.note, 'Repair crew on site');
  });

  it('creates an incident in local demo mode fallback', async () => {
    const res = await createIncident({
      category: 'pothole',
      severity: 'high',
      road: 'Barakhamba Road',
      area: 'Connaught Place',
      description: 'Deep road cavity near metro gate 2',
      latitude: 28.6330,
      longitude: 77.2260,
    });
    assert.equal(res.error, null);
    assert.ok(res.incident);
    assert.equal(res.incident.location.road, 'Barakhamba Road');
    assert.equal(res.incident.severity, 'high');
  });

  it('updates incident verification status', async () => {
    const res = await updateIncidentVerificationBackend('INC-001', 'verified', 'Inspector Sharma');
    assert.equal(res.error, null);
    assert.ok(res.updated);
    assert.equal(res.updated.verification, 'verified');
  });

  it('handles status update for non-existent incident gracefully', async () => {
    const res = await updateIncidentStatusBackend('INC-NON-EXISTENT', 'resolution_verified', 'QA Tester');
    assert.equal(res.updated, null);
  });
});

describe('Authentication Service Fallbacks', () => {
  it('returns graceful message when signing in unconfigured', async () => {
    const res = await signInWithEmail('test@example.com', 'password123');
    // In unconfigured demo mode, error indicates demo mode
    assert.ok(res.error !== null);
    assert.match(res.error, /demo mode|Supabase is not configured/);
  });

  it('returns graceful message when signing up unconfigured', async () => {
    const res = await signUpWithEmail('test@example.com', 'password123', 'Test User');
    assert.ok(res.error !== null);
    assert.match(res.error, /demo mode|Supabase is not configured/);
  });

  it('signOutUser handles unconfigured state without throwing', async () => {
    const res = await signOutUser();
    assert.equal(res.error, null);
  });

  it('fetchProfile returns null when unconfigured', async () => {
    const profile = await fetchProfile('non-existent-user');
    assert.equal(profile, null);
  });
});
