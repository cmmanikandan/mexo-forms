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

      // Step 1: Resolve username (927624bit060) to primary MEXO email (927624bit060@mexo.com)
      const resolvedEmail = await this.resolveMexoEmail(cleanInput);

      // Step 2: Authenticate ONLY using supabase.auth.signInWithPassword
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: cleanPassword,
      });

      if (error) {
        // Safe development error logging without exposing secrets
        if ((import.meta as any).env?.DEV) {
          console.error('MEXO Forms authentication failure', {
            status: error.status,
            code: (error as any).code,
            message: error.message,
            name: error.name,
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
        } else if (errStatus >= 500) {
          return { session: null, user: null, error: 'MEXO Account authentication is temporarily unavailable.', status: errStatus };
        } else if (errStatus === 0 || errMsg.includes('fetch') || errMsg.includes('network')) {
          return { session: null, user: null, error: 'Unable to connect to MEXO Account. Check your connection and try again.', status: 0 };
        } else {
          return { session: null, user: null, error: error.message || 'Unable to sign in. Please try again.', status: errStatus };
        }
      }

      if (!data.session) {
        return { session: null, user: null, error: 'Unable to sign in. Please try again.' };
      }

      // Step 3: Fetch public.profiles AFTER authentication succeeds
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
    await supabase.auth.signOut();
  },

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
