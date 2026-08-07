-- =============================================
-- MEXO Forms Database Schema V2 Improvements
-- Project: vnbixduiwsvepvtybygy
-- =============================================

-- 1. Add completion_time_seconds and device_type columns to form_responses if missing
ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS completion_time_seconds INTEGER;

ALTER TABLE public.form_responses
ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'Desktop';

-- 2. Add safe nonnegative constraint for completion_time_seconds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'form_responses_completion_time_nonnegative'
  ) THEN
    ALTER TABLE public.form_responses
    ADD CONSTRAINT form_responses_completion_time_nonnegative
    CHECK (completion_time_seconds IS NULL OR completion_time_seconds >= 0);
  END IF;
END $$;

-- 3. Atomic Stored Procedure / RPC for Safe Response & Answers Creation
CREATE OR REPLACE FUNCTION public.submit_form_response(
  p_form_id UUID,
  p_answers JSONB,
  p_started_at TIMESTAMPTZ DEFAULT NOW(),
  p_completion_time_seconds INTEGER DEFAULT NULL,
  p_device_type TEXT DEFAULT 'Desktop'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_is_published BOOLEAN;
  v_accepting_responses BOOLEAN;
  v_starts_at TIMESTAMPTZ;
  v_ends_at TIMESTAMPTZ;
  v_one_response_per_user BOOLEAN;
  v_response_id UUID;
  v_elem JSONB;
BEGIN
  -- Check authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit form responses.';
  END IF;

  -- Resolve respondent primary_address / email from profiles
  SELECT primary_address INTO v_user_email
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
  END IF;

  -- Verify form existence and availability
  SELECT is_published, accepting_responses, starts_at, ends_at, one_response_per_user
  INTO v_is_published, v_accepting_responses, v_starts_at, v_ends_at, v_one_response_per_user
  FROM public.forms
  WHERE id = p_form_id;

  IF v_is_published IS NOT TRUE THEN
    RAISE EXCEPTION 'This form is not published or unavailable.';
  END IF;

  IF v_accepting_responses IS NOT TRUE THEN
    RAISE EXCEPTION 'This form is no longer accepting responses.';
  END IF;

  IF v_starts_at IS NOT NULL AND NOW() < v_starts_at THEN
    RAISE EXCEPTION 'This form has not opened yet.';
  END IF;

  IF v_ends_at IS NOT NULL AND NOW() > v_ends_at THEN
    RAISE EXCEPTION 'This form has expired.';
  END IF;

  -- Check one response per user rule
  IF v_one_response_per_user IS TRUE THEN
    IF EXISTS (
      SELECT 1 FROM public.form_responses
      WHERE form_id = p_form_id
        AND respondent_id = v_user_id
        AND status = 'submitted'
    ) THEN
      RAISE EXCEPTION 'You have already responded to this form.';
    END IF;
  END IF;

  -- Create form_responses record
  INSERT INTO public.form_responses (
    form_id,
    respondent_id,
    respondent_email,
    status,
    device_type,
    completion_time_seconds,
    started_at,
    submitted_at
  ) VALUES (
    p_form_id,
    v_user_id,
    v_user_email,
    'submitted',
    COALESCE(p_device_type, 'Desktop'),
    p_completion_time_seconds,
    COALESCE(p_started_at, NOW()),
    NOW()
  )
  RETURNING id INTO v_response_id;

  -- Insert form_answers records
  IF p_answers IS NOT NULL AND jsonb_array_length(p_answers) > 0 THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
      INSERT INTO public.form_answers (
        response_id,
        question_id,
        answer_text,
        answer_json
      ) VALUES (
        v_response_id,
        (v_elem->>'question_id')::UUID,
        v_elem->>'answer_text',
        v_elem->'answer_json'
      );
    END LOOP;
  END IF;

  RETURN v_response_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_form_response(UUID, JSONB, TIMESTAMPTZ, INTEGER, TEXT) TO authenticated, anon;

-- 4. Update Row Level Security Policies
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Form responses: all access" ON public.form_responses;
DROP POLICY IF EXISTS "Form responses: owner read" ON public.form_responses;
DROP POLICY IF EXISTS "Form responses: public insert" ON public.form_responses;
DROP POLICY IF EXISTS "Form responses: respondent read own" ON public.form_responses;

CREATE POLICY "Form responses: owner and respondent read"
  ON public.form_responses FOR SELECT
  TO authenticated, anon
  USING (
    respondent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_responses.form_id
        AND (f.owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.form_collaborators c
          WHERE c.form_id = f.id AND c.user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Form responses: authenticated insert"
  ON public.form_responses FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (respondent_id IS NULL OR respondent_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_responses.form_id
        AND f.is_published = true
        AND f.accepting_responses = true
    )
  );

CREATE POLICY "Form responses: owner delete"
  ON public.form_responses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_responses.form_id
        AND f.owner_id = auth.uid()
    )
  );

-- Update RLS for form_answers
ALTER TABLE public.form_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Form answers: all access" ON public.form_answers;

CREATE POLICY "Form answers: owner and respondent read"
  ON public.form_answers FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.form_responses r
      JOIN public.forms f ON f.id = r.form_id
      WHERE r.id = form_answers.response_id
        AND (r.respondent_id = auth.uid() OR f.owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.form_collaborators c
          WHERE c.form_id = f.id AND c.user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Form answers: authenticated insert"
  ON public.form_answers FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.form_responses r
      WHERE r.id = form_answers.response_id
        AND (r.respondent_id IS NULL OR r.respondent_id = auth.uid())
    )
  );
