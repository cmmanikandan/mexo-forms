import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MexoProfile } from '../types/forms';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';

interface AuthContextType {
  profile: MexoProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<MexoProfile | null>(() => {
    try {
      const stored = localStorage.getItem('mexo_auth_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('mexo_auth_profile');
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user && mounted) {
          const p = await profileService.getProfileById(session.user.id);
          if (p && mounted) {
            setProfile(p);
            setIsAuthenticated(true);
            try {
              localStorage.setItem('mexo_auth_profile', JSON.stringify(p));
            } catch (e) {
              /* ignore storage errors */
            }
          }
        } else if (mounted) {
          // Check local storage backup if no active Supabase session
          const stored = localStorage.getItem('mexo_auth_profile');
          if (stored) {
            try {
              const p = JSON.parse(stored);
              setProfile(p);
              setIsAuthenticated(true);
            } catch {
              localStorage.removeItem('mexo_auth_profile');
            }
          }
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();

    const { data: listener } = authService.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsAuthenticated(false);
        try {
          localStorage.removeItem('mexo_auth_profile');
        } catch (e) {
          /* ignore */
        }
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const p = await profileService.getProfileById(session.user.id);
        if (p && mounted) {
          setProfile(p);
          setIsAuthenticated(true);
          try {
            localStorage.setItem('mexo_auth_profile', JSON.stringify(p));
          } catch (e) {
            /* ignore */
          }
        }
      }
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    setIsLoading(true);
    const { user, error } = await authService.signIn(emailOrUsername, password);
    if (user) {
      setProfile(user);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('mexo_auth_profile', JSON.stringify(user));
      } catch (e) {
        /* ignore */
      }
      setIsLoading(false);
      return { success: true };
    }
    setIsLoading(false);
    return { success: false, error: error || 'Sign in failed' };
  };

  const signOut = async () => {
    await authService.signOut();
    setProfile(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('mexo_auth_profile');
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider value={{ profile, isAuthenticated, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
