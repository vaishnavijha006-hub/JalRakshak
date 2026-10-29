// JalRakshak — Core Type Definitions

export type HazardCategory = 'pothole' | 'open_manhole' | 'waterlogging' | 'damaged_road' | 'other';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type VerificationStatus = 'unverified' | 'verified' | 'disputed' | 'resolved';
export type IncidentStatus =
  | 'reported'
  | 'under_verification'
  | 'forwarded_for_review'
  | 'repair_reported'
  | 'resolution_verified'
  | 'outdated';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type ReportSource = 'community' | 'survey' | 'automated' | 'demo';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  category: HazardCategory;
  severity: Severity;
  title: string;
  description: string;
  location: {
    road: string;
    area: string;
    coordinates: Coordinates;
  };
  observedAt: string;        // ISO timestamp of first observation
  lastVerifiedAt: string;    // ISO timestamp of latest verification
  reportedAt: string;        // ISO timestamp of report submission
  status: IncidentStatus;
  verification: VerificationStatus;
  source: ReportSource;
  isHistorical: boolean;     // Pre-monsoon observation
  isActive: boolean;         // Currently relevant
  reporterAlias?: string;
  /** Filename of the originally selected photo (display only) */
  photoPlaceholder?: boolean;
  /**
   * A data-URL (base64) of the user-selected photo, stored in localStorage.
   * Only present when a photo was successfully read from the File input.
   * Intentionally optional — not every incident carries a photo.
   *
   * Persistence note: this URL lives in localStorage alongside the incident.
   * localStorage is cleared on hard browser data wipe; no server backup exists.
   */
  photoDataUrl?: string;
  statusHistory: StatusEntry[];
}

export interface StatusEntry {
  status: IncidentStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface HiddenHazard {
  id: string;
  historicalIncidentId: string;
  waterloggingIncidentId: string;
  confidence: number;         // 0-100
  confidenceLabel: string;
  explanation: string;
  detectedAt: string;
  location: {
    road: string;
    area: string;
    coordinates: Coordinates;
  };
  historicalDefectType: HazardCategory;
  historicalObservedAt: string;
  waterloggingReportedAt: string;
  verificationState: VerificationStatus;
}

export interface RouteOption {
  id: string;
  name: string;
  description: string;
  waypoints: Coordinates[];
  distanceKm: number;
  estimatedMinutes: number;
  riskScore: number;          // 0-100
  riskLevel: RiskLevel;
  waterloggingCount: number;
  hiddenHazardCount: number;
  hazardDetails: string[];
  riskExplanation: string;
  recommended: boolean;
}

export interface RoutePlan {
  id: string;
  origin: string;
  destination: string;
  originCoords: Coordinates;
  destCoords: Coordinates;
  routes: RouteOption[];
  generatedAt: string;
}

export interface MetricSummary {
  totalHazards: number;
  activeWaterlogging: number;
  hiddenHazards: number;
  pendingVerification: number;
  resolvedThisWeek: number;
  criticalAlerts: number;
}

export interface FilterState {
  categories: HazardCategory[];
  riskLevels: RiskLevel[];
  verificationStatuses: VerificationStatus[];
  incidentStatuses: IncidentStatus[];
  searchQuery: string;
  showHistorical: boolean;
  showActive: boolean;
  showResolved: boolean;
}
