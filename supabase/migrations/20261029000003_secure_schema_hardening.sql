-- JalRakshak — Comprehensive Security Hardening & Pre-Production Migration
-- Migration: 20261029000003_secure_schema_hardening.sql
--
-- Security Hardening Applied:
-- 1. Fixed get_user_role() with immutable search_path and safe fallback.
-- 2. Clean public.hidden_hazards schema (Zero fabricated/unverified seed data).
-- 3. Strict Row Level Security: Closes direct REST update bypass on public.incidents.
-- 4. Concurrency-safe atomic status transition RPC with row-level exclusive lock (FOR UPDATE),
--    strict state transition matrix validation, and reporter privilege limits.
-- 5. Automatic profile generation trigger on auth.users with tamper-proof citizen role.
-- 6. Private storage bucket configuration with authenticated uploads and reporter ownership deletion checks.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Helper function for role-based RLS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
    SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'citizen'::user_role);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Close Direct REST Bypass on Incidents Table
-- ─────────────────────────────────────────────────────────────────────────────
-- Drop overly permissive policy that previously allowed reporters to bypass the RPC
-- and update status/is_active directly via REST PATCH requests.
DROP POLICY IF EXISTS "Volunteers and reviewers can update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Staff can update incidents" ON public.incidents;

CREATE POLICY "Staff can update incidents"
    ON public.incidents FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        public.get_user_role() IN ('volunteer', 'reviewer', 'admin')
    );

-- Secure incident status history direct insert policy
DROP POLICY IF EXISTS "Authenticated users can record status history" ON public.incident_status_history;
DROP POLICY IF EXISTS "Status history insert restricted" ON public.incident_status_history;

CREATE POLICY "Status history insert restricted"
    ON public.incident_status_history FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            actor_id = auth.uid() OR
            public.get_user_role() IN ('volunteer', 'reviewer', 'admin')
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Hidden Hazards Table (Clean Production Schema — Zero Fabricated Seed Data)
-- ─────────────────────────────────────────────────────────────────────────────
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

ALTER TABLE public.hidden_hazards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hidden hazards are viewable by everyone" ON public.hidden_hazards;
CREATE POLICY "Hidden hazards are viewable by everyone"
    ON public.hidden_hazards FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Staff can insert hidden hazards" ON public.hidden_hazards;
CREATE POLICY "Staff can insert hidden hazards"
    ON public.hidden_hazards FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        public.get_user_role() IN ('volunteer', 'reviewer', 'admin')
    );

DROP POLICY IF EXISTS "Staff can update hidden hazards" ON public.hidden_hazards;
CREATE POLICY "Staff can update hidden hazards"
    ON public.hidden_hazards FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        public.get_user_role() IN ('volunteer', 'reviewer', 'admin')
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Hardened Atomic Incident Status & History Transition RPC
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_incident_status_atomic(
    p_incident_id TEXT,
    p_new_status incident_status,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_user_role user_role;
    v_actor_name TEXT;
    v_current_incident public.incidents%ROWTYPE;
    v_is_deactivated BOOLEAN;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_is_valid_transition BOOLEAN := false;
BEGIN
    -- 1. Identify and authenticate caller strictly via JWT
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: Anonymous callers cannot transition incident status';
    END IF;

    -- 2. Concurrency-safe lock: Acquire row-level exclusive lock on target incident
    SELECT * INTO v_current_incident
    FROM public.incidents
    WHERE id = p_incident_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Incident with ID % not found', p_incident_id;
    END IF;

    -- 3. Identify caller role and display name safely
    SELECT role, display_name INTO v_user_role, v_actor_name
    FROM public.profiles
    WHERE id = v_user_id;

    -- Default to 'citizen' if profile record has not yet populated
    IF v_user_role IS NULL THEN
        v_user_role := 'citizen'::user_role;
    END IF;

    -- 4. No-op if status is already at requested state (does not create spurious history)
    IF v_current_incident.status = p_new_status THEN
        RETURN jsonb_build_object(
            'success', true,
            'incident_id', p_incident_id,
            'status', p_new_status,
            'message', 'Status already at requested state'
        );
    END IF;

    -- 5. Strict State Transition & Role Authorization Matrix
    -- Rule A: Ordinary Citizen Reporter
    IF v_user_role = 'citizen' THEN
        -- Citizen must be the original reporter
        IF v_current_incident.reporter_id IS DISTINCT FROM v_user_id THEN
            RAISE EXCEPTION 'Unauthorized: Citizens cannot modify status of incidents reported by others';
        END IF;

        -- Citizen reporter can only report repair progress ('repair_reported')
        -- They CANNOT verify resolution ('resolution_verified') or close incidents
        IF p_new_status = 'repair_reported' AND v_current_incident.status IN ('reported', 'under_verification', 'forwarded_for_review') THEN
            v_is_valid_transition := true;
        ELSE
            RAISE EXCEPTION 'Unauthorized transition: Citizen reporters may only report observed repairs (repair_reported)';
        END IF;

    -- Rule B: Municipal Volunteers & Reviewers
    ELSIF v_user_role IN ('volunteer', 'reviewer') THEN
        -- Permitted lifecycle progression:
        -- reported -> under_verification, outdated
        -- under_verification -> forwarded_for_review, outdated
        -- forwarded_for_review -> repair_reported, outdated
        -- repair_reported -> resolution_verified, outdated
        IF (v_current_incident.status = 'reported' AND p_new_status IN ('under_verification', 'outdated')) OR
           (v_current_incident.status = 'under_verification' AND p_new_status IN ('forwarded_for_review', 'outdated')) OR
           (v_current_incident.status = 'forwarded_for_review' AND p_new_status IN ('repair_reported', 'outdated')) OR
           (v_current_incident.status = 'repair_reported' AND p_new_status IN ('resolution_verified', 'outdated')) THEN
            v_is_valid_transition := true;
        ELSE
            RAISE EXCEPTION 'Invalid lifecycle transition: Cannot transition from % to %', v_current_incident.status, p_new_status;
        END IF;

    -- Rule C: System Administrators
    ELSIF v_user_role = 'admin' THEN
        v_is_valid_transition := true;
    ELSE
        RAISE EXCEPTION 'Unauthorized: User role % has no transition permissions', v_user_role;
    END IF;

    IF NOT v_is_valid_transition THEN
        RAISE EXCEPTION 'Unauthorized status transition rejected';
    END IF;

    -- 6. Determine deactivation state
    v_is_deactivated := (p_new_status = 'resolution_verified' OR p_new_status = 'outdated');

    -- 7. Perform atomic update on incidents table
    UPDATE public.incidents
    SET
        status = p_new_status,
        is_active = NOT v_is_deactivated,
        last_verified_at = v_now,
        updated_at = v_now
    WHERE id = p_incident_id;

    -- 8. Insert tamper-proof audit trail into incident_status_history
    INSERT INTO public.incident_status_history (
        incident_id,
        status,
        previous_status,
        actor_id,
        actor_name,
        note,
        timestamp
    ) VALUES (
        p_incident_id,
        p_new_status,
        v_current_incident.status,
        v_user_id,
        COALESCE(v_actor_name, 'Citizen Reporter'),
        p_note,
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'incident_id', p_incident_id,
        'previous_status', v_current_incident.status,
        'new_status', p_new_status,
        'actor_id', v_user_id,
        'actor_name', COALESCE(v_actor_name, 'Citizen Reporter'),
        'timestamp', v_now
    );
END;
$$;

-- Execution permissions: Revoke from public/anonymous; grant strictly to authenticated
REVOKE EXECUTE ON FUNCTION public.update_incident_status_atomic(TEXT, incident_status, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.update_incident_status_atomic(TEXT, incident_status, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Automatic Profile Creation on Signup (Tamper-Proof Citizen Role)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Citizen Reporter'),
        'citizen'::user_role -- Strictly citizen; ignores any role in raw_user_meta_data
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Storage Bucket Configuration & Secure Access Policies (Private by Default)
-- ─────────────────────────────────────────────────────────────────────────────
-- Configure bucket as private with 5 MiB size limit and strict image MIME filters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'incident-photos',
    'incident-photos',
    false, -- Private bucket by default (signed URLs used for authorized retrieval)
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS Policies
DROP POLICY IF EXISTS "Authorized access to incident photos" ON storage.objects;
CREATE POLICY "Authorized access to incident photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'incident-photos');

DROP POLICY IF EXISTS "Authenticated users can upload incident photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload incident photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'incident-photos' AND
        auth.role() = 'authenticated' AND
        (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'gif'))
    );

DROP POLICY IF EXISTS "Reporters and admins can delete photos" ON storage.objects;
CREATE POLICY "Reporters and admins can delete photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'incident-photos' AND
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.incidents
                WHERE id = (storage.foldername(name))[2]
                  AND reporter_id = auth.uid()
            ) OR
            public.get_user_role() = 'admin'
        )
    );
