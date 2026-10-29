import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { addIncident, generateIncidentId } from '../data/store';
import type { HazardCategory, Severity } from '../data/types';
import { AlertTriangle, MapPin, Camera, Send, CheckCircle, Shield, Clock, X, Info, Loader2 } from 'lucide-react';
import { getCategoryLabel, cn } from '../utils/format';
import { getAreaCoordinates } from '../utils/geo';
import { useAuth } from '../context/AuthContext';
import { createIncident } from '../services/incidentService';

// ── Photo constraints ──────────────────────────────────────────────────────────
// With Supabase configured, photo is uploaded to Supabase Storage and stored via secure public URL.
// In local demo mode, photo is stored as a base64 data-URL alongside the incident JSON.
const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// ──────────────────────────────────────────────────────────────────────────────

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
}

/** Holds the result of a successful FileReader read or an error message. */
interface PhotoState {
  name: string;
  dataUrl: string;
  sizeBytes: number;
  file?: File;
}

const defaultTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function ReportPage() {
  const { user, profile, isConfigured } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [submittedId, setSubmittedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── photo state (separate from core form to keep FormData lean) ──
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    category: 'pothole',
    road: '',
    area: '',
    severity: 'medium',
    description: '',
    observedAt: defaultTime(),
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

  /** Read a File object, validate type/size, and store the data-URL in state. */
  const handlePhotoChange = (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;

    if (!PHOTO_ALLOWED_TYPES.includes(file.type)) {
      setPhotoError(`Unsupported file type "${file.type}". Please choose a JPEG, PNG, WebP, or GIF image.`);
      // Reset the input so the same file can be re-selected after correcting the choice
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError(
        `Photo is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 2 MB.`
      );
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result;
      if (typeof result === 'string') {
        setPhoto({ name: file.name, dataUrl: result, sizeBytes: file.size, file });
      } else {
        setPhotoError('Could not read the selected file. Please try a different image.');
      }
      setPhotoLoading(false);
    };
    reader.onerror = () => {
      setPhotoError('File read failed. Please try again.');
      setPhotoLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const id = generateIncidentId();
      const now = new Date().toISOString();
      const coords = getAreaCoordinates(form.area, `${form.road}-${form.description}-${id}`);
      const reporterAlias = profile?.displayName || user?.email?.split('@')[0] || 'Citizen';

      if (isConfigured) {
        const { incident: created, error } = await createIncident(
          {
            title: `${getCategoryLabel(form.category)} on ${form.road}`,
            category: form.category,
            severity: form.severity,
            road: form.road,
            area: form.area,
            description: form.description,
            latitude: coords.lat,
            longitude: coords.lng,
            reporterUserId: user?.id,
            reporterAlias,
          },
          photo?.file
        );

        if (error) {
          setSubmitError(`Backend error: ${error}. Report could not be saved to the database. Please check your connection and retry.`);
          return;
        }

        if (created) {
          addIncident(created);
          setSubmittedId(created.id);
          setStep('success');
        }
      } else {
        // Standalone Local Demo Mode
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
          reporterAlias,
          photoPlaceholder: !!photo,
          photoDataUrl: photo?.dataUrl,
          statusHistory: [
            { status: 'reported', timestamp: now, actor: reporterAlias, note: 'Submitted via browser demo' },
          ],
        });
        setSubmittedId(id);
        setStep('success');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      category: 'pothole',
      road: '',
      area: '',
      severity: 'medium',
      description: '',
      observedAt: defaultTime(),
    });
    setErrors({});
    setPhoto(null);
    setPhotoError(null);
    setStep('form');
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4 bg-transparent min-h-screen text-white">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#00F5FF]" />
          Report a Hazard
        </h1>
        <p className="text-sm text-zinc-400 mt-0.5">Submit a road hazard observation to the community database</p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 shadow-[0_0_16px_rgba(255,77,109,0.08)]">
        <Shield className="w-4 h-4 text-[#FF4D6D] mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-[#FF4D6D] mb-0.5">Safety First</p>
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
                  ? 'border-[#35D07F] bg-[#35D07F]/20 text-[#35D07F]'
                  : 'border-[#1C1C28] bg-[#12121A] text-zinc-500'
            )}>
              {((step === 'review' && s === 'form') || step === 'success') && s !== 'success'
                ? <CheckCircle className="w-3.5 h-3.5" />
                : i + 1}
            </div>
            <span className="text-[10px] text-zinc-400 capitalize hidden sm:block">{s === 'form' ? 'Details' : s}</span>
            {i < 2 && <div className={cn('flex-1 h-px', s === 'form' && step !== 'form' ? 'bg-[#35D07F]/50' : 'bg-[#1C1C28]')} />}
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
                    'flex flex-col items-center justify-center gap-1 p-3 rounded-lg border text-center transition-all min-h-[58px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF] card-interactive',
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
                  errors.road ? 'border-[#FF4D6D]' : 'border-[#1C1C28]'
                )}
              />
              {errors.road && <p className="text-[10px] text-[#FF4D6D] mt-1">{errors.road}</p>}
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
                  errors.area ? 'border-[#FF4D6D]' : 'border-[#1C1C28]'
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
              {errors.area && <p className="text-[10px] text-[#FF4D6D] mt-1">{errors.area}</p>}
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
                    'p-3 min-h-[58px] rounded-lg border text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F5FF] card-interactive',
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
                errors.description ? 'border-[#FF4D6D]' : 'border-[#1C1C28]'
              )}
            />
            {errors.description && <p className="text-[10px] text-[#FF4D6D] mt-1">{errors.description}</p>}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-white">
                <Camera className="inline w-3 h-3 mr-1 text-[#00F5FF]" />Photo Evidence (Optional)
              </label>
              <span className="text-[10px] text-zinc-500">Max 2 MB (stored locally)</span>
            </div>

            {photo ? (
              <div className="p-3 rounded-lg border border-[#00F5FF]/40 bg-[#12121A] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-14 h-14 object-cover rounded-md border border-[#1C1C28] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{photo.name}</p>
                    <p className="text-[10px] text-zinc-400">
                      {(photo.sizeBytes / 1024).toFixed(0)} KB · Ready to save
                    </p>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="text-[10px] text-[#00F5FF] hover:underline mt-0.5 block"
                    >
                      Change photo
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  aria-label="Remove photo"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-[#FF4D6D] hover:bg-[#1C1C28] transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1.5 h-24 border-2 border-dashed border-[#1C1C28] bg-[#12121A] rounded-lg cursor-pointer hover:border-[#00F5FF]/50 hover:bg-[#161622] transition-colors text-center px-4"
              >
                {photoLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#00F5FF]">
                    <span className="w-2 h-2 rounded-full bg-[#00F5FF] animate-ping" />
                    <span>Loading and processing photo...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-300">
                      Click to attach photo from device
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      JPG, PNG, WebP or GIF up to 2 MB
                    </span>
                  </>
                )}
              </div>
            )}

            {photoError && (
              <p className="text-[10px] text-[#FF4D6D] mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {photoError}
              </p>
            )}

            <input
              ref={fileRef}
              type="file"
              accept={PHOTO_ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={e => handlePhotoChange(e.target.files?.[0])}
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
            ].map(item => (
              <div key={item.label} className="flex justify-between gap-3 py-2 border-b border-[#1C1C28] last:border-0">
                <span className="text-xs text-zinc-400 font-medium">{item.label}</span>
                <span className="text-xs text-white text-right">{item.value}</span>
              </div>
            ))}

            {/* Photo preview in review */}
            <div className="flex justify-between items-center gap-3 py-2 border-b border-[#1C1C28]">
              <span className="text-xs text-zinc-400 font-medium">Photo</span>
              {photo ? (
                <div className="flex items-center gap-2 text-right">
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-8 h-8 rounded object-cover border border-[#1C1C28]"
                  />
                  <span className="text-xs text-white truncate max-w-[180px]">
                    {photo.name} ({(photo.sizeBytes / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-500">None attached</span>
              )}
            </div>

            <div className="py-2">
              <span className="text-xs text-zinc-400 font-medium block mb-1">Description</span>
              <p className="text-xs text-white">{form.description}</p>
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#00F5FF] mt-0.5 shrink-0" />
              <p className="text-[10px] text-[#C4B5FD]">
                {isConfigured ? (
                  <>
                    Connected to <strong>Supabase Cloud</strong>. Your report and photo will be securely stored in the PostgreSQL database and cloud storage bucket.
                  </>
                ) : (
                  <>
                    This browser demo does <strong>not</strong> automatically notify government departments.
                    Submitted reports are stored locally for demonstration purposes only.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg border border-[#1C1C28] text-zinc-300 hover:text-white hover:border-[#8B5CF6]/50 text-sm font-medium transition-all disabled:opacity-50"
            >
              ← Edit
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#00F5FF] hover:bg-[#00F5FF]/90 text-black font-bold text-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Persisting Report...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS Step */}
      {step === 'success' && (
        <div className="bg-[#0B0B10] border border-[#35D07F]/40 rounded-xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#35D07F]/15 border border-[#35D07F]/40 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#35D07F]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Report Submitted</h2>
            <p className="text-sm text-zinc-400">
              {isConfigured
                ? 'Your hazard report has been securely saved to the Supabase database.'
                : 'Your hazard report has been added to the local demo database.'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#12121A] border border-[#1C1C28]">
            <span className="text-xs text-zinc-400">Incident ID:</span>
            <span className="text-sm font-mono font-bold text-[#00F5FF]">{submittedId}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#12121A] border border-[#1C1C28] text-left">
            <p className="text-[10px] text-zinc-400">
              {isConfigured
                ? '✓ Persisted in PostgreSQL · ✓ Photo stored in cloud · ✓ Reflected in live incident map'
                : '✓ Added to local incident store · ✓ Reflected in dashboard metrics · ✗ Not submitted to any government system'}
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
