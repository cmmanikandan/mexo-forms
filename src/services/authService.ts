import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { MexoProfile } from '../types/forms';
import { profileService } from './profileService';

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
   * NO signup, NO auto-account creation. MEXO Forms only consumes existing accounts.
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
          console.error('MEXO Forms authentication notice:', {
            status: error.status,
            code: (error as any).code,
            message: error.message,
            name: error.name,
          });
        }

        const errStatus = error.status || 0;
        const errMsg = (error.message || '').toLowerCase();
        const errName = error.name || '';
        const isServerError =
          errStatus >= 500 ||
          errName === 'AuthRetryableFetchError' ||
          errMsg.includes('database error querying schema') ||
          errMsg.includes('schema');

        // Step 3: Handle authentication errors cleanly
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
          return { session: null, user: null, error: error.message || 'Unable to sign in. Please try again.', status: errStatus };
        }
      }

      if (!data?.session) {
        return { session: null, user: null, error: 'Unable to sign in. Please try again.' };
      }

      const userProfile = await profileService.getProfileById(data.session.user.id);
      return { session: data.session, user: userProfile, error: null };
    } catch (err: any) {
      if ((import.meta as any).env?.DEV) {
        console.error('MEXO Forms auth exception', { message: err?.message, name: err?.name });
      }
      return { session: null, user: null, error: 'Unable to sign in. Please try again.' };
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
