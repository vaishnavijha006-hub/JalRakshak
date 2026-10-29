// JalRakshak — NWDP Telemetry Rainfall Service
// Integrates real-world hourly rainfall observations from the National Water Data Portal (NWIC)
// Dataset: Rainfall Telemetry Hourly Delhi Surface Water Groundwater Department
// Dataset ID: c4fd33e4-73a9-47f7-ac61-e2053b9006e4
// Resource ID: f044fbd1-bac2-4897-8a54-6437ef4b0c6e (Active 2026-2030)
// Portal: https://www.nwdp.nwic.gov.in

import {
  NWDP_DELHI_HOURLY_CSV,
  NWDP_METADATA,
  NWDP_STATIONS_REGISTRY,
  type NwdpStationMeta,
} from '../data/nwdpDelhiRainfallData';
import { calculateDistanceKm } from '../utils/geo';

export interface NwdpObservation {
  slNo: number;
  station: string;
  agency: string;
  district: string;
  latitude: number;
  longitude: number;
  rawLatitude: number;
  rawLongitude: number;
  dataAcquisitionTime: string;
  timestampIso: string;
  rainfallMm: number;
}

export type RainIntensity = 'None' | 'Light' | 'Moderate' | 'Heavy' | 'Very Heavy';

export interface StationSummary {
  station: string;
  district: string;
  latitude: number;
  longitude: number;
  agency: string;
  latestRainfallMm: number;
  latestAcquisitionTime: string;
  latestTimestampIso: string;
  maxRainfallMm: number;
  totalObservations: number;
  intensity: RainIntensity;
  isRecent: boolean;
}

export const NWDP_ACTIVE_RESOURCE_URL =
  'https://nwdp.nwic.gov.in/dataset/c4fd33e4-73a9-47f7-ac61-e2053b9006e4/resource/f044fbd1-bac2-4897-8a54-6437ef4b0c6e/download/rainfall_tel_hr_delhi_sw_gw_dl_2026_2030.csv';

/**
 * Categorize rainfall intensity based on IMD / NWDP standards:
 * - 0 mm: None
 * - 0.1 to 7.5 mm: Light
 * - 7.6 to 35.5 mm: Moderate
 * - 35.6 to 64.4 mm: Heavy
 * - > 64.4 mm: Very Heavy
 */
export function getRainIntensity(mm: number): RainIntensity {
  if (mm <= 0) return 'None';
  if (mm <= 7.5) return 'Light';
  if (mm <= 35.5) return 'Moderate';
  if (mm <= 64.4) return 'Heavy';
  return 'Very Heavy';
}

/**
 * Parses NWDP datetime format (e.g., "23-01-2026 08:00") into ISO 8601 string.
 */
export function parseNwdpTimestamp(dateTimeStr: string): string {
  if (!dateTimeStr || typeof dateTimeStr !== 'string') {
    return new Date().toISOString();
  }

  const parts = dateTimeStr.trim().split(' ');
  if (parts.length !== 2) {
    return new Date().toISOString();
  }

  const [datePart, timePart] = parts;
  const [day, month, year] = datePart.split('-');
  const [hour, minute] = timePart.split(':');

  if (!day || !month || !year || !hour || !minute) {
    return new Date().toISOString();
  }

  // Delhi is in Indian Standard Time (IST, UTC+05:30)
  const pad = (n: string | number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`;
}

/**
 * Parses raw CSV content from NWDP with coordinate anomaly detection & correction.
 *
 * NOTE on Govt Open Data Anomaly:
 * The official NWDP CSV headers label Column 16 as "Latitude" and Column 17 as "Longitude".
 * However, Column 16 values are ~77.12° (Delhi East Longitude) and Column 17 values
 * are ~28.79° (Delhi North Latitude).
 * This parser verifies degree bounds and transposes them to accurate geospatial coordinates.
 */
export function parseNwdpCsv(csvContent: string): NwdpObservation[] {
  if (!csvContent || typeof csvContent !== 'string') {
    return [];
  }

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }

  const header = lines[0].split(',').map((h) => h.trim());
  const stationIdx = header.indexOf('Station');
  const agencyIdx = header.indexOf('Agency');
  const districtIdx = header.indexOf('District');
  const latIdx = header.indexOf('Latitude');
  const lngIdx = header.indexOf('Longitude');
  const timeIdx = header.indexOf('Data Acquisition Time');
  const rainIdx = header.findIndex((h) => h.toLowerCase().includes('hourly rainfall'));

  const observations: NwdpObservation[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 18) continue;

    const slNo = parseInt(cols[0], 10) || i;
    const station = cols[stationIdx >= 0 ? stationIdx : 1] || 'Unknown Station';
    const agency = cols[agencyIdx >= 0 ? agencyIdx : 2] || 'Delhi SW GW';
    const district = cols[districtIdx >= 0 ? districtIdx : 6] || 'Delhi';

    const rawLat = parseFloat(cols[latIdx >= 0 ? latIdx : 16]) || 0;
    const rawLng = parseFloat(cols[lngIdx >= 0 ? lngIdx : 17]) || 0;
    const timeStr = cols[timeIdx >= 0 ? timeIdx : 18] || '';
    const rainfallMm = parseFloat(cols[rainIdx >= 0 ? rainIdx : 19]) || 0;

    // Detect and correct transposed coordinates (Delhi is ~28.4 to ~28.9 N, ~76.8 to ~77.4 E)
    let latitude = rawLat;
    let longitude = rawLng;

    if (rawLat > 60 && rawLng < 40) {
      latitude = rawLng;
      longitude = rawLat;
    }

    const timestampIso = parseNwdpTimestamp(timeStr);

    observations.push({
      slNo,
      station,
      agency,
      district,
      latitude,
      longitude,
      rawLatitude: rawLat,
      rawLongitude: rawLng,
      dataAcquisitionTime: timeStr,
      timestampIso,
      rainfallMm: Math.max(0, rainfallMm),
    });
  }

  return observations;
}

// In-memory cache for parsed telemetry
let _cachedObservations: NwdpObservation[] | null = null;

export function getVerifiedNwdpObservations(): NwdpObservation[] {
  if (!_cachedObservations) {
    _cachedObservations = parseNwdpCsv(NWDP_DELHI_HOURLY_CSV);
  }
  return _cachedObservations;
}

/**
 * Computes station summaries including latest observed rainfall, peak values, and intensity.
 */
export function getStationSummaries(observations?: NwdpObservation[]): StationSummary[] {
  const records = observations ?? getVerifiedNwdpObservations();
  const stationMap = new Map<string, NwdpObservation[]>();

  for (const obs of records) {
    const list = stationMap.get(obs.station) || [];
    list.push(obs);
    stationMap.set(obs.station, list);
  }

  const summaries: StationSummary[] = [];

  for (const [station, list] of stationMap.entries()) {
    // Sort descending by timestamp
    const sorted = [...list].sort(
      (a, b) => new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime()
    );

    const latest = sorted[0];
    const maxRainfallMm = Math.max(...list.map((r) => r.rainfallMm), 0);
    const registryInfo: NwdpStationMeta | undefined = NWDP_STATIONS_REGISTRY[station];

    summaries.push({
      station,
      district: registryInfo?.district ?? latest.district,
      latitude: registryInfo?.latitude ?? latest.latitude,
      longitude: registryInfo?.longitude ?? latest.longitude,
      agency: registryInfo?.agency ?? latest.agency,
      latestRainfallMm: latest.rainfallMm,
      latestAcquisitionTime: latest.dataAcquisitionTime,
      latestTimestampIso: latest.timestampIso,
      maxRainfallMm,
      totalObservations: list.length,
      intensity: getRainIntensity(latest.rainfallMm),
      isRecent: true,
    });
  }

  return summaries.sort((a, b) => b.latestRainfallMm - a.latestRainfallMm);
}

/**
 * Returns the nearest NWDP telemetry station to a coordinate.
 */
export function findNearestStation(
  lat: number,
  lng: number,
  summaries?: StationSummary[]
): { station: StationSummary; distanceKm: number } | null {
  const list = summaries ?? getStationSummaries();
  if (list.length === 0) return null;

  let closest: StationSummary = list[0];
  let minDistance = calculateDistanceKm(lat, lng, list[0].latitude, list[0].longitude);

  for (let i = 1; i < list.length; i++) {
    const dist = calculateDistanceKm(lat, lng, list[i].latitude, list[i].longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = list[i];
    }
  }

  return { station: closest, distanceKm: minDistance };
}

/**
 * Fetches live NWDP rainfall CSV if online, falling back gracefully to the verified snapshot.
 */
export async function fetchLiveNwdpRainfall(
  customUrl?: string
): Promise<{
  observations: NwdpObservation[];
  summaries: StationSummary[];
  isLive: boolean;
  source: string;
  error?: string;
}> {
  const url = customUrl || NWDP_ACTIVE_RESOURCE_URL;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/csv' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const liveObs = parseNwdpCsv(text);
    if (liveObs.length === 0) {
      throw new Error('Received empty or malformed telemetry payload');
    }

    return {
      observations: liveObs,
      summaries: getStationSummaries(liveObs),
      isLive: true,
      source: 'National Water Data Portal (NWIC) Live Telemetry Stream',
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const verifiedObs = getVerifiedNwdpObservations();

    return {
      observations: verifiedObs,
      summaries: getStationSummaries(verifiedObs),
      isLive: false,
      source: 'National Water Data Portal (NWIC) Verified Telemetry Archive',
      error: `Live fetch unavailable (${errorMsg}). Displaying verified NWDP telemetry archive.`,
    };
  }
}

export { NWDP_METADATA };
