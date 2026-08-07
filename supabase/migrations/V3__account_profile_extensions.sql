-- 0. Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Ensure public.profiles table has recovery_email, date_of_birth, gender columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS recovery_email TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT;

-- 2. SECURITY DEFINER RPC function for password update across MEXO services
DROP FUNCTION IF EXISTS public.update_user_password(TEXT);

CREATE OR REPLACE FUNCTION public.update_user_password(p_new_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'AUTHENTICATION_REQUIRED');
  END IF;

  IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters.');
  END IF;

  -- Use extensions.crypt with bcrypt cost factor 10 matching GoTrue
  BEGIN
    v_encrypted := extensions.crypt(p_new_password, extensions.gen_salt('bf', 10));
  EXCEPTION WHEN OTHERS THEN
    v_encrypted := crypt(p_new_password, gen_salt('bf', 10));
  END;

  UPDATE auth.users
  SET encrypted_password = v_encrypted,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_password(TEXT) TO authenticated;
