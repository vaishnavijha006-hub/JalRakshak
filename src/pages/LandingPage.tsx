import { Link } from 'react-router-dom';
import {
  Shield,
  Eye,
  Zap,
  ArrowRight,
  Navigation,
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
  Radar,
  Crosshair,
  CloudRain,
} from 'lucide-react';
import { InteractiveBackground } from '../components/layout/InteractiveBackground';
import { MonsoonRainEffect } from '../components/ui/MonsoonRainEffect';
import delhiHeroImg from '../assets/delhi-monsoon-hero.jpg';

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
              Delhi&apos;s monsoon road intelligence platform connecting dry-season baseline defects
              with real-time waterlogging — unmasking deep potholes and cave-ins concealed beneath standing floodwater.
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

            {/* Micro Delhi telemetry pills */}
            <div className="mt-8 pt-6 border-t border-[#1C1C28] grid grid-cols-3 gap-2 text-left">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Corridors</span>
                <span className="text-xs font-bold text-zinc-300">Central &amp; South Delhi</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Monsoon Radar</span>
                <span className="text-xs font-bold text-[#00F5FF]">42 mm/hr Inundation</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Hazard Mode</span>
                <span className="text-xs font-bold text-[#FF4D6D]">Submerged Inferred</span>
              </div>
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
    <div className="relative h-[380px] sm:h-[440px] md:h-[480px] w-full rounded-2xl border border-[#1C1C28] bg-[#0B0B10] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.85)] group">
      {/* ── Photographic Delhi Monsoon Anchor ── */}
      <img
        src={delhiHeroImg}
        alt="India Gate New Delhi silhouetted during monsoon downpour with submerged road defect in waterlogged road"
        className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.88] contrast-[1.08] transition-transform duration-1000 group-hover:scale-[1.02]"
      />

      {/* ── Continuous Atmospheric Monsoon Rain Simulation ── */}
      <MonsoonRainEffect intensity="moderate" className="absolute inset-0 pointer-events-none z-10" />

      {/* ── Atmospheric Lighting & Edge Vignette ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B10] via-[#050507]/20 to-[#050507]/80 pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,5,7,0.75)_100%)] pointer-events-none z-10" />

      {/* ── Corner Tactical Reticles ── */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#00F5FF]/70 z-20 pointer-events-none" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#00F5FF]/70 z-20 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#00F5FF]/70 z-20 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#00F5FF]/70 z-20 pointer-events-none" />

      {/* ── Top Telemetry HUD Bar ── */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="inline-flex items-center gap-2 rounded-lg bg-[#050507]/85 border border-[#1C1C28] px-3 py-1.5 backdrop-blur-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F5FF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F5FF]" />
          </span>
          <span className="text-[10px] font-mono font-bold tracking-wider text-white">
            LIVE // RAJPATH C-HEXAGON
          </span>
        </div>

        <div className="hidden sm:inline-flex items-center gap-3 rounded-lg bg-[#050507]/85 border border-[#1C1C28] px-3 py-1.5 backdrop-blur-md text-[10px] font-mono text-zinc-300 shadow-lg">
          <span className="flex items-center gap-1.5 text-[#00F5FF] font-bold">
            <CloudRain className="h-3 w-3" />
            42 mm/hr
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">28.6129° N, 77.2295° E</span>
        </div>
      </div>

      {/* ── Submerged Hazard Reticle (Targeting waterlogged cavity in foreground) ── */}
      <div className="absolute bottom-16 left-4 sm:bottom-16 sm:left-8 z-20 pointer-events-auto">
        <div className="relative">
          {/* Pulsing crosshair marker */}
          <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full border-2 border-[#FF4D6D] animate-ping opacity-60 pointer-events-none" />
          <div className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-[#FF4D6D] border border-white flex items-center justify-center pointer-events-none">
            <Crosshair className="h-3 w-3 text-white" />
          </div>

          {/* Precision telemetry popout */}
          <div className="ml-5 rounded-xl border border-[#FF4D6D]/60 bg-[#0B0B10]/95 backdrop-blur-md p-3 shadow-2xl max-w-[230px]">
            <div className="flex items-center justify-between gap-1 text-[9px] font-mono font-bold uppercase text-[#FF4D6D]">
              <span className="flex items-center gap-1">
                <AlertOctagon className="h-3 w-3" />
                Hidden Hazard Locked
              </span>
              <span className="text-[8px] bg-[#FF4D6D]/20 text-[#FF4D6D] px-1 py-0.5 rounded">
                CRITICAL
              </span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-white leading-snug">
              Submerged 28cm Pothole
            </p>
            <p className="text-[10px] text-zinc-300 leading-tight">
              Concealed beneath 1.6 ft standing floodwater. Inferred via pre-monsoon survey #DL-4819.
            </p>
            <div className="mt-2 pt-1.5 border-t border-[#1C1C28] flex items-center justify-between text-[9px] font-mono">
              <span className="text-zinc-500">Confidence</span>
              <span className="text-[#00F5FF] font-bold">94% Spatial Match</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SafeRoute Dynamic Vector HUD Pill (Top right) ── */}
      <div className="absolute top-16 right-4 z-20 pointer-events-auto max-w-[210px] hidden xs:block sm:block">
        <div className="rounded-xl border border-[#8B5CF6]/50 bg-[#0B0B10]/95 backdrop-blur-md p-3 shadow-2xl">
          <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase text-[#A78BFA]">
            <Radar className="h-3 w-3 text-[#00F5FF]" />
            SafeRoute Corridor Vector
          </div>
          <div className="mt-1 text-[11px] font-bold text-white">
            ITO ↔ Lajpat Nagar
          </div>
          <div className="mt-1.5 space-y-1 text-[9px] font-mono">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Direct (Ring Rd):</span>
              <span className="text-[#FF4D6D] font-bold">Risk 84 (Critical)</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Barapullah Bypass:</span>
              <span className="text-[#35D07F] font-bold">Risk 28 (Low)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Status Bar ── */}
      <div className="absolute bottom-2 inset-x-3 flex items-center justify-between z-20 pointer-events-none text-[9px] font-mono text-zinc-400 bg-[#050507]/90 px-3 py-1 rounded border border-[#1C1C28]">
        <span className="truncate">
          STATUS: ACTIVE MONSOON SURVEILLANCE // SENSING HIDDEN CAVITIES &amp; FLOOD RECESSION
        </span>
        <span className="hidden md:inline text-[#00F5FF] font-bold shrink-0 ml-2">
          JALRAKSHAK INTELLIGENCE ENGINE v1.0
        </span>
      </div>
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
