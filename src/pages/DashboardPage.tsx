// JalRakshak — Dashboard / Command Center Page
// Professional geospatial intelligence dashboard for Delhi monsoon hazards
// Core Brand: Jet Black (#050507), Deep Black (#0B0B10), Royal Amethyst (#8B5CF6), Electric Cyan (#00F5FF)
// Semantic Alerts: Red (#FF4D6D), Orange (#FF9F43), Yellow (#FFD166), Green (#35D07F)

import { useState, useMemo, useCallback, useEffect } from 'react';
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

import { useStore, setIncidents, setHiddenHazards } from '../data/store';
import { fetchIncidents, fetchHiddenHazards, subscribeToIncidentsRealtime } from '../services/incidentService';
import { isSupabaseConfigured } from '../lib/supabase';
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
  { key: 'critical', label: 'Critical', color: '#FF4D6D' },
  { key: 'high', label: 'High', color: '#FF9F43' },
  { key: 'medium', label: 'Medium', color: '#FFD166' },
  { key: 'low', label: 'Low', color: '#71717A' },
];

// Metric Card Component with interactive hover elevation
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
        'relative overflow-hidden rounded-xl border p-4 transition-all duration-300 card-interactive',
        highlight
          ? 'bg-[#FF4D6D]/10 border-[#FF4D6D]/40 shadow-[0_0_24px_rgba(255,77,109,0.15)]'
          : 'bg-[#0B0B10] border-[#1C1C28] hover:border-[#8B5CF6]/40',
      )}
    >
      {highlight && (
        <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full bg-[#FF4D6D]/15 blur-xl pointer-events-none" />
      )}
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
          style={{ background: `${color}18`, borderColor: `${color}35` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {highlight ? (
          <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/40 animate-pulse">
            USP Inferred
          </span>
        ) : (
          <span className="text-[10px] text-zinc-500 font-mono">SYNTHETIC</span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
        <p className="text-xs font-medium text-zinc-300 mt-0.5">{label}</p>
        {sublabel && <p className="text-[10px] text-zinc-500 mt-0.5">{sublabel}</p>}
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
        'w-full text-left rounded-lg border p-3 transition-all duration-200 focus:outline-none card-interactive',
        isSelected
          ? 'bg-[#1C1C28] border-[#00F5FF]/50 shadow-[0_0_12px_rgba(0,245,255,0.15)]'
          : 'bg-[#0B0B10] border-[#1C1C28] hover:bg-[#12121A] hover:border-[#8B5CF6]/40',
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
            <span className="text-[10px] text-zinc-400 font-medium">
              {getCategoryLabel(incident.category)}
            </span>
            {incident.isHistorical && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30">
                Pre-Monsoon
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-zinc-200 truncate">{incident.title}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
              {incident.location.area}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-zinc-500" />
              {formatTimeAgo(incident.reportedAt)}
            </span>
          </div>
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 text-zinc-500 shrink-0 mt-1 transition-transform',
          isSelected && 'rotate-90 text-[#00F5FF]',
        )} />
      </div>
    </button>
  );
}

// Expanded incident detail
function IncidentDetail({ incident }: { incident: Incident }) {
  return (
    <div className="mt-1 space-y-3">
      <div className="bg-[#050507] rounded-lg border border-[#1C1C28] p-3 text-left">
        <p className="text-xs text-zinc-300 leading-relaxed">{incident.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className={cn('text-[10px] px-2 py-0.5 rounded border font-semibold', getSeverityBg(incident.severity))}>
            {incident.severity.toUpperCase()} SEVERITY
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/30">
            {getCategoryLabel(incident.category)}
          </span>
          <span className={cn('text-[10px] px-2 py-0.5 rounded border', getStatusBg(incident.status))}>
            {getStatusLabel(incident.status)}
          </span>
          <span className={cn('text-[10px] px-2 py-0.5 rounded border', getVerificationBg(incident.verification))}>
            {incident.verification === 'verified' ? '✓ Verified' : incident.verification}
          </span>
        </div>

        <div className="mt-3 text-[11px] text-zinc-300 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#00F5FF] shrink-0 mt-0.5" />
          <span>{incident.location.road}, {incident.location.area}</span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
          <div className="p-2 rounded bg-[#0B0B10] border border-[#1C1C28]">
            <span className="text-zinc-500 block">First Observed</span>
            <span className="font-mono text-zinc-200">{formatTimeAgo(incident.observedAt)}</span>
          </div>
          <div className="p-2 rounded bg-[#0B0B10] border border-[#1C1C28]">
            <span className="text-zinc-500 block">Last Verified</span>
            <span className="font-mono text-zinc-200">{formatTimeAgo(incident.lastVerifiedAt)}</span>
          </div>
        </div>

        <Link
          to={`/incidents/${incident.id}`}
          className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-xs text-[#C4B5FD] hover:bg-[#8B5CF6]/20 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-[#00F5FF]" />
            Inspect Incident Evidence &amp; Timeline
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#00F5FF]" />
        </Link>
      </div>
    </div>
  );
}

// Hidden hazard alert banner
function HiddenHazardAlert({ hazard, onClose }: { hazard: HiddenHazard; onClose: () => void }) {
  return (
    <div className="rounded-xl border border-[#FF4D6D]/50 bg-[#0B0B10] p-4 relative shadow-[0_0_24px_rgba(255,77,109,0.15)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 flex items-center justify-center">
            <TriangleAlert className="w-4 h-4 text-[#FF4D6D]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#FF4D6D]">USP — Inferred Hidden Hazard</h3>
            <p className="text-[10px] text-[#FF9F43]">Historical Defect Submerged Beneath Waterlogging</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded text-zinc-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-lg bg-[#050507] border border-[#1C1C28] p-3 mb-2 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#FF9F43] font-semibold uppercase tracking-wider text-[10px]">1. Historical Defect</span>
          <span className="text-zinc-400 text-[10px]">{formatTimeAgo(hazard.historicalObservedAt)}</span>
        </div>
        <p className="text-xs text-zinc-200">
          Known <strong className="text-white">{getCategoryLabel(hazard.historicalDefectType)}</strong> recorded on {hazard.location.road}.
        </p>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1C1C28]">
          <span className="text-[#00F5FF] font-semibold uppercase tracking-wider text-[10px]">2. Active Waterlogging</span>
          <span className="text-zinc-400 text-[10px]">{formatTimeAgo(hazard.waterloggingReportedAt)}</span>
        </div>
        <p className="text-xs text-zinc-200">
          Heavy surface water reported overlapping the exact road segment.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 rounded-full bg-[#1C1C28] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${hazard.confidence}%`,
              background: hazard.confidence >= 75 ? '#FF4D6D' : hazard.confidence >= 50 ? '#FF9F43' : '#FFD166',
            }}
          />
        </div>
        <span className="text-xs font-bold text-white">{hazard.confidence}%</span>
        <span className="text-[10px] text-zinc-400 font-medium">{hazard.confidenceLabel}</span>
      </div>

      <p className="text-[11px] text-zinc-300 leading-relaxed mb-3">
        {hazard.explanation}
      </p>

      <div className="flex items-start gap-1.5 text-[10px] text-zinc-200 bg-[#FFD166]/10 rounded-lg p-2.5 border border-[#FFD166]/30">
        <ShieldAlert className="w-3.5 h-3.5 text-[#FFD166] shrink-0 mt-0.5" />
        <span>
          <strong className="text-white">Inferred Decision-Support Alert:</strong> Submerged condition is statistically estimated from spatial and temporal correlation. Not directly confirmed by physical divers.
        </span>
      </div>
    </div>
  );
}

// Chart tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white">{label}</p>
      <p className="text-xs text-[#00F5FF]">
        {payload[0].value} incident{payload[0].value !== 1 ? 's' : ''} in sample dataset
      </p>
    </div>
  );
}

export function DashboardPage() {
  const { incidents: allIncidents, hiddenHazards, metrics } = useStore();

  // Sync with Supabase on mount and listen to realtime updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;
    const syncData = async () => {
      try {
        const [remoteIncidents, remoteHidden] = await Promise.all([
          fetchIncidents(),
          fetchHiddenHazards(),
        ]);
        if (isMounted) {
          if (remoteIncidents && remoteIncidents.length > 0) {
            setIncidents(remoteIncidents);
          }
          if (remoteHidden && remoteHidden.length > 0) {
            setHiddenHazards(remoteHidden);
          }
        }
      } catch (err) {
        console.warn('Realtime sync failed:', err);
      }
    };

    syncData();

    const { unsubscribe } = subscribeToIncidentsRealtime(() => {
      syncData();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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

  // Chart data with semantic category colors
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allIncidents.forEach(inc => {
      const label = getCategoryLabel(inc.category);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => {
      let color = '#8B5CF6';
      if (name === 'Pothole') color = '#FF9F43';
      if (name === 'Open Manhole') color = '#FF4D6D';
      if (name === 'Waterlogging') color = '#00F5FF';
      if (name === 'Damaged Road') color = '#FFD166';
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
    <div className="min-h-screen bg-transparent text-white p-4 md:p-6 lg:p-8 space-y-6">
      {/* ─── Header & Notice ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1C1C28] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00F5FF]" />
              Delhi Monsoon Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[10px] font-bold text-[#C4B5FD]">
              DELHI ARTERIAL SECTOR
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pre-monsoon defect baseline combined with active inundation across Central &amp; South Delhi corridors (ITO, Minto Bridge, Mathura Rd, Ring Rd).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-[#0B0B10] border border-[#1C1C28] text-[11px] text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00F5FF]" />
            <span>USP Hidden Hazard Engine: <strong className="text-[#FF4D6D]">{hiddenHazards.length} Active Correlations</strong></span>
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
          color="#8B5CF6"
        />
        <MetricCard
          icon={Droplets}
          label="Active Waterlogging"
          value={metrics.activeWaterlogging}
          sublabel="Submerging roads"
          color="#00F5FF"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Potential Hidden Hazards"
          value={metrics.hiddenHazards}
          sublabel="Correlated underwater"
          highlight
          color="#FF4D6D"
        />
        <MetricCard
          icon={Clock}
          label="Pending Verification"
          value={metrics.pendingVerification}
          sublabel="Needs field review"
          color="#FFD166"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Critical Severity"
          value={metrics.criticalAlerts}
          sublabel="Immediate safety risk"
          color="#FF4D6D"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Resolved / Cleared"
          value={metrics.resolvedThisWeek}
          sublabel="Verified safe"
          color="#35D07F"
        />
      </div>

      {/* ─── Multi-factor Filter Bar ──────────────────────────────────── */}
      <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-3 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#00F5FF]" /> Type:
            </span>
            {CATEGORY_FILTERS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="button"
                aria-pressed={selectedCategory === key}
                onClick={() => setSelectedCategory(key)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                  selectedCategory === key
                    ? 'bg-[#00F5FF]/15 text-[#00F5FF] border-[#00F5FF]/50 shadow-sm'
                    : 'bg-[#12121A] text-zinc-400 border-[#1C1C28] hover:text-zinc-200 hover:border-[#8B5CF6]/40',
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search roads, areas, IDs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full min-h-[38px] pl-8 pr-3 py-1.5 rounded-lg bg-[#12121A] border border-[#1C1C28] text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-[#00F5FF]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
            />
          </div>
        </div>

        {/* Severity Filter Row */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1C1C28] flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#FF9F43]" /> Severity:
            </span>
            {SEVERITY_FILTERS.map(({ key, label, color }) => (
              <button
                key={key}
                type="button"
                role="button"
                aria-pressed={selectedSeverity === key}
                onClick={() => setSelectedSeverity(key)}
                className={cn(
                  'px-2.5 py-1 min-h-[32px] rounded text-[11px] font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                  selectedSeverity === key
                    ? 'bg-white/10 text-white font-bold border-white/30'
                    : 'bg-transparent text-zinc-400 border-[#1C1C28] hover:text-zinc-200',
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
              className="flex items-center gap-1 px-2.5 py-1 min-h-[32px] rounded text-xs text-[#00F5FF] bg-[#00F5FF]/10 border border-[#00F5FF]/30 hover:bg-[#00F5FF]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
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
        <div className="rounded-xl border border-[#1C1C28] bg-[#0B0B10] overflow-hidden shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1C1C28] bg-[#12121A]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00F5FF]" />
              <h2 className="text-sm font-bold text-zinc-100">Delhi NCR Spatial Hazard Engine</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/25 font-mono">
                EPSG:4326
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Showing <strong className="text-white">{filteredIncidents.length}</strong> markers ·{' '}
              <strong className="text-[#FF4D6D]">{hiddenHazards.length}</strong> hidden overlays
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

          <div className="p-3 border-t border-[#1C1C28] bg-[#050507] flex items-center justify-between text-[11px] text-zinc-400 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F43]" /> Potholes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D6D]" /> Open Manholes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F5FF]" /> Waterlogging
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#FF4D6D] text-[8px] font-bold text-white flex items-center justify-center">!</span> Hidden Predictions
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 italic">Click any marker to inspect evidence</span>
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
          <div role="tablist" aria-label="Geospatial feed views" className="flex rounded-lg bg-[#0B0B10] border border-[#1C1C28] p-1">
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
                'flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all min-h-[40px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                activeTab === 'feed'
                  ? 'bg-[#00F5FF]/15 text-[#00F5FF] border border-[#00F5FF]/30'
                  : 'text-zinc-400 hover:text-white',
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
                'flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]',
                activeTab === 'hidden_hazards'
                  ? 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              <TriangleAlert className="w-3.5 h-3.5 text-[#FF4D6D]" />
              Hidden Predictions ({hiddenHazards.length})
            </button>
          </div>

          {/* Incident Feed Tab */}
          {activeTab === 'feed' && (
            <div
              role="tabpanel"
              id="dashboard-panel-feed"
              aria-labelledby="dashboard-tab-feed"
              className="rounded-xl border border-[#1C1C28] bg-[#0B0B10] overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-[#1C1C28] flex items-center justify-between bg-[#12121A]">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Reported Hazards Feed
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Sorted by Severity
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-[460px] overflow-y-auto">
                {filteredIncidents.length === 0 ? (
                  <div className="text-center py-10">
                    <Search className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">No hazards match current filters</p>
                    <button
                      onClick={handleResetFilters}
                      className="text-xs text-[#00F5FF] hover:underline mt-1.5 inline-block"
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
              className="rounded-xl border border-[#1C1C28] bg-[#0B0B10] overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-[#1C1C28] bg-[#FF4D6D]/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TriangleAlert className="w-3.5 h-3.5 text-[#FF4D6D]" />
                  <h3 className="text-xs font-bold text-[#FF4D6D] uppercase tracking-wider">
                    Inferred Submerged Hazards
                  </h3>
                </div>
                <span className="text-[10px] text-[#FF9F43] font-semibold">USP Engine</span>
              </div>
              <div className="p-2 space-y-2 max-h-[460px] overflow-y-auto">
                {hiddenHazards.map(hh => (
                  <div
                    key={hh.id}
                    onClick={() => handleSelectHiddenHazard(hh.id)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all card-interactive',
                      selectedHiddenHazardId === hh.id
                        ? 'bg-[#FF4D6D]/10 border-[#FF4D6D]/50 shadow-md'
                        : 'bg-[#12121A] border-[#1C1C28] hover:border-[#FF9F43]/40',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        {getCategoryLabel(hh.historicalDefectType)} submerged
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF4D6D]/15 text-[#FF4D6D] font-bold">
                        {hh.confidence}% Conf.
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      {hh.location.road}, {hh.location.area}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1 italic line-clamp-2">
                      {hh.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dataset Distribution Chart */}
          <div className="rounded-xl border border-[#1C1C28] bg-[#0B0B10] p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Distribution by Category
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Real demo counts</span>
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
