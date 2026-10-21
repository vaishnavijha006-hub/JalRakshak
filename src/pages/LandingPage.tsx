import { Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
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
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Landing Page – standalone (no shared Layout wrapper)               */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100 font-[Inter,sans-serif] overflow-x-hidden">
      {/* ── Top Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0B1220]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className="h-7 w-7 text-cyan-400 transition-transform group-hover:scale-110" />
            <span className="text-lg font-bold tracking-tight">
              Jal<span className="text-cyan-400">Rakshak</span>
            </span>
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-300 ring-1 ring-cyan-500/30 transition hover:bg-cyan-500/25 hover:text-cyan-200"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 md:pt-36 md:pb-32 px-6">
        {/* ambient glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[720px] rounded-full bg-cyan-500/[0.07] blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          {/* Left – copy */}
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400 ring-1 ring-amber-500/20">
              <Activity className="h-3.5 w-3.5" />
              Delhi Monsoon Road Intelligence
            </p>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-[3.4rem]">
              Know what lies{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                beneath the flood.
              </span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-gray-400 sm:text-lg">
              Road intelligence that connects historical defects with current
              waterlogging to help commuters identify hidden road hazards.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-[#0B1220] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
              >
                Open Command Center
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/safe-route"
                className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-200 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                <Navigation className="h-4 w-4 text-teal-400" />
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
      <section className="relative px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Two Core Innovations</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400">
            JalRakshak moves beyond reactive flood alerts by combining
            infrastructure memory with real-time environmental data.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          {/* Innovation 1 */}
          <div className="group rounded-2xl border border-white/5 bg-[#111827] p-8 transition hover:border-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/5">
            <div className="mb-4 inline-flex rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Pre-Monsoon Road Intelligence</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              We catalogue potholes, cave-ins, and surface failures observed
              during dry months. When monsoon waters arrive, these records
              become early-warning indicators for hidden hazards lurking
              beneath waterlogged stretches.
            </p>
          </div>

          {/* Innovation 2 */}
          <div className="group rounded-2xl border border-white/5 bg-[#111827] p-8 transition hover:border-teal-500/20 hover:shadow-lg hover:shadow-teal-500/5">
            <div className="mb-4 inline-flex rounded-xl bg-teal-500/10 p-3 text-teal-400">
              <Route className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Dynamic Risk-Based Routing</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              SafeRoute evaluates every road segment by combining real-time
              waterlogging depth, historical defect severity, and crowdsourced
              reports — then suggests the safest path, not just the shortest
              one.
            </p>
          </div>
        </div>
      </section>

      {/* ── Three-Step Workflow ─────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28 bg-[#0d1526]">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">How It Works</h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3">
          <WorkflowStep
            step={1}
            icon={<Eye className="h-7 w-7" />}
            title="Observe"
            description="Citizens and field teams report potholes, cave-ins, and road defects during dry months — building a pre-monsoon infrastructure memory."
            color="cyan"
          />
          <WorkflowStep
            step={2}
            icon={<GitMerge className="h-7 w-7" />}
            title="Correlate"
            description="When waterlogging is reported, JalRakshak cross-references the location against known defects within a configurable radius."
            color="amber"
          />
          <WorkflowStep
            step={3}
            icon={<Bell className="h-7 w-7" />}
            title="Warn"
            description="If a historical defect overlaps with current flooding, the system flags an inferred hidden hazard and alerts nearby commuters."
            color="red"
          />
        </div>
      </section>

      {/* ── Hidden Hazard Example ──────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Hidden Hazard — Example Alert
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-gray-400">
            This is how JalRakshak infers danger that isn't directly visible.
          </p>

          {/* Card */}
          <div className="relative mt-10 overflow-hidden rounded-2xl border border-amber-500/20 bg-[#111827]">
            {/* Stripe */}
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

            <div className="p-6 sm:p-8">
              {/* badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-400 ring-1 ring-red-500/20">
                <AlertTriangle className="h-3.5 w-3.5" />
                Hidden Hazard Alert — Example
              </span>

              <div className="mt-6 space-y-5">
                {/* historical */}
                <HazardRow
                  icon={<CircleDot className="h-5 w-5 text-amber-400" />}
                  label="Historical Defect"
                  detail="Pothole observed 45 days ago"
                  sublabel="Severity: Moderate · Reported by field survey"
                  borderColor="border-amber-500/20"
                />

                {/* connector */}
                <div className="flex items-center gap-2 pl-2 text-gray-500">
                  <div className="h-6 w-px bg-gray-700" />
                  <GitMerge className="h-4 w-4 text-cyan-500" />
                  <span className="text-xs text-gray-500">Spatial correlation within 50 m</span>
                </div>

                {/* current */}
                <HazardRow
                  icon={<Droplets className="h-5 w-5 text-cyan-400" />}
                  label="Current Waterlogging"
                  detail="Reported 4 hours ago"
                  sublabel="Depth estimate: ~30 cm · Crowdsourced report"
                  borderColor="border-cyan-500/20"
                />
              </div>

              {/* result banner */}
              <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="flex items-start gap-2 text-sm font-medium text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    ⚠ Inferred hazard — not directly confirmed beneath the
                    water. The pre-existing pothole may still be present under
                    current waterlogging, posing a risk to vehicles and
                    pedestrians.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture Section ───────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28 bg-[#0d1526]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">System Architecture</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-400">
            From citizen observations to public safety — a pipeline designed
            for transparency and future government integration.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-0 sm:justify-between">
            <ArchNode icon={<Users className="h-6 w-6" />} label="Riders &amp; Citizens" color="cyan" />
            <ArrowConnector />
            <ArchNode icon={<Zap className="h-6 w-6" />} label="JalRakshak Intelligence Engine" color="teal" highlight />
            <ArrowConnector />
            <ArchNode icon={<Building2 className="h-6 w-6" />} label="Government Review" color="amber" proposed />
            <ArrowConnector />
            <ArchNode icon={<ShieldCheck className="h-6 w-6" />} label="Public Safety" color="green" />
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-amber-400 ring-1 ring-amber-500/20">
              Proposed
            </span>{' '}
            Government integration is a proposed future pathway — not currently active.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center text-xs text-gray-500">
          <Link to="/" className="flex items-center gap-2 text-gray-300">
            <Shield className="h-5 w-5 text-cyan-400" />
            <span className="font-semibold">
              Jal<span className="text-cyan-400">Rakshak</span>
            </span>
          </Link>

          <p className="max-w-md">
            All data shown is synthetic demonstration data. JalRakshak is a
            prototype civic-tech project and does not claim affiliation with
            any government body.
          </p>

          <Link
            to="/dashboard"
            className="mt-1 inline-flex items-center gap-1 text-cyan-400 transition hover:text-cyan-300"
          >
            Go to Dashboard
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          <p className="mt-2 text-gray-600">© {new Date().getFullYear()} JalRakshak</p>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================== */
/*  Sub-components (file-private)                                      */
/* ================================================================== */

/* ── Illustrative Hero Composition ─────────────────────────────────── */
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
          stroke="#1F2937"
          strokeWidth="56"
          strokeLinecap="round"
        />
        {/* road centre dashes */}
        <path
          d="M0 200 Q100 160 200 180 T400 160"
          stroke="#374151"
          strokeWidth="2"
          strokeDasharray="12 10"
          strokeLinecap="round"
        />
        {/* waterlogging fill */}
        <path
          d="M120 170 Q160 155 200 165 T280 155"
          stroke="#06B6D4"
          strokeWidth="48"
          strokeLinecap="round"
          opacity="0.13"
        />
        {/* animated water shimmer */}
        <path
          d="M130 172 Q165 160 200 167 T270 157"
          stroke="#06B6D4"
          strokeWidth="2"
          strokeDasharray="6 8"
          opacity="0.4"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2s" repeatCount="indefinite" />
        </path>

        {/* hazard markers */}
        <circle cx="170" cy="174" r="6" fill="#F59E0B" opacity="0.7">
          <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="220" cy="168" r="5" fill="#EF4444" opacity="0.7">
          <animate attributeName="r" values="5;7;5" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="260" cy="160" r="4" fill="#F97316" opacity="0.6">
          <animate attributeName="r" values="4;6;4" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Floating card — Hidden Hazard Alert */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-52 rounded-xl border border-amber-500/20 bg-[#111827]/95 p-3 shadow-xl backdrop-blur-sm animate-float-slow">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Hidden Hazard
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-gray-300">
          Pothole detected beneath reported waterlogging on Mathura Road.
        </p>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-red-400 font-medium">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          Risk: High
        </div>
      </div>

      {/* Floating card — Waterlogging indicator */}
      <div className="absolute bottom-6 left-0 sm:left-2 w-48 rounded-xl border border-cyan-500/20 bg-[#111827]/95 p-3 shadow-xl backdrop-blur-sm animate-float-medium">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
          <Waves className="h-3 w-3" />
          Waterlogging
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-gray-300">
          ~30 cm depth reported near ITO intersection, 2 hrs ago.
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
          <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400" />
        </div>
      </div>

      {/* Floating card — Risk Level */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 sm:-left-2 w-36 rounded-xl border border-white/5 bg-[#111827]/95 p-3 shadow-xl backdrop-blur-sm animate-float-fast">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          <Activity className="h-3 w-3 text-teal-400" />
          Risk Level
        </div>
        <div className="mt-2 flex gap-1">
          {['bg-green-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'].map((c, i) => (
            <div key={i} className={`h-3 flex-1 rounded-sm ${c} ${i < 3 ? 'opacity-100' : 'opacity-40'}`} />
          ))}
        </div>
        <p className="mt-1 text-[10px] text-orange-400 font-medium">Elevated</p>
      </div>

      {/* Keyframe styles injected via <style> tag */}
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

/* ── Workflow step card ────────────────────────────────────────────── */
function WorkflowStep({
  step,
  icon,
  title,
  description,
  color,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'cyan' | 'amber' | 'red';
}) {
  const ring: Record<string, string> = {
    cyan: 'ring-cyan-500/20 text-cyan-400 bg-cyan-500/10',
    amber: 'ring-amber-500/20 text-amber-400 bg-amber-500/10',
    red: 'ring-red-500/20 text-red-400 bg-red-500/10',
  };
  const badge: Record<string, string> = {
    cyan: 'bg-cyan-500 text-[#0B1220]',
    amber: 'bg-amber-500 text-[#0B1220]',
    red: 'bg-red-500 text-white',
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className={`relative mb-4 inline-flex rounded-2xl p-4 ring-1 ${ring[color]}`}>
        {icon}
        <span
          className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${badge[color]}`}
        >
          {step}
        </span>
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

/* ── Hidden hazard row ─────────────────────────────────────────────── */
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
    <div className={`flex items-start gap-3 rounded-xl border ${borderColor} bg-white/[0.02] p-4`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-400">
          <Clock className="h-3.5 w-3.5" />
          {detail}
        </p>
        <p className="mt-1 text-xs text-gray-500">{sublabel}</p>
      </div>
    </div>
  );
}

/* ── Architecture nodes & connector ────────────────────────────────── */
function ArchNode({
  icon,
  label,
  color,
  highlight,
  proposed,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'cyan' | 'teal' | 'amber' | 'green';
  highlight?: boolean;
  proposed?: boolean;
}) {
  const palette: Record<string, string> = {
    cyan: 'text-cyan-400 ring-cyan-500/20 bg-cyan-500/10',
    teal: 'text-teal-400 ring-teal-500/30 bg-teal-500/10',
    amber: 'text-amber-400 ring-amber-500/20 bg-amber-500/10',
    green: 'text-green-400 ring-green-500/20 bg-green-500/10',
  };

  return (
    <div className="flex flex-col items-center gap-2 text-center w-28 sm:w-24">
      <div
        className={`inline-flex rounded-2xl p-3 ring-1 ${palette[color]} ${
          highlight ? 'shadow-lg shadow-teal-500/10' : ''
        } ${proposed ? 'border border-dashed border-amber-500/30' : ''}`}
      >
        {icon}
      </div>
      <span className="text-[11px] font-medium leading-tight text-gray-300">{label}</span>
      {proposed && (
        <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-400 ring-1 ring-amber-500/20">
          Proposed
        </span>
      )}
    </div>
  );
}

function ArrowConnector() {
  return (
    <div className="hidden sm:flex items-center text-gray-600">
      <div className="h-px w-6 bg-gray-700" />
      <ChevronRight className="h-4 w-4 -ml-1" />
    </div>
  );
}
