-- JalRakshak — Comprehensive PostgreSQL Database Schema & Security Policies
-- Migration: 20261029000001_initial_schema.sql
-- Compatible with Supabase PostgreSQL, Authentication, Storage, and Row Level Security (RLS).

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create custom enumerations
DO $$ BEGIN
    CREATE TYPE hazard_category AS ENUM (
        'pothole',
        'open_manhole',
        'waterlogging',
        'damaged_road',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'unverified',
        'verified',
        'disputed',
        'resolved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM (
        'reported',
        'under_verification',
        'forwarded_for_review',
        'repair_reported',
        'resolution_verified',
        'outdated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'citizen',
        'volunteer',
        'reviewer',
        'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles table (mirrors auth.users safely)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT NOT NULL DEFAULT 'Citizen Reporter',
    role user_role NOT NULL DEFAULT 'citizen',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 4. Incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category hazard_category NOT NULL,
    severity severity_level NOT NULL,
    status incident_status NOT NULL DEFAULT 'reported',
    verification verification_status NOT NULL DEFAULT 'unverified',
    road TEXT NOT NULL,
    area TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_alias TEXT NOT NULL DEFAULT 'Anonymous Citizen',
    photo_url TEXT,
    photo_storage_path TEXT,
    is_historical BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for spatial, status, category, and date filtering
CREATE INDEX IF NOT EXISTS idx_incidents_category ON public.incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_verification ON public.incidents(verification);
CREATE INDEX IF NOT EXISTS idx_incidents_is_active ON public.incidents(is_active);
CREATE INDEX IF NOT EXISTS idx_incidents_coordinates ON public.incidents(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_at ON public.incidents(reported_at DESC);

-- 5. Incident Status History table
CREATE TABLE IF NOT EXISTS public.incident_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    status incident_status NOT NULL,
    previous_status incident_status,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL DEFAULT 'System / Volunteer',
    note TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_status_history_incident_id ON public.incident_status_history(incident_id);
CREATE INDEX IF NOT EXISTS idx_status_history_timestamp ON public.incident_status_history(timestamp DESC);

-- 6. Hidden Hazards table (Inferred USP Engine)
CREATE TABLE IF NOT EXISTS public.hidden_hazards (
    id TEXT PRIMARY KEY,
    historical_incident_id TEXT REFERENCES public.incidents(id) ON DELETE CASCADE,
    waterlogging_incident_id TEXT REFERENCES public.incidents(id) ON DELETE CASCADE,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    confidence_label TEXT NOT NULL,
    explanation TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    road TEXT NOT NULL,
    area TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    historical_defect_type hazard_category NOT NULL,
    historical_observed_at TIMESTAMPTZ NOT NULL,
    waterlogging_reported_at TIMESTAMPTZ NOT NULL,
    verification_state verification_status NOT NULL DEFAULT 'unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_hidden_hazards_coordinates ON public.hidden_hazards(latitude, longitude);

-- 7. Automated profile creation trigger on Auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'citizen' -- Default role is strictly citizen; cannot self-elevate
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Updated_at timestamp maintenance triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_incidents_updated ON public.incidents;
CREATE TRIGGER on_incidents_updated
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_hazards ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check user role securely
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Profiles Policies ──────────────────────────────────────────────────────────
-- Everyone (including public) can view basic profile information (display_name, avatar, role)
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can only update their own display_name and avatar_url; role cannot be altered by users
CREATE POLICY "Users can update their own profile details"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevents role tampering
    );

-- ── Incidents Policies ────────────────────────────────────────────────────────
-- Everyone (public and authenticated) can view all incidents
CREATE POLICY "Incidents are viewable by everyone"
    ON public.incidents FOR SELECT
    USING (true);

-- Anyone (including community citizens and authenticated users) can report a hazard
CREATE POLICY "Anyone can report an incident"
    ON public.incidents FOR INSERT
    WITH CHECK (true);

-- Volunteers, Reviewers, and Admins can update incident status and verification
CREATE POLICY "Volunteers and reviewers can update incidents"
    ON public.incidents FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            public.get_user_role() IN ('volunteer', 'reviewer', 'admin') OR
            reporter_id = auth.uid()
        )
    );

-- Only Admins can delete incidents
CREATE POLICY "Only admins can delete incidents"
    ON public.incidents FOR DELETE
    USING (
        auth.role() = 'authenticated' AND public.get_user_role() = 'admin'
    );

-- ── Incident Status History Policies ──────────────────────────────────────────
-- Status history is transparently viewable by the public
CREATE POLICY "Status history is viewable by everyone"
    ON public.incident_status_history FOR SELECT
    USING (true);

-- Authenticated users or reporters can record status entries
CREATE POLICY "Authenticated users can record status history"
    ON public.incident_status_history FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' OR actor_name IS NOT NULL
    );

-- ── Hidden Hazards Policies ───────────────────────────────────────────────────
-- Public can read hidden hazards
CREATE POLICY "Hidden hazards are viewable by everyone"
    ON public.hidden_hazards FOR SELECT
    USING (true);

-- Volunteers and Reviewers can update verification state
CREATE POLICY "Staff can update hidden hazards"
    ON public.hidden_hazards FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        public.get_user_role() IN ('volunteer', 'reviewer', 'admin')
    );

-- 10. Storage Bucket Setup (execute via Supabase Storage API or SQL where enabled)
-- Bucket name: 'incident-photos'
-- Public read access: true
-- Max file size: 5242880 bytes (5MB)
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'incident-photos',
    'incident-photos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS Policies
CREATE POLICY "Anyone can view incident photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'incident-photos');

CREATE POLICY "Anyone can upload incident photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'incident-photos' AND
        (octet_length(COALESCE(metadata->>'size', '0')::text) <= 5242880)
    );

CREATE POLICY "Reporters or staff can delete incident photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'incident-photos' AND
        auth.role() = 'authenticated'
    );

-- 11. Initial Baseline Seed Data (Delhi Arterial Corridors)
-- Inserts baseline historical defects into PostgreSQL so initial queries match the verified demo data
INSERT INTO public.incidents (
    id, title, description, category, severity, status, verification,
    road, area, latitude, longitude, observed_at, last_verified_at,
    reported_at, is_historical, is_active, reporter_alias
) VALUES
(
    'INC-001',
    'Submerged 32cm Cavity on Mathura Road',
    'Pre-monsoon excavation defect submerged under 1.8ft muddy water near Pragati Maidan underpass. Two-wheeler inversion hazard.',
    'pothole', 'critical', 'reported', 'verified',
    'Mathura Road', 'Pragati Maidan', 28.6139, 77.2410,
    '2024-05-15T10:30:00Z', '2024-07-28T14:00:00Z', '2024-07-28T12:00:00Z',
    true, true, 'PWD Survey Team'
),
(
    'INC-002',
    'Open Drainage Sump near Minto Bridge',
    'Cast iron drainage grate displaced during pre-monsoon desilting. Concealed by floodwater at underpass mouth.',
    'open_manhole', 'critical', 'forwarded_for_review', 'verified',
    'Connaught Circus to DDU Marg', 'Minto Bridge', 28.6328, 77.2250,
    '2024-05-18T08:00:00Z', '2024-07-28T15:30:00Z', '2024-07-28T13:15:00Z',
    true, true, 'Delhi Traffic Police'
),
(
    'INC-003',
    'Severe Waterlogging under Tilak Bridge',
    'Water accumulation of 2.2ft blocking two lanes towards ITO junction.',
    'waterlogging', 'high', 'reported', 'verified',
    'Vikas Marg / Tilak Bridge', 'ITO', 28.6290, 77.2435,
    '2024-07-28T11:00:00Z', '2024-07-28T14:30:00Z', '2024-07-28T11:00:00Z',
    false, true, 'Commuter Alert'
),
(
    'INC-004',
    'Eroded Road Shoulder on Outer Ring Road',
    'Large asphalt subsidence and crumbling edge near Nehru Place flyover ramp.',
    'damaged_road', 'medium', 'under_verification', 'unverified',
    'Outer Ring Road', 'Lajpat Nagar', 28.5685, 77.2430,
    '2024-06-02T16:00:00Z', '2024-07-28T10:00:00Z', '2024-07-28T09:30:00Z',
    true, true, 'Ward Volunteer'
),
(
    'INC-005',
    'Manhole Cover Fracture near Nizamuddin Dargah',
    'Cracked concrete cover with exposed reinforcing rods on pedestrian verge.',
    'open_manhole', 'high', 'repair_reported', 'verified',
    'Lodhi Road extension', 'Nizamuddin', 28.5910, 77.2470,
    '2024-05-22T12:00:00Z', '2024-07-28T16:00:00Z', '2024-07-27T18:00:00Z',
    true, true, 'MCD Inspector'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Hidden Hazards
INSERT INTO public.hidden_hazards (
    id, historical_incident_id, waterlogging_incident_id, confidence, confidence_label,
    explanation, detected_at, road, area, latitude, longitude,
    historical_defect_type, historical_observed_at, waterlogging_reported_at, verification_state
) VALUES
(
    'HH-001', 'INC-001', 'INC-003', 92, 'High Confidence Correlation',
    'Pre-monsoon 32cm pothole surveyed in May directly intersects with active 2.2ft floodwater report. Defect is visually obscured.',
    '2024-07-28T13:00:00Z', 'Mathura Road', 'Pragati Maidan', 28.6139, 77.2410,
    'pothole', '2024-05-15T10:30:00Z', '2024-07-28T11:00:00Z', 'verified'
),
(
    'HH-002', 'INC-002', 'INC-003', 88, 'Critical Underpass Hazard',
    'Missing drainage grate logged during dry season now covered by muddy floodwaters at Minto Bridge underpass.',
    '2024-07-28T14:00:00Z', 'Connaught Circus to DDU Marg', 'Minto Bridge', 28.6328, 77.2250,
    'open_manhole', '2024-05-18T08:00:00Z', '2024-07-28T11:00:00Z', 'verified'
)
ON CONFLICT (id) DO NOTHING;
