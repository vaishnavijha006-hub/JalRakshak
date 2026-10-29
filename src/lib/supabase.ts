// JalRakshak — Typed Supabase Client & Backend Foundation
// Supports full-stack production Supabase connectivity with non-breaking graceful fallback to local demo store

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type BackendMode = 'demo' | 'connecting' | 'configured' | 'connected' | 'error';

/**
 * Safely retrieves an environment variable across Vite, browser, and test environments.
 */
export function getEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] as string | undefined;
  }
  const globalProc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
  return globalProc?.env?.[key];
}

/**
 * Checks if forced demo mode is activated via VITE_FORCE_LOCAL_DEMO.
 */
export function isForcedDemoMode(): boolean {
  const envVal = getEnv('VITE_FORCE_LOCAL_DEMO');
  return envVal === 'true' || (envVal as unknown) === true;
}

/**
 * Validates whether the provided Supabase URL is plausible and non-placeholder.
 */
export function isValidSupabaseUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (
    trimmed === '' ||
    trimmed.includes('your-project') ||
    trimmed.includes('your-project-id') ||
    trimmed.includes('example.com') ||
    trimmed.includes('placeholder')
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validates whether the provided Supabase anon key is plausible and non-placeholder.
 */
export function isValidSupabaseKey(key: string | undefined | null): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (
    trimmed === '' ||
    trimmed.length < 20 ||
    trimmed.toLowerCase().includes('your-') ||
    trimmed.toLowerCase().includes('placeholder') ||
    trimmed.toLowerCase().includes('anon-key')
  ) {
    return false;
  }
  return true;
}

/**
 * Checks whether valid Supabase configuration is present in environment variables
 * and not overridden by forced local demo mode.
 */
export function isSupabaseConfigured(
  customUrl?: string | null,
  customKey?: string | null,
  customForcedDemo?: boolean
): boolean {
  if (customForcedDemo ?? isForcedDemoMode()) return false;
  const url = customUrl !== undefined ? customUrl : getEnv('VITE_SUPABASE_URL');
  const key = customKey !== undefined ? customKey : getEnv('VITE_SUPABASE_ANON_KEY');
  return isValidSupabaseUrl(url) && isValidSupabaseKey(key);
}

/**
 * Returns the current baseline backend mode based on environment configuration.
 */
export function getBackendMode(
  customUrl?: string | null,
  customKey?: string | null,
  customForcedDemo?: boolean
): BackendMode {
  if (isSupabaseConfigured(customUrl, customKey, customForcedDemo)) {
    return 'configured';
  }
  return 'demo';
}

/**
 * Safely initialized Supabase typed client, or null if unconfigured or forced demo.
 */
function initSupabaseClient(): SupabaseClient | null {
  try {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const url = String(getEnv('VITE_SUPABASE_URL')).trim();
    const key = String(getEnv('VITE_SUPABASE_ANON_KEY')).trim();
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    return null;
  }
}

export const supabase: SupabaseClient | null = initSupabaseClient();

/**
 * Performs an active connectivity check against Supabase.
 * Returns 'connected' if the database answers, 'error' if connection failed,
 * or 'demo' if not configured.
 */
export async function testBackendConnection(): Promise<BackendMode> {
  if (!supabase) return 'demo';
  try {
    const { error } = await supabase.from('incidents').select('id').limit(1);
    if (error) {
      console.warn('Supabase ping check returned error:', error.message);
      return 'error';
    }
    return 'connected';
  } catch (err) {
    console.warn('Supabase ping check network error:', err);
    return 'error';
  }
}
