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
    <div className="min-h-screen bg-navy-950 flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-navy-700/50 bg-navy-900 transition-all duration-300 relative z-20',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className={cn('p-4 border-b border-navy-700/50 flex items-center', sidebarOpen ? 'gap-3' : 'justify-center')}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">JalRakshak</h1>
                <p className="text-[10px] text-navy-400 leading-tight">Road Intelligence</p>
              </div>
            )}
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg transition-all duration-200 group',
                sidebarOpen ? 'px-3 py-2.5' : 'px-2 py-2.5 justify-center',
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-navy-300 hover:bg-navy-700/50 hover:text-white border border-transparent'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && (
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[10px] text-navy-400 group-hover:text-navy-300">{item.desc}</div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Controls */}
        <div className="p-3 border-t border-navy-700/50 space-y-2">
          {/* Backend Mode Indicator */}
          <BackendStatusBadge sidebarOpen={sidebarOpen} />

          {sidebarOpen && (
            <button
              onClick={handleReset}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700/50 transition-colors text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Data
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-navy-300 hover:text-white hover:bg-navy-600 transition-colors z-30"
        >
          {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-navy-900 border-r border-navy-700/50 flex flex-col">
            <div className="p-4 border-b border-navy-700/50 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">JalRakshak</h1>
                  <p className="text-[10px] text-navy-400">Road Intelligence</p>
                </div>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="text-navy-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-3 px-2 space-y-1">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                      : 'text-navy-300 hover:bg-navy-700/50 hover:text-white border border-transparent'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-[10px] text-navy-400">{item.desc}</div>
                  </div>
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-navy-700/50 space-y-2">
              <BackendStatusBadge />
              <button
                onClick={() => { handleReset(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-700/50 transition-colors text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Toolbar */}
        <header className="h-14 border-b border-navy-700/50 bg-navy-900/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-navy-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-sm font-bold text-white">JalRakshak</span>
            </div>
            <div className="hidden lg:block">
              {currentNav && (
                <div>
                  <h2 className="text-sm font-semibold text-white">{currentNav.label}</h2>
                  <p className="text-[11px] text-navy-400">{currentNav.desc}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BackendStatusBadge compact className="hidden sm:flex" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-700/50 border border-navy-600/50">
              <User className="w-3.5 h-3.5 text-navy-400" />
              <span className="text-xs text-navy-300">Demo Reviewer</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
