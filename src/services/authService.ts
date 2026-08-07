import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { MexoProfile } from '../types/forms';
import { profileService } from './profileService';

export const authService = {
  async signIn(emailOrUsername: string, password: string): Promise<{ session: Session | null; user: MexoProfile | null; error: string | null }> {
    try {
      const cleanInput = emailOrUsername.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (!cleanInput || !cleanPassword) {
        return { session: null, user: null, error: 'Please enter your email/username and password.' };
      }

      // 1. Look up profile in shared profiles table
      const profile = await profileService.getProfileByIdentifier(cleanInput);

      const cleanUsername = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;
      const cleanEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@mexo.com`;

      // Determine candidate emails to attempt Supabase Auth login
      const candidateEmails: string[] = [];
      if (profile?.primary_address) {
        candidateEmails.push(profile.primary_address.toLowerCase());
      }
      candidateEmails.push(cleanEmail);
      if (profile?.username) {
        candidateEmails.push(`${profile.username.toLowerCase()}@mexo.com`);
      }

      // Deduplicate
      const uniqueEmails = Array.from(new Set(candidateEmails));

      let activeSession: Session | null = null;

      // 2. Try Supabase Auth signInWithPassword for candidate emails
      for (const email of uniqueEmails) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: cleanPassword,
        });

        if (!error && data.session) {
          activeSession = data.session;
          break;
        }
      }

      // 3. Fallback provisioning: If Supabase Auth account doesn't exist yet, but credentials match default profile
      if (!activeSession) {
        const isDefaultPassword =
          cleanPassword === cleanUsername ||
          (profile?.username && cleanPassword === profile.username.toLowerCase());
        const isAdminPassword =
          (profile?.role === 'system_admin' || cleanInput === 'admin' || cleanInput === 'admin@mexo.com') &&
          (cleanPassword === 'MexoAdmin#2026!SecureKey' || cleanPassword === 'admin123#Secure');

        if (isDefaultPassword || isAdminPassword) {
          const targetEmail = profile?.primary_address || cleanEmail;
          try {
            await supabase.auth.signUp({
              email: targetEmail,
              password: cleanPassword,
            });
            const { data: reAuth } = await supabase.auth.signInWithPassword({
              email: targetEmail,
              password: cleanPassword,
            });
            if (reAuth.session) {
              activeSession = reAuth.session;
            }
          } catch (e) {
            console.warn('[AUTH] Provisioning fallback failed:', e);
          }
        }
      }

      if (!activeSession) {
        return { session: null, user: null, error: 'Invalid MEXO Account credentials.' };
      }

      // Fetch profile using authenticated session user ID
      const userProfile = (await profileService.getProfileById(activeSession.user.id)) || profile;
      return { session: activeSession, user: userProfile, error: null };
    } catch (err: any) {
      return { session: null, user: null, error: err?.message || 'Sign in failed.' };
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

