-- =============================================
-- MEXO Forms V10: Secure RLS Policies & Responses Query RPC
-- =============================================

-- Enable RLS on form_responses and form_answers
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_answers ENABLE ROW LEVEL SECURITY;

-- Drop obsolete policies to avoid conflicts
DROP POLICY IF EXISTS "Owners can view responses for their forms" ON public.form_responses;
DROP POLICY IF EXISTS "Respondents can insert responses" ON public.form_responses;
DROP POLICY IF EXISTS "Respondents can view own responses" ON public.form_responses;

DROP POLICY IF EXISTS "Owners can view answers for their forms" ON public.form_answers;
DROP POLICY IF EXISTS "Respondents can insert answers" ON public.form_answers;
DROP POLICY IF EXISTS "Respondents can view own answers" ON public.form_answers;

-- 1. POLICIES FOR form_responses
-- Form Owners can SELECT responses for forms they own
CREATE POLICY "Owners can view responses for their forms"
  ON public.form_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_responses.form_id
        AND f.owner_id = auth.uid()
    )
  );

-- Respondents can SELECT their own responses
CREATE POLICY "Respondents can view own responses"
  ON public.form_responses FOR SELECT
  USING (respondent_id = auth.uid());

-- Authenticated users & anon can INSERT responses
CREATE POLICY "Respondents can insert responses"
  ON public.form_responses FOR INSERT
  WITH CHECK (true);

-- Form Owners can DELETE responses for forms they own
CREATE POLICY "Owners can delete responses for their forms"
  ON public.form_responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_responses.form_id
        AND f.owner_id = auth.uid()
    )
  );

-- 2. POLICIES FOR form_answers
-- Form Owners can SELECT answers for forms they own
CREATE POLICY "Owners can view answers for their forms"
  ON public.form_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.form_responses r
      JOIN public.forms f ON f.id = r.form_id
      WHERE r.id = form_answers.response_id
        AND f.owner_id = auth.uid()
    )
  );

-- Respondents can SELECT their own answers
CREATE POLICY "Respondents can view own answers"
  ON public.form_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.form_responses r
      WHERE r.id = form_answers.response_id
        AND r.respondent_id = auth.uid()
    )
  );

-- Anyone who created a response can INSERT answers
CREATE POLICY "Respondents can insert answers"
  ON public.form_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.form_responses r
      WHERE r.id = form_answers.response_id
        AND r.respondent_id = auth.uid()
    )
  );

-- 3. Stored Procedure RPC to fetch form responses reliably for form owner
CREATE OR REPLACE FUNCTION public.get_owner_form_responses(p_form_id UUID)
RETURNS TABLE (
  id UUID,
  form_id UUID,
  respondent_id UUID,
  respondent_email TEXT,
  status TEXT,
  device_type TEXT,
  completion_time_seconds INTEGER,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  registration_ref TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_owner_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT owner_id INTO v_owner_id FROM public.forms WHERE forms.id = p_form_id;

  IF v_owner_id != v_user_id THEN
    RAISE EXCEPTION 'Access denied. Only form owner can view responses.';
  END IF;

  RETURN QUERY
    SELECT r.id, r.form_id, r.respondent_id, r.respondent_email, r.status,
           r.device_type, r.completion_time_seconds, r.started_at, r.submitted_at, r.registration_ref
    FROM public.form_responses r
    WHERE r.form_id = p_form_id AND r.status = 'submitted'
    ORDER BY r.submitted_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_owner_form_responses(UUID) TO authenticated;
