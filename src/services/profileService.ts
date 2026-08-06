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
};
