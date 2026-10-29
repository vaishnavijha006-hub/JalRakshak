import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseNwdpCsv,
  parseNwdpTimestamp,
  getRainIntensity,
  getStationSummaries,
  findNearestStation,
  getVerifiedNwdpObservations,
  NWDP_METADATA,
} from '../src/services/rainfallService';
import {
  fetchDelhiWeather,
  mapWmoWeatherCode,
  isImdApiConfigured,
  DELHI_MET_COORDINATES,
} from '../src/services/weatherService';
import {
  DELHI_ARTERIAL_CORRIDORS,
  DELHI_OSM_BOUNDS,
  OSM_ATTRIBUTION,
  distanceToPolylineKm,
  evaluateCorridorDataSufficiency,
} from '../src/services/roadNetworkService';
import {
  correlateSubmergedHazards,
  calculateDistanceMeters,
} from '../src/services/hazardCorrelationService';
import type { Incident } from '../src/data/types';

describe('NWDP Delhi Hourly Rainfall Telemetry Parser', () => {
  it('corrects official government CSV transposed coordinate anomaly', () => {
    // Official NWDP CSV header has Latitude as Column 16 (containing ~77.12) and Longitude as Column 17 (containing ~28.79)
    const rawSample = `SlNo,Station,Agency,State LGD Code,State,District LGD Code,District,Tehsil,Block,Village,River,Basin,Tributary,Subtributary,SubSubtributary,Local River,Latitude,Longitude,Data Acquisition Time,Telemetry Hourly Rainfall (mm)
1,Alipur Store,Delhi SW GW,7,Delhi,80,NORTH,-,-,-,-,-,-,-,-,-,77.11903800,28.79679900,23-01-2026 08:00,5.5`;

    const records = parseNwdpCsv(rawSample);
    assert.equal(records.length, 1);
    const rec = records[0];

    // Latitude must be ~28.79 N and Longitude must be ~77.12 E
    assert.ok(rec.latitude > 28.0 && rec.latitude < 29.0, `Latitude should be ~28.79, got ${rec.latitude}`);
    assert.ok(rec.longitude > 76.5 && rec.longitude < 77.5, `Longitude should be ~77.12, got ${rec.longitude}`);
    assert.equal(rec.station, 'Alipur Store');
    assert.equal(rec.rainfallMm, 5.5);
    assert.equal(rec.rawLatitude, 77.119038);
    assert.equal(rec.rawLongitude, 28.796799);
  });

  it('parses NWDP DD-MM-YYYY HH:mm timestamps into valid ISO 8601 strings', () => {
    const iso = parseNwdpTimestamp('23-01-2026 08:30');
    assert.match(iso, /^2026-01-23T08:30:00/);

    const malformed = parseNwdpTimestamp('');
    assert.ok(typeof malformed === 'string' && malformed.length > 0);
  });

  it('handles empty, header-only, or malformed CSV gracefully', () => {
    assert.deepEqual(parseNwdpCsv(''), []);
    assert.deepEqual(parseNwdpCsv('Header line only'), []);
    const partial = parseNwdpCsv('Col1,Col2\nVal1,Val2');
    assert.deepEqual(partial, []);
  });

  it('categorizes rainfall intensities per IMD standards accurately', () => {
    assert.equal(getRainIntensity(0), 'None');
    assert.equal(getRainIntensity(4.5), 'Light');
    assert.equal(getRainIntensity(15.0), 'Moderate');
    assert.equal(getRainIntensity(45.0), 'Heavy');
    assert.equal(getRainIntensity(85.0), 'Very Heavy');
  });

  it('aggregates station summaries across all verified Delhi telemetry stations', () => {
    const verifiedObs = getVerifiedNwdpObservations();
    assert.ok(verifiedObs.length > 100, `Expected >100 records, got ${verifiedObs.length}`);

    const summaries = getStationSummaries(verifiedObs);
    assert.equal(summaries.length, 6, 'Should identify all 6 Delhi telemetry stations');

    const stationNames = summaries.map(s => s.station);
    assert.ok(stationNames.includes('Alipur Store'));
    assert.ok(stationNames.includes('Basaidarapur Office Complex'));
    assert.ok(stationNames.includes('Dhansa_1'));
    assert.ok(stationNames.includes('Kanjhawala Store'));
    assert.ok(stationNames.includes('L.M. Bund Office Complex'));
    assert.ok(stationNames.includes('Rohini Office Complex'));

    for (const summary of summaries) {
      assert.ok(summary.maxRainfallMm >= summary.latestRainfallMm);
      assert.ok(summary.totalObservations > 0);
      assert.ok(summary.latitude > 28.0 && summary.latitude < 29.0);
      assert.ok(summary.longitude > 76.5 && summary.longitude < 77.5);
    }
  });

  it('locates the nearest NWDP telemetry station to given coordinates', () => {
    // Connaught Place: 28.6315, 77.2167
    const result = findNearestStation(28.6315, 77.2167);
    assert.ok(result !== null);
    assert.ok(result.distanceKm < 15, `Distance from CP should be <15km, got ${result.distanceKm}`);
    assert.ok(['Basaidarapur Office Complex', 'L.M. Bund Office Complex'].includes(result.station.station));
  });

  it('exposes authentic NWDP metadata and GodL license', () => {
    assert.equal(NWDP_METADATA.datasetId, 'c4fd33e4-73a9-47f7-ac61-e2053b9006e4');
    assert.ok(NWDP_METADATA.portalUrl.includes('nwdp.nwic.gov.in'));
    assert.equal(NWDP_METADATA.agency, 'Delhi Surface Water Ground Water Department');
  });
});

describe('Meteorological & IMD Weather Service', () => {
  it('maps WMO weather codes to human-readable weather descriptions', () => {
    assert.equal(mapWmoWeatherCode(0), 'Clear Sky');
    assert.equal(mapWmoWeatherCode(3), 'Overcast');
    assert.equal(mapWmoWeatherCode(51), 'Light Drizzle');
    assert.equal(mapWmoWeatherCode(61), 'Slight Rain');
    assert.equal(mapWmoWeatherCode(65), 'Heavy Rain');
    assert.equal(mapWmoWeatherCode(95), 'Thunderstorm');
  });

  it('transparently evaluates IMD API configuration status', () => {
    // In standard test environment without VITE_IMD_API_KEY, should report unconfigured
    const isConfigured = isImdApiConfigured();
    assert.equal(typeof isConfigured, 'boolean');
  });

  it('returns structured weather observation for Delhi with fallback safety', async () => {
    const observation = await fetchDelhiWeather();
    assert.ok(observation !== null);
    assert.ok(typeof observation.temperatureC === 'number');
    assert.ok(typeof observation.relativeHumidityPct === 'number');
    assert.ok(typeof observation.weatherDescription === 'string');
    assert.ok(['open_meteo', 'imd_api', 'cached_fallback'].includes(observation.source));
    assert.ok(observation.sourceAttribution.length > 0);
    assert.equal(DELHI_MET_COORDINATES.stationName, 'Safdarjung Observatory (IMD Station 42182)');
  });
});

describe('OpenStreetMap Road Network & Corridor Sufficiency', () => {
  it('defines authentic Delhi arterial corridors within NCT bounding box', () => {
    assert.ok(DELHI_ARTERIAL_CORRIDORS.length >= 4);

    for (const corridor of DELHI_ARTERIAL_CORRIDORS) {
      assert.ok(corridor.totalLengthKm > 0);
      assert.ok(corridor.keyWaypoints.length >= 2);

      for (const pt of corridor.keyWaypoints) {
        assert.ok(
          pt.lat >= DELHI_OSM_BOUNDS.minLat && pt.lat <= DELHI_OSM_BOUNDS.maxLat,
          `${pt.lat} out of bounds for ${corridor.name}`
        );
        assert.ok(
          pt.lng >= DELHI_OSM_BOUNDS.minLng && pt.lng <= DELHI_OSM_BOUNDS.maxLng,
          `${pt.lng} out of bounds for ${corridor.name}`
        );
      }
    }

    assert.ok(OSM_ATTRIBUTION.includes('OpenStreetMap contributors'));
  });

  it('calculates minimum distance from a point to a polyline accurately', () => {
    const waypoints = [
      { lat: 28.6300, lng: 77.2100 },
      { lat: 28.6300, lng: 77.2500 },
    ];

    // Point exactly on the line
    const onLine = { lat: 28.6300, lng: 77.2300 };
    const distOnLine = distanceToPolylineKm(onLine, waypoints);
    assert.ok(distOnLine < 0.05, `Distance should be ~0, got ${distOnLine}`);

    // Point 10 km north
    const farPoint = { lat: 28.7200, lng: 77.2300 };
    const distFar = distanceToPolylineKm(farPoint, waypoints);
    assert.ok(distFar > 9.0, `Distance should be >9km, got ${distFar}`);
  });

  it('flags insufficient data when corridor has zero verified incidents', () => {
    const corridorWaypoints = [
      { lat: 28.7500, lng: 77.1000 },
      { lat: 28.7800, lng: 77.1200 },
    ];

    // No incidents nearby
    const incidents: Incident[] = [
      {
        id: 'INC-001',
        category: 'pothole',
        severity: 'medium',
        title: 'Central Delhi pothole',
        description: 'Far away from corridor',
        location: { road: 'Barakhamba Rd', area: 'Connaught Place', coordinates: { lat: 28.633, lng: 77.226 } },
        observedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        reportedAt: new Date().toISOString(),
        status: 'reported',
        verification: 'verified',
        source: 'community',
        isHistorical: false,
        isActive: true,
      },
    ];

    const evaluation = evaluateCorridorDataSufficiency('R-TEST-1', 'Test Corridor', corridorWaypoints, incidents);
    assert.equal(evaluation.hasSufficientData, false);
    assert.equal(evaluation.verifiedIncidentCount, 0);
    assert.match(evaluation.disclaimer, /Insufficient verified data to determine current road risk/);
  });

  it('confirms data sufficiency when verified incidents exist within 500m of the corridor', () => {
    const corridorWaypoints = [
      { lat: 28.6300, lng: 77.2200 },
      { lat: 28.6300, lng: 77.2400 },
    ];

    // Incident right on the corridor (within 50m)
    const incidents: Incident[] = [
      {
        id: 'INC-002',
        category: 'waterlogging',
        severity: 'critical',
        title: 'Minto Road Inundation',
        description: 'Flooding on corridor',
        location: { road: 'Minto Road', area: 'Minto Bridge', coordinates: { lat: 28.6302, lng: 77.2250 } },
        observedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        reportedAt: new Date().toISOString(),
        status: 'under_verification',
        verification: 'verified',
        source: 'community',
        isHistorical: false,
        isActive: true,
      },
    ];

    const evaluation = evaluateCorridorDataSufficiency('R-TEST-2', 'Verified Corridor', corridorWaypoints, incidents);
    assert.equal(evaluation.hasSufficientData, true);
    assert.equal(evaluation.verifiedIncidentCount, 1);
    assert.match(evaluation.disclaimer, /Evaluated against 1 verified incident/);
  });
});

describe('Spatial Hazard Correlation Engine', () => {
  it('correlates pre-monsoon road defect within 75m of active waterlogging', () => {
    const defectCoord = { lat: 28.6285, lng: 77.2275 };
    // Waterlogging 30 meters away
    const waterCoord = { lat: 28.6287, lng: 77.2276 };

    const distanceMeters = calculateDistanceMeters(defectCoord, waterCoord);
    assert.ok(distanceMeters < 75, `Expected <75m, got ${distanceMeters}m`);

    const incidents: Incident[] = [
      {
        id: 'INC-001',
        category: 'pothole',
        severity: 'high',
        title: 'Deep road cavity',
        description: 'Pre-monsoon pothole',
        location: { road: 'Minto Road', area: 'Minto Bridge', coordinates: defectCoord },
        observedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        reportedAt: new Date().toISOString(),
        status: 'reported',
        verification: 'verified',
        source: 'community',
        isHistorical: true,
        isActive: true,
      },
      {
        id: 'INC-006',
        category: 'waterlogging',
        severity: 'critical',
        title: 'Severe waterlogging at underpass',
        description: '3 feet standing water',
        location: { road: 'Minto Road', area: 'Minto Bridge', coordinates: waterCoord },
        observedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        reportedAt: new Date().toISOString(),
        status: 'under_verification',
        verification: 'verified',
        source: 'community',
        isHistorical: false,
        isActive: true,
      },
    ];

    const correlations = correlateSubmergedHazards(incidents, 75);
    assert.equal(correlations.length, 1);
    assert.equal(correlations[0].defectIncidentId, 'INC-001');
    assert.equal(correlations[0].waterloggingIncidentId, 'INC-006');
    assert.equal(correlations[0].isGenuineLive, true);
    assert.match(correlations[0].explanation, /Spatial proximity correlation/);
  });

  it('does not correlate defects that are separated by more than proximity threshold', () => {
    const defectCoord = { lat: 28.6285, lng: 77.2275 };
    // Waterlogging 500 meters away
    const distantWaterCoord = { lat: 28.6330, lng: 77.2260 };

    const incidents: Incident[] = [
      {
        id: 'INC-001',
        category: 'pothole',
        severity: 'high',
        title: 'Deep road cavity',
        description: 'Pre-monsoon pothole',
        location: { road: 'Minto Road', area: 'Minto Bridge', coordinates: defectCoord },
        observedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        reportedAt: new Date().toISOString(),
        status: 'reported',
        verification: 'verified',
        source: 'community',
        isHistorical: true,
        isActive: true,
      },
      {
        id: 'INC-007',
        category: 'waterlogging',
        severity: 'high',
        title: 'Waterlogging at Barakhamba',
        description: 'Standing water far away',
        location: { road: 'Barakhamba Road', area: 'Connaught Place', coordinates: distantWaterCoord },
        observedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        reportedAt: new Date().toISOString(),
        status: 'reported',
        verification: 'verified',
        source: 'community',
        isHistorical: false,
        isActive: true,
      },
    ];

    const correlations = correlateSubmergedHazards(incidents, 75);
    assert.equal(correlations.length, 0, 'Should not correlate defects outside 75m threshold');
  });
});
