-- =============================================
-- MEXO Forms V13: Enhanced Auth Identifier Resolution
-- =============================================

CREATE OR REPLACE FUNCTION public.resolve_mexo_identifier(p_identifier TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean TEXT;
  v_email TEXT;
BEGIN
  v_clean := LOWER(TRIM(p_identifier));
  IF v_clean IS NULL OR v_clean = '' THEN
    RETURN NULL;
  END IF;

  -- 1. Direct match in auth.users.email
  SELECT email INTO v_email
  FROM auth.users
  WHERE LOWER(email) = v_clean
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- 2. Match username in public.profiles -> get primary_address or auth.users email
  SELECT COALESCE(u.email, p.primary_address) INTO v_email
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE LOWER(p.username) = CASE
    WHEN POSITION('@' IN v_clean) > 0 THEN SPLIT_PART(v_clean, '@', 1)
    ELSE v_clean
  END
  OR LOWER(p.primary_address) = v_clean
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- 3. Match auth.users.email starting with identifier (e.g. 927624bit060@...)
  IF POSITION('@' IN v_clean) = 0 THEN
    SELECT email INTO v_email
    FROM auth.users
    WHERE LOWER(email) LIKE v_clean || '@%'
    LIMIT 1;

    IF v_email IS NOT NULL THEN
      RETURN v_email;
    END IF;

    -- 4. Match metadata in auth.users
    SELECT email INTO v_email
    FROM auth.users
    WHERE LOWER(raw_user_meta_data->>'username') = v_clean
       OR LOWER(raw_user_meta_data->>'preferred_username') = v_clean
    LIMIT 1;

    IF v_email IS NOT NULL THEN
      RETURN v_email;
    END IF;

    RETURN v_clean || '@mexo.com';
  END IF;

  RETURN v_clean;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_mexo_identifier(TEXT) TO anon, authenticated;
