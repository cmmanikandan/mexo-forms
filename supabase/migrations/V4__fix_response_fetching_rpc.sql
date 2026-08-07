-- =============================================
-- MEXO Forms V4 Fix Response Fetching & RLS Policies
-- =============================================

-- 1. SECURITY DEFINER RPC to fetch form_responses bypassing RLS
CREATE OR REPLACE FUNCTION public.get_form_responses(p_form_id UUID)
RETURNS SETOF public.form_responses
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.form_responses
  WHERE form_id = p_form_id AND status = 'submitted'
  ORDER BY submitted_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_form_responses(UUID) TO anon, authenticated;

-- 2. SECURITY DEFINER RPC to fetch form_answers bypassing RLS
CREATE OR REPLACE FUNCTION public.get_form_answers(p_form_id UUID)
RETURNS SETOF public.form_answers
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fa.* FROM public.form_answers fa
  JOIN public.form_responses fr ON fr.id = fa.response_id
  WHERE fr.form_id = p_form_id AND fr.status = 'submitted';
$$;

GRANT EXECUTE ON FUNCTION public.get_form_answers(UUID) TO anon, authenticated;

-- 3. Open RLS Policies for form_responses & form_answers so PostgREST selects succeed
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Form responses: owner and respondent read" ON public.form_responses;
DROP POLICY IF EXISTS "Form responses: authenticated insert" ON public.form_responses;
DROP POLICY IF EXISTS "Form responses: owner delete" ON public.form_responses;
DROP POLICY IF EXISTS "Form responses: all access" ON public.form_responses;

CREATE POLICY "Form responses: all access"
  ON public.form_responses FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.form_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Form answers: owner and respondent read" ON public.form_answers;
DROP POLICY IF EXISTS "Form answers: authenticated insert" ON public.form_answers;
DROP POLICY IF EXISTS "Form answers: all access" ON public.form_answers;

CREATE POLICY "Form answers: all access"
  ON public.form_answers FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
