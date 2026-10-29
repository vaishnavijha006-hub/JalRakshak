import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { severityToRiskLevel, filterIncidents } from '../src/data/store';
import type { Severity, RiskLevel } from '../src/data/types';

describe('Risk-Level and Severity Mapping', () => {
  it('maps every valid Severity to its corresponding RiskLevel', () => {
    const cases: Array<[Severity, RiskLevel]> = [
      ['low', 'low'],
      ['medium', 'moderate'], // The core mapping discrepancy resolved
      ['high', 'high'],
      ['critical', 'critical'],
    ];

    for (const [severity, expectedRiskLevel] of cases) {
      const mapped = severityToRiskLevel(severity);
      assert.equal(
        mapped,
        expectedRiskLevel,
        `Expected severity "${severity}" to map to risk level "${expectedRiskLevel}", got "${mapped}"`
      );
    }
  });

  it('filters incidents by riskLevels: ["moderate"] and correctly matches "medium" severity incidents', () => {
    // The previous bug: filter looked for i.severity in ['moderate'], which failed because severity is 'medium'
    const filtered = filterIncidents({ riskLevels: ['moderate'] });
    assert.ok(filtered.length > 0, 'Expected at least one moderate risk incident');
    for (const incident of filtered) {
      assert.equal(
        incident.severity,
        'medium',
        `Incident ${incident.id} should have severity "medium", had "${incident.severity}"`
      );
      assert.equal(severityToRiskLevel(incident.severity), 'moderate');
    }
  });

  it('filters incidents by riskLevels: ["critical"]', () => {
    const filtered = filterIncidents({ riskLevels: ['critical'] });
    assert.ok(filtered.length > 0, 'Expected critical incidents');
    for (const incident of filtered) {
      assert.equal(incident.severity, 'critical');
    }
  });

  it('filters incidents by multiple riskLevels: ["low", "high"]', () => {
    const filtered = filterIncidents({ riskLevels: ['low', 'high'] });
    for (const incident of filtered) {
      const risk = severityToRiskLevel(incident.severity);
      assert.ok(
        risk === 'low' || risk === 'high',
        `Expected risk level to be low or high, got ${risk}`
      );
    }
  });

  it('passes all incidents when riskLevels is an empty array or undefined', () => {
    const unfiltered = filterIncidents({});
    const emptyFilter = filterIncidents({ riskLevels: [] });
    assert.equal(unfiltered.length, emptyFilter.length);
  });

  it('correctly combines riskLevels with category filters', () => {
    const filtered = filterIncidents({
      riskLevels: ['moderate'],
      categories: ['pothole'],
    });

    for (const incident of filtered) {
      assert.equal(incident.category, 'pothole');
      assert.equal(severityToRiskLevel(incident.severity), 'moderate');
    }
  });
});
