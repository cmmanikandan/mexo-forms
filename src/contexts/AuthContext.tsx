import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { MexoProfile } from '../types/forms';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: MexoProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<MexoProfile>) => Promise<MexoProfile | null>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MexoProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!session?.user?.id;

  useEffect(() => {
    let mounted = true;

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

    const handleSession = async (currentSession: Session | null) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user?.id) {
        try {
          const p = await resolveProfile(currentSession.user);
          if (mounted) {
            setProfile(p);
            try {
              localStorage.setItem('mexo_auth_profile', JSON.stringify(p));
            } catch (e) {
              /* ignore */
            }
          }
        } catch (e) {
          console.error('[AUTH] Profile fetch error:', e);
          if (mounted) setProfile(null);
        }
      } else {
        if (mounted) {
          setProfile(null);
          try {
            localStorage.removeItem('mexo_auth_profile');
          } catch (e) {
            /* ignore */
          }
        }
      }
    };

    const initialize = async () => {
      try {
        const { data: { session: initSession }, error } = await supabase.auth.getSession();
        if (error) console.error('[AUTH] getSession error:', error);
        await handleSession(initSession);
      } catch (e) {
        console.error('[AUTH] Auth init error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;
      await handleSession(currentSession);
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    const { session: newSession, user: userProfile, error } = await authService.signIn(emailOrUsername, password);
    if (newSession?.user) {
      setSession(newSession);
      setUser(newSession.user);
      if (userProfile) {
        setProfile(userProfile);
        try {
          localStorage.setItem('mexo_auth_profile', JSON.stringify(userProfile));
        } catch (e) {
          /* ignore */
        }
      }
      return { success: true };
    }
    return { success: false, error: error || 'Sign in failed' };
  };

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    try {
      localStorage.removeItem('mexo_auth_profile');
    } catch (e) {
      /* ignore */
    }
  };

  const updateProfile = async (updates: Partial<MexoProfile>): Promise<MexoProfile | null> => {
    if (!session?.user?.id) return null;
    const updated = await profileService.updateUserProfile(session.user.id, updates);
    if (updated) {
      setProfile(updated);
      try {
        localStorage.setItem('mexo_auth_profile', JSON.stringify(updated));
      } catch (e) {
        /* ignore */
      }
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
        isAuthenticated,
        isLoading,
        authLoading: isLoading,
        signIn,
        signOut,
        updateProfile,
        updatePassword,
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

