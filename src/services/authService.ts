// JalRakshak — Authentication Service
// Wraps Supabase Auth with typed profile retrieval and safe demo fallbacks

import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types/database.types';

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
}

/**
 * Fetches user profile from public.profiles
 */
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id, email, display_name, role, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Failed to fetch user profile:', error.message);
      return null;
    }
    if (!data) return null;

    const row = data as any;
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role as UserRole,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
    };
  } catch (err) {
    console.warn('Network error fetching profile:', err);
    return null;
  }
}

/**
 * Signs up a new citizen user with email, password, and optional display name.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; error: string | null }> {
  if (!supabase) {
    return { user: null, error: 'Supabase is not configured. Application is in local demo mode.' };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'An unexpected error occurred during sign up.' };
  }
}

/**
 * Signs in an existing user with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ session: Session | null; user: User | null; error: string | null }> {
  if (!supabase) {
    return { session: null, user: null, error: 'Supabase is not configured. Application is in local demo mode.' };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { session: null, user: null, error: error.message };
    }
    return { session: data.session, user: data.user, error: null };
  } catch (err: any) {
    return { session: null, user: null, error: err?.message || 'An unexpected error occurred during sign in.' };
  }
}

/**
 * Signs out the current authenticated user.
 */
export async function signOutUser(): Promise<{ error: string | null }> {
  if (!supabase) return { error: null };
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Sign out failed.' };
  }
}

/**
 * Subscribes to Supabase Auth state changes.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void } {
  if (!supabase) {
    return { unsubscribe: () => {} };
  }
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return {
    unsubscribe: () => {
      data.subscription.unsubscribe();
    },
  };
}

/**
 * Returns current session if Supabase is initialized.
 */
export async function getInitialSession(): Promise<{ session: Session | null; user: User | null }> {
  if (!supabase) return { session: null, user: null };
  try {
    const { data } = await supabase.auth.getSession();
    return { session: data.session, user: data.session?.user ?? null };
  } catch {
    return { session: null, user: null };
  }
}
