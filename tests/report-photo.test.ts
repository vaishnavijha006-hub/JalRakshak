import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Validation logic matching ReportPage constraints
const PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validatePhoto(file: { name: string; type: string; size: number }): { valid: boolean; error?: string } {
  if (!PHOTO_ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Please choose a JPEG, PNG, WebP, or GIF image.`,
    };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return {
      valid: false,
      error: `Photo is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 2 MB.`,
    };
  }
  return { valid: true };
}

function validateReportForm(form: {
  road: string;
  area: string;
  description: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!form.road.trim()) errors.road = 'Road name is required';
  if (!form.area.trim()) errors.area = 'Area / landmark is required';
  if (!form.description.trim()) {
    errors.description = 'Description is required';
  } else if (form.description.trim().length < 10) {
    errors.description = 'Please provide a more detailed description';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

describe('Report Validation & Photo Constraints', () => {
  it('accepts valid image types under 2MB', () => {
    for (const type of PHOTO_ALLOWED_TYPES) {
      const result = validatePhoto({
        name: `test-hazard.${type.split('/')[1]}`,
        type,
        size: 500 * 1024, // 500 KB
      });
      assert.equal(result.valid, true, `Type ${type} should be accepted`);
      assert.equal(result.error, undefined);
    }
  });

  it('rejects unsupported file types (e.g. PDF, executable, video)', () => {
    const disallowed = ['application/pdf', 'video/mp4', 'text/plain', 'image/svg+xml'];
    for (const type of disallowed) {
      const result = validatePhoto({
        name: 'document.pdf',
        type,
        size: 100 * 1024,
      });
      assert.equal(result.valid, false, `Type ${type} must be rejected`);
      assert.ok(result.error?.includes('Unsupported file type'));
    }
  });

  it('rejects image files exceeding 2 MB size cap', () => {
    const oversize = validatePhoto({
      name: 'giant-photo.jpg',
      type: 'image/jpeg',
      size: 3 * 1024 * 1024, // 3 MB
    });
    assert.equal(oversize.valid, false);
    assert.ok(oversize.error?.includes('too large'));
  });

  it('accepts image exactly at 2 MB limit', () => {
    const boundary = validatePhoto({
      name: 'limit.png',
      type: 'image/png',
      size: 2 * 1024 * 1024,
    });
    assert.equal(boundary.valid, true);
  });

  it('validates report form fields: rejects empty road, area, or description', () => {
    const emptyForm = validateReportForm({ road: '', area: '', description: '' });
    assert.equal(emptyForm.valid, false);
    assert.ok(emptyForm.errors.road);
    assert.ok(emptyForm.errors.area);
    assert.ok(emptyForm.errors.description);
  });

  it('rejects descriptions shorter than 10 characters', () => {
    const shortDesc = validateReportForm({
      road: 'Ring Road',
      area: 'Lajpat Nagar',
      description: 'Pothole', // 7 chars
    });
    assert.equal(shortDesc.valid, false);
    assert.ok(shortDesc.errors.description.includes('more detailed'));
  });

  it('accepts valid report form with adequate details', () => {
    const valid = validateReportForm({
      road: 'Mathura Road near DPS',
      area: 'Nizamuddin',
      description: 'Large broken sewer cover partially dislodged in the middle lane.',
    });
    assert.equal(valid.valid, true);
    assert.equal(Object.keys(valid.errors).length, 0);
  });
});
