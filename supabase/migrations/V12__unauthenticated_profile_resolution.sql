-- =============================================
-- MEXO Forms V12: Unauthenticated Profile Identifier Resolution
-- =============================================

-- 1. Grant SELECT on public.profiles to anon for login identification
DROP POLICY IF EXISTS "Allow anon identifier lookup" ON public.profiles;

CREATE POLICY "Allow anon identifier lookup"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. SECURITY DEFINER RPC to resolve username/email for login
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

  -- 1. Direct match on primary_address in public.profiles
  SELECT primary_address INTO v_email
  FROM public.profiles
  WHERE LOWER(primary_address) = v_clean
     OR LOWER(username) = v_clean
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- 2. Match username in public.profiles
  SELECT primary_address INTO v_email
  FROM public.profiles
  WHERE LOWER(username) = CASE
    WHEN POSITION('@' IN v_clean) > 0 THEN SPLIT_PART(v_clean, '@', 1)
    ELSE v_clean
  END
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- 3. Match in auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE LOWER(email) = v_clean
     OR LOWER(email) LIKE v_clean || '@%'
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- 4. Default format
  IF POSITION('@' IN v_clean) > 0 THEN
    RETURN v_clean;
  ELSE
    RETURN v_clean || '@mexo.com';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_mexo_identifier(TEXT) TO anon, authenticated;
