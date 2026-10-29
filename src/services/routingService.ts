// JalRakshak — Dynamic Route Planning Service
// Integrates Open Source Routing Machine (OSRM) Route API with OpenStreetMap road network geometry
// Provides genuine road-following polyline alternatives, spatial hazard evaluation, and contextual telemetry.

import type { Coordinates, Incident } from '../data/types';
import { distanceToPolylineKm } from './roadNetworkService';
import { findNearestStation, getStationSummaries } from './rainfallService';

export interface RouteHazardMatch {
  incidentId: string;
  category: string;
  severity: string;
  title: string;
  locationName: string;
  distanceMeters: number;
  verification: string;
  isWaterlogging: boolean;
  reportedAt: string;
}

export interface CalculatedRouteAlternative {
  id: string;
  name: string;
  summary: string;
  distanceKm: number;
  estimatedMinutes: number;
  waypoints: Coordinates[];
  hazardMatches: RouteHazardMatch[];
  verifiedWaterloggingCount: number;
  verifiedDefectCount: number;
  unverifiedHazardCount: number;
  nearestStation: {
    stationName: string;
    distanceKm: number;
    latestRainfallMm: number;
    acquisitionTime: string;
  } | null;
  hasSufficientData: boolean;
  dataSufficiencyNotice: string;
  recommended: boolean;
  source: 'osrm_live' | 'cached_fallback';
  engineNotice: string;
}

export interface CalculatedRoutePlan {
  originName: string;
  destName: string;
  originCoords: Coordinates;
  destCoords: Coordinates;
  routes: CalculatedRouteAlternative[];
  calculatedAt: string;
  engineAttribution: string;
  providerNotice: string;
}

// In-memory cache for OSRM responses to prevent rate limiting
const _routePlanCache = new Map<string, CalculatedRoutePlan>();

const DEFAULT_OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
export const INCIDENT_PROXIMITY_THRESHOLD_KM = 0.25; // 250 meters buffer

export function getRouteCacheKey(c1: Coordinates, c2: Coordinates): string {
  return `${c1.lat.toFixed(5)},${c1.lng.toFixed(5)}->${c2.lat.toFixed(5)},${c2.lng.toFixed(5)}`;
}

/**
 * Evaluates spatial hazards along a route polyline without double-counting.
 */
export function evaluateRouteHazards(
  waypoints: Coordinates[],
  incidents: Incident[]
): {
  matches: RouteHazardMatch[];
  verifiedWaterlogging: number;
  verifiedDefects: number;
  unverifiedCount: number;
} {
  const matches: RouteHazardMatch[] = [];
  const countedIds = new Set<string>();

  let verifiedWaterlogging = 0;
  let verifiedDefects = 0;
  let unverifiedCount = 0;

  for (const inc of incidents) {
    // Only check active incidents with valid coordinates
    if (!inc.isActive || !inc.location?.coordinates) continue;
    const { lat, lng } = inc.location.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) continue;

    if (countedIds.has(inc.id)) continue;

    const distKm = distanceToPolylineKm(inc.location.coordinates, waypoints);
    if (distKm <= INCIDENT_PROXIMITY_THRESHOLD_KM) {
      countedIds.add(inc.id);
      const distMeters = Math.round(distKm * 1000);
      const isWaterlogging = inc.category === 'waterlogging';
      const isVerified = inc.verification === 'verified';

      if (isVerified) {
        if (isWaterlogging) {
          verifiedWaterlogging++;
        } else {
          verifiedDefects++;
        }
      } else {
        unverifiedCount++;
      }

      matches.push({
        incidentId: inc.id,
        category: inc.category,
        severity: inc.severity,
        title: inc.title,
        locationName: `${inc.location.road}, ${inc.location.area}`,
        distanceMeters: distMeters,
        verification: inc.verification,
        isWaterlogging,
        reportedAt: inc.reportedAt,
      });
    }
  }

  return {
    matches: matches.sort((a, b) => a.distanceMeters - b.distanceMeters),
    verifiedWaterlogging,
    verifiedDefects,
    unverifiedCount,
  };
}

/**
 * Parses raw OSRM API JSON response into a structured CalculatedRoutePlan.
 */
export function parseOsrmRouteResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  osrmData: any,
  originCoords: Coordinates,
  destCoords: Coordinates,
  originName: string,
  destName: string,
  incidents: Incident[] = []
): CalculatedRoutePlan {
  if (!osrmData || osrmData.code !== 'Ok' || !osrmData.routes || osrmData.routes.length === 0) {
    throw new Error(`Invalid OSRM response: ${osrmData?.code || 'Empty route array'}`);
  }

  // Determine nearest NWDP station for contextual rainfall telemetry
  const midLat = (originCoords.lat + destCoords.lat) / 2;
  const midLng = (originCoords.lng + destCoords.lng) / 2;
  const nearestStn = findNearestStation(midLat, midLng, getStationSummaries());

  const stationContext = nearestStn
    ? {
        stationName: nearestStn.station.station,
        distanceKm: Math.round(nearestStn.distanceKm * 10) / 10,
        latestRainfallMm: nearestStn.station.latestRainfallMm,
        acquisitionTime: nearestStn.station.latestAcquisitionTime,
      }
    : null;

  // Parse actual OSRM routes
  const parsedAlternatives: CalculatedRouteAlternative[] = osrmData.routes.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (osrmRoute: any, idx: number) => {
      // Convert OSRM GeoJSON [lng, lat] to Leaflet Coordinates { lat, lng }
      const waypoints: Coordinates[] = osrmRoute.geometry.coordinates.map(
        (pt: [number, number]) => ({ lat: pt[1], lng: pt[0] })
      );

      const distanceKm = Math.round((osrmRoute.distance / 1000) * 10) / 10;
      const estimatedMinutes = Math.max(1, Math.round(osrmRoute.duration / 60));

      // Evaluate genuine hazards along this road-following polyline
      const { matches, verifiedWaterlogging, verifiedDefects, unverifiedCount } =
        evaluateRouteHazards(waypoints, incidents);

      const hasSufficientData = verifiedWaterlogging > 0 || verifiedDefects > 0;
      const totalVerifiedHazards = verifiedWaterlogging + verifiedDefects;

      let notice = '';
      if (!hasSufficientData) {
        notice = `Insufficient verified data to determine current road risk along this corridor. 0 verified incidents reported in the last 24h within 250m of this route. Absence of reported incidents does not guarantee the road is free of defects.`;
      } else {
        notice = `Evaluated against ${totalVerifiedHazards} verified hazard(s) within 250m (${verifiedWaterlogging} waterlogging pool(s), ${verifiedDefects} road defect(s)).`;
      }

      const routeLabel =
        idx === 0
          ? 'Primary Route (Shortest Distance)'
          : `Alternative Route ${idx + 1} (Via Connecting Arterial)`;

      return {
        id: `OSRM-ALT-${idx + 1}`,
        name: routeLabel,
        summary: `${distanceKm} km · ~${estimatedMinutes} mins via OpenStreetMap network`,
        distanceKm,
        estimatedMinutes,
        waypoints,
        hazardMatches: matches,
        verifiedWaterloggingCount: verifiedWaterlogging,
        verifiedDefectCount: verifiedDefects,
        unverifiedHazardCount: unverifiedCount,
        nearestStation: stationContext,
        hasSufficientData,
        dataSufficiencyNotice: notice,
        recommended: false,
        source: 'osrm_live',
        engineNotice: 'Road-following geometry computed by OSRM routing engine using OpenStreetMap road network data.',
      };
    }
  );

  // Pick recommended route: lowest verified hazard count, then shortest distance
  let bestIndex = 0;
  let minHazards = Infinity;
  let minDistance = Infinity;

  parsedAlternatives.forEach((alt, idx) => {
    const hazardScore = alt.verifiedWaterloggingCount * 2 + alt.verifiedDefectCount;
    if (
      hazardScore < minHazards ||
      (hazardScore === minHazards && alt.distanceKm < minDistance)
    ) {
      minHazards = hazardScore;
      minDistance = alt.distanceKm;
      bestIndex = idx;
    }
  });

  parsedAlternatives[bestIndex].recommended = true;

  return {
    originName,
    destName,
    originCoords,
    destCoords,
    routes: parsedAlternatives,
    calculatedAt: new Date().toISOString(),
    engineAttribution: 'Routing engine: Open Source Routing Machine (OSRM) · Map data © OpenStreetMap contributors (ODbL 1.0)',
    providerNotice: 'Duration estimated from road network geometry & standard speed limits. Real-time traffic congestion is not included without official municipal probe data.',
  };
}

/**
 * Queries the OSRM routing engine for road-following route alternatives.
 * Note: OSRM URL requires coordinates in {longitude},{latitude} format.
 */
export async function calculateDynamicRoutes(
  originCoords: Coordinates,
  destCoords: Coordinates,
  originName: string = 'Selected Origin',
  destName: string = 'Selected Destination',
  incidents: Incident[] = []
): Promise<CalculatedRoutePlan> {
  const cacheKey = getRouteCacheKey(originCoords, destCoords);
  if (_routePlanCache.has(cacheKey)) {
    return _routePlanCache.get(cacheKey)!;
  }

  const routerBase = import.meta.env.VITE_OSRM_ROUTER_URL || DEFAULT_OSRM_URL;
  // OSRM format: {lon1},{lat1};{lon2},{lat2}
  const queryUrl = `${routerBase}/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&alternatives=true`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(queryUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Routing server responded with HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const plan = parseOsrmRouteResponse(data, originCoords, destCoords, originName, destName, incidents);
    _routePlanCache.set(cacheKey, plan);
    return plan;
  } catch (err) {
    clearTimeout(timeoutId);
    // If routing engine fails, produce a clean geometric corridor with clear warning
    const steps = 5;
    const fallbackWaypoints: Coordinates[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      fallbackWaypoints.push({
        lat: originCoords.lat + (destCoords.lat - originCoords.lat) * t,
        lng: originCoords.lng + (destCoords.lng - originCoords.lng) * t,
      });
    }

    const distKm = Math.round(
      Math.sqrt(
        (destCoords.lat - originCoords.lat) ** 2 +
          ((destCoords.lng - originCoords.lng) * Math.cos((destCoords.lat * Math.PI) / 180)) ** 2
      ) * 111 * 10
    ) / 10;

    const errorMsg = err instanceof Error ? err.message : String(err);
    const { matches, verifiedWaterlogging, verifiedDefects, unverifiedCount } =
      evaluateRouteHazards(fallbackWaypoints, incidents);

    const hasSufficientData = verifiedWaterlogging > 0 || verifiedDefects > 0;
    const totalVerified = verifiedWaterlogging + verifiedDefects;

    let notice = '';
    if (!hasSufficientData) {
      notice = `Insufficient verified data to determine current road risk along this corridor. 0 verified incidents reported in the last 24h within 250m of this route.`;
    } else {
      notice = `Evaluated against ${totalVerified} verified hazard(s) within 250m.`;
    }
    notice += ` (Live OSRM routing server was unreachable: ${errorMsg}. Displaying approximate direct corridor).`;

    const fallbackPlan: CalculatedRoutePlan = {
      originName,
      destName,
      originCoords,
      destCoords,
      routes: [
        {
          id: 'FALLBACK-CORRIDOR',
          name: 'Direct Geometric Corridor (Routing Offline)',
          summary: `~${distKm} km straight-line corridor estimate`,
          distanceKm: distKm,
          estimatedMinutes: Math.round((distKm / 35) * 60),
          waypoints: fallbackWaypoints,
          hazardMatches: matches,
          verifiedWaterloggingCount: verifiedWaterlogging,
          verifiedDefectCount: verifiedDefects,
          unverifiedHazardCount: unverifiedCount,
          nearestStation: null,
          hasSufficientData,
          dataSufficiencyNotice: notice,
          recommended: true,
          source: 'cached_fallback',
          engineNotice: 'Fallback schematic geometry. OSRM routing server was unreachable.',
        },
      ],
      calculatedAt: new Date().toISOString(),
      engineAttribution: 'Offline Geometric Fallback · Live OSRM Server Unreachable',
      providerNotice: `Routing service notice: ${errorMsg}`,
    };

    return fallbackPlan;
  }
}
