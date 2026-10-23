import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore, updateIncidentVerification } from '../data/store';
import type { Incident, HazardCategory, VerificationStatus, HiddenHazard } from '../data/types';
import {
  formatTimeAgo, formatDate, getCategoryLabel, getSeverityBg,
  getStatusBg, getStatusLabel, getVerificationBg, cn
} from '../utils/format';
import {
  Search, FileText, Clock, MapPin, ChevronRight, Eye,
  AlertTriangle, X, Calendar, TriangleAlert,
  History
} from 'lucide-react';

type TabType = 'all' | 'historical' | 'active' | 'hidden';

function EvidencePlaceholder({ label }: { label: string }) {
  return (
    <div className="h-24 rounded-lg border-2 border-dashed border-navy-600/50 flex flex-col items-center justify-center gap-1 bg-navy-700/20">
      <Eye className="w-4 h-4 text-navy-500" />
      <span className="text-[10px] text-navy-500 text-center px-2">{label}</span>
      <span className="text-[9px] text-navy-600 italic">Illustrative placeholder — not authentic evidence</span>
    </div>
  );
}

function IncidentRow({ incident, selected, onClick }: { incident: Incident; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150 group',
        selected
          ? 'border-cyan-500/40 bg-cyan-500/5'
          : 'border-navy-700/30 bg-navy-800/50 hover:border-navy-600/50 hover:bg-navy-800'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0', getSeverityBg(incident.severity))}>
            {incident.severity}
          </span>
          <span className="text-[10px] text-navy-400 shrink-0">{getCategoryLabel(incident.category)}</span>
          {incident.isHistorical && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">Historical</span>
          )}
        </div>
        <p className="text-xs font-medium text-white truncate">{incident.title}</p>
        <p className="text-[10px] text-navy-400 truncate">{incident.location.road}, {incident.location.area}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-navy-400">{formatTimeAgo(incident.observedAt)}</p>
        <span className={cn('text-[9px] px-1.5 py-0.5 rounded border', getVerificationBg(incident.verification))}>
          {incident.verification}
        </span>
      </div>
      <ChevronRight className={cn('w-3.5 h-3.5 shrink-0 transition-colors', selected ? 'text-cyan-400' : 'text-navy-600 group-hover:text-navy-400')} />
    </div>
  );
}

function HiddenHazardRow({ hh, selected, onClick }: { hh: HiddenHazard; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150 group',
        selected
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-red-500/20 bg-navy-800/50 hover:border-red-500/30'
      )}
    >
      <TriangleAlert className="w-4 h-4 text-red-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">
          {hh.historicalDefectType.replace('_', ' ')} beneath waterlogging
        </p>
        <p className="text-[10px] text-navy-400 truncate">{hh.location.road}, {hh.location.area}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-red-400">{hh.confidence}% confident</p>
        <p className="text-[9px] text-navy-500">{formatTimeAgo(hh.detectedAt)}</p>
      </div>
      <ChevronRight className={cn('w-3.5 h-3.5 shrink-0', selected ? 'text-red-400' : 'text-navy-600 group-hover:text-navy-400')} />
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
    <div className="bg-navy-800 border border-navy-700/50 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-navy-700/50 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono text-navy-400">{incident.id}</span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', getSeverityBg(incident.severity))}>
              {incident.severity}
            </span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', getStatusBg(incident.status))}>
              {getStatusLabel(incident.status)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white">{incident.title}</h3>
        </div>
        <button onClick={onClose} className="text-navy-400 hover:text-white shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
        {/* Description */}
        <p className="text-xs text-navy-300 leading-relaxed">{incident.description}</p>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-navy-700/30 rounded-lg">
            <div className="text-[10px] text-navy-500 mb-0.5">Category</div>
            <div className="text-xs text-white font-medium">{getCategoryLabel(incident.category)}</div>
          </div>
          <div className="p-2.5 bg-navy-700/30 rounded-lg">
            <div className="text-[10px] text-navy-500 mb-0.5">Source</div>
            <div className="text-xs text-white font-medium capitalize">{incident.source}</div>
          </div>
          <div className="p-2.5 bg-navy-700/30 rounded-lg col-span-2">
            <div className="text-[10px] text-navy-500 mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />Location</div>
            <div className="text-xs text-white">{incident.location.road}, {incident.location.area}</div>
          </div>
          <div className="p-2.5 bg-navy-700/30 rounded-lg">
            <div className="text-[10px] text-navy-500 mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />Observed</div>
            <div className="text-[10px] text-white">{formatDate(incident.observedAt)}</div>
          </div>
          <div className="p-2.5 bg-navy-700/30 rounded-lg">
            <div className="text-[10px] text-navy-500 mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />Last Verified</div>
            <div className="text-[10px] text-white">{formatDate(incident.lastVerifiedAt)}</div>
          </div>
        </div>

        {/* Evidence Placeholders */}
        <div>
          <h4 className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-2">Evidence</h4>
          <div className="grid grid-cols-2 gap-2">
            <EvidencePlaceholder label="Pre-observation photo" />
            <EvidencePlaceholder label="Follow-up photo" />
          </div>
        </div>

        {/* Verification Controls */}
        <div>
          <h4 className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-2">Verification (Demo)</h4>
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
                    : 'border-navy-600/50 text-navy-400 hover:border-navy-500 hover:text-white'
                )}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Status Timeline */}
        <div>
          <h4 className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <History className="w-3 h-3" />
            Status Timeline
          </h4>
          <div className="relative pl-4">
            {incident.statusHistory.map((entry, i) => (
              <div key={i} className="relative pb-4 last:pb-0">
                <div className="absolute left-[-9px] top-0.5 w-2 h-2 rounded-full bg-cyan-500 border-2 border-navy-800" />
                {i < incident.statusHistory.length - 1 && (
                  <div className="absolute left-[-5px] top-3 bottom-0 w-px bg-navy-700/50" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', getStatusBg(entry.status as any))}>
                      {getStatusLabel(entry.status as any)}
                    </span>
                    <p className="text-[10px] text-navy-400 mt-1">by {entry.actor}</p>
                    {entry.note && <p className="text-[10px] text-navy-500 italic">{entry.note}</p>}
                  </div>
                  <span className="text-[9px] text-navy-500 shrink-0">{formatTimeAgo(entry.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link to full detail */}
        <Link
          to={`/incidents/${incident.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs hover:bg-cyan-500/10 transition-colors"
        >
          View Full Detail Page
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function HiddenHazardDetail({ hh, onClose }: { hh: HiddenHazard; onClose: () => void }) {
  return (
    <div className="bg-navy-800 border border-red-500/30 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-red-500/20 flex items-start justify-between gap-3 bg-red-500/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-navy-400">{hh.id}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">
              Hidden Hazard
            </span>
          </div>
          <h3 className="text-sm font-semibold text-red-300">
            {hh.historicalDefectType.replace('_', ' ')} beneath waterlogging
          </h3>
        </div>
        <button onClick={onClose} className="text-navy-400 hover:text-white shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-[10px] text-red-300 italic">
            ⚠ This is an inferred hazard — not directly confirmed beneath the water. Based on correlation of historical observations with current waterlogging reports.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-navy-700/30 rounded-lg">
            <div className="text-[10px] text-navy-500 mb-0.5">Confidence</div>
            <div className="text-sm font-bold text-white">{hh.confidence}%</div>
            <div className="text-[9px] text-navy-400">{hh.confidenceLabel}</div>
          </div>
          <div className="p-2.5 bg-navy-700/30 rounded-lg">
            <div className="text-[10px] text-navy-500 mb-0.5">Detected</div>
            <div className="text-xs text-white">{formatTimeAgo(hh.detectedAt)}</div>
          </div>
          <div className="p-2.5 bg-navy-700/30 rounded-lg col-span-2">
            <div className="text-[10px] text-navy-500 mb-0.5">Location</div>
            <div className="text-xs text-white">{hh.location.road}, {hh.location.area}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider">Evidence Correlation</h4>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="text-[10px] text-purple-400 font-medium mb-1">Historical Record ({formatTimeAgo(hh.historicalObservedAt)})</div>
            <p className="text-xs text-navy-300">
              {hh.historicalDefectType.replace('_', ' ')} observed at this location · Ref: {hh.historicalIncidentId}
            </p>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <div className="text-[10px] text-cyan-400 font-medium mb-1">Current Waterlogging ({formatTimeAgo(hh.waterloggingReportedAt)})</div>
            <p className="text-xs text-navy-300">
              Active waterlogging reported at same road segment · Ref: {hh.waterloggingIncidentId}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider mb-2">Correlation Explanation</h4>
          <p className="text-xs text-navy-300 leading-relaxed">{hh.explanation}</p>
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
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Road Intelligence
        </h1>
        <p className="text-sm text-navy-400 mt-0.5">Historical observations, current reports, and inferred hidden hazards</p>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Road intelligence record categories" className="flex gap-1 bg-navy-800 border border-navy-700/50 rounded-xl p-1">
        {([
          { id: 'all', label: 'All Records', count: incidents.length },
          { id: 'historical', label: 'Historical', count: incidents.filter(i => i.isHistorical).length },
          { id: 'active', label: 'Active Reports', count: incidents.filter(i => !i.isHistorical && i.isActive).length },
          { id: 'hidden', label: 'Hidden Hazards', count: allHiddenHazards.length },
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
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 min-h-[42px] rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
              tab === t.id
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                : 'text-navy-400 hover:text-white'
            )}
          >
            {t.label}
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-mono',
              tab === t.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-navy-700 text-navy-400'
            )}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab !== 'hidden' && (
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search incidents..."
              className="w-full pl-9 pr-3 py-2 bg-navy-800 border border-navy-700/50 rounded-lg text-xs text-white placeholder:text-navy-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 bg-navy-800 border border-navy-700/50 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
          </select>
          <select
            value={verificationFilter}
            onChange={e => setVerificationFilter(e.target.value as any)}
            className="px-3 py-2 bg-navy-800 border border-navy-700/50 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="disputed">Disputed</option>
          </select>
          {(search || categoryFilter !== 'all' || verificationFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter('all'); setVerificationFilter('all'); }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-navy-600/50 text-navy-400 hover:text-white text-xs"
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
          {tab !== 'hidden' && (
            <>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-navy-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
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
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">About Hidden Hazard Detection</span>
                </div>
                <p className="text-[10px] text-red-300/80">
                  Hidden hazards are <strong>inferred correlations</strong> between historical road defects and current waterlogging.
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

      <p className="text-[10px] text-navy-600 italic text-center">
        All incident records are synthetic demonstration data. Evidence photos are illustrative placeholders.
      </p>
    </div>
  );
}
