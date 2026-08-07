import { supabase } from '../lib/supabase';
import { MexoProfile } from '../types/forms';

export const profileService = {
  async getProfileById(userId: string): Promise<MexoProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return data as MexoProfile;
  },

  async getProfileByAddress(address: string): Promise<MexoProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('primary_address', address.toLowerCase())
      .single();
    if (error || !data) return null;
    return data as MexoProfile;
  },

  async getProfileByIdentifier(identifier: string): Promise<MexoProfile | null> {
    const clean = identifier.trim().toLowerCase();
    const cleanUsername = clean.includes('@') ? clean.split('@')[0] : clean;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`primary_address.eq.${clean},username.eq.${cleanUsername}`)
      .limit(1);
    if (!data || data.length === 0) return null;
    return data[0] as MexoProfile;
  },

  async searchProfiles(query: string): Promise<MexoProfile[]> {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, primary_address, first_name, last_name, avatar_url')
      .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,primary_address.ilike.%${query}%`)
      .limit(10);
    return (data as MexoProfile[]) || [];
  },

  async updateUserProfile(userId: string, updates: Partial<MexoProfile>): Promise<MexoProfile | null> {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.first_name !== undefined) dbUpdates.first_name = updates.first_name;
      if (updates.last_name !== undefined) dbUpdates.last_name = updates.last_name;
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
      if (updates.recovery_email !== undefined) dbUpdates.recovery_email = updates.recovery_email;
      if (updates.date_of_birth !== undefined) dbUpdates.date_of_birth = updates.date_of_birth;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.role !== undefined) dbUpdates.role = updates.role;

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select('*')
        .single();

      if (error || !data) {
        console.error('[PROFILE] Error updating profile:', error);
        return null;
      }
      return data as MexoProfile;
    } catch (e) {
      console.error('[PROFILE] Exception updating profile:', e);
      return null;
    }
  },

  async updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      let { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        sessionData = refreshed as any;
      }

      if (!sessionData?.session?.user) {
        return { success: false, error: 'Session expired. Please sign in again.' };
      }

      let rpcSucceeded = false;
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('update_user_password', {
          p_new_password: newPassword,
        });

        if (!rpcError && (rpcResult as any)?.success === true) {
          rpcSucceeded = true;
        }
      } catch (e) {
        /* ignore */
      }

      let authUpdateSucceeded = false;
      try {
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (!updateError) {
          authUpdateSucceeded = true;
        }
      } catch (e) {
        /* ignore */
      }

      if (rpcSucceeded || authUpdateSucceeded) {
        return { success: true };
      }

      return { success: false, error: 'Unable to update password. Please re-authenticate and try again.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' };
    }
  },
};

