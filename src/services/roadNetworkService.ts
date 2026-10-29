// JalRakshak — OpenStreetMap Road Network & Corridor Intelligence Service
// Integrates Delhi road network geometry and provides real-data corridor sufficiency assessments
// Attribution: © OpenStreetMap contributors (ODbL 1.0) — https://www.openstreetmap.org/copyright

import type { Coordinates, Incident } from '../data/types';
import { calculateDistanceKm } from '../utils/geo';
import { findNearestStation, type StationSummary } from './rainfallService';

export interface OsmRoadCorridor {
  id: string;
  name: string;
  ref?: string;
  osmType: 'trunk' | 'primary' | 'secondary' | 'motorway';
  description: string;
  keyWaypoints: Coordinates[];
  totalLengthKm: number;
}

export interface CorridorDataSufficiency {
  routeId: string;
  routeName: string;
  isIllustrativeDemo: boolean;
  hasSufficientData: boolean;
  verifiedIncidentCount: number;
  unverifiedIncidentCount: number;
  nearestStation: {
    stationName: string;
    distanceKm: number;
    latestRainfallMm: number;
  } | null;
  riskConfidence: 'low' | 'moderate' | 'high';
  disclaimer: string;
  osmAttribution: string;
}

export const DELHI_OSM_BOUNDS = {
  minLat: 28.40,
  maxLat: 28.88,
  minLng: 76.84,
  maxLng: 77.35,
};

export const OSM_ATTRIBUTION = 'Map data © OpenStreetMap contributors, ODbL 1.0';

/**
 * Authentic Delhi arterial corridors mapped to OpenStreetMap roadway entities.
 */
export const DELHI_ARTERIAL_CORRIDORS: OsmRoadCorridor[] = [
  {
    id: 'OSM-COR-01',
    name: 'Ring Road (Mahatma Gandhi Marg)',
    ref: 'State Highway 2',
    osmType: 'trunk',
    description: 'Delhi major circumferential arterial road connecting North, Central, and South Delhi.',
    keyWaypoints: [
      { lat: 28.7041, lng: 77.1025 }, // Azadpur
      { lat: 28.6508, lng: 77.1271 }, // Punjabi Bagh
      { lat: 28.6289, lng: 77.1585 }, // Dhaula Kuan
      { lat: 28.5705, lng: 77.2395 }, // Lajpat Nagar
      { lat: 28.6304, lng: 77.2415 }, // ITO
      { lat: 28.6750, lng: 77.2280 }, // Kashmere Gate
    ],
    totalLengthKm: 48.0,
  },
  {
    id: 'OSM-COR-02',
    name: 'Mathura Road Corridor',
    ref: 'NH 44',
    osmType: 'trunk',
    description: 'Major arterial corridor from Delhi Gate / ITO through Pragati Maidan and Nizamuddin to Ashram.',
    keyWaypoints: [
      { lat: 28.6304, lng: 77.2415 }, // ITO
      { lat: 28.6167, lng: 77.2467 }, // Pragati Maidan / Bhairon Marg
      { lat: 28.5930, lng: 77.2510 }, // Nizamuddin
      { lat: 28.5700, lng: 77.2400 }, // Ashram Chowk
    ],
    totalLengthKm: 7.8,
  },
  {
    id: 'OSM-COR-03',
    name: 'Barapullah Elevated Corridor',
    osmType: 'primary',
    description: 'Elevated bypass linking Sarai Kale Khan to INA Market, bypassing ground-level underpasses.',
    keyWaypoints: [
      { lat: 28.5880, lng: 77.2580 }, // Sarai Kale Khan
      { lat: 28.5830, lng: 77.2350 }, // Barapullah Central
      { lat: 28.5740, lng: 77.2150 }, // INA Market
    ],
    totalLengthKm: 5.8,
  },
  {
    id: 'OSM-COR-04',
    name: 'Vikas Marg / ITO River Crossing',
    osmType: 'primary',
    description: 'Trans-Yamuna connector crossing the Yamuna River at ITO Bridge into East Delhi.',
    keyWaypoints: [
      { lat: 28.6304, lng: 77.2415 }, // ITO Chowk
      { lat: 28.6320, lng: 77.2520 }, // ITO Yamuna Bridge
      { lat: 28.6335, lng: 77.2750 }, // Laxmi Nagar
    ],
    totalLengthKm: 4.2,
  },
];

/**
 * Calculates perpendicular/minimum metric distance from a point to a line segment in kilometers.
 * Uses an equirectangular planar projection scaled by local cosine factor to eliminate
 * longitudinal convergence distortion at Delhi latitude (~28.6°N).
 */
export function distanceToSegmentKm(
  p: Coordinates,
  v: Coordinates,
  w: Coordinates
): number {
  const rad = Math.PI / 180;
  const midLatRad = ((v.lat + w.lat) / 2) * rad;
  const cosMid = Math.cos(midLatRad);

  // Conversion factors: 1 deg lat ≈ 110.852 km; 1 deg lng ≈ 111.320 * cos(lat) km
  const DEG_TO_KM_LAT = 110.852;
  const DEG_TO_KM_LNG = 111.320 * cosMid;

  const wx = (w.lng - v.lng) * DEG_TO_KM_LNG;
  const wy = (w.lat - v.lat) * DEG_TO_KM_LAT;
  const px = (p.lng - v.lng) * DEG_TO_KM_LNG;
  const py = (p.lat - v.lat) * DEG_TO_KM_LAT;

  const segLen2 = wx * wx + wy * wy;
  if (segLen2 === 0) {
    return Math.sqrt(px * px + py * py);
  }

  // Projection parameter t clamped to [0, 1] segment interval
  const t = Math.max(0, Math.min(1, (px * wx + py * wy) / segLen2));

  // Closest point coordinates on segment in local metric space
  const projX = t * wx;
  const projY = t * wy;

  const dx = px - projX;
  const dy = py - projY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates minimum distance from a point to a route's polyline waypoints in kilometers.
 */
export function distanceToPolylineKm(point: Coordinates, waypoints: Coordinates[]): number {
  if (waypoints.length === 0) return Infinity;
  if (waypoints.length === 1) {
    return calculateDistanceKm(point.lat, point.lng, waypoints[0].lat, waypoints[0].lng);
  }

  let minDistance = Infinity;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dist = distanceToSegmentKm(point, waypoints[i], waypoints[i + 1]);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance;
}

/**
 * Evaluates whether a route has sufficient verified real-world data
 * to determine road safety with statistical confidence.
 */
export function evaluateCorridorDataSufficiency(
  routeId: string,
  routeName: string,
  waypoints: Coordinates[],
  incidents: Incident[],
  rainfallSummaries?: StationSummary[],
  isDemoCorridor: boolean = true
): CorridorDataSufficiency {
  // Proximity threshold: 500 meters (0.5 km)
  const BUFFER_KM = 0.5;

  let verifiedCount = 0;
  let unverifiedCount = 0;

  for (const inc of incidents) {
    const dist = distanceToPolylineKm(inc.location.coordinates, waypoints);
    if (dist <= BUFFER_KM) {
      if (inc.verification === 'verified') {
        verifiedCount++;
      } else {
        unverifiedCount++;
      }
    }
  }

  // Find nearest NWDP rainfall telemetry station to corridor midpoint
  const midIndex = Math.floor(waypoints.length / 2);
  const midPoint = waypoints[midIndex] ?? { lat: 28.6139, lng: 77.2090 };
  const nearest = findNearestStation(midPoint.lat, midPoint.lng, rainfallSummaries);

  // A corridor has sufficient verified data only if it has at least 1 verified incident or confirmed clearance
  const hasSufficientData = verifiedCount >= 1;

  let confidence: 'low' | 'moderate' | 'high' = 'low';
  if (verifiedCount >= 3) {
    confidence = 'high';
  } else if (verifiedCount >= 1) {
    confidence = 'moderate';
  }

  let disclaimer = '';
  if (!hasSufficientData) {
    disclaimer = `Insufficient verified data to determine current road risk along this corridor. 0 verified incidents reported in the last 24h within 500m of this route. Exercise caution and do not assume route is hazard-free.`;
  } else {
    disclaimer = `Evaluated against ${verifiedCount} verified incident(s) within 500m. Nearest rainfall telemetry station: ${nearest?.station.station ?? 'Safdarjung'} (${nearest?.station.latestRainfallMm ?? 0} mm recorded).`;
  }

  return {
    routeId,
    routeName,
    isIllustrativeDemo: isDemoCorridor,
    hasSufficientData,
    verifiedIncidentCount: verifiedCount,
    unverifiedIncidentCount: unverifiedCount,
    nearestStation: nearest
      ? {
          stationName: nearest.station.station,
          distanceKm: Math.round(nearest.distanceKm * 10) / 10,
          latestRainfallMm: nearest.station.latestRainfallMm,
        }
      : null,
    riskConfidence: confidence,
    disclaimer,
    osmAttribution: OSM_ATTRIBUTION,
  };
}
