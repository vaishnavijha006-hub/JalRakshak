// JalRakshak — SafeRoute Experience
// Demonstrating Innovation 2 (Dynamic Risk-Based Routing) and USP (Hidden Hazard Prediction)
import { useState, useMemo } from 'react';
import { useStore } from '../data/store';
import type { RouteOption } from '../data/types';
import { HazardMap } from '../components/map/HazardMap';
import { cn } from '../utils/format';
import {
  Navigation, MapPin, Clock, Ruler, Shield,
  ChevronDown, ChevronUp, Info, CheckCircle,
  Eye, TriangleAlert, Star, ArrowLeftRight, Layers,
  Compass, AlertOctagon
} from 'lucide-react';

const RISK_SCORE_BAR_COLOR: Record<string, string> = {
  low: '#10B981',
  moderate: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

function RiskScoreGauge({ score, level }: { score: number; level: string }) {
  const color = RISK_SCORE_BAR_COLOR[level] ?? '#6B7280';
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-4 shadow-lg"
        style={{ borderColor: color, color, backgroundColor: `${color}15` }}
      >
        {score}
      </div>
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Risk Score</span>
    </div>
  );
}

function RouteCard({
  route,
  selected,
  onSelect,
}: {
  route: RouteOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const color = RISK_SCORE_BAR_COLOR[route.riskLevel] ?? '#6B7280';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'rounded-xl border p-4 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
        selected
          ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
          : 'border-navy-700/60 bg-[#111827] hover:border-gray-600',
        route.recommended && !selected && 'ring-1 ring-emerald-500/40 border-emerald-500/30',
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-bold text-white">{route.name}</h3>
            {route.recommended && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 font-bold">
                <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                RECOMMENDED ALTERNATIVE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 leading-snug">{route.description}</p>
        </div>
        <RiskScoreGauge score={route.riskScore} level={route.riskLevel} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-navy-900/80 rounded-lg p-2 border border-navy-700/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-0.5">
            <Ruler className="w-3 h-3 text-cyan-400" /> Distance
          </div>
          <div className="text-xs font-bold text-white">{route.distanceKm} km</div>
        </div>
        <div className="bg-navy-900/80 rounded-lg p-2 border border-navy-700/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-0.5">
            <Clock className="w-3 h-3 text-cyan-400" /> Duration
          </div>
          <div className="text-xs font-bold text-white">~{route.estimatedMinutes} min</div>
        </div>
        <div className="bg-navy-900/80 rounded-lg p-2 border border-navy-700/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-0.5">
            <Eye className="w-3 h-3 text-cyan-400" /> Waterlogging
          </div>
          <div className="text-xs font-bold text-cyan-300">{route.waterloggingCount} zones</div>
        </div>
        <div className="bg-navy-900/80 rounded-lg p-2 border border-navy-700/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-0.5">
            <TriangleAlert className="w-3 h-3 text-red-400" /> Hidden Defect
          </div>
          <div className={cn('text-xs font-bold', route.hiddenHazardCount > 0 ? 'text-red-400' : 'text-gray-400')}>
            {route.hiddenHazardCount} danger{route.hiddenHazardCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Risk Level Badge & Toggle */}
      <div className="flex items-center justify-between pt-1">
        <span
          className="text-xs px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider"
          style={{ color, borderColor: `${color}55`, backgroundColor: `${color}18` }}
        >
          {route.riskLevel} Risk Profile
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors p-1"
        >
          {expanded ? 'Hide Risk Breakdown' : 'Inspect Risk Factors'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Detailed Hazard & Reasoning Breakdown */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-navy-700/70 space-y-2.5">
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> Known Road Conditions Along Path
            </h4>
            {route.hazardDetails.length === 0 ? (
              <p className="text-xs text-emerald-400 italic">No recorded hazards on this path segment</p>
            ) : (
              <ul className="space-y-1">
                {route.hazardDetails.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-3 rounded-lg bg-navy-900/90 border border-navy-700/70">
            <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1">
              Dynamic Risk Assessment
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">{route.riskExplanation}</p>
          </div>
        </div>
      )}

      {/* Selection action */}
      <div className="mt-3 pt-2 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">
          {selected ? 'Active on map view' : 'Click to render this path'}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={cn(
            'px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
            selected
              ? 'bg-cyan-500 text-navy-950 shadow-md'
              : 'bg-navy-800 text-gray-300 hover:text-white border border-navy-700 hover:bg-navy-700',
          )}
        >
          {selected ? '✓ Active Route' : 'Compare on Map'}
        </button>
      </div>
    </div>
  );
}

export function SafeRoutePage() {
  const { incidents: allIncidents, hiddenHazards, routes: routePlans } = useStore();

  const [origin, setOrigin] = useState<string>('Connaught Place');
  const [destination, setDestination] = useState<string>('Lajpat Nagar');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);

  // Available locations
  const availableLocations = ['Connaught Place', 'Lajpat Nagar', 'ITO'];

  // Find matching route plan deterministically (bidirectional check)
  const matchResult = useMemo(() => {
    const forward = routePlans.find(p => p.origin === origin && p.destination === destination);
    if (forward) return { plan: forward, isReversed: false };
    const backward = routePlans.find(p => p.origin === destination && p.destination === origin);
    if (backward) return { plan: backward, isReversed: true };
    return null;
  }, [routePlans, origin, destination]);

  const selectedPlan = matchResult?.plan ?? null;
  const isReversed = matchResult?.isReversed ?? false;

  // Derive active route: if selectedRouteId matches current plan, use it; otherwise pick recommended
  const activeRoute = useMemo(() => {
    if (!selectedPlan) return null;
    if (selectedRouteId) {
      const match = selectedPlan.routes.find(r => r.id === selectedRouteId);
      if (match) return match;
    }
    return selectedPlan.routes.find(r => r.recommended) || selectedPlan.routes[0] || null;
  }, [selectedPlan, selectedRouteId]);

  const handleSwap = () => {
    const oldOrigin = origin;
    setOrigin(destination);
    setDestination(oldOrigin);
    setSelectedRouteId(null);
  };

  const routeWaypoints = useMemo(() => {
    if (!activeRoute) return [];
    const waypoints = isReversed ? [...activeRoute.waypoints].reverse() : activeRoute.waypoints;
    return [{
      points: waypoints.map(w => [w.lat, w.lng] as [number, number]),
      color: RISK_SCORE_BAR_COLOR[activeRoute.riskLevel] ?? '#06B6D4',
      label: `${activeRoute.name} (${origin} → ${destination})`,
    }];
  }, [activeRoute, isReversed, origin, destination]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (!selectedPlan) return [28.6139, 77.2090];
    return [
      (selectedPlan.originCoords.lat + selectedPlan.destCoords.lat) / 2,
      (selectedPlan.originCoords.lng + selectedPlan.destCoords.lng) / 2,
    ];
  }, [selectedPlan]);

  // Trade-off calculation
  const tradeOff = useMemo(() => {
    if (!selectedPlan || selectedPlan.routes.length < 2) return null;
    const recommended = selectedPlan.routes.find(r => r.recommended);
    const highestRisk = selectedPlan.routes.reduce(
      (max, r) => (r.riskScore > max.riskScore ? r : max),
      selectedPlan.routes[0],
    );
    if (!recommended || !highestRisk || recommended.id === highestRisk.id) return null;

    const timeDiff = Math.max(0, recommended.estimatedMinutes - highestRisk.estimatedMinutes);
    const distDiff = (recommended.distanceKm - highestRisk.distanceKm).toFixed(1);
    const riskReduction = Math.round(
      ((highestRisk.riskScore - recommended.riskScore) / highestRisk.riskScore) * 100,
    );

    return {
      recommended,
      highestRisk,
      timeDiff,
      distDiff,
      riskReduction,
    };
  }, [selectedPlan]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-[#0B1220] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1F2937]/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Navigation className="w-6 h-6 text-cyan-400" />
              SafeRoute — Dynamic Risk Navigation
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
              INNOVATION 2
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Evaluates alternative paths by cross-referencing pre-monsoon road defects, active waterlogging depth, and spatial confidence.
          </p>
        </div>
      </div>

      {/* Safety & Demo Reality Banner */}
      <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <p className="font-semibold text-orange-300">
            Decision-Support Prototype Notice
          </p>
          <p className="text-[11px] text-orange-200/90 leading-relaxed">
            Risk scores and route corridors are <strong>illustrative demonstration calculations</strong>. Lines represent schematic corridors rather than turn-by-turn navigable road guidance. Absence of reported hazards does not guarantee a road is completely safe. Always exercise caution.
          </p>
        </div>
      </div>

      {/* Origin / Destination Selector Bar */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Origin Select */}
            <div className="flex-1">
              <label htmlFor="origin-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" /> Origin Point
              </label>
              <select
                id="origin-select"
                value={origin}
                onChange={e => {
                  setOrigin(e.target.value);
                  setSelectedRouteId(null);
                  if (e.target.value === destination) {
                    setDestination(availableLocations.find(l => l !== e.target.value) || 'Lajpat Nagar');
                  }
                }}
                className="w-full min-h-[44px] bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                {availableLocations.map(loc => (
                  <option key={loc} value={loc} disabled={loc === destination}>
                    {loc}
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
              className="self-center p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-navy-800 border border-navy-700 hover:bg-navy-700 text-gray-300 hover:text-white transition-colors mt-4 sm:mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Destination Select */}
            <div className="flex-1">
              <label htmlFor="dest-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Compass className="w-3 h-3 text-red-400" /> Destination Point
              </label>
              <select
                id="dest-select"
                value={destination}
                onChange={e => {
                  setDestination(e.target.value);
                  setSelectedRouteId(null);
                  if (e.target.value === origin) {
                    setOrigin(availableLocations.find(l => l !== e.target.value) || 'Connaught Place');
                  }
                }}
                className="w-full min-h-[44px] bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                {availableLocations.map(loc => (
                  <option key={loc} value={loc} disabled={loc === origin}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick preset selector */}
          <div className="flex items-center gap-1.5 self-start lg:self-center pt-2 lg:pt-0 border-t lg:border-t-0 border-navy-800 flex-wrap">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">Corridors:</span>
            <button
              type="button"
              onClick={() => { setOrigin('Connaught Place'); setDestination('Lajpat Nagar'); setSelectedRouteId(null); }}
              className={cn(
                "px-2.5 py-1.5 min-h-[36px] rounded border text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                (origin === 'Connaught Place' && destination === 'Lajpat Nagar') || (origin === 'Lajpat Nagar' && destination === 'Connaught Place')
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                  : "bg-navy-800 border-navy-700 text-gray-300 hover:text-white"
              )}
            >
              CP ↔ Lajpat
            </button>
            <button
              type="button"
              onClick={() => { setOrigin('ITO'); setDestination('Connaught Place'); setSelectedRouteId(null); }}
              className={cn(
                "px-2.5 py-1.5 min-h-[36px] rounded border text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                (origin === 'ITO' && destination === 'Connaught Place') || (origin === 'Connaught Place' && destination === 'ITO')
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                  : "bg-navy-800 border-navy-700 text-gray-300 hover:text-white"
              )}
            >
              ITO ↔ CP
            </button>
            <button
              type="button"
              onClick={() => { setOrigin('ITO'); setDestination('Lajpat Nagar'); setSelectedRouteId(null); }}
              className={cn(
                "px-2.5 py-1.5 min-h-[36px] rounded border text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                (origin === 'ITO' && destination === 'Lajpat Nagar') || (origin === 'Lajpat Nagar' && destination === 'ITO')
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                  : "bg-navy-800 border-navy-700 text-gray-300 hover:text-white"
              )}
            >
              ITO ↔ Lajpat
            </button>
          </div>
        </div>
      </div>

      {!selectedPlan ? (
        /* Explicit corridor unavailable card instead of silent wrong fallback */
        <div className="rounded-xl border border-navy-700 bg-[#111827] p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <TriangleAlert className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white mb-1">Corridor Simulation Not Configured</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              JalRakshak currently models dynamic risk evaluations for the three primary commuter corridors shown below.
              Please select one of these corridors to view hazard predictions:
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setOrigin('Connaught Place'); setDestination('Lajpat Nagar'); }}
              className="px-3 py-2 min-h-[44px] rounded-lg bg-navy-800 border border-navy-700 hover:border-cyan-500 text-xs font-semibold text-gray-200 hover:text-white transition-colors"
            >
              Connaught Place ↔ Lajpat Nagar
            </button>
            <button
              type="button"
              onClick={() => { setOrigin('ITO'); setDestination('Connaught Place'); }}
              className="px-3 py-2 min-h-[44px] rounded-lg bg-navy-800 border border-navy-700 hover:border-cyan-500 text-xs font-semibold text-gray-200 hover:text-white transition-colors"
            >
              ITO ↔ Connaught Place
            </button>
            <button
              type="button"
              onClick={() => { setOrigin('ITO'); setDestination('Lajpat Nagar'); }}
              className="px-3 py-2 min-h-[44px] rounded-lg bg-navy-800 border border-navy-700 hover:border-cyan-500 text-xs font-semibold text-gray-200 hover:text-white transition-colors"
            >
              ITO ↔ Lajpat Nagar
            </button>
          </div>
        </div>
      ) : (
        /* Main Grid: Comparison Panel (Left) & Map Centerpiece (Right) */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
          {/* Left: Route Comparison Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Comparing {selectedPlan.routes.length} Route Options ({origin} → {destination})
              </h2>
              <span className="text-[11px] text-gray-400">
                Risk Range: <strong className="text-emerald-400">{Math.min(...selectedPlan.routes.map(r => r.riskScore))}</strong> to{' '}
                <strong className="text-red-400">{Math.max(...selectedPlan.routes.map(r => r.riskScore))}</strong>
              </span>
            </div>

            {/* Trade-off Highlight Card */}
            {tradeOff && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                      Recommended Risk/Time Trade-off
                    </h4>
                    <p className="text-xs text-gray-200 leading-relaxed">
                      By taking <strong>{tradeOff.recommended.name}</strong> over {tradeOff.highestRisk.name}, the journey is{' '}
                      <strong>{Number(tradeOff.distDiff) >= 0 ? `+${tradeOff.distDiff}` : tradeOff.distDiff} km</strong> and <strong>~{tradeOff.timeDiff} minutes longer</strong>, but circumvents high-risk submerged segments — yielding an estimated{' '}
                      <strong className="text-emerald-300">{tradeOff.riskReduction}% lower hazard risk</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Route Options List */}
            <div className="space-y-3">
              {selectedPlan.routes.map(route => (
                <RouteCard
                  key={route.id}
                  route={route}
                  selected={activeRoute?.id === route.id}
                  onSelect={() => setSelectedRouteId(route.id)}
                />
              ))}
            </div>

            {/* Methodology Disclosure Accordion */}
            <div className="rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMethodology(!showMethodology)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-navy-900/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-gray-200">How the Route Risk Score is Computed</span>
                </div>
                {showMethodology ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {showMethodology && (
                <div className="p-4 pt-1 border-t border-navy-800 text-xs text-gray-300 space-y-2.5">
                  <p className="text-gray-400">
                    The prototype applies a deterministic multi-factor weighting formula across intersected road segments:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-navy-900 border border-navy-800">
                      <span className="font-bold text-cyan-400 block">35% Waterlogging Factor</span>
                      Active surface flooding depth and reported impassability
                    </div>
                    <div className="p-2 rounded bg-navy-900 border border-navy-800">
                      <span className="font-bold text-red-400 block">30% Hidden Hazard Factor</span>
                      Pre-monsoon defects concealed under current water
                    </div>
                    <div className="p-2 rounded bg-navy-900 border border-navy-800">
                      <span className="font-bold text-amber-400 block">20% Historical Defect Severity</span>
                      Pothole depth, broken manhole structural risk
                    </div>
                    <div className="p-2 rounded bg-navy-900 border border-navy-800">
                      <span className="font-bold text-emerald-400 block">15% Freshness &amp; Verification</span>
                      Decay weighting over time + volunteer confirmation
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 italic">
                    Note: Illustrative decision-support model built for hackathon demonstration. Not calibrated against official municipal sensors.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Map Workspace with Active Route Corridor */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-[#1F2937] bg-navy-900/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    Route Hazard Overlay Map
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Viewing: <strong className="text-cyan-300">{activeRoute?.name}</strong> ({origin} → {destination})
                  </p>
                </div>
                {activeRoute && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full border font-bold"
                    style={{
                      color: RISK_SCORE_BAR_COLOR[activeRoute.riskLevel],
                      borderColor: `${RISK_SCORE_BAR_COLOR[activeRoute.riskLevel]}40`,
                      backgroundColor: `${RISK_SCORE_BAR_COLOR[activeRoute.riskLevel]}15`,
                    }}
                  >
                    Score: {activeRoute.riskScore}/100
                  </span>
                )}
              </div>

              <div className="relative">
                <HazardMap
                  incidents={allIncidents.filter(i => i.isActive)}
                  hiddenHazards={hiddenHazards}
                  routeWaypoints={routeWaypoints}
                  center={mapCenter}
                  zoom={13}
                  className="h-[460px] md:h-[520px]"
                />

                {/* Map floating disclaimer */}
                <div className="absolute top-3 left-3 z-[1000] px-2.5 py-1 rounded bg-navy-900/90 border border-navy-700/80 text-[10px] text-gray-400 backdrop-blur-sm pointer-events-none">
                  Schematic corridor overlay · Non-navigable representation
                </div>
              </div>
            </div>

            {/* Deep-Dive USP Correlation Card */}
            {activeRoute && activeRoute.hiddenHazardCount > 0 && (
              <div className="rounded-xl border-2 border-red-500/40 bg-red-500/10 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider">
                      USP Demonstration — Hidden Hazard Correlation Detected on Path
                    </h4>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      This corridor intersects with a <strong>pre-monsoon road cavity</strong> now submerged beneath flooding along {origin} ↔ {destination}. Under dry weather, riders can see and avoid this pothole; flooded, it becomes an invisible hazard.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-navy-950/80 border border-navy-800">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      Pre-Monsoon Defect
                    </span>
                    <span className="text-gray-200">
                      {activeRoute.hazardDetails.find(d => d.toLowerCase().includes('cavity') || d.toLowerCase().includes('pothole') || d.toLowerCase().includes('drain')) || 'Pre-monsoon defect recorded on road segment'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Historical Baseline Observation</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-navy-950/80 border border-navy-800">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      Active Waterlogging
                    </span>
                    <span className="text-gray-200">
                      {activeRoute.hazardDetails.find(d => d.toLowerCase().includes('waterlogging') || d.toLowerCase().includes('flood')) || 'Monsoon water accumulation on corridor'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Current Condition Report</span>
                  </div>
                </div>

                <div className="text-[11px] text-red-200 bg-red-500/15 p-2.5 rounded-lg border border-red-500/30">
                  <strong>Why risk is elevated:</strong> The water level conceals roadbed damage, dramatically elevating crash risk for two-wheelers and delivery riders navigating through standing water.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
