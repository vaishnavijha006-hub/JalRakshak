// JalRakshak — Formatting and display utilities
// Cyber-Civic Palette: Jet Black (#050507), Deep Black (#0B0B10), Royal Amethyst (#8B5CF6), Electric Cyan (#00F5FF)

import type { HazardCategory, Severity, RiskLevel, VerificationStatus, IncidentStatus } from '../data/types';

export function formatTimeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCategoryLabel(cat: HazardCategory): string {
  const labels: Record<HazardCategory, string> = {
    pothole: 'Pothole',
    open_manhole: 'Open Manhole',
    waterlogging: 'Waterlogging',
    damaged_road: 'Damaged Road',
    other: 'Other',
  };
  return labels[cat];
}

export function getCategoryIcon(cat: HazardCategory): string {
  const icons: Record<HazardCategory, string> = {
    pothole: '🕳️',
    open_manhole: '⚠️',
    waterlogging: '🌊',
    damaged_road: '🚧',
    other: '📍',
  };
  return icons[cat];
}

export function getSeverityColor(sev: Severity): string {
  const colors: Record<Severity, string> = {
    low: '#71717A',
    medium: '#A78BFA',
    high: '#8B5CF6',
    critical: '#00F5FF',
  };
  return colors[sev];
}

export function getSeverityBg(sev: Severity): string {
  const classes: Record<Severity, string> = {
    low: 'bg-[#12121A] text-[#9CA3AF] border-[#222233]',
    medium: 'bg-[#8B5CF6]/10 text-[#C4B5FD] border-[#8B5CF6]/25',
    high: 'bg-[#8B5CF6]/20 text-[#DDD6FE] border-[#8B5CF6]/45',
    critical: 'bg-[#00F5FF]/15 text-[#00F5FF] border-[#00F5FF]/50 shadow-[0_0_12px_rgba(0,245,255,0.2)]',
  };
  return classes[sev];
}

export function getRiskColor(risk: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#71717A',
    moderate: '#A78BFA',
    high: '#8B5CF6',
    critical: '#00F5FF',
  };
  return colors[risk];
}

export function getRiskBg(risk: RiskLevel): string {
  const classes: Record<RiskLevel, string> = {
    low: 'bg-[#12121A] text-[#9CA3AF] border-[#222233]',
    moderate: 'bg-[#8B5CF6]/10 text-[#C4B5FD] border-[#8B5CF6]/25',
    high: 'bg-[#8B5CF6]/20 text-[#DDD6FE] border-[#8B5CF6]/45',
    critical: 'bg-[#00F5FF]/15 text-[#00F5FF] border-[#00F5FF]/50 shadow-[0_0_12px_rgba(0,245,255,0.2)]',
  };
  return classes[risk];
}

export function getVerificationBg(v: VerificationStatus): string {
  const classes: Record<VerificationStatus, string> = {
    unverified: 'bg-[#12121A] text-[#71717A] border-[#222233]',
    verified: 'bg-[#8B5CF6]/20 text-[#DDD6FE] border-[#8B5CF6]/40',
    disputed: 'bg-[#00F5FF]/15 text-[#00F5FF] border-[#00F5FF]/40',
    resolved: 'bg-[#8B5CF6]/10 text-[#A78BFA] border-[#8B5CF6]/25',
  };
  return classes[v];
}

export function getStatusLabel(status: IncidentStatus): string {
  const labels: Record<IncidentStatus, string> = {
    reported: 'Reported',
    under_verification: 'Under Verification',
    forwarded_for_review: 'Forwarded for Review',
    repair_reported: 'Repair Reported',
    resolution_verified: 'Resolution Verified',
    outdated: 'Outdated',
  };
  return labels[status];
}

export function getStatusBg(status: IncidentStatus): string {
  const classes: Record<IncidentStatus, string> = {
    reported: 'bg-[#00F5FF]/15 text-[#00F5FF] border-[#00F5FF]/30',
    under_verification: 'bg-[#8B5CF6]/15 text-[#C4B5FD] border-[#8B5CF6]/30',
    forwarded_for_review: 'bg-[#8B5CF6]/25 text-[#DDD6FE] border-[#8B5CF6]/45',
    repair_reported: 'bg-[#00F5FF]/20 text-[#67E8F9] border-[#00F5FF]/40',
    resolution_verified: 'bg-[#8B5CF6]/30 text-[#EDE9FE] border-[#8B5CF6]/60 shadow-[0_0_10px_rgba(139,92,246,0.2)]',
    outdated: 'bg-[#12121A] text-[#71717A] border-[#222233]',
  };
  return classes[status];
}

export function getCategoryMarkerColor(cat: HazardCategory): string {
  const colors: Record<HazardCategory, string> = {
    pothole: '#8B5CF6',
    open_manhole: '#A78BFA',
    waterlogging: '#00F5FF',
    damaged_road: '#7C3AED',
    other: '#00B4D8',
  };
  return colors[cat];
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
