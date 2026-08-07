import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { MexoProfile } from '../types/forms';
import { profileService } from './profileService';

export function normalizeAuthError(error: any): string {
  if (!error) return 'Unable to sign in. Please check your credentials and try again.';

  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (trimmed === '{}' || trimmed === '[object Object]' || !trimmed) {
      return 'Unable to sign in. Please check your MEXO ID and password.';
    }
    if (trimmed.includes('invalid_grant') || trimmed.toLowerCase().includes('invalid login credentials')) {
      return 'Incorrect MEXO ID or password.';
    }
    return error;
  }

  if (typeof error === 'object') {
    const msg = error.message || error.error_description || error.error || error.msg;
    if (typeof msg === 'string') {
      const trimmedMsg = msg.trim();
      if (trimmedMsg && trimmedMsg !== '{}' && trimmedMsg !== '[object Object]') {
        if (trimmedMsg.toLowerCase().includes('invalid login credentials') || trimmedMsg.includes('invalid_grant')) {
          return 'Incorrect MEXO ID or password.';
        }
        if (trimmedMsg.toLowerCase().includes('email not confirmed')) {
          return 'Email address is not confirmed.';
        }
        return trimmedMsg;
      }
    }
  }

  return 'Unable to sign in. Please check your MEXO ID and password.';
}

export const authService = {
  /**
   * Resolves input username (e.g. 927624bit060) or email to primary MEXO email address
   */
  async resolveMexoEmail(input: string): Promise<string> {
    const value = input.trim().toLowerCase();
    if (!value) return '';
    if (value.includes('@')) return value;

    try {
      const profile = await profileService.getProfileByIdentifier(value);
      if (profile?.primary_address) {
        return profile.primary_address.toLowerCase();
      }
    } catch (err) {
      console.error('[AUTH] Profile username resolution error:', err);
    }

    return `${value}@mexo.com`;
  },

  /**
   * Authenticates an existing MEXO Account using Supabase Auth.
   */
  async signIn(
    emailOrUsername: string,
    password: string
  ): Promise<{ session: Session | null; user: MexoProfile | null; error: string | null; status?: number }> {
    try {
      const cleanInput = emailOrUsername.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (!cleanInput || !cleanPassword) {
        return { session: null, user: null, error: 'Please enter your MEXO email/username and password.' };
      }

      // Step 1: Resolve username (e.g. 927624bit060) to primary MEXO email (927624bit060@mexo.com)
      const resolvedEmail = await this.resolveMexoEmail(cleanInput);

      // Step 2: Authenticate using supabase.auth.signInWithPassword
      let data: any = null;
      let error: any = null;

      try {
        const res = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password: cleanPassword,
        });
        data = res.data;
        error = res.error;
      } catch (err: any) {
        error = err;
      }

      if (!error && data?.session) {
        const userProfile = await profileService.getProfileById(data.session.user.id);
        return { session: data.session, user: userProfile, error: null };
      }

      if (error) {
        if ((import.meta as any).env?.DEV) {
          console.error('[AUTH] Sign-in error:', {
            status: error.status,
            message: error.message,
          });
        }

        const errStatus = error.status || 0;
        const errMsg = (error.message || '').toLowerCase();
        const errCode = (((error as any).code) || '').toLowerCase();

        if (
          errStatus === 401 ||
          errCode.includes('invalid') ||
          errMsg.includes('invalid login credentials') ||
          errMsg.includes('invalid_grant')
        ) {
          return { session: null, user: null, error: 'Incorrect MEXO ID or password.', status: 401 };
        } else if (errStatus === 0 || errMsg.includes('fetch') || errMsg.includes('network')) {
          return { session: null, user: null, error: 'Unable to connect to MEXO Account. Check your connection and try again.', status: 0 };
        } else {
          return { session: null, user: null, error: normalizeAuthError(error), status: errStatus };
        }
      }

      if (!data?.session) {
        return { session: null, user: null, error: 'Unable to sign in. Please check your credentials.' };
      }

      const userProfile = await profileService.getProfileById(data.session.user.id);
      return { session: data.session, user: userProfile, error: null };
    } catch (err: any) {
      return { session: null, user: null, error: normalizeAuthError(err) };
    }
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    try {
      localStorage.removeItem('mexo_auth_profile');
      localStorage.removeItem('mexo_auth_session');
    } catch (e) {}
  },

  async getSession(): Promise<Session | null> {
    // Single source of truth: Active Supabase Auth session
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session?.user?.id) {
        return data.session;
      }
      if (error) {
        // Try session refresh
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr && refreshData?.session?.user?.id) {
          return refreshData.session;
        }
      }
    } catch (e) {}

    return null;
  },

  async refreshSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session) {
        return data.session;
      }
    } catch (e) {}
    return this.getSession();
  },

  async getUser() {
    const session = await this.getSession();
    return session?.user || null;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
