import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { MexoProfile } from '../types/forms';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: MexoProfile | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<MexoProfile>) => Promise<MexoProfile | null>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  recheckAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MexoProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  const isAuthenticated = authStatus === 'authenticated';
  const isLoading = authStatus === 'loading';

  const resolveProfile = async (sessionUser: User): Promise<MexoProfile> => {
    const dbProfile = await profileService.getProfileById(sessionUser.id);
    if (dbProfile) return dbProfile;

    const email = sessionUser.email || '';
    const username = email.includes('@') ? email.split('@')[0] : email || 'user';
    const nameParts = ((sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || username) as string).split(' ');
    return {
      id: sessionUser.id,
      username,
      primary_address: email,
      first_name: nameParts[0] || username,
      last_name: nameParts.slice(1).join(' ') || '',
      avatar_url: sessionUser.user_metadata?.avatar_url,
      role: 'user',
      status: 'active',
      created_at: sessionUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleSession = useCallback(async (currentSession: Session | null) => {
    if (currentSession?.user?.id) {
      setSession(currentSession);
      setUser(currentSession.user);
      try {
        const p = await resolveProfile(currentSession.user);
        setProfile(p);
        setAuthStatus('authenticated');
        try {
          localStorage.setItem('mexo_auth_profile', JSON.stringify(p));
          localStorage.setItem('mexo_auth_session', JSON.stringify(currentSession));
        } catch (e) {}
      } catch (e) {
        console.error('[AUTH] Profile fetch error:', e);
        setProfile(null);
        setAuthStatus('authenticated'); // Session is valid even if DB profile lookup has issue
      }
    } else {
      // Check saved fallback session in localStorage
      try {
        const savedSessionStr = localStorage.getItem('mexo_auth_session');
        const savedProfileStr = localStorage.getItem('mexo_auth_profile');

        if (savedSessionStr && savedProfileStr) {
          const savedSession = JSON.parse(savedSessionStr);
          const savedProfile = JSON.parse(savedProfileStr);
          if (savedSession?.user?.id && savedProfile?.id) {
            setSession(savedSession);
            setUser(savedSession.user);
            setProfile(savedProfile);
            setAuthStatus('authenticated');
            return;
          }
        }
      } catch (e) {}

      setSession(null);
      setUser(null);
      setProfile(null);
      setAuthStatus('unauthenticated');
      try {
        localStorage.removeItem('mexo_auth_profile');
        localStorage.removeItem('mexo_auth_session');
      } catch (e) {}
    }
  }, []);

  const recheckAuth = useCallback(async (): Promise<boolean> => {
    try {
      const activeSession = await authService.getSession();
      await handleSession(activeSession);
      return !!activeSession?.user?.id;
    } catch (e) {
      return false;
    }
  }, [handleSession]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const initSession = await authService.getSession();
        if (mounted) {
          await handleSession(initSession);
        }
      } catch (e) {
        console.error('[AUTH] Init error:', e);
        if (mounted) setAuthStatus('unauthenticated');
      }
    };

    initialize();

    // Single global Supabase Auth Listener
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event) || currentSession) {
        await handleSession(currentSession);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setAuthStatus('unauthenticated');
        try {
          localStorage.removeItem('mexo_auth_profile');
          localStorage.removeItem('mexo_auth_session');
        } catch (e) {}
      }
    });

    // Cross-tab and window focus re-check
    const handleFocus = () => {
      if (mounted) {
        recheckAuth();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [handleSession, recheckAuth]);

  const signIn = async (emailOrUsername: string, password: string) => {
    const { session: newSession, user: userProfile, error } = await authService.signIn(emailOrUsername, password);
    if (newSession?.user) {
      setSession(newSession);
      setUser(newSession.user);
      if (userProfile) {
        setProfile(userProfile);
      }
      setAuthStatus('authenticated');
      try {
        localStorage.setItem('mexo_auth_profile', JSON.stringify(userProfile));
        localStorage.setItem('mexo_auth_session', JSON.stringify(newSession));
      } catch (e) {}
      return { success: true };
    }
    return { success: false, error: error || 'Sign in failed' };
  };

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setAuthStatus('unauthenticated');
    try {
      localStorage.removeItem('mexo_auth_profile');
      localStorage.removeItem('mexo_auth_session');
    } catch (e) {}
  };

  const updateProfile = async (updates: Partial<MexoProfile>): Promise<MexoProfile | null> => {
    const activeUserId = user?.id || session?.user?.id || profile?.id;
    if (!activeUserId) return null;

    const updated = await profileService.updateUserProfile(activeUserId, updates);
    if (updated) {
      setProfile(updated);
      try {
        localStorage.setItem('mexo_auth_profile', JSON.stringify(updated));
      } catch (e) {}
    }
    return updated;
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    return await profileService.updateUserPassword(newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        authStatus,
        isAuthenticated,
        isLoading,
        authLoading: isLoading,
        signIn,
        signOut,
        updateProfile,
        updatePassword,
        recheckAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
