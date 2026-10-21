import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getIncidentById, getHiddenHazards, updateIncidentStatus, updateIncidentVerification } from '../data/store';
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
  const [incident, setIncident] = useState(() => getIncidentById(id ?? ''));
  const hiddenHazards = getHiddenHazards();
  const relatedHH = hiddenHazards.filter(
    hh => hh.historicalIncidentId === id || hh.waterloggingIncidentId === id
  );
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [verificationUpdating, setVerificationUpdating] = useState(false);

  if (!incident) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-navy-800 border border-navy-700/50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-navy-500" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Incident Not Found</h2>
        <p className="text-sm text-navy-400 mb-6">No incident with ID <code className="text-cyan-400">{id}</code> was found.</p>
        <Link
          to="/road-intelligence"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-700 text-white hover:bg-navy-600 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Road Intelligence
        </Link>
      </div>
    );
  }

  const handleStatusUpdate = (status: IncidentStatus) => {
    setStatusUpdating(true);
    const updated = updateIncidentStatus(incident.id, status, 'Demo Reviewer');
    if (updated) setIncident(updated);
    setTimeout(() => setStatusUpdating(false), 500);
  };

  const handleVerificationUpdate = (verification: VerificationStatus) => {
    setVerificationUpdating(true);
    const updated = updateIncidentVerification(incident.id, verification, 'Demo Reviewer');
    if (updated) setIncident(updated);
    setTimeout(() => setVerificationUpdating(false), 500);
  };

  const currentStatusIdx = STATUS_FLOW.indexOf(incident.status as IncidentStatus);
  const nextStatus = currentStatusIdx >= 0 && currentStatusIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentStatusIdx + 1]
    : null;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Back Button + Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-navy-400 hover:text-white text-sm transition-colors shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:block">Back</span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
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
          <p className="text-sm text-navy-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {incident.location.road}, {incident.location.area}
          </p>
        </div>
      </div>

      {/* Hidden Hazard Warning */}
      {relatedHH.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <TriangleAlert className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400 mb-1">
              Related Hidden Hazard Detected
            </p>
            {relatedHH.map(hh => (
              <p key={hh.id} className="text-xs text-red-300">
                {hh.id}: {hh.historicalDefectType.replace('_', ' ')} potentially submerged beneath waterlogging —{' '}
                <span className="font-medium">{hh.confidence}% confidence</span>.
                {' '}<em className="text-red-400/70">Inferred, not directly confirmed.</em>
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
          <div className="bg-navy-800 border border-navy-700/50 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3">Observation Details</h2>
            <p className="text-sm text-navy-200 leading-relaxed">{incident.description}</p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-2.5 bg-navy-700/30 rounded-lg">
                <div className="text-[10px] text-navy-500 mb-0.5">Category</div>
                <div className="text-sm font-medium text-white">{getCategoryLabel(incident.category)}</div>
              </div>
              <div className="p-2.5 bg-navy-700/30 rounded-lg">
                <div className="text-[10px] text-navy-500 mb-0.5">Source</div>
                <div className="text-sm font-medium text-white capitalize">{incident.source}</div>
              </div>
              <div className="p-2.5 bg-navy-700/30 rounded-lg">
                <div className="text-[10px] text-navy-500 mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />Observed</div>
                <div className="text-xs text-white">{formatDate(incident.observedAt)}</div>
                <div className="text-[9px] text-navy-400">{formatTimeAgo(incident.observedAt)}</div>
              </div>
              <div className="p-2.5 bg-navy-700/30 rounded-lg">
                <div className="text-[10px] text-navy-500 mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />Last Verified</div>
                <div className="text-xs text-white">{formatDate(incident.lastVerifiedAt)}</div>
                <div className="text-[9px] text-navy-400">{formatTimeAgo(incident.lastVerifiedAt)}</div>
              </div>
              <div className="p-2.5 bg-navy-700/30 rounded-lg">
                <div className="text-[10px] text-navy-500 mb-0.5 flex items-center gap-1"><User className="w-3 h-3" />Reporter</div>
                <div className="text-xs text-white">{incident.reporterAlias ?? 'Anonymous'}</div>
              </div>
              <div className="p-2.5 bg-navy-700/30 rounded-lg">
                <div className="text-[10px] text-navy-500 mb-0.5">Type</div>
                <div className="text-xs font-medium text-white">
                  {incident.isHistorical ? '📋 Historical / Pre-monsoon' : '🔴 Active Report'}
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Placeholders */}
          <div className="bg-navy-800 border border-navy-700/50 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3">Evidence</h2>
            <div className="grid grid-cols-2 gap-3">
              {['Pre-observation / Historical photo', 'Recent follow-up photo'].map(label => (
                <div key={label} className="h-28 rounded-lg border-2 border-dashed border-navy-600/50 flex flex-col items-center justify-center gap-1.5 bg-navy-700/20">
                  <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center">
                    <Info className="w-4 h-4 text-navy-500" />
                  </div>
                  <span className="text-[10px] text-navy-500 text-center px-3">{label}</span>
                  <span className="text-[9px] text-navy-600 italic text-center px-2">Illustrative placeholder — not authentic evidence</span>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Controls */}
          <div className="bg-navy-800 border border-navy-700/50 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5" />
              Demo Controls
            </h2>

            <div className="space-y-3">
              {/* Status Advance */}
              <div>
                <label className="text-[10px] text-navy-500 mb-2 block">Advance Status</label>
                <div className="flex flex-wrap gap-2">
                  {nextStatus && (
                    <button
                      onClick={() => handleStatusUpdate(nextStatus)}
                      disabled={statusUpdating}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-all disabled:opacity-50"
                    >
                      {statusUpdating ? '...' : `→ ${getStatusLabel(nextStatus)}`}
                    </button>
                  )}
                  {incident.status !== 'outdated' && (
                    <button
                      onClick={() => handleStatusUpdate('outdated')}
                      disabled={statusUpdating}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50 text-navy-400 text-xs hover:text-white transition-all disabled:opacity-50"
                    >
                      Mark Outdated
                    </button>
                  )}
                </div>
                {incident.status === 'forwarded_for_review' && (
                  <p className="text-[9px] text-amber-400/70 mt-1.5 italic">
                    Note: In this demo, no actual government submission occurs
                  </p>
                )}
              </div>

              {/* Verification */}
              <div>
                <label className="text-[10px] text-navy-500 mb-2 block">Update Verification</label>
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
                          : 'border-navy-600/50 text-navy-400 hover:border-navy-500 hover:text-white'
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
          <div className="bg-navy-800 border border-navy-700/50 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-navy-700/50">
              <h2 className="text-xs font-semibold text-navy-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />Location
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
            <div className="p-3 border-t border-navy-700/50">
              <p className="text-[10px] text-navy-400">{incident.location.road}, {incident.location.area}</p>
              <p className="text-[9px] text-navy-500">
                {incident.location.coordinates.lat.toFixed(4)}, {incident.location.coordinates.lng.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-navy-800 border border-navy-700/50 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              Status Timeline
            </h2>
            <div className="relative pl-5">
              {incident.statusHistory.map((entry, i) => (
                <div key={i} className="relative pb-5 last:pb-0">
                  <div className="absolute left-[-10px] top-0.5 w-3 h-3 rounded-full bg-cyan-500 border-2 border-navy-800" />
                  {i < incident.statusHistory.length - 1 && (
                    <div className="absolute left-[-4px] top-4 bottom-0 w-px bg-navy-700/50" />
                  )}
                  <div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border inline-block mb-1', getStatusBg(entry.status as any))}>
                      {getStatusLabel(entry.status as any)}
                    </span>
                    <p className="text-[10px] text-navy-400">by {entry.actor}</p>
                    {entry.note && <p className="text-[10px] text-navy-500 italic mt-0.5">{entry.note}</p>}
                    <p className="text-[9px] text-navy-600 mt-0.5">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-navy-600 italic text-center">
        Synthetic demonstration data — not a real incident record
      </p>
    </div>
  );
}
