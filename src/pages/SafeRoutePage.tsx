// JalRakshak — SafeRoute Dynamic Risk-Aware Navigation
// Real-world dynamic routing powered by Open Source Routing Machine (OSRM) and OpenStreetMap road network geometry.
// Correlates active citizen & municipal incidents within 250m of actual road-following polylines.

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../data/store';
import { HazardMap } from '../components/map/HazardMap';
import {
  calculateDynamicRoutes,
  type CalculatedRoutePlan,
  type CalculatedRouteAlternative,
  INCIDENT_PROXIMITY_THRESHOLD_KM,
} from '../services/routingService';
import {
  VERIFIED_DELHI_LOCATIONS,
  DELHI_COMMUTER_PRESETS,
  type RoutePreset,
} from '../data/delhiLocations';
import { cn } from '../utils/format';
import {
  Navigation, MapPin, Clock, Ruler,
  Info, CheckCircle, ChevronDown, ChevronUp,
  Eye, TriangleAlert, Star, ArrowLeftRight, Layers,
  Compass, AlertOctagon, Loader2, Sparkles
} from 'lucide-react';

export function SafeRoutePage() {
  const { incidents: allIncidents, hiddenHazards } = useStore();

  // Location state (defaults to Connaught Place -> Lajpat Nagar)
  const [originKey, setOriginKey] = useState<string>('connaught_place');
  const [destKey, setDestKey] = useState<string>('lajpat_nagar');

  // Custom coordinate overrides (e.g. from map click)
  const [customOrigin, setCustomOrigin] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [customDest, setCustomDest] = useState<{ name: string; lat: number; lng: number } | null>(null);

  // Selected route alternative within active plan
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedPresetGroup, setSelectedPresetGroup] = useState<string>('Central Corridors');
  const [showMethodology, setShowMethodology] = useState<boolean>(false);

  // Dynamic Routing state
  const [routePlan, setRoutePlan] = useState<CalculatedRoutePlan | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  // Active Origin Coordinates & Name
  const activeOrigin = useMemo(() => {
    if (customOrigin) return customOrigin;
    const loc = VERIFIED_DELHI_LOCATIONS[originKey];
    return {
      name: loc ? loc.name : 'Origin',
      lat: loc ? loc.coordinates.lat : 28.6315,
      lng: loc ? loc.coordinates.lng : 77.2167,
    };
  }, [customOrigin, originKey]);

  // Active Destination Coordinates & Name
  const activeDest = useMemo(() => {
    if (customDest) return customDest;
    const loc = VERIFIED_DELHI_LOCATIONS[destKey];
    return {
      name: loc ? loc.name : 'Destination',
      lat: loc ? loc.coordinates.lat : 28.5700,
      lng: loc ? loc.coordinates.lng : 77.2400,
    };
  }, [customDest, destKey]);

  // Execute Dynamic Route Calculation via OSRM Engine
  useEffect(() => {
    let ignore = false;

    queueMicrotask(async () => {
      if (ignore) return;
      setIsLoadingRoutes(true);
      setRoutingError(null);

      try {
        const plan = await calculateDynamicRoutes(
          { lat: activeOrigin.lat, lng: activeOrigin.lng },
          { lat: activeDest.lat, lng: activeDest.lng },
          activeOrigin.name,
          activeDest.name,
          allIncidents
        );

        if (!ignore) {
          setRoutePlan(plan);
          const rec = plan.routes.find(r => r.recommended) || plan.routes[0];
          setSelectedRouteId(rec?.id ?? null);
        }
      } catch (err) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : String(err);
          setRoutingError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoadingRoutes(false);
        }
      }
    });

    return () => {
      ignore = true;
    };
  }, [activeOrigin, activeDest, allIncidents]);

  // Active Selected Route Alternative
  const activeRoute = useMemo<CalculatedRouteAlternative | null>(() => {
    if (!routePlan || routePlan.routes.length === 0) return null;
    if (selectedRouteId) {
      const match = routePlan.routes.find(r => r.id === selectedRouteId);
      if (match) return match;
    }
    return routePlan.routes.find(r => r.recommended) || routePlan.routes[0] || null;
  }, [routePlan, selectedRouteId]);

  // Swap Origin and Destination
  const handleSwap = () => {
    if (customOrigin || customDest) {
      setCustomOrigin(customDest);
      setCustomDest(customOrigin);
    } else {
      const prevOrig = originKey;
      setOriginKey(destKey);
      setDestKey(prevOrig);
    }
  };

  // Map Click Handler (sets destination if origin exists)
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setCustomDest({
      name: `Custom Pin (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      lat: coords.lat,
      lng: coords.lng,
    });
  };

  // Preset Selection Handler
  const handleSelectPreset = (preset: RoutePreset) => {
    setCustomOrigin(null);
    setCustomDest(null);
    setOriginKey(preset.originId);
    setDestKey(preset.destId);
  };

  // Formatted Route Polylines for Leaflet Map
  const mapRoutePolylines = useMemo(() => {
    if (!routePlan) return [];
    return routePlan.routes.map(r => {
      const isSelected = activeRoute?.id === r.id;
      return {
        points: r.waypoints.map(w => [w.lat, w.lng] as [number, number]),
        color: isSelected ? '#00F5FF' : '#8B5CF6',
        label: `${r.name} (${r.distanceKm} km · ~${r.estimatedMinutes} min)`,
        active: isSelected,
      };
    });
  }, [routePlan, activeRoute]);

  // Filtered Presets by active Category
  const presetGroups = [
    'Central Corridors',
    'Transit & Railway',
    'South Delhi',
    'Airport Connectors',
    'North & West',
    'East Delhi',
  ];

  const currentGroupPresets = useMemo(() => {
    return DELHI_COMMUTER_PRESETS.filter(p => p.group === selectedPresetGroup);
  }, [selectedPresetGroup]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-transparent min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1C1C28] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Navigation className="w-6 h-6 text-[#00F5FF]" />
              SafeRoute — Delhi Dynamic Road Planner
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#00F5FF]/15 border border-[#00F5FF]/30 text-[10px] font-bold text-[#00F5FF]">
              REAL OSRM ENGINE
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Calculates road-following route alternatives across Delhi using OpenStreetMap network data and cross-references active flood incidents within 250m.
          </p>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-[#0B0B10] border border-[#1C1C28] text-[11px] text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#35D07F] animate-pulse" />
            <span>Routing Provider: <strong className="text-white">OSRM Road Network</strong></span>
          </div>
        </div>
      </div>

      {/* Origin / Destination Selector Bar */}
      <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Origin Select */}
            <div className="flex-1">
              <label htmlFor="origin-select" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#35D07F]" /> Origin Point (A)
                </span>
                {customOrigin && (
                  <button
                    type="button"
                    onClick={() => setCustomOrigin(null)}
                    className="text-[9px] text-[#00F5FF] hover:underline"
                  >
                    Reset to Preset
                  </button>
                )}
              </label>
              <select
                id="origin-select"
                value={customOrigin ? 'custom' : originKey}
                onChange={e => {
                  setCustomOrigin(null);
                  setOriginKey(e.target.value);
                  if (e.target.value === destKey) {
                    setDestKey(Object.keys(VERIFIED_DELHI_LOCATIONS).find(k => k !== e.target.value) || 'lajpat_nagar');
                  }
                }}
                className="w-full min-h-[44px] bg-[#12121A] border border-[#1C1C28] rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#00F5FF]"
              >
                {customOrigin && <option value="custom">📍 {customOrigin.name}</option>}
                {Object.values(VERIFIED_DELHI_LOCATIONS).map(loc => (
                  <option key={loc.id} value={loc.id} disabled={!customDest && loc.id === destKey}>
                    {loc.name} ({loc.description.split('(')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap Origin and Destination"
              title="Swap Origin and Destination"
              className="self-center p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#12121A] border border-[#1C1C28] hover:bg-[#1C1C28] text-zinc-300 hover:text-white transition-colors mt-4 sm:mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#00F5FF]" />
            </button>

            {/* Destination Select */}
            <div className="flex-1">
              <label htmlFor="dest-select" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Compass className="w-3 h-3 text-[#FF4D6D]" /> Destination Point (B)
                </span>
                {customDest && (
                  <button
                    type="button"
                    onClick={() => setCustomDest(null)}
                    className="text-[9px] text-[#00F5FF] hover:underline"
                  >
                    Reset to Preset
                  </button>
                )}
              </label>
              <select
                id="dest-select"
                value={customDest ? 'custom' : destKey}
                onChange={e => {
                  setCustomDest(null);
                  setDestKey(e.target.value);
                  if (e.target.value === originKey) {
                    setOriginKey(Object.keys(VERIFIED_DELHI_LOCATIONS).find(k => k !== e.target.value) || 'connaught_place');
                  }
                }}
                className="w-full min-h-[44px] bg-[#12121A] border border-[#1C1C28] rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#00F5FF]"
              >
                {customDest && <option value="custom">🎯 {customDest.name}</option>}
                {Object.values(VERIFIED_DELHI_LOCATIONS).map(loc => (
                  <option key={loc.id} value={loc.id} disabled={!customOrigin && loc.id === originKey}>
                    {loc.name} ({loc.description.split('(')[0].trim()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 20 Curated Delhi Commuter Shortcuts */}
        <div className="pt-3 border-t border-[#1C1C28] space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#00F5FF]" /> Delhi Commuter Presets (20 Verified Corridors):
            </span>

            {/* Preset Group Filter Tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              {presetGroups.map(grp => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedPresetGroup(grp)}
                  className={cn(
                    'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                    selectedPresetGroup === grp
                      ? 'bg-[#00F5FF]/15 text-[#00F5FF] border border-[#00F5FF]/40 font-bold'
                      : 'bg-[#12121A] text-zinc-400 hover:text-white border border-[#1C1C28]'
                  )}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Buttons for Selected Group */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentGroupPresets.map(preset => {
              const isCurrent =
                !customOrigin &&
                !customDest &&
                originKey === preset.originId &&
                destKey === preset.destId;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                    isCurrent
                      ? 'bg-[#00F5FF]/20 text-[#00F5FF] border-[#00F5FF]/60 font-bold shadow-[0_0_12px_rgba(0,245,255,0.2)]'
                      : 'bg-[#12121A] border-[#1C1C28] text-zinc-300 hover:text-white hover:border-[#8B5CF6]/50'
                  )}
                  title={preset.description}
                >
                  <span>{preset.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Comparison Panel (Left) & Map Centerpiece (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
        {/* Left: Route Alternatives & Hazard Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00F5FF]" />
              {isLoadingRoutes ? (
                <span className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00F5FF]" />
                  Calculating OSRM Route Geometry...
                </span>
              ) : (
                <span>
                  {routePlan?.routes.length ?? 0} Route Alternative{routePlan?.routes.length !== 1 ? 's' : ''} ({activeOrigin.name} → {activeDest.name})
                </span>
              )}
            </h2>
            {activeRoute && (
              <span className="text-[11px] text-zinc-400 font-mono">
                Buffer: {INCIDENT_PROXIMITY_THRESHOLD_KM * 1000}m
              </span>
            )}
          </div>

          {/* Error Banner */}
          {routingError && (
            <div className="p-3.5 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 text-[#FF4D6D] text-xs flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Routing Request Warning</p>
                <p className="text-[11px] text-zinc-300 mt-0.5">{routingError}</p>
              </div>
            </div>
          )}

          {/* Route Alternatives List */}
          {routePlan && (
            <div className="space-y-3">
              {routePlan.routes.map(alt => {
                const isSelected = activeRoute?.id === alt.id;

                return (
                  <div
                    key={alt.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRouteId(alt.id);
                      }
                    }}
                    onClick={() => setSelectedRouteId(alt.id)}
                    className={cn(
                      'rounded-xl border p-4 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF] card-interactive space-y-3',
                      isSelected
                        ? 'border-[#00F5FF]/70 bg-[#00F5FF]/10 shadow-lg shadow-[#00F5FF]/10 ring-1 ring-[#00F5FF]/40'
                        : 'border-[#1C1C28] bg-[#0B0B10] hover:border-[#8B5CF6]/50',
                      alt.recommended && !isSelected && 'ring-1 ring-[#35D07F]/40 border-[#35D07F]/40'
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-bold text-white">{alt.name}</h3>
                          {alt.recommended && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#35D07F]/15 text-[#35D07F] border border-[#35D07F]/35 font-bold">
                              <Star className="w-3 h-3 fill-[#35D07F] text-[#35D07F]" />
                              RECOMMENDED ROUTE
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                            {alt.source === 'osrm_live' ? 'OSRM ROAD NETWORK' : 'OFFLINE CORRIDOR'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-snug">{alt.summary}</p>
                      </div>

                      {/* Distance & Duration Highlight */}
                      <div className="text-right shrink-0">
                        <div className="text-lg font-black text-white">{alt.distanceKm} km</div>
                        <div className="text-xs font-semibold text-[#00F5FF]">~{alt.estimatedMinutes} mins</div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-[#12121A] rounded-lg p-2 border border-[#1C1C28]">
                        <div className="flex items-center gap-1 text-zinc-400 text-[10px] mb-0.5">
                          <Ruler className="w-3 h-3 text-[#00F5FF]" /> Distance
                        </div>
                        <div className="font-bold text-white">{alt.distanceKm} km</div>
                      </div>
                      <div className="bg-[#12121A] rounded-lg p-2 border border-[#1C1C28]">
                        <div className="flex items-center gap-1 text-zinc-400 text-[10px] mb-0.5">
                          <Clock className="w-3 h-3 text-[#00F5FF]" /> Est. Driving
                        </div>
                        <div className="font-bold text-white">~{alt.estimatedMinutes} min</div>
                      </div>
                      <div className="bg-[#12121A] rounded-lg p-2 border border-[#1C1C28]">
                        <div className="flex items-center gap-1 text-zinc-400 text-[10px] mb-0.5">
                          <Eye className="w-3 h-3 text-[#00F5FF]" /> Waterlogging
                        </div>
                        <div className={cn('font-bold', alt.verifiedWaterloggingCount > 0 ? 'text-[#00F5FF]' : 'text-zinc-400')}>
                          {alt.verifiedWaterloggingCount} pool{alt.verifiedWaterloggingCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="bg-[#12121A] rounded-lg p-2 border border-[#1C1C28]">
                        <div className="flex items-center gap-1 text-zinc-400 text-[10px] mb-0.5">
                          <TriangleAlert className="w-3 h-3 text-[#FF4D6D]" /> Road Defects
                        </div>
                        <div className={cn('font-bold', alt.verifiedDefectCount > 0 ? 'text-[#FF4D6D]' : 'text-zinc-400')}>
                          {alt.verifiedDefectCount} defect{alt.verifiedDefectCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Data Sufficiency Warning Banner */}
                    <div className={cn(
                      'p-2.5 rounded-lg border text-xs',
                      alt.hasSufficientData
                        ? 'border-[#35D07F]/30 bg-[#35D07F]/10 text-zinc-200'
                        : 'border-[#FF9F43]/40 bg-[#FF9F43]/10 text-zinc-300'
                    )}>
                      <div className="flex items-start gap-2">
                        {alt.hasSufficientData ? (
                          <CheckCircle className="w-4 h-4 text-[#35D07F] shrink-0 mt-0.5" />
                        ) : (
                          <AlertOctagon className="w-4 h-4 text-[#FF9F43] shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <p className="text-[11px] leading-relaxed">
                            {alt.dataSufficiencyNotice}
                          </p>
                          {alt.nearestStation && (
                            <p className="text-[10px] text-zinc-400 pt-1 border-t border-white/10">
                              Contextual Telemetry Station: <strong className="text-white">{alt.nearestStation.stationName}</strong> ({alt.nearestStation.distanceKm} km from route &middot; {alt.nearestStation.latestRainfallMm} mm recorded at {alt.nearestStation.acquisitionTime})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Incidents List within 250m */}
                    {alt.hazardMatches.length > 0 && isSelected && (
                      <div className="pt-2 border-t border-[#1C1C28] space-y-2">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Incidents Located Within 250m Buffer:
                        </h4>
                        <div className="space-y-1.5">
                          {alt.hazardMatches.map(match => (
                            <div
                              key={match.incidentId}
                              className="p-2 rounded bg-[#050507] border border-[#1C1C28] flex items-center justify-between text-[11px]"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-semibold text-white truncate">{match.title}</div>
                                <div className="text-[10px] text-zinc-400">{match.locationName}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-mono text-[#00F5FF] font-bold">{match.distanceMeters}m from path</div>
                                <div className="text-[9px] text-zinc-500 uppercase">{match.verification}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Methodology Disclosure Accordion */}
          <div className="rounded-xl border border-[#1C1C28] bg-[#0B0B10] overflow-hidden shadow-xl">
            <button
              type="button"
              onClick={() => setShowMethodology(!showMethodology)}
              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#12121A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#00F5FF]" />
                <span className="text-xs font-bold text-zinc-200">Routing &amp; Hazard Methodology Disclosure</span>
              </div>
              {showMethodology ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </button>

            {showMethodology && (
              <div className="p-4 pt-1 border-t border-[#1C1C28] text-xs text-zinc-300 space-y-2.5">
                <p className="text-zinc-400">
                  How SafeRoute evaluates alternative road network paths:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-[#12121A] border border-[#1C1C28]">
                    <span className="font-bold text-[#00F5FF] block">OSRM Routing Engine</span>
                    Actual road-following polylines computed from OpenStreetMap highway geometries
                  </div>
                  <div className="p-2 rounded bg-[#12121A] border border-[#1C1C28]">
                    <span className="font-bold text-[#FF4D6D] block">250m Hazard Buffer</span>
                    Perpendicular distance calculation from route polyline to reported incident coordinates
                  </div>
                  <div className="p-2 rounded bg-[#12121A] border border-[#1C1C28]">
                    <span className="font-bold text-[#35D07F] block">Contextual NWDP Telemetry</span>
                    Hourly precipitation from automated Delhi SW GW gauges nearest to the route midpoint
                  </div>
                  <div className="p-2 rounded bg-[#12121A] border border-[#1C1C28]">
                    <span className="font-bold text-[#FF9F43] block">Honest Data Sufficiency</span>
                    Clear warning displayed when verified incident density along a corridor is zero
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 italic">
                  Note: Driving durations are estimated from road classifications and legal speed limits. Live traffic congestion requires municipal sensor feeds and is not simulated.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Map Workspace with Active Route Corridor */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#1C1C28] bg-[#0B0B10] overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-[#1C1C28] bg-[#12121A] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#00F5FF]" />
                  Delhi Route Hazard Overlay Map
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Active: <strong className="text-[#00F5FF]">{activeRoute?.name || 'Computing...'}</strong> ({activeOrigin.name} → {activeDest.name})
                </p>
              </div>
              <div className="text-[10px] text-zinc-400">
                Click map to set Destination
              </div>
            </div>

            <div className="relative">
              <HazardMap
                incidents={allIncidents.filter(i => i.isActive)}
                hiddenHazards={hiddenHazards}
                routeWaypoints={mapRoutePolylines}
                originCoords={{ lat: activeOrigin.lat, lng: activeOrigin.lng, label: activeOrigin.name }}
                destCoords={{ lat: activeDest.lat, lng: activeDest.lng, label: activeDest.name }}
                onMapClick={handleMapClick}
                center={[activeOrigin.lat, activeOrigin.lng]}
                zoom={12}
                className="h-[460px] md:h-[540px]"
              />

              {/* Map Floating Attribution */}
              <div className="absolute top-3 right-3 z-[1000] px-2.5 py-1 rounded bg-[#0B0B10]/90 border border-[#1C1C28] text-[10px] text-zinc-400 backdrop-blur-sm pointer-events-none">
                OSRM Routing Engine &middot; OpenStreetMap &copy;
              </div>
            </div>
          </div>

          {/* Deep-Dive USP Correlation Card if Waterlogging is on Path */}
          {activeRoute && activeRoute.verifiedWaterloggingCount > 0 && (
            <div className="rounded-xl border border-[#FF4D6D]/50 bg-[#0B0B10] p-4 space-y-2 shadow-[0_0_24px_rgba(255,77,109,0.15)]">
              <div className="flex items-start gap-2.5">
                <AlertOctagon className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#FF4D6D] uppercase tracking-wider">
                    Hazard Proximity Alert — Submerged Roadway Detected
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    This route intersects within 250m of <strong className="text-white">{activeRoute.verifiedWaterloggingCount} active waterlogging zone(s)</strong>.
                    Pre-monsoon potholes and open sumps in this area may be concealed under standing water.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
