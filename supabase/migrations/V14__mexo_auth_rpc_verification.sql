-- =============================================
-- MEXO Forms V14: Server-Side Password Verification & Auth Helper
-- =============================================

CREATE OR REPLACE FUNCTION public.mexo_authenticate_user(p_identifier TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_clean TEXT;
  v_user_id UUID;
  v_encrypted TEXT;
  v_email TEXT;
  v_matches BOOLEAN := FALSE;
BEGIN
  v_clean := LOWER(TRIM(p_identifier));
  IF v_clean IS NULL OR v_clean = '' OR p_password IS NULL OR p_password = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid input');
  END IF;

  -- 1. Find user from public.profiles or auth.users
  SELECT p.id, COALESCE(u.email, p.primary_address), u.encrypted_password
  INTO v_user_id, v_email, v_encrypted
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE LOWER(p.username) = CASE WHEN POSITION('@' IN v_clean) > 0 THEN SPLIT_PART(v_clean, '@', 1) ELSE v_clean END
     OR LOWER(p.primary_address) = v_clean
     OR LOWER(u.email) = v_clean
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT id, email, encrypted_password
    INTO v_user_id, v_email, v_encrypted
    FROM auth.users
    WHERE LOWER(email) = v_clean
       OR LOWER(email) LIKE v_clean || '@%'
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  END IF;

  IF v_encrypted IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_PASSWORD_HASH');
  END IF;

  -- 2. Verify password hash using pgcrypto crypt
  BEGIN
    IF v_encrypted = extensions.crypt(p_password, v_encrypted) THEN
      v_matches := TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      IF v_encrypted = crypt(p_password, v_encrypted) THEN
        v_matches := TRUE;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_matches := FALSE;
    END;
  END;

  IF v_matches IS TRUE THEN
    RETURN jsonb_build_object(
      'success', true,
      'user_id', v_user_id,
      'email', v_email
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_PASSWORD');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mexo_authenticate_user(TEXT, TEXT) TO anon, authenticated;
