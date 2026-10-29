import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDynamicRoutes,
  parseOsrmRouteResponse,
  evaluateRouteHazards,
  INCIDENT_PROXIMITY_THRESHOLD_KM,
} from '../src/services/routingService';
import {
  VERIFIED_DELHI_LOCATIONS,
  DELHI_COMMUTER_PRESETS,
} from '../src/data/delhiLocations';
import { DELHI_OSM_BOUNDS } from '../src/services/roadNetworkService';
import type { Incident } from '../src/data/types';

describe('Delhi Location Presets & Geographic Verification', () => {
  it('contains at least 20 verified Delhi locations within NCT bounding box', () => {
    const locations = Object.values(VERIFIED_DELHI_LOCATIONS);
    assert.ok(locations.length >= 20, `Expected >= 20 locations, got ${locations.length}`);

    for (const loc of locations) {
      assert.ok(loc.name.length > 0);
      assert.ok(loc.description.length > 0);
      assert.ok(
        loc.coordinates.lat >= DELHI_OSM_BOUNDS.minLat && loc.coordinates.lat <= DELHI_OSM_BOUNDS.maxLat,
        `${loc.name} latitude ${loc.coordinates.lat} outside Delhi bounds`
      );
      assert.ok(
        loc.coordinates.lng >= DELHI_OSM_BOUNDS.minLng && loc.coordinates.lng <= DELHI_OSM_BOUNDS.maxLng,
        `${loc.name} longitude ${loc.coordinates.lng} outside Delhi bounds`
      );
    }
  });

  it('contains at least 18 curated commuter presets across 6 logical groups', () => {
    assert.ok(DELHI_COMMUTER_PRESETS.length >= 18, `Expected >= 18 presets, got ${DELHI_COMMUTER_PRESETS.length}`);

    const groups = new Set(DELHI_COMMUTER_PRESETS.map(p => p.group));
    assert.ok(groups.has('Central Corridors'));
    assert.ok(groups.has('Transit & Railway'));
    assert.ok(groups.has('South Delhi'));
    assert.ok(groups.has('Airport Connectors'));
    assert.ok(groups.has('North & West'));
    assert.ok(groups.has('East Delhi'));

    for (const preset of DELHI_COMMUTER_PRESETS) {
      assert.ok(VERIFIED_DELHI_LOCATIONS[preset.originId], `Origin ${preset.originId} not in registry`);
      assert.ok(VERIFIED_DELHI_LOCATIONS[preset.destId], `Destination ${preset.destId} not in registry`);
      assert.notEqual(preset.originId, preset.destId, 'Origin and destination must differ');
    }
  });
});

describe('OSRM Routing Response Parser & Alternative Handling', () => {
  const origin = { lat: 28.6315, lng: 77.2167 };
  const dest = { lat: 28.5700, lng: 77.2400 };

  it('parses multiple genuine alternatives and converts [lng, lat] to {lat, lng}', () => {
    const mockOsrmResponse = {
      code: 'Ok',
      routes: [
        {
          distance: 9890.5,
          duration: 812.0,
          geometry: {
            type: 'LineString',
            coordinates: [
              [77.2167, 28.6315],
              [77.2280, 28.6000],
              [77.2400, 28.5700],
            ],
          },
        },
        {
          distance: 10450.0,
          duration: 890.0,
          geometry: {
            type: 'LineString',
            coordinates: [
              [77.2167, 28.6315],
              [77.2350, 28.5900],
              [77.2400, 28.5700],
            ],
          },
        },
      ],
    };

    const plan = parseOsrmRouteResponse(mockOsrmResponse, origin, dest, 'Connaught Place', 'Lajpat Nagar', []);
    assert.equal(plan.routes.length, 2, 'Must parse exactly 2 alternatives without fabrication');

    // First alternative
    const alt1 = plan.routes[0];
    assert.equal(alt1.distanceKm, 9.9);
    assert.equal(alt1.estimatedMinutes, 14);
    assert.equal(alt1.waypoints[0].lat, 28.6315);
    assert.equal(alt1.waypoints[0].lng, 77.2167);

    // Second alternative
    const alt2 = plan.routes[1];
    assert.equal(alt2.distanceKm, 10.5);
    assert.equal(alt2.estimatedMinutes, 15);
  });

  it('parses single alternative honestly without fabricating extra routes', () => {
    const mockSingleRoute = {
      code: 'Ok',
      routes: [
        {
          distance: 1500.0,
          duration: 180.0,
          geometry: {
            type: 'LineString',
            coordinates: [
              [77.2167, 28.6315],
              [77.2190, 28.6330],
            ],
          },
        },
      ],
    };

    const plan = parseOsrmRouteResponse(mockSingleRoute, origin, dest, 'Origin', 'Dest', []);
    assert.equal(plan.routes.length, 1, 'Must not duplicate or fabricate fake alternatives');
    assert.equal(plan.routes[0].recommended, true);
  });

  it('throws descriptive error on malformed or empty OSRM response', () => {
    assert.throws(() => {
      parseOsrmRouteResponse({ code: 'NoRoute', routes: [] }, origin, dest, 'A', 'B', []);
    }, /Invalid OSRM response/);
  });
});

describe('Hazard Proximity & Evaluation Along Route', () => {
  const waypoints = [
    { lat: 28.6315, lng: 77.2167 }, // CP
    { lat: 28.6250, lng: 77.2185 }, // Janpath
    { lat: 28.5700, lng: 77.2400 }, // Lajpat
  ];

  it('detects incidents within 250m and excludes distant incidents', () => {
    const incidentNear: Incident = {
      id: 'INC-NEAR-1',
      category: 'waterlogging',
      severity: 'critical',
      title: 'Active Flooding near Janpath',
      description: 'Water pool on lane',
      location: { road: 'Janpath', area: 'Connaught Place', coordinates: { lat: 28.6251, lng: 77.2186 } },
      observedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      status: 'under_verification',
      verification: 'verified',
      source: 'community',
      isHistorical: false,
      isActive: true,
    };

    const incidentFar: Incident = {
      id: 'INC-FAR-1',
      category: 'pothole',
      severity: 'medium',
      title: 'Rohini Pothole',
      description: 'Distant pothole in Rohini',
      location: { road: 'Outer Ring Rd', area: 'Rohini', coordinates: { lat: 28.7200, lng: 77.1100 } },
      observedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      status: 'reported',
      verification: 'verified',
      source: 'community',
      isHistorical: false,
      isActive: true,
    };

    const result = evaluateRouteHazards(waypoints, [incidentNear, incidentFar]);
    assert.equal(result.matches.length, 1);
    assert.equal(result.matches[0].incidentId, 'INC-NEAR-1');
    assert.equal(result.verifiedWaterlogging, 1);
    assert.equal(result.verifiedDefects, 0);
  });

  it('prevents double-counting duplicate incident records', () => {
    const incident: Incident = {
      id: 'INC-DUP-1',
      category: 'pothole',
      severity: 'high',
      title: 'Pothole on Path',
      description: 'Road defect',
      location: { road: 'Janpath', area: 'CP', coordinates: { lat: 28.6251, lng: 77.2186 } },
      observedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      status: 'reported',
      verification: 'verified',
      source: 'community',
      isHistorical: false,
      isActive: true,
    };

    const result = evaluateRouteHazards(waypoints, [incident, { ...incident }, { ...incident }]);
    assert.equal(result.matches.length, 1, 'Incident must only be counted once');
    assert.equal(result.verifiedDefects, 1);
  });

  it('ignores inactive incidents and incidents with invalid coordinates', () => {
    const inactive: Incident = {
      id: 'INC-RESOLVED',
      category: 'waterlogging',
      severity: 'high',
      title: 'Cleared Water',
      description: 'Water drained',
      location: { road: 'Janpath', area: 'CP', coordinates: { lat: 28.6251, lng: 77.2186 } },
      observedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      status: 'resolution_verified',
      verification: 'resolved',
      source: 'community',
      isHistorical: false,
      isActive: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidCoords: any = {
      id: 'INC-NAN',
      category: 'pothole',
      severity: 'high',
      title: 'Invalid coordinates',
      description: 'Broken lat/lng',
      location: { road: 'Road', area: 'Area', coordinates: { lat: NaN, lng: null } },
      observedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      status: 'reported',
      verification: 'verified',
      source: 'community',
      isHistorical: false,
      isActive: true,
    };

    const result = evaluateRouteHazards(waypoints, [inactive, invalidCoords]);
    assert.equal(result.matches.length, 0);
  });
});

describe('Dynamic Route Planner Integration', () => {
  it('returns valid plan structure with insufficient-data notice when hazards are zero', async () => {
    const origin = VERIFIED_DELHI_LOCATIONS['connaught_place'].coordinates;
    const dest = VERIFIED_DELHI_LOCATIONS['lajpat_nagar'].coordinates;

    const plan = await calculateDynamicRoutes(origin, dest, 'CP', 'Lajpat', []);
    assert.ok(plan !== null);
    assert.ok(plan.routes.length >= 1);

    const primary = plan.routes[0];
    assert.equal(primary.hasSufficientData, false);
    assert.match(primary.dataSufficiencyNotice, /Insufficient verified data to determine current road risk/);
  });

  it('documents proximity threshold as exactly 250 meters', () => {
    assert.equal(INCIDENT_PROXIMITY_THRESHOLD_KM, 0.25);
  });

  it('correctly evaluates boundary condition at exactly 250m (0.25 km) threshold', () => {
    // Horizontal segment along 28.6000°N from 77.2000°E to 77.2100°E
    const segment = [
      { lat: 28.6000, lng: 77.2000 },
      { lat: 28.6000, lng: 77.2100 },
    ];

    // Offset in latitude: 1 degree lat = 110.852 km
    // 0.100 km = 0.100 / 110.852 = 0.000902103°
    // 0.240 km = 0.240 / 110.852 = 0.002165048°
    // 0.250 km = 0.250 / 110.852 = 0.00225526°
    // 0.260 km = 0.260 / 110.852 = 0.002345469°
    const latDelta240m = 0.240 / 110.852;
    const latDelta250m = 0.250 / 110.852;
    const latDelta260m = 0.260 / 110.852;

    const baseIncident = (id: string, latOffset: number): Incident => ({
      id,
      category: 'waterlogging',
      severity: 'high',
      title: `Incident at offset ${latOffset}`,
      description: 'Threshold boundary test',
      location: {
        road: 'Test Road',
        area: 'Test Area',
        coordinates: { lat: 28.6000 + latOffset, lng: 77.2050 }, // Middle of segment
      },
      observedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      status: 'under_verification',
      verification: 'verified',
      source: 'community',
      isHistorical: false,
      isActive: true,
    });

    const inc240m = baseIncident('INC-240M', latDelta240m);
    const inc250m = baseIncident('INC-250M', latDelta250m);
    const inc260m = baseIncident('INC-260M', latDelta260m);

    // 240m should be within 250m threshold
    const res240 = evaluateRouteHazards(segment, [inc240m]);
    assert.equal(res240.matches.length, 1, 'Incident at 240m must be included within 250m buffer');

    // 250.0m should be within or at 250m threshold (<= 0.25)
    const res250 = evaluateRouteHazards(segment, [inc250m]);
    assert.equal(res250.matches.length, 1, 'Incident at exactly 250m must be included (<= 0.25 km)');

    // 260m should be outside 250m threshold
    const res260 = evaluateRouteHazards(segment, [inc260m]);
    assert.equal(res260.matches.length, 0, 'Incident at 260m must be excluded (> 0.25 km)');
  });

  it('correctly projects onto multi-segment curved routes', () => {
    // 3-segment Z-route
    const curvedRoute = [
      { lat: 28.6000, lng: 77.2000 },
      { lat: 28.6100, lng: 77.2000 }, // Northward segment 1
      { lat: 28.6100, lng: 77.2100 }, // Eastward segment 2
      { lat: 28.6200, lng: 77.2100 }, // Northward segment 3
    ];

    // Incident perpendicular to segment 2 (at lat 28.6105, lng 77.2050)
    // Distance from (28.6100, 77.2050) is 0.0005 * 110.852 = ~0.055 km (~55m)
    const incidentOnSeg2: Incident = {
      id: 'INC-SEG2',
      category: 'pothole',
      severity: 'high',
      title: 'Pothole on middle leg',
      description: 'Testing middle segment projection',
      location: {
        road: 'Middle Segment',
        area: 'Test',
        coordinates: { lat: 28.6105, lng: 77.2050 },
      },
      observedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      status: 'reported',
      verification: 'verified',
      source: 'community',
      isHistorical: false,
      isActive: true,
    };

    const evalResult = evaluateRouteHazards(curvedRoute, [incidentOnSeg2]);
    assert.equal(evalResult.matches.length, 1, 'Must detect hazard closest to middle segment of curved route');
    assert.equal(evalResult.verifiedDefects, 1);
  });
});
