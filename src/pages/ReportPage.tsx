import { useState, useRef } from 'react';
import { addIncident, generateIncidentId } from '../data/store';
import type { HazardCategory, Severity } from '../data/types';
import { AlertTriangle, MapPin, Camera, Send, CheckCircle, Shield, Clock, X, Info } from 'lucide-react';
import { getCategoryLabel, cn } from '../utils/format';

type Step = 'form' | 'review' | 'success';

const CATEGORIES: { value: HazardCategory; label: string; icon: string; desc: string }[] = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️', desc: 'Road surface depression or hole' },
  { value: 'open_manhole', label: 'Open Manhole', icon: '⚠️', desc: 'Missing or broken manhole cover' },
  { value: 'waterlogging', label: 'Waterlogging', icon: '🌊', desc: 'Water accumulation on road' },
  { value: 'damaged_road', label: 'Damaged Road', icon: '🚧', desc: 'Cracks, erosion, or road subsidence' },
  { value: 'other', label: 'Other', icon: '📍', desc: 'Other road hazard' },
];

const SEVERITIES: { value: Severity; label: string; color: string; desc: string }[] = [
  { value: 'low', label: 'Low', color: '#10B981', desc: 'Minor inconvenience, caution needed' },
  { value: 'medium', label: 'Medium', color: '#F59E0B', desc: 'Significant hazard, reduce speed' },
  { value: 'high', label: 'High', color: '#F97316', desc: 'Dangerous, avoid if possible' },
  { value: 'critical', label: 'Critical', color: '#EF4444', desc: 'Extreme danger, do not proceed' },
];

interface FormData {
  category: HazardCategory;
  road: string;
  area: string;
  severity: Severity;
  description: string;
  observedAt: string;
  photoName: string;
}

const defaultTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function ReportPage() {
  const [step, setStep] = useState<Step>('form');
  const [submittedId, setSubmittedId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    category: 'pothole',
    road: '',
    area: '',
    severity: 'medium',
    description: '',
    observedAt: defaultTime(),
    photoName: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.road.trim()) e.road = 'Road name is required';
    if (!form.area.trim()) e.area = 'Area / landmark is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.description.trim().length < 10) e.description = 'Please provide a more detailed description';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setStep('review');
  };

  const handleConfirm = () => {
    const id = generateIncidentId();
    const now = new Date().toISOString();
    addIncident({
      id,
      category: form.category,
      severity: form.severity,
      title: `${getCategoryLabel(form.category)} on ${form.road}`,
      description: form.description,
      location: {
        road: form.road,
        area: form.area,
        coordinates: { lat: 28.6139, lng: 77.2090 }, // generic Delhi center for demo
      },
      observedAt: new Date(form.observedAt).toISOString(),
      lastVerifiedAt: now,
      reportedAt: now,
      status: 'reported',
      verification: 'unverified',
      source: 'community',
      isHistorical: false,
      isActive: true,
      reporterAlias: 'Demo User',
      photoPlaceholder: !!form.photoName,
      statusHistory: [
        { status: 'reported', timestamp: now, actor: 'Demo User', note: 'Submitted via browser demo' },
      ],
    });
    setSubmittedId(id);
    setStep('success');
  };

  const handleReset = () => {
    setForm({
      category: 'pothole',
      road: '',
      area: '',
      severity: 'medium',
      description: '',
      observedAt: defaultTime(),
      photoName: '',
    });
    setErrors({});
    setStep('form');
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Report a Hazard
        </h1>
        <p className="text-sm text-navy-400 mt-0.5">Submit a road hazard observation to the community database</p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <Shield className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-red-400 mb-0.5">Safety First</p>
          <p className="text-xs text-red-300">
            Please report only when <strong>safely stopped</strong>. Never use your phone while riding or driving.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {(['form', 'review', 'success'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
              step === s ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' :
                (step === 'review' && s === 'form') || step === 'success'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-navy-600 bg-navy-700 text-navy-500'
            )}>
              {((step === 'review' && s === 'form') || step === 'success') && s !== 'success'
                ? <CheckCircle className="w-3.5 h-3.5" />
                : i + 1}
            </div>
            <span className="text-[10px] text-navy-400 capitalize hidden sm:block">{s === 'form' ? 'Details' : s}</span>
            {i < 2 && <div className={cn('flex-1 h-px', s === 'form' && step !== 'form' ? 'bg-emerald-500/50' : 'bg-navy-700/50')} />}
          </div>
        ))}
      </div>

      {/* FORM Step */}
      {step === 'form' && (
        <div className="bg-navy-800 border border-navy-700/50 rounded-xl p-5 space-y-5">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-white mb-2">Hazard Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all',
                    form.category === cat.value
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                      : 'border-navy-700/50 text-navy-400 hover:border-navy-600 hover:text-navy-200'
                  )}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[10px] font-medium">{cat.label}</span>
                  <span className="text-[9px] text-navy-500">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Road + Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                <MapPin className="inline w-3 h-3 mr-1" />Road / Street Name *
              </label>
              <input
                type="text"
                value={form.road}
                onChange={e => setForm(f => ({ ...f, road: e.target.value }))}
                placeholder="e.g. Ring Road, Mathura Road"
                className={cn(
                  'w-full px-3 py-2.5 bg-navy-700/50 border rounded-lg text-sm text-white placeholder:text-navy-500 focus:outline-none focus:border-cyan-500/50 transition-colors',
                  errors.road ? 'border-red-500/50' : 'border-navy-600/50'
                )}
              />
              {errors.road && <p className="text-[10px] text-red-400 mt-1">{errors.road}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">Area / Landmark *</label>
              <input
                type="text"
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                placeholder="e.g. Lajpat Nagar, ITO"
                className={cn(
                  'w-full px-3 py-2.5 bg-navy-700/50 border rounded-lg text-sm text-white placeholder:text-navy-500 focus:outline-none focus:border-cyan-500/50 transition-colors',
                  errors.area ? 'border-red-500/50' : 'border-navy-600/50'
                )}
              />
              {errors.area && <p className="text-[10px] text-red-400 mt-1">{errors.area}</p>}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-semibold text-white mb-2">Severity *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITIES.map(sev => (
                <button
                  key={sev.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, severity: sev.value }))}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-all',
                    form.severity === sev.value
                      ? 'border-opacity-50 text-white'
                      : 'border-navy-700/50 text-navy-400 hover:border-navy-600'
                  )}
                  style={form.severity === sev.value ? {
                    borderColor: `${sev.color}60`,
                    backgroundColor: `${sev.color}15`,
                  } : {}}
                >
                  <div className="text-xs font-bold mb-0.5" style={{ color: form.severity === sev.value ? sev.color : undefined }}>
                    {sev.label}
                  </div>
                  <div className="text-[9px] text-navy-500">{sev.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Describe the hazard in detail — size, exact location, any visible danger..."
              className={cn(
                'w-full px-3 py-2.5 bg-navy-700/50 border rounded-lg text-sm text-white placeholder:text-navy-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none',
                errors.description ? 'border-red-500/50' : 'border-navy-600/50'
              )}
            />
            {errors.description && <p className="text-[10px] text-red-400 mt-1">{errors.description}</p>}
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              <Clock className="inline w-3 h-3 mr-1" />When did you observe this? *
            </label>
            <input
              type="datetime-local"
              value={form.observedAt}
              onChange={e => setForm(f => ({ ...f, observedAt: e.target.value }))}
              className="w-full px-3 py-2.5 bg-navy-700/50 border border-navy-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              <Camera className="inline w-3 h-3 mr-1" />Photo (Optional)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-3 h-20 border-2 border-dashed border-navy-600/50 rounded-lg cursor-pointer hover:border-cyan-500/40 transition-colors"
            >
              {form.photoName ? (
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">{form.photoName}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, photoName: '' })); }}
                    className="text-navy-400 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="w-5 h-5 text-navy-500 mx-auto mb-1" />
                  <span className="text-[10px] text-navy-500">Click to attach photo</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setForm(f => ({ ...f, photoName: e.target.files?.[0]?.name ?? '' }))}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold text-sm transition-all"
          >
            <Send className="w-4 h-4" />
            Review & Submit Report
          </button>
        </div>
      )}

      {/* REVIEW Step */}
      {step === 'review' && (
        <div className="bg-navy-800 border border-navy-700/50 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Review Your Report</h2>

          <div className="space-y-3">
            {[
              { label: 'Category', value: getCategoryLabel(form.category) },
              { label: 'Location', value: `${form.road}, ${form.area}` },
              { label: 'Severity', value: form.severity.charAt(0).toUpperCase() + form.severity.slice(1) },
              { label: 'Observed', value: new Date(form.observedAt).toLocaleString('en-IN') },
              { label: 'Photo', value: form.photoName || 'None attached' },
            ].map(item => (
              <div key={item.label} className="flex justify-between gap-3 py-2 border-b border-navy-700/30 last:border-0">
                <span className="text-xs text-navy-400 font-medium">{item.label}</span>
                <span className="text-xs text-white text-right">{item.value}</span>
              </div>
            ))}
            <div className="py-2">
              <span className="text-xs text-navy-400 font-medium block mb-1">Description</span>
              <p className="text-xs text-white">{form.description}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-300">
                This browser demo does <strong>not</strong> automatically notify government departments.
                Submitted reports are stored locally for demonstration purposes only.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 py-2.5 rounded-lg border border-navy-600/50 text-navy-300 hover:text-white hover:border-navy-500 text-sm font-medium transition-all"
            >
              ← Edit
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold text-sm transition-all"
            >
              <Send className="w-4 h-4" />
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS Step */}
      {step === 'success' && (
        <div className="bg-navy-800 border border-emerald-500/30 rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Report Submitted</h2>
            <p className="text-sm text-navy-400">Your hazard report has been added to the local demo database.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-700/50 border border-navy-600/50">
            <span className="text-xs text-navy-400">Incident ID:</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{submittedId}</span>
          </div>
          <div className="p-3 rounded-lg bg-navy-700/30 border border-navy-700/50 text-left">
            <p className="text-[10px] text-navy-400">
              ✓ Added to incident database · ✓ Reflected in dashboard metrics · ✗ Not submitted to any government system
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-lg bg-navy-700/60 hover:bg-navy-700 border border-navy-600/50 text-white font-medium text-xs transition-all"
            >
              Report Another Hazard
            </button>
            <a
              href="/dashboard"
              className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5"
            >
              View on Dashboard Map →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
