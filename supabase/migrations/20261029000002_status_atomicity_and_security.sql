-- JalRakshak — Status Atomicity & Security Hardening
-- Migration: 20261029000002_status_atomicity_and_security.sql
-- Hardens SECURITY DEFINER search paths, implements atomic status transitions via RPC,
-- and adds server-side lifecycle validation.

-- 1. Hardened get_user_role with explicit search_path
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Hardened handle_new_user with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'citizen' -- Strictly citizen by default; prevents self-elevation
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Atomic Incident Status & History Transition RPC
-- Executes both incident update and status_history insert within a single database transaction.
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
BEGIN
    -- 1. Identify and authenticate caller
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: Anonymous callers cannot transition incident status';
    END IF;

    -- Retrieve the current incident record
    SELECT * INTO v_current_incident
    FROM public.incidents
    WHERE id = p_incident_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Incident with ID % not found', p_incident_id;
    END IF;

    -- 2. Authorization validation
    SELECT role, display_name INTO v_user_role, v_actor_name
    FROM public.profiles
    WHERE id = v_user_id;

    -- Staff (volunteer, reviewer, admin) or original reporter may transition
    IF (v_user_role NOT IN ('volunteer', 'reviewer', 'admin')) AND
       (v_current_incident.reporter_id IS DISTINCT FROM v_user_id) THEN
        RAISE EXCEPTION 'Unauthorized: User does not have permission to transition incident status';
    END IF;

    -- 3. No-op if status is unchanged
    IF v_current_incident.status = p_new_status THEN
        RETURN jsonb_build_object(
            'success', true,
            'incident_id', p_incident_id,
            'status', p_new_status,
            'message', 'Status already at requested state'
        );
    END IF;

    -- 4. Determine deactivation state
    v_is_deactivated := (p_new_status = 'resolution_verified' OR p_new_status = 'outdated');

    -- 5. Perform atomic update on incidents table
    UPDATE public.incidents
    SET
        status = p_new_status,
        is_active = NOT v_is_deactivated,
        last_verified_at = v_now,
        updated_at = v_now
    WHERE id = p_incident_id;

    -- 6. Insert audit trail into incident_status_history
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
        COALESCE(v_actor_name, 'Verified Reviewer'),
        p_note,
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'incident_id', p_incident_id,
        'previous_status', v_current_incident.status,
        'new_status', p_new_status,
        'actor_name', COALESCE(v_actor_name, 'Verified Reviewer'),
        'timestamp', v_now
    );
END;
$$;

-- Grant execution strictly to authenticated users; revoke from anonymous public
REVOKE EXECUTE ON FUNCTION public.update_incident_status_atomic(TEXT, incident_status, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.update_incident_status_atomic(TEXT, incident_status, TEXT) TO authenticated;
