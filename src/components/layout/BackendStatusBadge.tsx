// JalRakshak — Backend Mode Status Badge
// Cyber-Civic Palette: Jet Black (#050507), Deep Black (#0B0B10), Royal Amethyst (#8B5CF6), Electric Cyan (#00F5FF)

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
    containerClass: 'bg-[#12121A] border-[#222233]',
    dotClass: 'bg-[#8B5CF6] animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]',
    textClass: 'text-[#C4B5FD]',
  },
  configured: {
    label: 'Backend Configured',
    compactLabel: 'Configured',
    description: 'Supabase configuration detected (connectivity unverified)',
    containerClass: 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40',
    dotClass: 'bg-[#A78BFA]',
    textClass: 'text-[#DDD6FE]',
  },
  connected: {
    label: 'Backend Connected',
    compactLabel: 'Connected',
    description: 'Connected to live Supabase backend',
    containerClass: 'bg-[#00F5FF]/10 border-[#00F5FF]/40 shadow-[0_0_10px_rgba(0,245,255,0.25)]',
    dotClass: 'bg-[#00F5FF]',
    textClass: 'text-[#00F5FF]',
  },
  error: {
    label: 'Connection Error',
    compactLabel: 'Error',
    description: 'Failed to communicate with backend',
    containerClass: 'bg-[#12121A] border-[#00F5FF]/60',
    dotClass: 'bg-[#00F5FF] animate-pulse',
    textClass: 'text-[#00F5FF]',
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
        <span className={cn('text-[10px] font-bold uppercase tracking-wider', config.textClass)}>
          {compact ? config.compactLabel : config.label}
        </span>
      )}
    </div>
  );
}
