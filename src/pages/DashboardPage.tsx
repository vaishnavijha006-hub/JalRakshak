// JalRakshak — Dashboard / Command Center Page
// Professional geospatial intelligence dashboard for Delhi monsoon hazards
import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  AlertTriangle, Shield, Droplets, Activity, CheckCircle2, Search,
  Clock, MapPin, ChevronRight, ExternalLink, TriangleAlert, X,
  CircleDot, Construction, ShieldAlert, ArrowUpRight,
  Filter, Layers, Sparkles
} from 'lucide-react';

import { useStore } from '../data/store';
import type { Incident, HiddenHazard, HazardCategory, Severity } from '../data/types';
import { HazardMap } from '../components/map/HazardMap';
import {
  formatTimeAgo, getCategoryLabel, getSeverityBg, getSeverityColor,
  getStatusBg, getStatusLabel, getVerificationBg, cn,
} from '../utils/format';

// Severity sort priority
const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

// Category filter config
const CATEGORY_FILTERS: { key: HazardCategory | 'all'; label: string; icon: typeof AlertTriangle }[] = [
  { key: 'all', label: 'All Hazards', icon: Activity },
  { key: 'pothole', label: 'Pothole', icon: CircleDot },
  { key: 'open_manhole', label: 'Open Manhole', icon: AlertTriangle },
  { key: 'waterlogging', label: 'Waterlogging', icon: Droplets },
  { key: 'damaged_road', label: 'Damaged Road', icon: Construction },
];

const SEVERITY_FILTERS: { key: Severity | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'All Severities', color: '#9CA3AF' },
  { key: 'critical', label: 'Critical', color: '#EF4444' },
  { key: 'high', label: 'High', color: '#F97316' },
  { key: 'medium', label: 'Medium', color: '#F59E0B' },
  { key: 'low', label: 'Low', color: '#10B981' },
];

// Metric Card Component
function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
  highlight,
  color,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: number;
  sublabel?: string;
  highlight?: boolean;
  color: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 transition-all duration-300',
        highlight
          ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_24px_rgba(239,68,68,0.12)]'
          : 'bg-[#111827] border-[#1F2937]/70 hover:border-[#374151]',
      )}
    >
      {highlight && (
        <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full bg-red-500/15 blur-xl pointer-events-none" />
      )}
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
          style={{ background: `${color}18`, borderColor: `${color}35` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {highlight ? (
          <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            USP Inferred
          </span>
        ) : (
          <span className="text-[10px] text-gray-500 font-mono">SYNTHETIC</span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
        <p className="text-xs font-medium text-gray-300 mt-0.5">{label}</p>
        {sublabel && <p className="text-[10px] text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

// Incident card in feed
function IncidentCard({
  incident,
  isSelected,
  onClick,
}: {
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-all duration-200 focus:outline-none',
        isSelected
          ? 'bg-[#1F2937]/90 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
          : 'bg-[#111827] border-[#1F2937]/60 hover:bg-[#1F2937]/50 hover:border-gray-600/50',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
          style={{ background: getSeverityColor(incident.severity) }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border', getSeverityBg(incident.severity))}>
              {incident.severity.toUpperCase()}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {getCategoryLabel(incident.category)}
            </span>
            {incident.isHistorical && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Pre-Monsoon
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-gray-200 truncate">{incident.title}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
              {incident.location.area}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-gray-500" />
              {formatTimeAgo(incident.reportedAt)}
            </span>
          </div>
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 text-gray-500 shrink-0 mt-1 transition-transform',
          isSelected && 'rotate-90 text-cyan-400',
        )} />
      </div>
    </button>
  );
}

// Expanded incident detail
function IncidentDetail({ incident }: { incident: Incident }) {
  return (
    <div className="mt-1 space-y-3">
      <div className="bg-[#0B1220] rounded-lg border border-[#1F2937] p-3 text-left">
        <p className="text-xs text-gray-300 leading-relaxed">{incident.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className={cn('text-[10px] px-2 py-0.5 rounded border font-semibold', getSeverityBg(incident.severity))}>
            {incident.severity.toUpperCase()} SEVERITY
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
            {getCategoryLabel(incident.category)}
          </span>
          <span className={cn('text-[10px] px-2 py-0.5 rounded border', getStatusBg(incident.status))}>
            {getStatusLabel(incident.status)}
          </span>
          <span className={cn('text-[10px] px-2 py-0.5 rounded border', getVerificationBg(incident.verification))}>
            {incident.verification === 'verified' ? '✓ Verified' : incident.verification}
          </span>
        </div>

        <div className="mt-3 text-[11px] text-gray-300 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>{incident.location.road}, {incident.location.area}</span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-gray-400">
          <div className="p-2 rounded bg-navy-900 border border-navy-700/50">
            <span className="text-gray-500 block">First Observed</span>
            <span className="font-mono text-gray-200">{formatTimeAgo(incident.observedAt)}</span>
          </div>
          <div className="p-2 rounded bg-navy-900 border border-navy-700/50">
            <span className="text-gray-500 block">Last Verified</span>
            <span className="font-mono text-gray-200">{formatTimeAgo(incident.lastVerifiedAt)}</span>
          </div>
        </div>

        <Link
          to={`/incidents/${incident.id}`}
          className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Inspect Incident Evidence &amp; Timeline
          </span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// Hidden hazard alert banner
function HiddenHazardAlert({ hazard, onClose }: { hazard: HiddenHazard; onClose: () => void }) {
  return (
    <div className="rounded-xl border-2 border-red-500/50 bg-red-500/10 p-4 relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <TriangleAlert className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-400">USP — Inferred Hidden Hazard</h3>
            <p className="text-[10px] text-red-300/80">Historical Defect Submerged Beneath Waterlogging</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-lg bg-[#0B1220] border border-[#1F2937] p-3 mb-2 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px]">1. Historical Defect</span>
          <span className="text-gray-400 text-[10px]">{formatTimeAgo(hazard.historicalObservedAt)}</span>
        </div>
        <p className="text-xs text-gray-200">
          Known <strong className="text-white">{getCategoryLabel(hazard.historicalDefectType)}</strong> recorded on {hazard.location.road}.
        </p>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-navy-800">
          <span className="text-cyan-400 font-semibold uppercase tracking-wider text-[10px]">2. Active Waterlogging</span>
          <span className="text-gray-400 text-[10px]">{formatTimeAgo(hazard.waterloggingReportedAt)}</span>
        </div>
        <p className="text-xs text-gray-200">
          Heavy surface water reported overlapping the exact road segment.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 rounded-full bg-[#1F2937] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${hazard.confidence}%`,
              background: hazard.confidence >= 75 ? '#EF4444' : hazard.confidence >= 50 ? '#F97316' : '#F59E0B',
            }}
          />
        </div>
        <span className="text-xs font-bold text-white">{hazard.confidence}%</span>
        <span className="text-[10px] text-gray-400 font-medium">{hazard.confidenceLabel}</span>
      </div>

      <p className="text-[11px] text-gray-300 leading-relaxed mb-3">
        {hazard.explanation}
      </p>

      <div className="flex items-start gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 rounded-lg p-2.5 border border-amber-500/25">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Inferred Decision-Support Alert:</strong> Submerged condition is statistically estimated from spatial and temporal correlation. Not directly confirmed by physical divers.
        </span>
      </div>
    </div>
  );
}

// Chart tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white">{label}</p>
      <p className="text-xs text-cyan-300">
        {payload[0].value} incident{payload[0].value !== 1 ? 's' : ''} in sample dataset
      </p>
    </div>
  );
}

export function DashboardPage() {
  const { incidents: allIncidents, hiddenHazards, metrics } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<HazardCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'hidden_hazards'>('feed');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedHiddenHazardId, setSelectedHiddenHazardId] = useState<string | null>('HH-001');

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    let result = [...allIncidents];

    if (selectedCategory !== 'all') {
      result = result.filter(i => i.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.location.road.toLowerCase().includes(q) ||
        i.location.area.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q),
      );
    }

    if (selectedSeverity !== 'all') {
      result = result.filter(i => i.severity === selectedSeverity);
    }

    return result.sort((a, b) => {
      const sevDiff = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    });
  }, [allIncidents, selectedCategory, selectedSeverity, searchQuery]);

  // Chart data
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allIncidents.forEach(inc => {
      const label = getCategoryLabel(inc.category);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => {
      let color = '#06B6D4';
      if (name === 'Pothole') color = '#F97316';
      if (name === 'Open Manhole') color = '#EF4444';
      if (name === 'Waterlogging') color = '#06B6D4';
      if (name === 'Damaged Road') color = '#F59E0B';
      return { name, count, color };
    });
  }, [allIncidents]);

  const selectedIncident = useMemo(
    () => allIncidents.find(i => i.id === selectedIncidentId) ?? null,
    [allIncidents, selectedIncidentId],
  );

  const selectedHiddenHazard = useMemo(
    () => hiddenHazards.find(h => h.id === selectedHiddenHazardId) ?? null,
    [hiddenHazards, selectedHiddenHazardId],
  );

  const handleSelectIncident = useCallback((id: string) => {
    setSelectedIncidentId(prev => (prev === id ? null : id));
  }, []);

  const handleSelectHiddenHazard = useCallback((id: string) => {
    setSelectedHiddenHazardId(prev => (prev === id ? null : id));
    setActiveTab('hidden_hazards');
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedCategory('all');
    setSelectedSeverity('all');
    setSearchQuery('');
  }, []);

  const hasActiveFilters = selectedCategory !== 'all' || selectedSeverity !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#0B1220] text-white p-4 md:p-6 lg:p-8 space-y-6">
      {/* ─── Header & Notice ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1F2937]/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-400">
              DEMO DATASET
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Pre-monsoon defect memory combined with active waterlogging across central Delhi corridors.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700/80 text-[11px] text-gray-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>USP Hidden Hazard Engine: <strong className="text-red-400">{hiddenHazards.length} Active Correlations</strong></span>
          </div>
        </div>
      </div>

      {/* ─── Metric Cards (Directly derived from loaded dataset) ────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          icon={Shield}
          label="Total Road Records"
          value={metrics.totalHazards}
          sublabel="Historical + Current"
          color="#06B6D4"
        />
        <MetricCard
          icon={Droplets}
          label="Active Waterlogging"
          value={metrics.activeWaterlogging}
          sublabel="Submerging roads"
          color="#14B8A6"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Potential Hidden Hazards"
          value={metrics.hiddenHazards}
          sublabel="Correlated underwater"
          highlight
          color="#EF4444"
        />
        <MetricCard
          icon={Clock}
          label="Pending Verification"
          value={metrics.pendingVerification}
          sublabel="Needs field review"
          color="#F59E0B"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Critical Severity"
          value={metrics.criticalAlerts}
          sublabel="Immediate safety risk"
          color="#F97316"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Resolved / Cleared"
          value={metrics.resolvedThisWeek}
          sublabel="Verified safe"
          color="#10B981"
        />
      </div>

      {/* ─── Multi-factor Filter Bar ──────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> Type:
            </span>
            {CATEGORY_FILTERS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="button"
                aria-pressed={selectedCategory === key}
                onClick={() => setSelectedCategory(key)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                  selectedCategory === key
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-navy-900/60 text-gray-400 border-navy-700/60 hover:text-gray-200 hover:border-gray-600',
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search roads, areas, IDs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full min-h-[38px] pl-8 pr-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-xs text-gray-200 placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </div>
        </div>

        {/* Severity Filter Row */}
        <div className="flex items-center justify-between pt-2 border-t border-navy-800/80 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-400" /> Severity:
            </span>
            {SEVERITY_FILTERS.map(({ key, label, color }) => (
              <button
                key={key}
                type="button"
                role="button"
                aria-pressed={selectedSeverity === key}
                onClick={() => setSelectedSeverity(key)}
                className={cn(
                  'px-2.5 py-1 min-h-[32px] rounded text-[11px] font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                  selectedSeverity === key
                    ? 'bg-white/10 text-white font-bold border-white/30'
                    : 'bg-transparent text-gray-400 border-navy-700 hover:text-gray-200',
                )}
                style={selectedSeverity === key && key !== 'all' ? { borderColor: `${color}60`, color } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 min-h-[32px] rounded text-xs text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <X className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ─── Main Geospatial Workspace: Map (Centerpiece) + Right Panel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 items-start">
        {/* Large Central Map Workspace */}
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-navy-900/60">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-gray-100">Delhi NCR Spatial Hazard Engine</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                EPSG:4326
              </span>
            </div>
            <div className="text-[11px] text-gray-400">
              Showing <strong className="text-white">{filteredIncidents.length}</strong> markers ·{' '}
              <strong className="text-red-400">{hiddenHazards.length}</strong> hidden overlays
            </div>
          </div>

          <div className="relative">
            <HazardMap
              incidents={filteredIncidents}
              hiddenHazards={hiddenHazards}
              selectedId={selectedIncidentId || selectedHiddenHazardId}
              onSelectIncident={handleSelectIncident}
              onSelectHiddenHazard={handleSelectHiddenHazard}
              className="h-[460px] md:h-[540px] lg:h-[620px]"
            />
          </div>

          <div className="p-3 border-t border-navy-800 bg-[#0B1220]/80 flex items-center justify-between text-[11px] text-gray-400 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" /> Potholes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Open Manholes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" /> Waterlogging
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#EF4444] text-[8px] font-bold text-white flex items-center justify-center">!</span> Hidden Predictions
              </span>
            </div>
            <span className="text-[10px] text-gray-500 italic">Click any marker to inspect evidence</span>
          </div>
        </div>

        {/* Right Intelligence Panel */}
        <div className="space-y-4">
          {/* Active Hidden Hazard Spotlight */}
          {selectedHiddenHazard && (
            <HiddenHazardAlert
              hazard={selectedHiddenHazard}
              onClose={() => setSelectedHiddenHazardId(null)}
            />
          )}

          {/* Tab Switcher: Incident Feed vs Inferred Hazards */}
          <div role="tablist" aria-label="Geospatial feed views" className="flex rounded-lg bg-[#111827] border border-[#1F2937] p-1">
            <button
              type="button"
              role="tab"
              id="dashboard-tab-feed"
              aria-selected={activeTab === 'feed'}
              aria-controls="dashboard-panel-feed"
              onClick={() => setActiveTab('feed')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setActiveTab('hidden_hazards');
                  document.getElementById('dashboard-tab-hidden-hazards')?.focus();
                }
              }}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all min-h-[40px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                activeTab === 'feed'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white',
              )}
            >
              Incident Feed ({filteredIncidents.length})
            </button>
            <button
              type="button"
              role="tab"
              id="dashboard-tab-hidden-hazards"
              aria-selected={activeTab === 'hidden_hazards'}
              aria-controls="dashboard-panel-hidden-hazards"
              onClick={() => setActiveTab('hidden_hazards')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setActiveTab('feed');
                  document.getElementById('dashboard-tab-feed')?.focus();
                }
              }}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
                activeTab === 'hidden_hazards'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-gray-400 hover:text-white',
              )}
            >
              <TriangleAlert className="w-3.5 h-3.5 text-red-400" />
              Hidden Predictions ({hiddenHazards.length})
            </button>
          </div>

          {/* Incident Feed Tab */}
          {activeTab === 'feed' && (
            <div
              role="tabpanel"
              id="dashboard-panel-feed"
              aria-labelledby="dashboard-tab-feed"
              className="rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-[#1F2937] flex items-center justify-between bg-navy-900/40">
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Reported Hazards Feed
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  Sorted by Severity
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-[460px] overflow-y-auto">
                {filteredIncidents.length === 0 ? (
                  <div className="text-center py-10">
                    <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No hazards match current filters</p>
                    <button
                      onClick={handleResetFilters}
                      className="text-xs text-cyan-400 hover:underline mt-1.5 inline-block"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  filteredIncidents.map(inc => (
                    <div key={inc.id}>
                      <IncidentCard
                        incident={inc}
                        isSelected={selectedIncidentId === inc.id}
                        onClick={() => handleSelectIncident(inc.id)}
                      />
                      {selectedIncidentId === inc.id && selectedIncident && (
                        <IncidentDetail incident={selectedIncident} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Hidden Hazards List Tab */}
          {activeTab === 'hidden_hazards' && (
            <div
              role="tabpanel"
              id="dashboard-panel-hidden-hazards"
              aria-labelledby="dashboard-tab-hidden-hazards"
              className="rounded-xl border border-[#1F2937] bg-[#111827] overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-[#1F2937] bg-red-500/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TriangleAlert className="w-3.5 h-3.5 text-red-400" />
                  <h3 className="text-xs font-bold text-red-300 uppercase tracking-wider">
                    Inferred Submerged Hazards
                  </h3>
                </div>
                <span className="text-[10px] text-red-300 font-semibold">USP Engine</span>
              </div>
              <div className="p-2 space-y-2 max-h-[460px] overflow-y-auto">
                {hiddenHazards.map(hh => (
                  <div
                    key={hh.id}
                    onClick={() => handleSelectHiddenHazard(hh.id)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedHiddenHazardId === hh.id
                        ? 'bg-red-500/15 border-red-500/50 shadow-md'
                        : 'bg-navy-900 border-navy-700/60 hover:border-red-500/30',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        {getCategoryLabel(hh.historicalDefectType)} submerged
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                        {hh.confidence}% Conf.
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      {hh.location.road}, {hh.location.area}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 italic line-clamp-2">
                      {hh.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dataset Distribution Chart */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Distribution by Category
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">Real demo counts</span>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%">
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#9CA3AF' }}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#9CA3AF' }}
                    allowDecimals={false}
                    width={20}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
