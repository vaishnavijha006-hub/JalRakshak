import { useState, useMemo } from 'react';
import { getIncidents, getHiddenHazards } from '../data/store';
import type { RoutePlan, RouteOption } from '../data/types';
import { DEMO_ROUTES } from '../data/incidents';
import { HazardMap } from '../components/map/HazardMap';
import { cn, formatTimeAgo } from '../utils/format';
import {
  Navigation, MapPin, Clock, Ruler, AlertTriangle, Shield,
  ChevronDown, ChevronUp, Info, CheckCircle, ArrowRight,
  Eye, TriangleAlert, Star
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
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-4"
        style={{ borderColor: color, color }}
      >
        {score}
      </div>
      <span className="text-[10px] text-navy-400">Risk Score</span>
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
  const [expanded, setExpanded] = useState(false);
  const color = RISK_SCORE_BAR_COLOR[route.riskLevel] ?? '#6B7280';

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200 cursor-pointer',
        selected
          ? 'border-cyan-500/50 bg-cyan-500/5'
          : 'border-navy-700/50 bg-navy-800 hover:border-navy-600/50',
        route.recommended && !selected && 'ring-1 ring-emerald-500/30'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">{route.name}</h3>
            {route.recommended && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                <Star className="w-2.5 h-2.5" />
                Recommended
              </span>
            )}
          </div>
          <p className="text-xs text-navy-400 mt-0.5">{route.description}</p>
        </div>
        <RiskScoreGauge score={route.riskScore} level={route.riskLevel} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 bg-navy-700/40 rounded-lg px-3 py-2">
          <Ruler className="w-3.5 h-3.5 text-navy-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white">{route.distanceKm} km</div>
            <div className="text-[10px] text-navy-400">Distance</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-navy-700/40 rounded-lg px-3 py-2">
          <Clock className="w-3.5 h-3.5 text-navy-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white">~{route.estimatedMinutes} min</div>
            <div className="text-[10px] text-navy-400">Estimated</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-navy-700/40 rounded-lg px-3 py-2">
          <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-cyan-400">{route.waterloggingCount}</div>
            <div className="text-[10px] text-navy-400">Waterlogging</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-navy-700/40 rounded-lg px-3 py-2">
          <TriangleAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-red-400">{route.hiddenHazardCount}</div>
            <div className="text-[10px] text-navy-400">Hidden Hazards</div>
          </div>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs px-2.5 py-1 rounded-full border font-medium"
          style={{ color, borderColor: `${color}44`, backgroundColor: `${color}15` }}
        >
          {route.riskLevel.charAt(0).toUpperCase() + route.riskLevel.slice(1)} Risk
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="flex items-center gap-1 text-xs text-navy-400 hover:text-white transition-colors"
        >
          {expanded ? 'Hide details' : 'Show details'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Hazard List */}
      {expanded && (
        <div className="border-t border-navy-700/50 pt-3 space-y-2">
          <h4 className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider">Known Hazards on Route</h4>
          {route.hazardDetails.length === 0 ? (
            <p className="text-xs text-navy-400 italic">No reported hazards on this route</p>
          ) : (
            <ul className="space-y-1">
              {route.hazardDetails.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-navy-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-navy-500 mt-1.5 shrink-0" />
                  {detail}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 p-3 rounded-lg bg-navy-700/30 border border-navy-700/50">
            <h4 className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-1">Risk Explanation</h4>
            <p className="text-xs text-navy-300 leading-relaxed">{route.riskExplanation}</p>
          </div>
        </div>
      )}

      {/* Select Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn(
          'mt-3 w-full py-2 rounded-lg text-xs font-medium transition-all duration-200',
          selected
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            : 'bg-navy-700/50 text-navy-300 hover:bg-navy-700 hover:text-white border border-navy-600/50'
        )}
      >
        {selected ? '✓ Route Selected' : 'Select Route'}
      </button>
    </div>
  );
}

export function SafeRoutePage() {
  const allIncidents = useMemo(() => getIncidents(), []);
  const allHiddenHazards = useMemo(() => getHiddenHazards(), []);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('RP-001');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>('R-001B');
  const [showMethodology, setShowMethodology] = useState(false);

  const routePlans: RoutePlan[] = DEMO_ROUTES;
  const selectedPlan = routePlans.find(p => p.id === selectedPlanId);
  const selectedRoute = selectedPlan?.routes.find(r => r.id === selectedRouteId);

  const routeWaypoints = useMemo(() => {
    if (!selectedRoute) return [];
    return [{
      points: selectedRoute.waypoints.map(w => [w.lat, w.lng] as [number, number]),
      color: RISK_SCORE_BAR_COLOR[selectedRoute.riskLevel] ?? '#06B6D4',
      label: selectedRoute.name,
    }];
  }, [selectedRoute]);

  // Filter incidents relevant to selected route
  const relevantIncidents = useMemo(() => {
    if (!selectedRoute) return allIncidents;
    return allIncidents.filter(inc => inc.isActive);
  }, [allIncidents, selectedRoute]);

  const relevantHiddenHazards = useMemo(() => {
    if (!selectedRoute) return allHiddenHazards;
    return allHiddenHazards;
  }, [allHiddenHazards, selectedRoute]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            SafeRoute
          </h1>
          <p className="text-sm text-navy-400 mt-0.5">Compare route risks using historical defects and current waterlogging data</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-medium text-amber-400">DEMO DATA</span>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <Shield className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
        <p className="text-xs text-orange-300">
          Route risk scores are <strong>illustrative prototype calculations</strong> — not validated predictions. 
          Always drive carefully and report any hazards when safely stopped.
        </p>
      </div>

      {/* Route Plan Selector */}
      <div className="bg-navy-800 border border-navy-700/50 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Select Journey</h2>
        <div className="flex flex-wrap gap-2">
          {routePlans.map(plan => (
            <button
              key={plan.id}
              onClick={() => { setSelectedPlanId(plan.id); setSelectedRouteId(plan.routes[0]?.id ?? null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border transition-all',
                selectedPlanId === plan.id
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  : 'border-navy-600/50 text-navy-300 hover:border-navy-500 hover:text-white'
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="font-medium">{plan.origin}</span>
              <ArrowRight className="w-3.5 h-3.5 text-navy-500" />
              <span className="font-medium">{plan.destination}</span>
            </button>
          ))}
        </div>
        {selectedPlan && (
          <p className="text-[10px] text-navy-500 mt-2">
            Analysis generated {formatTimeAgo(selectedPlan.generatedAt)} · All data is synthetic demo
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Route Options */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Route Options</h2>
            <span className="text-[10px] text-navy-400">{selectedPlan?.routes.length ?? 0} routes compared</span>
          </div>

          {selectedPlan?.routes.map(route => (
            <RouteCard
              key={route.id}
              route={route}
              selected={selectedRouteId === route.id}
              onSelect={() => setSelectedRouteId(route.id)}
            />
          ))}

          {/* Trade-off summary */}
          {selectedPlan && (() => {
            const recommended = selectedPlan.routes.find(r => r.recommended);
            const highRisk = selectedPlan.routes.find(r => !r.recommended && r.riskScore === Math.max(...selectedPlan.routes.filter(r2 => !r2.recommended).map(r2 => r2.riskScore)));
            if (!recommended || !highRisk) return null;
            const timeDiff = recommended.estimatedMinutes - highRisk.estimatedMinutes;
            const distDiff = (recommended.distanceKm - highRisk.distanceKm).toFixed(1);
            const riskDiff = Math.round(((highRisk.riskScore - recommended.riskScore) / highRisk.riskScore) * 100);
            return (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">Recommended Route Trade-off</span>
                </div>
                <p className="text-xs text-emerald-300">
                  <strong>{distDiff} km longer</strong>, ~<strong>{timeDiff} min more</strong> — but approximately <strong>{riskDiff}% lower estimated risk</strong> based on current reports.
                </p>
              </div>
            );
          })()}
        </div>

        {/* Map */}
        <div className="xl:col-span-3 space-y-3">
          <div className="bg-navy-800 border border-navy-700/50 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-navy-700/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Route Map</h2>
              {selectedRoute && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full border font-medium"
                  style={{
                    color: RISK_SCORE_BAR_COLOR[selectedRoute.riskLevel],
                    borderColor: `${RISK_SCORE_BAR_COLOR[selectedRoute.riskLevel]}44`,
                    backgroundColor: `${RISK_SCORE_BAR_COLOR[selectedRoute.riskLevel]}15`,
                  }}
                >
                  {selectedRoute.name}
                </span>
              )}
            </div>
            <HazardMap
              incidents={relevantIncidents}
              hiddenHazards={relevantHiddenHazards}
              routeWaypoints={routeWaypoints}
              center={selectedPlan ? [
                (selectedPlan.originCoords.lat + selectedPlan.destCoords.lat) / 2,
                (selectedPlan.originCoords.lng + selectedPlan.destCoords.lng) / 2,
              ] : [28.6139, 77.2090]}
              zoom={12}
              className="h-[420px]"
              showLegend={true}
            />
          </div>

          {/* Methodology */}
          <div className="bg-navy-800 border border-navy-700/50 rounded-xl">
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">Risk Score Methodology</span>
              </div>
              {showMethodology ? <ChevronUp className="w-4 h-4 text-navy-400" /> : <ChevronDown className="w-4 h-4 text-navy-400" />}
            </button>
            {showMethodology && (
              <div className="px-4 pb-4 border-t border-navy-700/50 pt-4 space-y-3">
                <p className="text-xs text-navy-300 leading-relaxed">
                  Route risk is a <strong className="text-white">prototype illustrative calculation</strong>, not a validated prediction model.
                  It combines the following inputs:
                </p>
                {[
                  { label: 'Waterlogging count', weight: '35%', desc: 'Number of active waterlogging reports on the route, weighted by severity' },
                  { label: 'Hidden hazard count', weight: '30%', desc: 'Number of inferred hidden hazards (historical defect + waterlogging overlap), weighted by confidence' },
                  { label: 'Historical defect severity', weight: '20%', desc: 'Severity of known road defects (potholes, open manholes) on or near the route' },
                  { label: 'Report freshness', weight: '10%', desc: 'Newer reports receive higher weight (decay over 24h)' },
                  { label: 'Verification status', weight: '5%', desc: 'Verified reports contribute more than unverified community reports' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 text-[10px] font-mono font-bold shrink-0 border border-cyan-500/20">
                      {item.weight}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{item.label}</div>
                      <div className="text-[10px] text-navy-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] text-amber-300">
                    <strong>Note:</strong> Absence of reports does not guarantee a route is safe. Routes with fewer community reporters may have incomplete hazard coverage. Always drive with caution.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Route Hazard Detail */}
      {selectedRoute && selectedRoute.hiddenHazardCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Hidden Hazard Warning — {selectedRoute.name}</h3>
          </div>
          <p className="text-xs text-red-300 mb-3">
            This route passes near <strong>{selectedRoute.hiddenHazardCount} potential hidden hazard(s)</strong> — locations where
            previously recorded road defects are believed to be submerged beneath current waterlogging.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relevantHiddenHazards
              .filter(hh => selectedRoute.hazardDetails.some(d => d.includes(hh.id)))
              .concat(relevantHiddenHazards.slice(0, selectedRoute.hiddenHazardCount))
              .slice(0, selectedRoute.hiddenHazardCount)
              .map(hh => (
                <div key={hh.id} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">
                      {hh.confidenceLabel}
                    </span>
                    <span className="text-[10px] text-red-400">{hh.confidence}% confidence</span>
                  </div>
                  <p className="text-xs text-navy-300 font-medium">{hh.historicalDefectType.replace('_', ' ')} beneath waterlogging</p>
                  <p className="text-[10px] text-navy-400 mt-1">{hh.location.road}, {hh.location.area}</p>
                  <p className="text-[10px] text-red-400/70 mt-2 italic">
                    ⚠ Inferred hazard — not directly confirmed beneath the water
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
