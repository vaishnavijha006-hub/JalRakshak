// JalRakshak — Backend Mode Status Badge
// Accurately reflects Demo Mode vs Backend Configured/Connected state

import type { BackendMode } from '../../lib/supabase';
import { getBackendMode } from '../../lib/supabase';
import { cn } from '../../utils/format';

interface BackendStatusBadgeProps {
  mode?: BackendMode;
  compact?: boolean;
  sidebarOpen?: boolean;
  className?: string;
}

const MODE_CONFIG: Record<
  BackendMode,
  {
    label: string;
    compactLabel: string;
    description: string;
    containerClass: string;
    dotClass: string;
    textClass: string;
  }
> = {
  demo: {
    label: 'Demo Mode',
    compactLabel: 'Demo',
    description: 'Operating with local demo dataset',
    containerClass: 'bg-amber-500/10 border-amber-500/20',
    dotClass: 'bg-amber-400 animate-pulse',
    textClass: 'text-amber-400',
  },
  configured: {
    label: 'Backend Configured',
    compactLabel: 'Configured',
    description: 'Supabase configuration detected (connectivity unverified)',
    containerClass: 'bg-sky-500/10 border-sky-500/25',
    dotClass: 'bg-sky-400',
    textClass: 'text-sky-300',
  },
  connected: {
    label: 'Backend Connected',
    compactLabel: 'Connected',
    description: 'Connected to live Supabase backend',
    containerClass: 'bg-emerald-500/10 border-emerald-500/25',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-300',
  },
  error: {
    label: 'Connection Error',
    compactLabel: 'Error',
    description: 'Failed to communicate with backend',
    containerClass: 'bg-red-500/10 border-red-500/25',
    dotClass: 'bg-red-400',
    textClass: 'text-red-400',
  },
};

export function BackendStatusBadge({
  mode,
  compact = false,
  sidebarOpen = true,
  className,
}: BackendStatusBadgeProps) {
  const currentMode = mode ?? getBackendMode();
  const config = MODE_CONFIG[currentMode];

  return (
    <div
      role="status"
      aria-label={`Backend mode: ${config.label}. ${config.description}`}
      title={config.description}
      className={cn(
        'flex items-center gap-2 rounded-lg border transition-all duration-200',
        compact ? 'px-2.5 py-1 rounded-full' : 'px-3 py-2',
        !sidebarOpen && !compact && 'justify-center px-2',
        config.containerClass,
        className,
      )}
    >
      <div className={cn('w-2 h-2 rounded-full shrink-0', config.dotClass)} aria-hidden="true" />
      {(sidebarOpen || compact) && (
        <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.textClass)}>
          {compact ? config.compactLabel : config.label}
        </span>
      )}
    </div>
  );
}
