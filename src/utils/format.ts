// JalRakshak — Formatting and display utilities

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
    low: '#10B981',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
  };
  return colors[sev];
}

export function getSeverityBg(sev: Severity): string {
  const colors: Record<Severity, string> = {
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[sev];
}

export function getRiskColor(risk: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#10B981',
    moderate: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
  };
  return colors[risk];
}

export function getRiskBg(risk: RiskLevel): string {
  const classes: Record<RiskLevel, string> = {
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    moderate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return classes[risk];
}

export function getVerificationBg(v: VerificationStatus): string {
  const classes: Record<VerificationStatus, string> = {
    unverified: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    verified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    disputed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    resolved: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
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
    reported: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    under_verification: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    forwarded_for_review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    repair_reported: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    resolution_verified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    outdated: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return classes[status];
}

export function getCategoryMarkerColor(cat: HazardCategory): string {
  const colors: Record<HazardCategory, string> = {
    pothole: '#F97316',
    open_manhole: '#EF4444',
    waterlogging: '#06B6D4',
    damaged_road: '#F59E0B',
    other: '#8B5CF6',
  };
  return colors[cat];
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
