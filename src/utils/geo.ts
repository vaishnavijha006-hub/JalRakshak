// JalRakshak — Delhi Area Geospatial Coordinate Lookup
import type { Coordinates } from '../data/types';

export const DELHI_AREA_COORDINATES: Record<string, Coordinates> = {
  'connaught place': { lat: 28.6315, lng: 77.2167 },
  'minto bridge': { lat: 28.6280, lng: 77.2280 },
  'ito': { lat: 28.6304, lng: 77.2415 },
  'pragati maidan': { lat: 28.6167, lng: 77.2467 },
  'lajpat nagar': { lat: 28.5700, lng: 77.2400 },
  'vikas marg': { lat: 28.6310, lng: 77.2780 },
  'laxmi nagar': { lat: 28.6310, lng: 77.2780 },
  'lodhi road': { lat: 28.5900, lng: 77.2220 },
  'lodhi garden': { lat: 28.5900, lng: 77.2220 },
  'aiims': { lat: 28.5680, lng: 77.2100 },
  'aurobindo marg': { lat: 28.5680, lng: 77.2100 },
  'nizamuddin': { lat: 28.5930, lng: 77.2510 },
  'mathura road': { lat: 28.6050, lng: 77.2450 },
  'ring road': { lat: 28.5700, lng: 77.2400 },
  'india gate': { lat: 28.6129, lng: 77.2295 },
  'barakhamba road': { lat: 28.6330, lng: 77.2260 },
  'karol bagh': { lat: 28.6514, lng: 77.1907 },
  'chandni chowk': { lat: 28.6506, lng: 77.2303 },
  'south extension': { lat: 28.5728, lng: 77.2227 },
};

export const DEFAULT_DELHI_CENTER: Coordinates = { lat: 28.6139, lng: 77.2090 };

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Maps a Delhi landmark or area name to representative coordinates.
 * An optional seedString provides small deterministic displacement (within ~200m)
 * so multiple reports in the same neighborhood do not render on top of each other.
 */
export function getAreaCoordinates(area: string, seedString?: string): Coordinates {
  if (!area || typeof area !== 'string') return { ...DEFAULT_DELHI_CENTER };

  const normalized = area.toLowerCase().trim();
  let baseCoords: Coordinates | undefined;

  for (const [key, coords] of Object.entries(DELHI_AREA_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      baseCoords = coords;
      break;
    }
  }

  if (!baseCoords) {
    baseCoords = DEFAULT_DELHI_CENTER;
  }

  if (seedString) {
    const hash = simpleHash(seedString);
    // Deterministic offset: +/- 0.002 degrees (~200m)
    const latOffset = ((hash % 100) - 50) * 0.00004;
    const lngOffset = (((Math.floor(hash / 100)) % 100) - 50) * 0.00004;
    return {
      lat: Number((baseCoords.lat + latOffset).toFixed(6)),
      lng: Number((baseCoords.lng + lngOffset).toFixed(6)),
    };
  }

  return { ...baseCoords };
}
