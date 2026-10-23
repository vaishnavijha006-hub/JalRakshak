// JalRakshak — Formatting and display utilities
// Core Brand: Jet Black (#050507), Deep Black (#0B0B10), Royal Amethyst (#8B5CF6), Electric Cyan (#00F5FF)
// Semantic Alerts: Red (#FF4D6D), Orange (#FF9F43), Yellow (#FFD166), Green (#35D07F)

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
    medium: '#FFD166',
    high: '#FF9F43',
    critical: '#FF4D6D',
  };
  return colors[sev];
}

export function getSeverityBg(sev: Severity): string {
  const classes: Record<Severity, string> = {
    low: 'bg-[#12121A] text-[#9CA3AF] border-[#2A2A3C]',
    medium: 'bg-[#FFD166]/10 text-[#FFD166] border-[#FFD166]/30',
    high: 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/35',
    critical: 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/45 shadow-[0_0_12px_rgba(255,77,109,0.25)]',
  };
  return classes[sev];
}

export function getRiskColor(risk: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#35D07F',
    moderate: '#FFD166',
    high: '#FF9F43',
    critical: '#FF4D6D',
  };
  return colors[risk];
}

export function getRiskBg(risk: RiskLevel): string {
  const classes: Record<RiskLevel, string> = {
    low: 'bg-[#35D07F]/10 text-[#35D07F] border-[#35D07F]/30',
    moderate: 'bg-[#FFD166]/10 text-[#FFD166] border-[#FFD166]/30',
    high: 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/35',
    critical: 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/45 shadow-[0_0_12px_rgba(255,77,109,0.25)]',
  };
  return classes[risk];
}

export function getVerificationBg(v: VerificationStatus): string {
  const classes: Record<VerificationStatus, string> = {
    unverified: 'bg-[#FFD166]/10 text-[#FFD166] border-[#FFD166]/30',
    verified: 'bg-[#35D07F]/15 text-[#35D07F] border-[#35D07F]/35',
    disputed: 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/35',
    resolved: 'bg-[#35D07F]/20 text-[#35D07F] border-[#35D07F]/45',
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
    under_verification: 'bg-[#FFD166]/15 text-[#FFD166] border-[#FFD166]/30',
    forwarded_for_review: 'bg-[#FF9F43]/15 text-[#FF9F43] border-[#FF9F43]/35',
    repair_reported: 'bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40',
    resolution_verified: 'bg-[#35D07F]/20 text-[#35D07F] border-[#35D07F]/40 shadow-[0_0_10px_rgba(53,208,127,0.2)]',
    outdated: 'bg-[#12121A] text-[#71717A] border-[#2A2A3C]',
  };
  return classes[status];
}

export function getCategoryMarkerColor(cat: HazardCategory): string {
  const colors: Record<HazardCategory, string> = {
    pothole: '#FF9F43',
    open_manhole: '#FF4D6D',
    waterlogging: '#00F5FF',
    damaged_road: '#FFD166',
    other: '#8B5CF6',
  };
  return colors[cat];
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
