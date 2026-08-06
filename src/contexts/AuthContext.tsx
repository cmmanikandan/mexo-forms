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
  const [profile, setProfile] = useState<MexoProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const p = await profileService.getProfileById(session.user.id);
        if (p && mounted) {
          setProfile(p);
          setIsAuthenticated(true);
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
