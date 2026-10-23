import { Link } from 'react-router-dom';
import {
  Shield,
  Eye,
  Zap,
  ArrowRight,
  Navigation,
  Waves,
  GitMerge,
  Bell,
  Activity,
  ChevronRight,
  Droplets,
  CircleDot,
  Users,
  Building2,
  ShieldCheck,
  Clock,
  Route,
  AlertOctagon,
} from 'lucide-react';
import { InteractiveBackground } from '../components/layout/InteractiveBackground';

/* ------------------------------------------------------------------ */
/*  Landing Page – standalone (no shared Layout wrapper)               */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-[#F3F4F6] font-[Inter,sans-serif] overflow-x-hidden relative">
      {/* ── Cursor-Reactive Ambient Lighting & Technical Grid Depth ── */}
      <InteractiveBackground mode="landing" />

      {/* ── Top Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#1C1C28] bg-[#050507]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center transition-transform group-hover:scale-105 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
              <Shield className="h-4 w-4 text-[#00F5FF]" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-white">
              Jal<span className="text-[#00F5FF]">Rakshak</span>
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[#8B5CF6]/20 px-4 py-2 text-xs font-bold text-white border border-[#8B5CF6]/40 transition hover:bg-[#8B5CF6]/30 hover:border-[#8B5CF6] hover:shadow-[0_0_12px_rgba(139,92,246,0.25)]"
          >
            Open Dashboard
            <ArrowRight className="h-3.5 w-3.5 text-[#00F5FF]" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-6">
        {/* ambient glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[680px] rounded-full bg-[#8B5CF6]/[0.06] blur-[140px]" />
        <div className="pointer-events-none absolute top-20 right-1/4 h-[350px] w-[450px] rounded-full bg-[#00F5FF]/[0.04] blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          {/* Left – copy */}
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#8B5CF6]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#A78BFA] border border-[#8B5CF6]/25">
              <Activity className="h-3.5 w-3.5 text-[#00F5FF]" />
              Delhi Monsoon Road Intelligence
            </p>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-[3.2rem]">
              Know what lies{' '}
              <span className="bg-gradient-to-r from-[#00F5FF] via-[#A78BFA] to-[#8B5CF6] bg-clip-text text-transparent">
                beneath the flood.
              </span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
              Road intelligence that connects historical defects with current
              waterlogging to help commuters identify hidden road hazards.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-[#00F5FF] px-5 py-2.5 text-xs font-extrabold text-[#050507] shadow-lg shadow-[#00F5FF]/20 transition hover:bg-[#67E8F9] hover:shadow-[#00F5FF]/40"
              >
                Open Command Center
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/safe-route"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B0B10] px-5 py-2.5 text-xs font-bold text-zinc-200 border border-[#1C1C28] hover:border-[#8B5CF6]/60 hover:bg-[#12121A] transition"
              >
                <Navigation className="h-4 w-4 text-[#8B5CF6]" />
                Explore SafeRoute
              </Link>
            </div>
          </div>

          {/* Right – illustrative composition */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none select-none" aria-hidden="true">
            <HeroComposition />
          </div>
        </div>
      </section>

      {/* ── Innovation Section ─────────────────────────────────────── */}
      <section className="relative px-6 py-20 md:py-24 border-t border-[#1C1C28]/80 bg-[#0B0B10]/40">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-[10px] font-bold text-[#00F5FF] uppercase tracking-widest block mb-2">Core Differentiators</span>
          <h2 className="text-2xl font-extrabold sm:text-3xl text-white">Two Core Innovations &amp; One USP</h2>
          <p className="mx-auto mt-3 max-w-xl text-xs text-zinc-400 leading-relaxed">
            JalRakshak moves beyond reactive flood alerts by combining
            infrastructure baseline defect memory with real-time environmental waterlogging reports.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          {/* Innovation 1 */}
          <div className="group rounded-xl border border-[#1C1C28] bg-[#0B0B10] p-7 transition card-interactive hover:border-[#8B5CF6]/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.15)]">
            <div className="mb-4 inline-flex rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 p-2.5 text-[#8B5CF6]">
              <Eye className="h-5 w-5 text-[#00F5FF]" />
            </div>
            <div className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider mb-1">Innovation 1</div>
            <h3 className="text-base font-bold text-white">Pre-Monsoon Road Intelligence</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Catalogues potholes, cave-ins, and surface structural damage observed
              during dry months. When heavy monsoon rains flood the city, these records
              anchor early warnings for submerged cavities hidden beneath standing water.
            </p>
          </div>

          {/* Innovation 2 */}
          <div className="group rounded-xl border border-[#1C1C28] bg-[#0B0B10] p-7 transition card-interactive hover:border-[#00F5FF]/50 hover:shadow-[0_0_24px_rgba(0,245,255,0.15)]">
            <div className="mb-4 inline-flex rounded-lg bg-[#00F5FF]/15 border border-[#00F5FF]/35 p-2.5 text-[#00F5FF]">
              <Route className="h-5 w-5 text-[#00F5FF]" />
            </div>
            <div className="text-[10px] font-bold text-[#00F5FF] uppercase tracking-wider mb-1">Innovation 2</div>
            <h3 className="text-base font-bold text-white">Dynamic Risk-Based Routing</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              SafeRoute evaluates alternative corridors by cross-referencing real-time
              waterlogging reports, pre-monsoon defect severity, and report freshness —
              recommending routes with lower hazard risk rather than raw shortest distance.
            </p>
          </div>
        </div>
      </section>

      {/* ── Three-Step Workflow ─────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 bg-[#050507]">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-widest block mb-2">Methodology</span>
          <h2 className="text-2xl font-extrabold sm:text-3xl text-white">How It Works</h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          <WorkflowStep
            step={1}
            icon={<Eye className="h-6 w-6 text-[#A78BFA]" />}
            title="Observe"
            description="Field surveys and commuters log potholes and road defects during dry weather, constructing a pre-monsoon baseline."
            accent="amethyst"
          />
          <WorkflowStep
            step={2}
            icon={<GitMerge className="h-6 w-6 text-[#00F5FF]" />}
            title="Correlate"
            description="When waterlogging occurs, the system spatially cross-references flooded segments with baseline defect coordinates."
            accent="cyan"
          />
          <WorkflowStep
            step={3}
            icon={<Bell className="h-6 w-6 text-[#00F5FF]" />}
            title="Warn"
            description="If a pre-monsoon defect coincides with surface water, JalRakshak flags an inferred hidden hazard to protect riders."
            accent="dual"
          />
        </div>
      </section>

      {/* ── Hidden Hazard Example (USP) ─────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 border-t border-[#1C1C28]/80 bg-[#0B0B10]/40">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-[10px] font-bold text-[#00F5FF] uppercase tracking-widest block mb-1">Unique Selling Proposition</span>
            <h2 className="text-2xl font-extrabold sm:text-3xl text-white">
              Hidden Hazard Prediction
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-xs text-zinc-400">
              Inferring invisible danger beneath floodwater through spatial and temporal evidence correlation.
            </p>
          </div>

          {/* Card */}
          <div className="relative mt-9 overflow-hidden rounded-xl border border-[#FF4D6D]/40 bg-[#0B0B10] shadow-2xl card-interactive">
            {/* Top Amethyst/Cyan Accent Bar */}
            <div className="h-1 bg-gradient-to-r from-[#FF4D6D] via-[#FF9F43] to-[#00F5FF]" />

            <div className="p-6 sm:p-8">
              {/* badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF4D6D]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FF4D6D] border border-[#FF4D6D]/35">
                <AlertOctagon className="h-3.5 w-3.5" />
                USP Inferred Prediction Alert
              </span>

              <div className="mt-6 space-y-4">
                {/* historical */}
                <HazardRow
                  icon={<CircleDot className="h-5 w-5 text-[#FF9F43]" />}
                  label="Historical Road Defect"
                  detail="30cm pothole observed 45 days ago"
                  sublabel="Pre-monsoon baseline observation · Survey verified"
                  borderColor="border-[#FF9F43]/30"
                />

                {/* connector */}
                <div className="flex items-center gap-2 pl-3 text-zinc-500">
                  <div className="h-6 w-px bg-[#1C1C28]" />
                  <GitMerge className="h-3.5 w-3.5 text-[#00F5FF]" />
                  <span className="text-[11px] font-medium text-zinc-400">Spatial correlation overlap on Minto Road</span>
                </div>

                {/* current */}
                <HazardRow
                  icon={<Droplets className="h-5 w-5 text-[#00F5FF]" />}
                  label="Active Waterlogging"
                  detail="Reported 4 hours ago"
                  sublabel="Estimated depth: 2-3 ft · Direct commuter report"
                  borderColor="border-[#00F5FF]/30"
                />
              </div>

              {/* result banner */}
              <div className="mt-6 rounded-lg border border-[#FF4D6D]/30 bg-[#FF4D6D]/10 p-4">
                <p className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                  <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D6D]" />
                  <span>
                    <strong className="text-[#FF4D6D]">Inferred hazard notice:</strong> The defect is statistically predicted beneath current floodwater based on GPS intersection. It is not physically visible under standing water.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture Section ───────────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 bg-[#050507]">
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-widest block mb-1">Architecture</span>
          <h2 className="text-2xl font-extrabold sm:text-3xl text-white">System Data Pipeline</h2>
          <p className="mx-auto mt-2 max-w-lg text-xs text-zinc-400">
            From crowdsourced observations to risk mitigation — designed for municipal interoperability.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-0 sm:justify-between">
            <ArchNode icon={<Users className="h-5 w-5" />} label="Riders &amp; Commuters" accent="cyan" />
            <ArrowConnector />
            <ArchNode icon={<Zap className="h-5 w-5" />} label="JalRakshak Engine" accent="amethyst" highlight />
            <ArrowConnector />
            <ArchNode icon={<Building2 className="h-5 w-5" />} label="Municipal Review" accent="amethyst" proposed />
            <ArrowConnector />
            <ArchNode icon={<ShieldCheck className="h-5 w-5" />} label="Public Safety Feed" accent="cyan" />
          </div>

          <p className="mt-8 text-center text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 rounded bg-[#8B5CF6]/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#C4B5FD] border border-[#8B5CF6]/30">
              Proposed Pathway
            </span>{' '}
            Municipal departmental integration represents a planned future interface.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1C1C28] px-6 py-10 bg-[#050507]">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center text-xs text-zinc-500">
          <Link to="/" className="flex items-center gap-2 text-white">
            <Shield className="h-4 w-4 text-[#00F5FF]" />
            <span className="font-bold tracking-tight">
              Jal<span className="text-[#00F5FF]">Rakshak</span>
            </span>
          </Link>

          <p className="max-w-md text-[11px] text-zinc-400">
            All data shown is synthetic demonstration data. JalRakshak is a
            decision-support civic-tech prototype and does not claim official affiliation with
            any municipal department.
          </p>

          <Link
            to="/dashboard"
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#00F5FF] hover:underline"
          >
            Launch Command Center
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          <p className="mt-2 text-[10px] text-zinc-600">© JalRakshak Civic-Tech Platform</p>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================== */
/*  Sub-components (file-private)                                      */
/* ================================================================== */

function HeroComposition() {
  return (
    <div className="relative h-[340px] sm:h-[400px] w-full">
      {/* Stylised "road" SVG */}
      <svg
        viewBox="0 0 400 320"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* road surface */}
        <path
          d="M0 200 Q100 160 200 180 T400 160"
          stroke="#12121A"
          strokeWidth="56"
          strokeLinecap="round"
        />
        {/* road centre dashes */}
        <path
          d="M0 200 Q100 160 200 180 T400 160"
          stroke="#2A2A3C"
          strokeWidth="2"
          strokeDasharray="12 10"
          strokeLinecap="round"
        />
        {/* waterlogging fill */}
        <path
          d="M120 170 Q160 155 200 165 T280 155"
          stroke="#00F5FF"
          strokeWidth="48"
          strokeLinecap="round"
          opacity="0.14"
        />
        {/* animated water shimmer */}
        <path
          d="M130 172 Q165 160 200 167 T270 157"
          stroke="#00F5FF"
          strokeWidth="2"
          strokeDasharray="6 8"
          opacity="0.45"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2s" repeatCount="indefinite" />
        </path>

        {/* hazard markers */}
        <circle cx="170" cy="174" r="6" fill="#8B5CF6" opacity="0.8">
          <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="220" cy="168" r="5" fill="#00F5FF" opacity="0.9">
          <animate attributeName="r" values="5;7;5" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="260" cy="160" r="4" fill="#A78BFA" opacity="0.7">
          <animate attributeName="r" values="4;6;4" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Floating card — Hidden Hazard Alert */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-52 rounded-xl border border-[#8B5CF6]/40 bg-[#0B0B10]/95 p-3.5 shadow-2xl backdrop-blur-md animate-float-slow">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00F5FF]">
          <AlertOctagon className="h-3 w-3" />
          Hidden Hazard
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-zinc-300">
          Pothole detected beneath active flooding on Mathura Road.
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#A78BFA] font-bold">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00F5FF] animate-pulse" />
          Risk Profile: Critical
        </div>
      </div>

      {/* Floating card — Waterlogging indicator */}
      <div className="absolute bottom-6 left-0 sm:left-2 w-48 rounded-xl border border-[#00F5FF]/35 bg-[#0B0B10]/95 p-3.5 shadow-2xl backdrop-blur-md animate-float-medium">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00F5FF]">
          <Waves className="h-3 w-3" />
          Waterlogging
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-zinc-300">
          ~2.5 ft depth reported near ITO junction.
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1C1C28]">
          <div className="h-full w-3/4 rounded-full bg-[#00F5FF]" />
        </div>
      </div>

      {/* Floating card — Risk Level */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 sm:-left-2 w-36 rounded-xl border border-[#1C1C28] bg-[#0B0B10]/95 p-3 shadow-xl backdrop-blur-md animate-float-fast">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <Activity className="h-3 w-3 text-[#00F5FF]" />
          Risk Score
        </div>
        <div className="mt-2 flex gap-1">
          {['bg-[#1C1C28]', 'bg-[#8B5CF6]/40', 'bg-[#8B5CF6]', 'bg-[#00F5FF]'].map((c, i) => (
            <div key={i} className={`h-2.5 flex-1 rounded-sm ${c}`} />
          ))}
        </div>
        <p className="mt-1 text-[10px] text-[#00F5FF] font-extrabold tracking-wide">Elevated Risk</p>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes float-slow  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes float-medium{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes float-fast  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .animate-float-slow   { animation: float-slow   5s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium  4s ease-in-out infinite 0.5s; }
        .animate-float-fast   { animation: float-fast    3.5s ease-in-out infinite 1s; }
        @media (prefers-reduced-motion: reduce) {
          .animate-float-slow,
          .animate-float-medium,
          .animate-float-fast { animation: none; }
          svg animate { animation: none; }
        }
      `}</style>
    </div>
  );
}

function WorkflowStep({
  step,
  icon,
  title,
  description,
  accent,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: 'amethyst' | 'cyan' | 'dual';
}) {
  const accentClass =
    accent === 'amethyst'
      ? 'border-[#8B5CF6]/35 bg-[#8B5CF6]/10 text-[#C4B5FD]'
      : accent === 'cyan'
      ? 'border-[#00F5FF]/35 bg-[#00F5FF]/10 text-[#00F5FF]'
      : 'border-[#00F5FF]/50 bg-[#00F5FF]/15 text-[#00F5FF] shadow-[0_0_14px_rgba(0,245,255,0.2)]';

  const badgeClass =
    accent === 'amethyst'
      ? 'bg-[#8B5CF6] text-white'
      : 'bg-[#00F5FF] text-[#050507]';

  return (
    <div className="flex flex-col items-center text-center p-6 rounded-xl border border-[#1C1C28] bg-[#0B0B10] card-interactive hover:border-[#8B5CF6]/50">
      <div className={`relative mb-4 inline-flex rounded-xl p-3 border ${accentClass}`}>
        {icon}
        <span
          className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${badgeClass}`}
        >
          {step}
        </span>
      </div>
      <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
      <p className="text-xs leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}

function HazardRow({
  icon,
  label,
  detail,
  sublabel,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  sublabel: string;
  borderColor: string;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border ${borderColor} bg-[#12121A]/70 p-3.5`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-300">
          <Clock className="h-3 w-3 text-zinc-500" />
          {detail}
        </p>
        <p className="mt-1 text-[10px] text-zinc-500">{sublabel}</p>
      </div>
    </div>
  );
}

function ArchNode({
  icon,
  label,
  accent,
  highlight,
  proposed,
}: {
  icon: React.ReactNode;
  label: string;
  accent: 'cyan' | 'amethyst';
  highlight?: boolean;
  proposed?: boolean;
}) {
  const style =
    accent === 'cyan'
      ? 'text-[#00F5FF] border-[#00F5FF]/30 bg-[#00F5FF]/10'
      : 'text-[#A78BFA] border-[#8B5CF6]/35 bg-[#8B5CF6]/10';

  return (
    <div className="flex flex-col items-center gap-2 text-center w-28 sm:w-24">
      <div
        className={`inline-flex rounded-xl p-2.5 border ${style} ${
          highlight ? 'shadow-[0_0_14px_rgba(139,92,246,0.25)] border-[#8B5CF6]' : ''
        } ${proposed ? 'border-dashed' : ''}`}
      >
        {icon}
      </div>
      <span className="text-[10px] font-bold leading-tight text-zinc-300">{label}</span>
      {proposed && (
        <span className="inline-flex items-center rounded bg-[#8B5CF6]/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#C4B5FD] border border-[#8B5CF6]/30">
          Proposed
        </span>
      )}
    </div>
  );
}

function ArrowConnector() {
  return (
    <div className="hidden sm:flex items-center text-zinc-600">
      <div className="h-px w-5 bg-[#2A2A3C]" />
      <ChevronRight className="h-3.5 w-3.5 text-zinc-500 -ml-1" />
    </div>
  );
}
