import { useState } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Navigation, FileText, AlertTriangle,
  Wrench, Menu, X, ChevronLeft, ChevronRight, Shield,
  RotateCcw, User
} from 'lucide-react';
import { resetDemoData } from '../../data/store';
import { cn } from '../../utils/format';
import { BackendStatusBadge } from './BackendStatusBadge';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center', desc: 'Hazard overview & map' },
  { to: '/safe-route', icon: Navigation, label: 'SafeRoute', desc: 'Route risk comparison' },
  { to: '/road-intelligence', icon: FileText, label: 'Road Intelligence', desc: 'Evidence & observations' },
  { to: '/report', icon: AlertTriangle, label: 'Report Hazard', desc: 'Submit observation' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance', desc: 'Resolution workflow' },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const currentNav = NAV_ITEMS.find(n => location.pathname.startsWith(n.to));

  const handleReset = () => {
    if (confirm('Reset all demo data to initial state? This will remove any reports you have submitted.')) {
      resetDemoData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#F3F4F6] flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-[#1C1C28] bg-[#0B0B10] transition-all duration-300 relative z-20',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className={cn('p-4 border-b border-[#1C1C28] flex items-center', sidebarOpen ? 'gap-3' : 'justify-center')}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
              <Shield className="w-4 h-4 text-[#00F5FF]" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-sm font-extrabold text-white tracking-tight group-hover:text-[#00F5FF] transition-colors">JalRakshak</h1>
                <p className="text-[10px] text-[#A78BFA] font-medium leading-tight tracking-wider uppercase">Road Intelligence</p>
              </div>
            )}
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-1.5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg transition-all duration-200 group border',
                sidebarOpen ? 'px-3 py-2.5' : 'px-2 py-2.5 justify-center',
                isActive
                  ? 'bg-[#8B5CF6]/15 text-white border-[#8B5CF6]/40 shadow-[0_0_14px_rgba(139,92,246,0.18)]'
                  : 'text-zinc-400 hover:bg-[#12121A] hover:text-white border-transparent'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-[#00F5FF]' : 'text-zinc-400 group-hover:text-zinc-200')} />
                  {sidebarOpen && (
                    <div>
                      <div className={cn('text-xs font-bold tracking-wide', isActive ? 'text-white' : 'text-zinc-300')}>{item.label}</div>
                      <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400">{item.desc}</div>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Controls */}
        <div className="p-3 border-t border-[#1C1C28] space-y-2">
          {/* Backend Mode Indicator */}
          <BackendStatusBadge sidebarOpen={sidebarOpen} />

          {sidebarOpen && (
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-white bg-[#0B0B10] hover:bg-[#12121A] border border-[#1C1C28] hover:border-[#8B5CF6]/40 transition-colors text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Reset Demo Data
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0B0B10] border border-[#1C1C28] flex items-center justify-center text-zinc-400 hover:text-[#00F5FF] hover:border-[#8B5CF6]/50 transition-colors z-30 shadow-md"
        >
          {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#050507]/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0B0B10] border-r border-[#1C1C28] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#1C1C28] flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#00F5FF]" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold text-white">JalRakshak</h1>
                  <p className="text-[10px] text-[#A78BFA] font-medium tracking-wider uppercase">Road Intelligence</p>
                </div>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-3 px-2 space-y-1.5">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border',
                    isActive
                      ? 'bg-[#8B5CF6]/15 text-white border-[#8B5CF6]/40 shadow-[0_0_12px_rgba(139,92,246,0.18)]'
                      : 'text-zinc-400 hover:bg-[#12121A] hover:text-white border-transparent'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn('w-4 h-4', isActive ? 'text-[#00F5FF]' : 'text-zinc-400')} />
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] text-zinc-500">{item.desc}</div>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-[#1C1C28] space-y-2">
              <BackendStatusBadge />
              <button
                onClick={() => { handleReset(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-white bg-[#0B0B10] hover:bg-[#12121A] border border-[#1C1C28] transition-colors text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Toolbar */}
        <header className="h-14 border-b border-[#1C1C28] bg-[#050507]/90 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden text-zinc-300 hover:text-white p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6]/35 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-[#00F5FF]" />
              </div>
              <span className="text-sm font-extrabold text-white tracking-tight">JalRakshak</span>
            </div>
            <div className="hidden lg:block">
              {currentNav && (
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">{currentNav.label}</h2>
                  <p className="text-[10px] text-zinc-400">{currentNav.desc}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BackendStatusBadge compact className="hidden sm:flex" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B0B10] border border-[#1C1C28]">
              <User className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="text-xs font-semibold text-zinc-300">Demo Reviewer</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#050507]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
