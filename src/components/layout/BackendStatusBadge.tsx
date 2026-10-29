// JalRakshak — Backend Mode Status Badge
// Cyber-Civic Palette: Jet Black (#050507), Deep Black (#0B0B10), Royal Amethyst (#8B5CF6), Electric Cyan (#00F5FF)

import { useState, useEffect } from 'react';
import type { BackendMode } from '../../lib/supabase';
import { isSupabaseConfigured, testBackendConnection } from '../../lib/supabase';
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
    label: 'Local Demo Mode',
    compactLabel: 'Demo',
    description: 'Operating with local demo dataset (no backend configured)',
    containerClass: 'bg-[#12121A] border-[#222233]',
    dotClass: 'bg-[#8B5CF6] animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]',
    textClass: 'text-[#C4B5FD]',
  },
  connecting: {
    label: 'Connecting...',
    compactLabel: 'Connecting',
    description: 'Verifying connection to configured Supabase backend...',
    containerClass: 'bg-[#FFD166]/10 border-[#FFD166]/30',
    dotClass: 'bg-[#FFD166] animate-ping',
    textClass: 'text-[#FFD166]',
  },
  configured: {
    label: 'Backend Configured',
    compactLabel: 'Configured',
    description: 'Supabase credentials detected (awaiting ping verification)',
    containerClass: 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40',
    dotClass: 'bg-[#A78BFA]',
    textClass: 'text-[#DDD6FE]',
  },
  connected: {
    label: 'Backend Connected',
    compactLabel: 'Connected',
    description: 'Verified active connection to live Supabase database',
    containerClass: 'bg-[#00F5FF]/10 border-[#00F5FF]/40 shadow-[0_0_10px_rgba(0,245,255,0.25)]',
    dotClass: 'bg-[#00F5FF]',
    textClass: 'text-[#00F5FF]',
  },
  error: {
    label: 'Backend Error',
    compactLabel: 'Backend Error',
    description: 'Configured Supabase backend is unreachable or returned error',
    containerClass: 'bg-red-500/10 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    dotClass: 'bg-red-400 animate-pulse',
    textClass: 'text-red-400',
  },
};

export function BackendStatusBadge({
  mode,
  compact = false,
  sidebarOpen = true,
  className,
}: BackendStatusBadgeProps) {
  const [testedMode, setTestedMode] = useState<BackendMode | null>(null);

  useEffect(() => {
    if (mode || !isSupabaseConfigured()) {
      return;
    }

    let isMounted = true;
    testBackendConnection().then((status) => {
      if (isMounted) {
        setTestedMode(status);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [mode]);

  const liveMode: BackendMode = mode ?? testedMode ?? (isSupabaseConfigured() ? 'connecting' : 'demo');
  const config = MODE_CONFIG[liveMode];

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
