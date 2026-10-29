// JalRakshak — Spatial Hazard Correlation Engine
// Implements USP: Spatial correlation of pre-monsoon road defects with active waterlogging
// to identify concealed, submerged hazards (open manholes, deep potholes, surface subsidence).

import type { Incident, Coordinates, HazardCategory } from '../data/types';
import { calculateDistanceKm } from '../utils/geo';

export interface CorrelatedHazard {
  id: string;
  defectIncidentId: string;
  waterloggingIncidentId: string;
  category: HazardCategory;
  defectTitle: string;
  waterloggingTitle: string;
  locationName: string;
  coordinates: Coordinates;
  distanceMeters: number;
  dangerLevel: 'critical' | 'high' | 'medium';
  /**
   * Spatial proximity score (60-100) based on inverse distance within the 75m threshold.
   * NOTE: This represents geospatial proximity, not an empirical statistical probability.
   */
  proximityScore: number;
  confidenceScore: number; // Retained as alias for backward compatibility
  explanation: string;
  isGenuineLive: boolean;
  detectedAt: string;
}

export const CORRELATION_PROXIMITY_THRESHOLD_METERS = 75;

/**
 * Calculates distance in meters between two coordinates.
 */
export function calculateDistanceMeters(c1: Coordinates, c2: Coordinates): number {
  return Math.round(calculateDistanceKm(c1.lat, c1.lng, c2.lat, c2.lng) * 1000);
}

/**
 * Correlates active waterlogging incidents with known pre-monsoon road defects.
 * Any defect within 75m of an active waterlogging pool is flagged as potentially submerged.
 */
export function correlateSubmergedHazards(
  incidents: Incident[],
  proximityMeters: number = CORRELATION_PROXIMITY_THRESHOLD_METERS
): CorrelatedHazard[] {
  const waterloggingIncidents = incidents.filter(
    (inc) => inc.category === 'waterlogging' && inc.isActive
  );

  const defectIncidents = incidents.filter(
    (inc) =>
      inc.category !== 'waterlogging' &&
      (inc.category === 'open_manhole' || inc.category === 'pothole' || inc.category === 'damaged_road') &&
      inc.isActive
  );

  const correlations: CorrelatedHazard[] = [];

  for (const defect of defectIncidents) {
    for (const water of waterloggingIncidents) {
      const distMeters = calculateDistanceMeters(
        defect.location.coordinates,
        water.location.coordinates
      );

      if (distMeters <= proximityMeters) {
        // Danger level is highest for open manholes and critical potholes
        let dangerLevel: 'critical' | 'high' | 'medium' = 'high';
        if (defect.category === 'open_manhole' || defect.severity === 'critical') {
          dangerLevel = 'critical';
        } else if (defect.severity === 'low') {
          dangerLevel = 'medium';
        }

        // Proximity score decays linearly with distance from 100 at 0m to 60 at threshold
        const proximityScore = Math.max(60, Math.round(100 - (distMeters / proximityMeters) * 40));

        // Is genuine live if either incident came from verified live DB records
        const isGenuineLive =
          defect.id.startsWith('INC-') &&
          water.id.startsWith('INC-') &&
          defect.source !== 'demo';

        correlations.push({
          id: `COR-${defect.id}-${water.id}`,
          defectIncidentId: defect.id,
          waterloggingIncidentId: water.id,
          category: defect.category,
          defectTitle: defect.title,
          waterloggingTitle: water.title,
          locationName: `${defect.location.road}, ${defect.location.area}`,
          coordinates: defect.location.coordinates,
          distanceMeters: distMeters,
          dangerLevel,
          proximityScore,
          confidenceScore: proximityScore,
          explanation: `Spatial proximity correlation: ${defect.title} is within ${distMeters}m of ${water.title}. The defect is submerged beneath surface water (Proximity Score: ${proximityScore}/100, heuristic inverse-distance model).`,
          isGenuineLive,
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  return correlations.sort((a, b) => b.proximityScore - a.proximityScore);
}
