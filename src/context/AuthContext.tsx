/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../services/authService';
import {
  fetchProfile,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  getInitialSession,
  onAuthStateChange,
} from '../services/authService';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(() => isConfigured);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    let isMounted = true;

    // Load initial session
    getInitialSession().then(async ({ session: initialSession, user: initialUser }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialUser);

      if (initialUser) {
        await loadProfile(initialUser.id);
      }
      if (isMounted) {
        setLoading(false);
      }
    });

    // Listen to auth state changes
    const { unsubscribe } = onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isConfigured, loadProfile]);

  const signIn = async (email: string, password: string) => {
    const res = await signInWithEmail(email, password);
    if (!res.error && res.user) {
      setUser(res.user);
      setSession(res.session);
      await loadProfile(res.user.id);
    }
    return { error: res.error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const res = await signUpWithEmail(email, password, displayName);
    if (!res.error && res.user) {
      setUser(res.user);
      await loadProfile(res.user.id);
    }
    return { error: res.error };
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
