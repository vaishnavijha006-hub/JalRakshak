import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../data/store';
import { updateIncidentStatusBackend } from '../services/incidentService';
import { useAuth } from '../context/AuthContext';
import type { Incident, IncidentStatus } from '../data/types';
import {
  formatTimeAgo, getCategoryLabel, getSeverityBg,
  getStatusBg, getStatusLabel, cn
} from '../utils/format';
import {
  Wrench, ArrowRight, CheckCircle, AlertTriangle, Eye,
  ChevronRight, Building2, Users, Shield, FileCheck,
  Info, X, ChevronDown, ChevronUp, Database, Zap
} from 'lucide-react';

const STATUS_STEPS: IncidentStatus[] = [
  'reported', 'under_verification', 'forwarded_for_review',
  'repair_reported', 'resolution_verified',
];

const STEP_CONFIG = [
  { status: 'reported' as IncidentStatus, label: 'Reported', color: '#00F5FF', actor: 'Platform', icon: AlertTriangle },
  { status: 'under_verification' as IncidentStatus, label: 'Under Verification', color: '#FFD166', actor: 'Platform', icon: Eye },
  { status: 'forwarded_for_review' as IncidentStatus, label: 'Forwarded for Review', color: '#FF9F43', actor: 'Platform → External (Proposed)', icon: FileCheck },
  { status: 'repair_reported' as IncidentStatus, label: 'Repair Reported', color: '#8B5CF6', actor: 'External (Proposed)', icon: Wrench },
  { status: 'resolution_verified' as IncidentStatus, label: 'Resolution Verified', color: '#35D07F', actor: 'Platform', icon: CheckCircle },
];

function WorkflowDiagram({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00F5FF]" />
          Incident Lifecycle
        </h2>
        <span className="text-[10px] text-zinc-400 px-2 py-1 rounded bg-[#12121A] border border-[#1C1C28]">Demo workflow</span>
      </div>

      {/* Flow diagram */}
      <div className="flex flex-col gap-0">
        {STEP_CONFIG.map((step, i) => {
          const count = counts[step.status] ?? 0;
          const isExternal = step.status === 'repair_reported';
          return (
            <div key={step.status}>
              <div
                className="flex items-center gap-3 p-3 rounded-lg border relative transition-all"
                style={{ borderColor: `${step.color}35`, backgroundColor: `${step.color}0a` }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: `${step.color}20`, borderColor: `${step.color}40` }}
                >
                  <step.icon className="w-4 h-4" style={{ color: step.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">{step.label}</span>
                    {isExternal && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30 font-medium">
                        Proposed External Action
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400">{step.actor}</div>
                </div>
                <div
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                  style={{ color: step.color, borderColor: `${step.color}60`, backgroundColor: `${step.color}15` }}
                >
                  {count}
                </div>
              </div>
              {i < STEP_CONFIG.length - 1 && (
                <div className="flex justify-start pl-7">
                  <div className="w-px h-4 bg-[#1C1C28]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-[#12121A] border border-[#1C1C28]">
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          <span className="text-[#00F5FF] font-medium">Platform Actions</span> — actions taken within JalRakshak by volunteers and demo reviewers.
          <br />
          <span className="text-[#8B5CF6] font-medium">Proposed External Actions</span> — steps that would involve government departments in a future integration.
          <span className="italic text-zinc-500"> No actual government submissions occur in this demo.</span>
        </p>
      </div>
    </div>
  );
}

function IncidentRow({
  incident,
  selected,
  onClick,
  onStatusUpdate,
}: {
  incident: Incident;
  selected: boolean;
  onClick: () => void;
  onStatusUpdate: (id: string, status: IncidentStatus) => void;
}) {
  const currentIdx = STATUS_STEPS.indexOf(incident.status as IncidentStatus);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_STEPS.length - 1
    ? STATUS_STEPS[currentIdx + 1]
    : null;

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-150 card-interactive',
        selected ? 'border-[#00F5FF]/50 bg-[#00F5FF]/10 shadow-[0_0_12px_rgba(0,245,255,0.1)]' : 'border-[#1C1C28] bg-[#0B0B10] hover:border-[#8B5CF6]/40'
      )}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[9px] font-mono text-zinc-500">{incident.id}</span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', getSeverityBg(incident.severity))}>
              {incident.severity}
            </span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', getStatusBg(incident.status as any))}>
              {getStatusLabel(incident.status as any)}
            </span>
          </div>
          <p className="text-xs font-medium text-white truncate">{incident.title}</p>
          <p className="text-[10px] text-zinc-400 truncate">{incident.location.road}, {incident.location.area}</p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <p className="text-[10px] text-zinc-500">{formatTimeAgo(incident.lastVerifiedAt)}</p>
          <Link
            to={`/incidents/${incident.id}`}
            className="text-[10px] text-[#00F5FF] hover:underline flex items-center gap-0.5 justify-end"
            onClick={e => e.stopPropagation()}
          >
            Detail <ChevronRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>

      {/* Action buttons */}
      {nextStatus && (
        <div className="px-3 pb-3 border-t border-[#1C1C28] pt-2.5 flex items-center gap-2 flex-wrap">
          <button
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(incident.id, nextStatus); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00F5FF]/15 border border-[#00F5FF]/30 text-[#00F5FF] text-[10px] font-medium hover:bg-[#00F5FF]/25 transition-all"
          >
            <ArrowRight className="w-3 h-3" />
            → {getStatusLabel(nextStatus)}
          </button>
          {nextStatus === 'forwarded_for_review' && (
            <span className="text-[9px] text-[#C4B5FD] italic">No actual gov. submission</span>
          )}
        </div>
      )}
    </div>
  );
}

export function MaintenancePage() {
  const { incidents } = useStore();
  const { user, profile } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [showArchitecture, setShowArchitecture] = useState(false);

  const activeIncidents = useMemo(() =>
    incidents.filter(i => i.status !== 'outdated'), [incidents]);

  const filtered = useMemo(() =>
    activeIncidents.filter(i =>
      statusFilter === 'all' || i.status === statusFilter
    ),
    [activeIncidents, statusFilter]);

  const statusCounts = useMemo(() =>
    STATUS_STEPS.reduce((acc, s) => ({
      ...acc,
      [s]: incidents.filter(i => i.status === s).length,
    }), {} as Record<string, number>),
    [incidents]);

  const selectedIncident = incidents.find(i => i.id === selectedId);

  const handleStatusUpdate = async (id: string, status: IncidentStatus) => {
    const actorName = profile?.displayName || user?.email?.split('@')[0] || 'Demo Reviewer';
    await updateIncidentStatusBackend(
      id,
      status,
      actorName,
      status === 'forwarded_for_review'
        ? 'Forwarded to proposed municipal review queue'
        : undefined,
      user?.id
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 bg-transparent min-h-screen text-white">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#00F5FF]" />
          Maintenance & Resolution
        </h1>
        <p className="text-sm text-zinc-400 mt-0.5">Manage incident lifecycle and proposed resolution workflow</p>
      </div>

      {/* Demo Notice */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#12121A] border border-[#8B5CF6]/30">
        <Info className="w-4 h-4 text-[#00F5FF] mt-0.5 shrink-0" />
        <p className="text-xs text-zinc-300">
          Status updates in this demo update local data only. <strong className="text-white">No reports are forwarded to government departments.</strong>{' '}
          Labels marked "Proposed External Action" represent future integration aspirations, not existing workflows.
        </p>
      </div>

      {/* Workflow + Filters Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workflow Diagram */}
        <div className="lg:col-span-1">
          <WorkflowDiagram counts={statusCounts} />
        </div>

        {/* Incident List */}
        <div className="lg:col-span-2 space-y-3">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                statusFilter === 'all'
                  ? 'bg-[#00F5FF]/15 border-[#00F5FF]/40 text-[#00F5FF] font-semibold'
                  : 'border-[#1C1C28] bg-[#0B0B10] text-zinc-400 hover:text-white'
              )}
            >
              All ({activeIncidents.length})
            </button>
            {STATUS_STEPS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  statusFilter === s
                    ? getStatusBg(s as any)
                    : 'border-[#1C1C28] bg-[#0B0B10] text-zinc-400 hover:text-white'
                )}
              >
                {getStatusLabel(s as any)} ({statusCounts[s] ?? 0})
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <div className="text-center py-10 text-zinc-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-600" />
                <p className="text-sm">No incidents in this status</p>
              </div>
            )}
            {filtered.map(inc => (
              <IncidentRow
                key={inc.id}
                incident={inc}
                selected={selectedId === inc.id}
                onClick={() => setSelectedId(inc.id === selectedId ? null : inc.id)}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selected Incident Detail */}
      {selectedIncident && (
        <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono text-[#00F5FF]">{selectedIncident.id}</span>
                <span className={cn('text-xs px-2 py-0.5 rounded border', getSeverityBg(selectedIncident.severity))}>
                  {selectedIncident.severity}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">{selectedIncident.title}</h3>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-zinc-400 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
              <div className="text-[10px] text-zinc-500 mb-0.5">Category</div>
              <div className="text-xs text-white font-medium">{getCategoryLabel(selectedIncident.category)}</div>
            </div>
            <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
              <div className="text-[10px] text-zinc-500 mb-0.5">Location</div>
              <div className="text-xs text-white">{selectedIncident.location.road}</div>
              <div className="text-[9px] text-zinc-400">{selectedIncident.location.area}</div>
            </div>
            <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
              <div className="text-[10px] text-zinc-500 mb-0.5">Responsible Agency</div>
              <div className="text-xs text-[#C4B5FD] italic">Proposed / Unconfirmed</div>
              <div className="text-[9px] text-zinc-500">PWD Delhi (future integration)</div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Action Timeline</h4>
            <div className="relative pl-5">
              {selectedIncident.statusHistory.map((entry, i) => (
                <div key={i} className="relative pb-4 last:pb-0">
                  <div className="absolute left-[-10px] top-0.5 w-3 h-3 rounded-full bg-[#00F5FF] border-2 border-[#0B0B10]" />
                  {i < selectedIncident.statusHistory.length - 1 && (
                    <div className="absolute left-[-4px] top-4 bottom-0 w-px bg-[#1C1C28]" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border inline-block mb-0.5', getStatusBg(entry.status as any))}>
                        {getStatusLabel(entry.status as any)}
                      </span>
                      <p className="text-[10px] text-zinc-400">by {entry.actor}</p>
                      {entry.note && <p className="text-[10px] text-zinc-500 italic">{entry.note}</p>}
                    </div>
                    <span className="text-[9px] text-zinc-500 shrink-0">{formatTimeAgo(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Future Architecture */}
      <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl shadow-xl">
        <button
          onClick={() => setShowArchitecture(!showArchitecture)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-sm font-semibold text-white">Proposed Integration Architecture</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30">Future Pathway</span>
          </div>
          {showArchitecture ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </button>

        {showArchitecture && (
          <div className="px-4 pb-5 border-t border-[#1C1C28] pt-4">
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              This describes a <strong className="text-white">proposed future integration</strong>, not an existing implementation.
              JalRakshak currently operates as a community-driven intelligence layer only.
            </p>

            {/* Architecture Boxes */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
              {[
                { icon: Users, label: 'Public Observations', desc: 'Community reporters, survey teams', color: '#00F5FF' },
                { icon: Database, label: 'JalRakshak Intelligence', desc: 'Risk correlation engine', color: '#8B5CF6' },
                { icon: Building2, label: 'Departmental Review', desc: 'Authorized gov. reviewers (proposed)', color: '#FF9F43' },
                { icon: Wrench, label: 'Repair Verification', desc: 'Field verification of repairs', color: '#C4B5FD' },
                { icon: Shield, label: 'Public Hazard Map', desc: 'Updated community safety info', color: '#35D07F' },
              ].map((item, i, arr) => (
                <div key={item.label} className="flex sm:flex-col items-center w-full sm:flex-1">
                  <div
                    className="w-full sm:w-auto flex sm:flex-col items-center gap-3 sm:gap-2 p-3 rounded-xl border text-center"
                    style={{ borderColor: `${item.color}35`, backgroundColor: `${item.color}0a` }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{ backgroundColor: `${item.color}20`, borderColor: `${item.color}40` }}
                    >
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div className="sm:text-center">
                      <div className="text-xs font-semibold text-white">{item.label}</div>
                      <div className="text-[10px] text-zinc-400">{item.desc}</div>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="shrink-0 flex items-center justify-center sm:rotate-90 w-8 sm:w-full sm:py-1">
                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#12121A] border border-[#8B5CF6]/30">
              <p className="text-[10px] text-[#C4B5FD]">
                <strong className="text-white">Disclaimer:</strong> This is a proposed architecture diagram demonstrating how JalRakshak could
                complement existing municipal road-maintenance systems. No government partnership or data integration
                currently exists. Any "Forwarded for Review" status in this demo does not result in actual communication
                with government departments.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
