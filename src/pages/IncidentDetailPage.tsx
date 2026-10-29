import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { updateIncidentStatusBackend, updateIncidentVerificationBackend } from '../services/incidentService';
import { useAuth } from '../context/AuthContext';
import { HazardMap } from '../components/map/HazardMap';
import {
  formatDate, formatTimeAgo, getCategoryLabel, getSeverityBg,
  getStatusBg, getStatusLabel, getVerificationBg, cn
} from '../utils/format';
import {
  ArrowLeft, MapPin, Clock, AlertTriangle,
  Info, History, TriangleAlert, User, Calendar, Wrench
} from 'lucide-react';
import type { IncidentStatus, VerificationStatus } from '../data/types';

const STATUS_FLOW: IncidentStatus[] = [
  'reported', 'under_verification', 'forwarded_for_review',
  'repair_reported', 'resolution_verified',
];

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Subscribe reactively to store updates so this page stays synchronized with any external or internal state changes
  const { incidents, hiddenHazards } = useStore();

  const incident = useMemo(
    () => incidents.find(i => i.id === id),
    [incidents, id]
  );

  const relatedHH = useMemo(
    () => hiddenHazards.filter(hh => hh.historicalIncidentId === id || hh.waterloggingIncidentId === id),
    [hiddenHazards, id]
  );

  const { user, profile } = useAuth();
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [verificationUpdating, setVerificationUpdating] = useState(false);

  if (!incident) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center bg-[#050507] text-white">
        <div className="w-16 h-16 rounded-full bg-[#0B0B10] border border-[#1C1C28] flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Incident Not Found</h2>
        <p className="text-sm text-zinc-400 mb-6">No incident with ID <code className="text-[#00F5FF]">{id}</code> was found.</p>
        <Link
          to="/road-intelligence"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1C1C28] text-white hover:bg-[#2A2A3C] transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Road Intelligence
        </Link>
      </div>
    );
  }

  const handleStatusUpdate = async (status: IncidentStatus) => {
    if (!incident) return;
    setStatusUpdating(true);
    const actorName = profile?.displayName || user?.email?.split('@')[0] || 'Demo Reviewer';
    await updateIncidentStatusBackend(incident.id, status, actorName, undefined, user?.id);
    setStatusUpdating(false);
  };

  const handleVerificationUpdate = async (verification: VerificationStatus) => {
    if (!incident) return;
    setVerificationUpdating(true);
    const actorName = profile?.displayName || user?.email?.split('@')[0] || 'Demo Reviewer';
    await updateIncidentVerificationBackend(incident.id, verification, actorName);
    setVerificationUpdating(false);
  };

  const currentStatusIdx = STATUS_FLOW.indexOf(incident.status as IncidentStatus);
  const nextStatus = currentStatusIdx >= 0 && currentStatusIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentStatusIdx + 1]
    : null;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto bg-transparent min-h-screen text-white">
      {/* Back Button + Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:block">Back</span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[#00F5FF] bg-[#00F5FF]/10 border border-[#00F5FF]/20 px-2 py-0.5 rounded">
              {incident.id}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', getSeverityBg(incident.severity))}>
              {incident.severity}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded border', getStatusBg(incident.status as any))}>
              {getStatusLabel(incident.status as any)}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded border', getVerificationBg(incident.verification))}>
              {incident.verification}
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">{incident.title}</h1>
          <p className="text-sm text-zinc-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#00F5FF]" />
            {incident.location.road}, {incident.location.area}
          </p>
        </div>
      </div>

      {/* Hidden Hazard Warning with Semantic Red Alert */}
      {relatedHH.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 shadow-[0_0_16px_rgba(255,77,109,0.12)]">
          <TriangleAlert className="w-5 h-5 text-[#FF4D6D] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#FF4D6D] mb-1">
              Related Hidden Hazard Detected
            </p>
            {relatedHH.map(hh => (
              <p key={hh.id} className="text-xs text-zinc-300">
                {hh.id}: {hh.historicalDefectType.replace('_', ' ')} potentially submerged beneath waterlogging —{' '}
                <span className="font-bold text-[#FF4D6D]">{hh.confidence}% confidence</span>.
                {' '}<em className="text-[#FF9F43]">Inferred, not directly confirmed.</em>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left column — Details */}
        <div className="lg:col-span-3 space-y-4">
          {/* Description */}
          <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-4 shadow-xl">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Observation Details</h2>
            <p className="text-sm text-zinc-200 leading-relaxed">{incident.description}</p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5">Category</div>
                <div className="text-sm font-medium text-white">{getCategoryLabel(incident.category)}</div>
              </div>
              <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5">Source</div>
                <div className="text-sm font-medium text-white capitalize">{incident.source}</div>
              </div>
              <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#8B5CF6]" />Observed</div>
                <div className="text-xs text-white">{formatDate(incident.observedAt)}</div>
                <div className="text-[9px] text-zinc-400">{formatTimeAgo(incident.observedAt)}</div>
              </div>
              <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3 text-[#00F5FF]" />Last Verified</div>
                <div className="text-xs text-white">{formatDate(incident.lastVerifiedAt)}</div>
                <div className="text-[9px] text-zinc-400">{formatTimeAgo(incident.lastVerifiedAt)}</div>
              </div>
              <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5 flex items-center gap-1"><User className="w-3 h-3 text-zinc-400" />Reporter</div>
                <div className="text-xs text-white">{incident.reporterAlias ?? 'Anonymous'}</div>
              </div>
              <div className="p-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5">Type</div>
                <div className="text-xs font-medium text-white">
                  {incident.isHistorical ? '📋 Historical / Pre-monsoon' : '⚡ Active Report'}
                </div>
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-4 shadow-xl">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Evidence</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incident.photoDataUrl ? (
                <div className="rounded-lg border border-[#00F5FF]/30 bg-[#12121A] overflow-hidden flex flex-col justify-between">
                  <div className="h-32 bg-[#050507] flex items-center justify-center overflow-hidden">
                    <img
                      src={incident.photoDataUrl}
                      alt={incident.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 border-t border-[#1C1C28]">
                    <span className="text-[10px] font-bold text-[#00F5FF] block">Reporter Photo Evidence</span>
                    <span className="text-[9px] text-zinc-400">Attached at report time · Stored locally</span>
                  </div>
                </div>
              ) : (
                <div className="h-28 rounded-lg border-2 border-dashed border-[#1C1C28] flex flex-col items-center justify-center gap-1.5 bg-[#12121A]">
                  <div className="w-8 h-8 rounded-full bg-[#1C1C28] flex items-center justify-center">
                    <Info className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="text-[10px] text-zinc-400 text-center px-3">Pre-observation / Historical photo</span>
                  <span className="text-[9px] text-zinc-600 italic text-center px-2">Illustrative placeholder — not authentic evidence</span>
                </div>
              )}

              <div className="h-28 rounded-lg border-2 border-dashed border-[#1C1C28] flex flex-col items-center justify-center gap-1.5 bg-[#12121A]">
                <div className="w-8 h-8 rounded-full bg-[#1C1C28] flex items-center justify-center">
                  <Info className="w-4 h-4 text-zinc-500" />
                </div>
                <span className="text-[10px] text-zinc-400 text-center px-3">Recent follow-up photo</span>
                <span className="text-[9px] text-zinc-600 italic text-center px-2">Awaiting municipal verification inspection</span>
              </div>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-4 shadow-xl">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-[#00F5FF]" />
              Demo Controls
            </h2>

            <div className="space-y-3">
              {/* Status Advance */}
              <div>
                <label className="text-[10px] text-zinc-500 mb-2 block">Advance Status</label>
                <div className="flex flex-wrap gap-2">
                  {nextStatus && (
                    <button
                      onClick={() => handleStatusUpdate(nextStatus)}
                      disabled={statusUpdating}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00F5FF]/15 border border-[#00F5FF]/30 text-[#00F5FF] text-xs font-medium hover:bg-[#00F5FF]/25 transition-all disabled:opacity-50"
                    >
                      {statusUpdating ? '...' : `→ ${getStatusLabel(nextStatus)}`}
                    </button>
                  )}
                  {incident.status !== 'outdated' && (
                    <button
                      onClick={() => handleStatusUpdate('outdated')}
                      disabled={statusUpdating}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#12121A] border border-[#1C1C28] text-zinc-400 text-xs hover:text-white transition-all disabled:opacity-50"
                    >
                      Mark Outdated
                    </button>
                  )}
                </div>
                {incident.status === 'forwarded_for_review' && (
                  <p className="text-[9px] text-[#C4B5FD] mt-1.5 italic">
                    Note: In this demo, no actual government submission occurs
                  </p>
                )}
              </div>

              {/* Verification */}
              <div>
                <label className="text-[10px] text-zinc-500 mb-2 block">Update Verification</label>
                <div className="flex gap-2 flex-wrap">
                  {(['verified', 'unverified', 'disputed'] as VerificationStatus[]).map(v => (
                    <button
                      key={v}
                      onClick={() => handleVerificationUpdate(v)}
                      disabled={verificationUpdating}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-all font-medium disabled:opacity-50',
                        incident.verification === v
                          ? getVerificationBg(v)
                          : 'border-[#1C1C28] text-zinc-400 hover:border-[#8B5CF6]/50 hover:text-white'
                      )}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Map + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map */}
          <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl overflow-hidden shadow-xl">
            <div className="p-3 border-b border-[#1C1C28] bg-[#12121A]">
              <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#00F5FF]" />Location
              </h2>
            </div>
            <HazardMap
              incidents={[incident]}
              hiddenHazards={relatedHH}
              selectedId={incident.id}
              center={[incident.location.coordinates.lat, incident.location.coordinates.lng]}
              zoom={15}
              className="h-64"
              showLegend={false}
            />
            <div className="p-3 border-t border-[#1C1C28] bg-[#050507]">
              <p className="text-[10px] text-zinc-300">{incident.location.road}, {incident.location.area}</p>
              <p className="text-[9px] text-zinc-500">
                {incident.location.coordinates.lat.toFixed(4)}, {incident.location.coordinates.lng.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-4 shadow-xl">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-[#00F5FF]" />
              Status Timeline
            </h2>
            <div className="relative pl-5">
              {incident.statusHistory.map((entry, i) => (
                <div key={i} className="relative pb-5 last:pb-0">
                  <div className="absolute left-[-10px] top-0.5 w-3 h-3 rounded-full bg-[#00F5FF] border-2 border-[#0B0B10]" />
                  {i < incident.statusHistory.length - 1 && (
                    <div className="absolute left-[-4px] top-4 bottom-0 w-px bg-[#1C1C28]" />
                  )}
                  <div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border inline-block mb-1', getStatusBg(entry.status as any))}>
                      {getStatusLabel(entry.status as any)}
                    </span>
                    <p className="text-[10px] text-zinc-400">by {entry.actor}</p>
                    {entry.note && <p className="text-[10px] text-zinc-500 italic mt-0.5">{entry.note}</p>}
                    <p className="text-[9px] text-zinc-500 mt-0.5">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-zinc-600 italic text-center">
        Synthetic demonstration data — not a real incident record
      </p>
    </div>
  );
}
