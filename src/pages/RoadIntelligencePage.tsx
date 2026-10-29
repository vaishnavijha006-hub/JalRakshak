import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore, updateIncidentVerification } from '../data/store';
import type { Incident, HazardCategory, VerificationStatus, HiddenHazard } from '../data/types';
import { getStationSummaries, NWDP_METADATA } from '../services/rainfallService';
import {
  formatTimeAgo, formatDate, getCategoryLabel, getSeverityBg,
  getStatusBg, getStatusLabel, getVerificationBg, cn
} from '../utils/format';
import {
  Search, FileText, Clock, MapPin, ChevronRight, Eye,
  AlertTriangle, X, Calendar, TriangleAlert,
  History, CloudRain, ExternalLink
} from 'lucide-react';

type TabType = 'all' | 'historical' | 'active' | 'hidden' | 'nwdp_telemetry';

function EvidencePlaceholder({ label }: { label: string }) {
  return (
    <div className="h-24 rounded-lg border-2 border-dashed border-[#1C1C28] flex flex-col items-center justify-center gap-1 bg-[#12121A]">
      <Eye className="w-4 h-4 text-zinc-500" />
      <span className="text-[10px] text-zinc-400 text-center px-2">{label}</span>
      <span className="text-[9px] text-zinc-600 italic">Illustrative placeholder — not authentic evidence</span>
    </div>
  );
}

function IncidentRow({ incident, selected, onClick }: { incident: Incident; selected: boolean; onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Select incident ${incident.id}: ${incident.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150 group card-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
        selected
          ? 'border-[#00F5FF]/50 bg-[#00F5FF]/10 shadow-[0_0_12px_rgba(0,245,255,0.1)]'
          : 'border-[#1C1C28] bg-[#0B0B10] hover:border-[#8B5CF6]/40 hover:bg-[#12121A]'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0', getSeverityBg(incident.severity))}>
            {incident.severity}
          </span>
          <span className="text-[10px] text-zinc-400 shrink-0">{getCategoryLabel(incident.category)}</span>
          {incident.isHistorical ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30">
              Historical Baseline
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#35D07F]/15 text-[#35D07F] border border-[#35D07F]/30">
              Active Report
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-white truncate">{incident.title}</p>
        <p className="text-[10px] text-zinc-400 truncate">{incident.location.road}, {incident.location.area}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-zinc-400">{formatTimeAgo(incident.observedAt)}</p>
        <span className={cn('text-[9px] px-1.5 py-0.5 rounded border', getVerificationBg(incident.verification))}>
          {incident.verification}
        </span>
      </div>
      <ChevronRight className={cn('w-3.5 h-3.5 shrink-0 transition-colors', selected ? 'text-[#00F5FF]' : 'text-zinc-600 group-hover:text-zinc-400')} />
    </div>
  );
}

function HiddenHazardRow({ hh, selected, onClick }: { hh: HiddenHazard; selected: boolean; onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Select hidden hazard ${hh.id}: ${hh.historicalDefectType} beneath waterlogging`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150 group card-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]',
        selected
          ? 'border-[#FF4D6D]/50 bg-[#FF4D6D]/10 shadow-[0_0_12px_rgba(255,77,109,0.15)]'
          : 'border-[#1C1C28] bg-[#0B0B10] hover:border-[#FF9F43]/40 hover:bg-[#12121A]'
      )}
    >
      <TriangleAlert className="w-4 h-4 text-[#FF4D6D] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">
          {hh.historicalDefectType.replace('_', ' ')} beneath waterlogging
        </p>
        <p className="text-[10px] text-zinc-400 truncate">{hh.location.road}, {hh.location.area}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-[#FF4D6D] font-bold">{hh.confidence}% confident</p>
        <p className="text-[9px] text-zinc-500">{formatTimeAgo(hh.detectedAt)}</p>
      </div>
      <ChevronRight className={cn('w-3.5 h-3.5 shrink-0', selected ? 'text-[#FF4D6D]' : 'text-zinc-600 group-hover:text-zinc-400')} />
    </div>
  );
}

function DetailPanel({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const [updating, setUpdating] = useState(false);
  const [localVerification, setLocalVerification] = useState(incident.verification);

  const handleVerify = (v: VerificationStatus) => {
    setUpdating(true);
    updateIncidentVerification(incident.id, v, 'Demo Reviewer');
    setLocalVerification(v);
    setTimeout(() => setUpdating(false), 500);
  };

  return (
    <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-[#1C1C28] flex items-start justify-between gap-3 bg-[#12121A]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono text-zinc-400">{incident.id}</span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', getSeverityBg(incident.severity))}>
              {incident.severity}
            </span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', getStatusBg(incident.status))}>
              {getStatusLabel(incident.status)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white">{incident.title}</h3>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
        {/* Description */}
        <p className="text-xs text-zinc-300 leading-relaxed">{incident.description}</p>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
            <div className="text-[10px] text-zinc-500 mb-0.5">Category</div>
            <div className="text-xs text-white font-medium">{getCategoryLabel(incident.category)}</div>
          </div>
          <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
            <div className="text-[10px] text-zinc-500 mb-0.5">Source</div>
            <div className="text-xs text-white font-medium">
              {incident.isHistorical ? 'PWD Pre-Monsoon Survey' : (incident.reporterAlias ? `Citizen: ${incident.reporterAlias}` : incident.source)}
            </div>
          </div>
          <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg col-span-2">
            <div className="text-[10px] text-zinc-500 mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#00F5FF]" />Location</div>
            <div className="text-xs text-white">{incident.location.road}, {incident.location.area}</div>
          </div>
          <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
            <div className="text-[10px] text-zinc-500 mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#8B5CF6]" />Observed</div>
            <div className="text-[10px] text-white">{formatDate(incident.observedAt)}</div>
          </div>
          <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
            <div className="text-[10px] text-zinc-500 mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3 text-[#00F5FF]" />Last Verified</div>
            <div className="text-[10px] text-white">{formatDate(incident.lastVerifiedAt)}</div>
          </div>
        </div>

        {/* Evidence */}
        <div>
          <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Evidence</h4>
          <div className="grid grid-cols-2 gap-2">
            {incident.photoDataUrl ? (
              <div className="h-24 rounded-lg border border-[#00F5FF]/30 bg-[#12121A] overflow-hidden flex flex-col justify-between">
                <div className="h-16 bg-[#050507] flex items-center justify-center overflow-hidden">
                  <img src={incident.photoDataUrl} alt={incident.title} className="w-full h-full object-cover" />
                </div>
                <div className="px-2 py-1 text-[9px] font-bold text-[#00F5FF] truncate">Reporter photo</div>
              </div>
            ) : (
              <EvidencePlaceholder label="Pre-observation photo" />
            )}
            <EvidencePlaceholder label="Follow-up photo" />
          </div>
        </div>

        {/* Verification Controls */}
        <div>
          <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Verification (Demo)</h4>
          <div className="flex gap-2 flex-wrap">
            {(['unverified', 'verified', 'disputed'] as VerificationStatus[]).map(v => (
              <button
                key={v}
                onClick={() => handleVerify(v)}
                disabled={updating}
                className={cn(
                  'text-[10px] px-3 py-1.5 rounded-lg border transition-all font-medium',
                  localVerification === v
                    ? getVerificationBg(v)
                    : 'border-[#1C1C28] text-zinc-400 hover:border-[#8B5CF6]/50 hover:text-white'
                )}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Status Timeline */}
        <div>
          <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <History className="w-3 h-3 text-[#00F5FF]" />
            Status Timeline
          </h4>
          <div className="relative pl-4">
            {incident.statusHistory.map((entry, i) => (
              <div key={i} className="relative pb-4 last:pb-0">
                <div className="absolute left-[-9px] top-0.5 w-2 h-2 rounded-full bg-[#00F5FF] border-2 border-[#0B0B10]" />
                {i < incident.statusHistory.length - 1 && (
                  <div className="absolute left-[-5px] top-3 bottom-0 w-px bg-[#1C1C28]" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', getStatusBg(entry.status as any))}>
                      {getStatusLabel(entry.status as any)}
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-1">by {entry.actor}</p>
                    {entry.note && <p className="text-[10px] text-zinc-500 italic">{entry.note}</p>}
                  </div>
                  <span className="text-[9px] text-zinc-500 shrink-0">{formatTimeAgo(entry.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link to full detail */}
        <Link
          to={`/incidents/${incident.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-[#8B5CF6]/30 text-[#C4B5FD] text-xs hover:bg-[#8B5CF6]/15 transition-colors"
        >
          View Full Detail Page
          <ChevronRight className="w-3.5 h-3.5 text-[#00F5FF]" />
        </Link>
      </div>
    </div>
  );
}

function HiddenHazardDetail({ hh, onClose }: { hh: HiddenHazard; onClose: () => void }) {
  return (
    <div className="bg-[#0B0B10] border border-[#FF4D6D]/30 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-[#FF4D6D]/20 flex items-start justify-between gap-3 bg-[#FF4D6D]/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-zinc-400">{hh.id}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/30 font-medium">
              Hidden Hazard
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[#FF4D6D]">
            {hh.historicalDefectType.replace('_', ' ')} beneath waterlogging
          </h3>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div className="p-3 rounded-lg bg-[#FFD166]/10 border border-[#FFD166]/30">
          <p className="text-[10px] text-zinc-300 italic">
            ⚠ This is an inferred hazard — not directly confirmed beneath the water. Based on correlation of historical observations with current waterlogging reports.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
            <div className="text-[10px] text-zinc-500 mb-0.5">Confidence</div>
            <div className="text-sm font-bold text-[#FF4D6D]">{hh.confidence}%</div>
            <div className="text-[9px] text-zinc-400">{hh.confidenceLabel}</div>
          </div>
          <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
            <div className="text-[10px] text-zinc-500 mb-0.5">Detected</div>
            <div className="text-xs text-white">{formatTimeAgo(hh.detectedAt)}</div>
          </div>
          <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg col-span-2">
            <div className="text-[10px] text-zinc-500 mb-0.5">Location</div>
            <div className="text-xs text-white">{hh.location.road}, {hh.location.area}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Evidence Correlation</h4>
          <div className="p-3 bg-[#FF9F43]/10 border border-[#FF9F43]/30 rounded-lg">
            <div className="text-[10px] text-[#FF9F43] font-medium mb-1">Historical Record ({formatTimeAgo(hh.historicalObservedAt)})</div>
            <p className="text-xs text-zinc-300">
              {hh.historicalDefectType.replace('_', ' ')} observed at this location · Ref: {hh.historicalIncidentId}
            </p>
          </div>
          <div className="p-3 bg-[#00F5FF]/10 border border-[#00F5FF]/25 rounded-lg">
            <div className="text-[10px] text-[#00F5FF] font-medium mb-1">Current Waterlogging ({formatTimeAgo(hh.waterloggingReportedAt)})</div>
            <p className="text-xs text-zinc-300">
              Active waterlogging reported at same road segment · Ref: {hh.waterloggingIncidentId}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Correlation Explanation</h4>
          <p className="text-xs text-zinc-300 leading-relaxed">{hh.explanation}</p>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES: HazardCategory[] = ['pothole', 'open_manhole', 'waterlogging', 'damaged_road', 'other'];

export function RoadIntelligencePage() {
  const [tab, setTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<HazardCategory | 'all'>('all');
  const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | 'all'>('all');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedHHId, setSelectedHHId] = useState<string | null>(null);

  const { incidents, hiddenHazards: allHiddenHazards } = useStore();
  const rainfallStations = useMemo(() => getStationSummaries(), []);

  const filtered = useMemo(() => {
    let base = [...incidents];
    if (search) base = base.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.location.road.toLowerCase().includes(search.toLowerCase()) ||
      i.location.area.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase())
    );
    if (categoryFilter !== 'all') base = base.filter(i => i.category === categoryFilter);
    if (verificationFilter !== 'all') base = base.filter(i => i.verification === verificationFilter);
    if (tab === 'historical') base = base.filter(i => i.isHistorical);
    if (tab === 'active') base = base.filter(i => !i.isHistorical && i.isActive);
    return base.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
  }, [incidents, search, categoryFilter, verificationFilter, tab]);

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);
  const selectedHH = allHiddenHazards.find(h => h.id === selectedHHId);

  return (
    <div className="p-4 lg:p-6 space-y-4 bg-transparent min-h-screen text-white">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#00F5FF]" />
          Road Intelligence
        </h1>
        <p className="text-sm text-zinc-400 mt-0.5">Historical observations, current reports, and inferred hidden hazards</p>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Road intelligence record categories" className="flex gap-1 bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-1 overflow-x-auto">
        {([
          { id: 'all', label: 'All Records', count: incidents.length },
          { id: 'historical', label: 'Historical', count: incidents.filter(i => i.isHistorical).length },
          { id: 'active', label: 'Active Reports', count: incidents.filter(i => !i.isHistorical && i.isActive).length },
          { id: 'hidden', label: 'Hidden Hazards', count: allHiddenHazards.length },
          { id: 'nwdp_telemetry', label: 'NWDP Rainfall Telemetry', count: rainfallStations.length },
        ] as const).map((t, idx, arr) => (
          <button
            key={t.id}
            role="tab"
            id={`intel-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`intel-panel-${t.id}`}
            onClick={() => { setTab(t.id); setSelectedIncidentId(null); setSelectedHHId(null); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextTab = arr[(idx + 1) % arr.length].id;
                setTab(nextTab);
                setSelectedIncidentId(null);
                setSelectedHHId(null);
                document.getElementById(`intel-tab-${nextTab}`)?.focus();
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevTab = arr[(idx - 1 + arr.length) % arr.length].id;
                setTab(prevTab);
                setSelectedIncidentId(null);
                setSelectedHHId(null);
                document.getElementById(`intel-tab-${prevTab}`)?.focus();
              }
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 min-h-[42px] rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
              tab === t.id
                ? 'bg-[#00F5FF]/15 text-[#00F5FF] border border-[#00F5FF]/30 font-semibold'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            {t.label}
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-mono',
              tab === t.id ? 'bg-[#00F5FF]/20 text-[#00F5FF]' : 'bg-[#1C1C28] text-zinc-400'
            )}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab !== 'hidden' && tab !== 'nwdp_telemetry' && (
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search incidents..."
              className="w-full pl-9 pr-3 py-2 bg-[#0B0B10] border border-[#1C1C28] rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00F5FF]/50"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#0B0B10] border border-[#1C1C28] rounded-lg text-xs text-white focus:outline-none focus:border-[#00F5FF]/50"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
          </select>
          <select
            value={verificationFilter}
            onChange={e => setVerificationFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#0B0B10] border border-[#1C1C28] rounded-lg text-xs text-white focus:outline-none focus:border-[#00F5FF]/50"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="disputed">Disputed</option>
          </select>
          {(search || categoryFilter !== 'all' || verificationFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter('all'); setVerificationFilter('all'); }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#1C1C28] text-zinc-400 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      <div
        role="tabpanel"
        id={`intel-panel-${tab}`}
        aria-labelledby={`intel-tab-${tab}`}
        className={cn('grid gap-4', (selectedIncident || selectedHH) ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}
      >
        {/* List */}
        <div className="space-y-2">
          {tab !== 'hidden' && tab !== 'nwdp_telemetry' && (
            <>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-zinc-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-zinc-600" />
                  <p className="text-sm">No records match your filters</p>
                </div>
              )}
              {filtered.map(inc => (
                <IncidentRow
                  key={inc.id}
                  incident={inc}
                  selected={selectedIncidentId === inc.id}
                  onClick={() => {
                    setSelectedIncidentId(inc.id === selectedIncidentId ? null : inc.id);
                    setSelectedHHId(null);
                  }}
                />
              ))}
            </>
          )}
          {tab === 'hidden' && (
            <>
              <div className="p-3 rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 mb-3 shadow-[0_0_16px_rgba(255,77,109,0.1)]">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-[#FF4D6D]" />
                  <span className="text-xs font-semibold text-[#FF4D6D]">About Hidden Hazard Detection</span>
                </div>
                <p className="text-[10px] text-zinc-300">
                  Hidden hazards are <strong className="text-white">inferred correlations</strong> between historical road defects and current waterlogging.
                  They are not directly confirmed observations. The system uses a deterministic rule: if a verified defect location
                  falls within the same road segment as an active waterlogging report, it flags a potential hidden hazard
                  with a confidence score based on report freshness, verification status, and proximity.
                </p>
              </div>
              {allHiddenHazards.map(hh => (
                <HiddenHazardRow
                  key={hh.id}
                  hh={hh}
                  selected={selectedHHId === hh.id}
                  onClick={() => {
                    setSelectedHHId(hh.id === selectedHHId ? null : hh.id);
                    setSelectedIncidentId(null);
                  }}
                />
              ))}
            </>
          )}
          {tab === 'nwdp_telemetry' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#00F5FF]/10 border border-[#00F5FF]/30 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-[#00F5FF]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      National Water Data Portal — Delhi Telemetry Network
                    </span>
                  </div>
                  <a
                    href={NWDP_METADATA.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#00F5FF] hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Dataset c4fd33e4-73a9-47f7</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Real hourly precipitation telemetry recorded by official automated rain gauges operated by the{' '}
                  <strong className="text-white">Delhi Surface Water Ground Water Department</strong> under the Government Open Data License (GODL).
                  Transposed coordinate anomalies in official CSV records have been normalized.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rainfallStations.map(stn => (
                  <div key={stn.station} className="rounded-xl border border-[#1C1C28] bg-[#0B0B10] p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#8B5CF6] uppercase">{stn.district}</span>
                        <h3 className="text-sm font-bold text-white">{stn.station}</h3>
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded font-mono font-bold',
                        stn.latestRainfallMm > 0 ? 'bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/40' : 'bg-zinc-800 text-zinc-400'
                      )}>
                        {stn.latestRainfallMm} mm
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 pt-1 border-t border-[#1C1C28]">
                      <div>
                        <span className="text-zinc-500 block">Rain Intensity</span>
                        <span className="text-white font-medium">{stn.intensity}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Peak Recorded</span>
                        <span className="text-[#00F5FF] font-mono font-medium">{stn.maxRainfallMm} mm</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Acquired</span>
                        <span className="text-zinc-300">{stn.latestAcquisitionTime}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Coordinates</span>
                        <span className="text-zinc-300 font-mono">{stn.latitude.toFixed(4)}°N, {stn.longitude.toFixed(4)}°E</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedIncident && (
          <DetailPanel
            key={selectedIncident.id}
            incident={selectedIncident}
            onClose={() => setSelectedIncidentId(null)}
          />
        )}
        {selectedHH && (
          <HiddenHazardDetail
            key={selectedHH.id}
            hh={selectedHH}
            onClose={() => setSelectedHHId(null)}
          />
        )}
      </div>

      <p className="text-[10px] text-zinc-500 text-center">
        Persistent database incidents displayed with authentic Delhi rainfall telemetry from National Water Data Portal (NWIC). Correlated hazards and demonstration corridors evaluated by the application intelligence layer.
      </p>
    </div>
  );
}
