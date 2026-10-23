import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { addIncident, generateIncidentId } from '../data/store';
import type { HazardCategory, Severity } from '../data/types';
import { AlertTriangle, MapPin, Camera, Send, CheckCircle, Shield, Clock, X, Info } from 'lucide-react';
import { getCategoryLabel, cn } from '../utils/format';
import { getAreaCoordinates } from '../utils/geo';

type Step = 'form' | 'review' | 'success';

const CATEGORIES: { value: HazardCategory; label: string; icon: string; desc: string }[] = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️', desc: 'Road surface depression or hole' },
  { value: 'open_manhole', label: 'Open Manhole', icon: '⚠️', desc: 'Missing or broken manhole cover' },
  { value: 'waterlogging', label: 'Waterlogging', icon: '🌊', desc: 'Water accumulation on road' },
  { value: 'damaged_road', label: 'Damaged Road', icon: '🚧', desc: 'Cracks, erosion, or road subsidence' },
  { value: 'other', label: 'Other', icon: '📍', desc: 'Other road hazard' },
];

const SEVERITIES: { value: Severity; label: string; color: string; desc: string }[] = [
  { value: 'low', label: 'Low', color: '#71717A', desc: 'Minor inconvenience, caution needed' },
  { value: 'medium', label: 'Medium', color: '#A78BFA', desc: 'Significant hazard, reduce speed' },
  { value: 'high', label: 'High', color: '#8B5CF6', desc: 'Dangerous, avoid if possible' },
  { value: 'critical', label: 'Critical', color: '#00F5FF', desc: 'Extreme danger, do not proceed' },
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
    const coords = getAreaCoordinates(form.area, `${form.road}-${form.description}-${id}`);

    addIncident({
      id,
      category: form.category,
      severity: form.severity,
      title: `${getCategoryLabel(form.category)} on ${form.road}`,
      description: form.description,
      location: {
        road: form.road,
        area: form.area,
        coordinates: coords,
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
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4 bg-[#050507] min-h-screen text-white">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#00F5FF]" />
          Report a Hazard
        </h1>
        <p className="text-sm text-zinc-400 mt-0.5">Submit a road hazard observation to the community database</p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#12121A] border border-[#8B5CF6]/30">
        <Shield className="w-4 h-4 text-[#00F5FF] mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-[#00F5FF] mb-0.5">Safety First</p>
          <p className="text-xs text-zinc-300">
            Please report only when <strong className="text-white">safely stopped</strong>. Never use your phone while riding or driving.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {(['form', 'review', 'success'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
              step === s ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]' :
                (step === 'review' && s === 'form') || step === 'success'
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#C4B5FD]'
                  : 'border-[#1C1C28] bg-[#12121A] text-zinc-500'
            )}>
              {((step === 'review' && s === 'form') || step === 'success') && s !== 'success'
                ? <CheckCircle className="w-3.5 h-3.5" />
                : i + 1}
            </div>
            <span className="text-[10px] text-zinc-400 capitalize hidden sm:block">{s === 'form' ? 'Details' : s}</span>
            {i < 2 && <div className={cn('flex-1 h-px', s === 'form' && step !== 'form' ? 'bg-[#8B5CF6]/50' : 'bg-[#1C1C28]')} />}
          </div>
        ))}
      </div>

      {/* FORM Step */}
      {step === 'form' && (
        <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-5 space-y-5 shadow-xl">
          {/* Category */}
          <div>
            <label id="category-label" className="block text-xs font-semibold text-white mb-2">Hazard Category *</label>
            <div role="radiogroup" aria-labelledby="category-label" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  role="radio"
                  aria-checked={form.category === cat.value}
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 p-3 rounded-lg border text-center transition-all min-h-[58px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                    form.category === cat.value
                      ? 'border-[#00F5FF]/60 bg-[#00F5FF]/15 text-[#00F5FF] shadow-sm'
                      : 'border-[#1C1C28] bg-[#12121A] text-zinc-400 hover:border-[#8B5CF6]/40 hover:text-zinc-200',
                    cat.value === 'other' ? 'col-span-2 sm:col-span-1' : ''
                  )}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[10px] font-bold">{cat.label}</span>
                  <span className="text-[9px] text-zinc-500">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Road + Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="road-input" className="block text-xs font-semibold text-white mb-1.5">
                <MapPin className="inline w-3 h-3 mr-1 text-[#00F5FF]" />Road / Street Name *
              </label>
              <input
                id="road-input"
                type="text"
                value={form.road}
                onChange={e => setForm(f => ({ ...f, road: e.target.value }))}
                placeholder="e.g. Ring Road, Mathura Road"
                className={cn(
                  'w-full min-h-[44px] px-3 py-2.5 bg-[#12121A] border rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00F5FF]/50 transition-colors',
                  errors.road ? 'border-[#00F5FF]' : 'border-[#1C1C28]'
                )}
              />
              {errors.road && <p className="text-[10px] text-[#00F5FF] mt-1">{errors.road}</p>}
            </div>
            <div>
              <label htmlFor="area-input" className="block text-xs font-semibold text-white mb-1.5">Area / Landmark *</label>
              <input
                id="area-input"
                type="text"
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                placeholder="e.g. Lajpat Nagar, ITO"
                className={cn(
                  'w-full min-h-[44px] px-3 py-2.5 bg-[#12121A] border rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00F5FF]/50 transition-colors',
                  errors.area ? 'border-[#00F5FF]' : 'border-[#1C1C28]'
                )}
              />
              {/* Quick Area Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-zinc-500 font-medium">Quick select:</span>
                {['Connaught Place', 'Lajpat Nagar', 'ITO', 'Minto Bridge', 'Pragati Maidan', 'Vikas Marg'].map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, area: a }))}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded border transition-colors min-h-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                      form.area.toLowerCase() === a.toLowerCase()
                        ? 'bg-[#00F5FF]/15 border-[#00F5FF]/50 text-[#00F5FF] font-semibold'
                        : 'bg-[#12121A] border-[#1C1C28] text-zinc-400 hover:text-white hover:border-[#8B5CF6]/40'
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
              {errors.area && <p className="text-[10px] text-[#00F5FF] mt-1">{errors.area}</p>}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label id="severity-label" className="block text-xs font-semibold text-white mb-2">Severity *</label>
            <div role="radiogroup" aria-labelledby="severity-label" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITIES.map(sev => (
                <button
                  key={sev.value}
                  type="button"
                  role="radio"
                  aria-checked={form.severity === sev.value}
                  onClick={() => setForm(f => ({ ...f, severity: sev.value }))}
                  className={cn(
                    'p-3 min-h-[58px] rounded-lg border text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]',
                    form.severity === sev.value
                      ? 'border-opacity-50 text-white shadow-sm'
                      : 'border-[#1C1C28] bg-[#12121A] text-zinc-400 hover:border-[#8B5CF6]/40'
                  )}
                  style={form.severity === sev.value ? {
                    borderColor: `${sev.color}60`,
                    backgroundColor: `${sev.color}15`,
                  } : {}}
                >
                  <div className="text-xs font-bold mb-0.5" style={{ color: form.severity === sev.value ? sev.color : undefined }}>
                    {sev.label}
                  </div>
                  <div className="text-[9px] text-zinc-500">{sev.desc}</div>
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
                'w-full px-3 py-2.5 bg-[#12121A] border rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00F5FF]/50 transition-colors resize-none',
                errors.description ? 'border-[#00F5FF]' : 'border-[#1C1C28]'
              )}
            />
            {errors.description && <p className="text-[10px] text-[#00F5FF] mt-1">{errors.description}</p>}
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              <Clock className="inline w-3 h-3 mr-1 text-[#00F5FF]" />When did you observe this? *
            </label>
            <input
              type="datetime-local"
              value={form.observedAt}
              onChange={e => setForm(f => ({ ...f, observedAt: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#12121A] border border-[#1C1C28] rounded-lg text-sm text-white focus:outline-none focus:border-[#00F5FF]/50"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              <Camera className="inline w-3 h-3 mr-1 text-[#00F5FF]" />Photo (Optional)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-3 h-20 border-2 border-dashed border-[#1C1C28] bg-[#12121A] rounded-lg cursor-pointer hover:border-[#00F5FF]/40 transition-colors"
            >
              {form.photoName ? (
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#00F5FF]" />
                  <span className="text-xs text-[#00F5FF]">{form.photoName}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, photoName: '' })); }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="w-5 h-5 text-zinc-500 mx-auto mb-1" />
                  <span className="text-[10px] text-zinc-500">Click to attach photo</span>
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#00F5FF] hover:bg-[#00F5FF]/90 text-black font-bold text-sm transition-all"
          >
            <Send className="w-4 h-4" />
            Review & Submit Report
          </button>
        </div>
      )}

      {/* REVIEW Step */}
      {step === 'review' && (
        <div className="bg-[#0B0B10] border border-[#1C1C28] rounded-xl p-5 space-y-4 shadow-xl">
          <h2 className="text-sm font-semibold text-white">Review Your Report</h2>

          <div className="space-y-3">
            {[
              { label: 'Category', value: getCategoryLabel(form.category) },
              { label: 'Location', value: `${form.road}, ${form.area}` },
              { label: 'Severity', value: form.severity.charAt(0).toUpperCase() + form.severity.slice(1) },
              { label: 'Observed', value: new Date(form.observedAt).toLocaleString('en-IN') },
              { label: 'Photo', value: form.photoName || 'None attached' },
            ].map(item => (
              <div key={item.label} className="flex justify-between gap-3 py-2 border-b border-[#1C1C28] last:border-0">
                <span className="text-xs text-zinc-400 font-medium">{item.label}</span>
                <span className="text-xs text-white text-right">{item.value}</span>
              </div>
            ))}
            <div className="py-2">
              <span className="text-xs text-zinc-400 font-medium block mb-1">Description</span>
              <p className="text-xs text-white">{form.description}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#00F5FF] mt-0.5 shrink-0" />
              <p className="text-[10px] text-[#C4B5FD]">
                This browser demo does <strong>not</strong> automatically notify government departments.
                Submitted reports are stored locally for demonstration purposes only.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 py-2.5 rounded-lg border border-[#1C1C28] text-zinc-300 hover:text-white hover:border-[#8B5CF6]/50 text-sm font-medium transition-all"
            >
              ← Edit
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#00F5FF] hover:bg-[#00F5FF]/90 text-black font-bold text-sm transition-all"
            >
              <Send className="w-4 h-4" />
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS Step */}
      {step === 'success' && (
        <div className="bg-[#0B0B10] border border-[#00F5FF]/30 rounded-xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#00F5FF]/15 border border-[#00F5FF]/40 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#00F5FF]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Report Submitted</h2>
            <p className="text-sm text-zinc-400">Your hazard report has been added to the local demo database.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#12121A] border border-[#1C1C28]">
            <span className="text-xs text-zinc-400">Incident ID:</span>
            <span className="text-sm font-mono font-bold text-[#00F5FF]">{submittedId}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#12121A] border border-[#1C1C28] text-left">
            <p className="text-[10px] text-zinc-400">
              ✓ Added to incident database · ✓ Reflected in dashboard metrics · ✗ Not submitted to any government system
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-lg bg-[#12121A] hover:bg-[#1C1C28] border border-[#1C1C28] text-white font-medium text-xs transition-all"
            >
              Report Another Hazard
            </button>
            <Link
              to="/dashboard"
              className="flex-1 py-2.5 rounded-lg bg-[#00F5FF] hover:bg-[#00F5FF]/90 text-black font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF]"
            >
              View on Dashboard Map →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
