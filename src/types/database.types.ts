// JalRakshak — Supabase Database Type Definitions
// Generated and aligned with migration 20261029000001_initial_schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type HazardCategory = 'pothole' | 'open_manhole' | 'waterlogging' | 'damaged_road' | 'other';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type VerificationStatus = 'unverified' | 'verified' | 'disputed' | 'resolved';
export type IncidentStatus =
  | 'reported'
  | 'under_verification'
  | 'forwarded_for_review'
  | 'repair_reported'
  | 'resolution_verified'
  | 'outdated';
export type UserRole = 'citizen' | 'volunteer' | 'reviewer' | 'admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      incidents: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: HazardCategory;
          severity: SeverityLevel;
          status: IncidentStatus;
          verification: VerificationStatus;
          road: string;
          area: string;
          latitude: number;
          longitude: number;
          observed_at: string;
          last_verified_at: string;
          reported_at: string;
          reporter_id: string | null;
          reporter_alias: string;
          photo_url: string | null;
          photo_storage_path: string | null;
          is_historical: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description: string;
          category: HazardCategory;
          severity: SeverityLevel;
          status?: IncidentStatus;
          verification?: VerificationStatus;
          road: string;
          area: string;
          latitude: number;
          longitude: number;
          observed_at?: string;
          last_verified_at?: string;
          reported_at?: string;
          reporter_id?: string | null;
          reporter_alias?: string;
          photo_url?: string | null;
          photo_storage_path?: string | null;
          is_historical?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: HazardCategory;
          severity?: SeverityLevel;
          status?: IncidentStatus;
          verification?: VerificationStatus;
          road?: string;
          area?: string;
          latitude?: number;
          longitude?: number;
          observed_at?: string;
          last_verified_at?: string;
          reported_at?: string;
          reporter_id?: string | null;
          reporter_alias?: string;
          photo_url?: string | null;
          photo_storage_path?: string | null;
          is_historical?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      incident_status_history: {
        Row: {
          id: string;
          incident_id: string;
          status: IncidentStatus;
          previous_status: IncidentStatus | null;
          actor_id: string | null;
          actor_name: string;
          note: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          status: IncidentStatus;
          previous_status?: IncidentStatus | null;
          actor_id?: string | null;
          actor_name: string;
          note?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          status?: IncidentStatus;
          previous_status?: IncidentStatus | null;
          actor_id?: string | null;
          actor_name?: string;
          note?: string | null;
          timestamp?: string;
        };
      };
      hidden_hazards: {
        Row: {
          id: string;
          historical_incident_id: string | null;
          waterlogging_incident_id: string | null;
          confidence: number;
          confidence_label: string;
          explanation: string;
          detected_at: string;
          road: string;
          area: string;
          latitude: number;
          longitude: number;
          historical_defect_type: HazardCategory;
          historical_observed_at: string;
          waterlogging_reported_at: string;
          verification_state: VerificationStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          historical_incident_id?: string | null;
          waterlogging_incident_id?: string | null;
          confidence: number;
          confidence_label: string;
          explanation: string;
          detected_at?: string;
          road: string;
          area: string;
          latitude: number;
          longitude: number;
          historical_defect_type: HazardCategory;
          historical_observed_at: string;
          waterlogging_reported_at: string;
          verification_state?: VerificationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          historical_incident_id?: string | null;
          waterlogging_incident_id?: string | null;
          confidence?: number;
          confidence_label?: string;
          explanation?: string;
          detected_at?: string;
          road?: string;
          area?: string;
          latitude?: number;
          longitude?: number;
          historical_defect_type?: HazardCategory;
          historical_observed_at?: string;
          waterlogging_reported_at?: string;
          verification_state?: VerificationStatus;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      hazard_category: HazardCategory;
      severity_level: SeverityLevel;
      verification_status: VerificationStatus;
      incident_status: IncidentStatus;
      user_role: UserRole;
    };
  };
}
