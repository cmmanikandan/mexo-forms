-- =============================================
-- MEXO Forms V16: User Submitted Responses Query RPC
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_submitted_forms(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  response_id UUID,
  form_id UUID,
  form_title TEXT,
  form_description TEXT,
  form_slug TEXT,
  form_mode TEXT,
  registration_ref TEXT,
  submitted_at TIMESTAMPTZ,
  owner_name TEXT,
  owner_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := COALESCE(p_user_id, auth.uid());
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    r.id AS response_id,
    f.id AS form_id,
    f.title AS form_title,
    COALESCE(f.description, '') AS form_description,
    f.slug AS form_slug,
    COALESCE(f.form_mode, 'standard') AS form_mode,
    r.registration_ref,
    r.submitted_at,
    COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''), p.username, 'MEXO User') AS owner_name,
    COALESCE(p.primary_address, u.email, '') AS owner_email
  FROM public.form_responses r
  JOIN public.forms f ON f.id = r.form_id
  LEFT JOIN public.profiles p ON p.id = f.owner_id
  LEFT JOIN auth.users u ON u.id = f.owner_id
  WHERE r.respondent_id = v_uid
    AND r.status = 'submitted'
  ORDER BY r.submitted_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_submitted_forms(UUID) TO authenticated, anon;
