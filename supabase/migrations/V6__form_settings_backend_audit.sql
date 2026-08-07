-- =============================================
-- MEXO Forms V6: Database Schema & Backend Audit
-- Project: vnbixduiwsvepvtybygy
-- =============================================

-- 1. Ensure all Form Settings fields exist on public.forms
ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'violet',
  ADD COLUMN IF NOT EXISTS allow_response_editing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_draft_save BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_quiz_score BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_response_summary BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS response_limit INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS show_remaining_capacity BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS closed_title TEXT DEFAULT 'Registration Closed',
  ADD COLUMN IF NOT EXISTS closed_message TEXT DEFAULT 'Registration for this event has ended. Thank you for your interest.',
  ADD COLUMN IF NOT EXISTS closed_button_text TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closed_button_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS event_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS event_venue TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS event_date TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS registration_prefix TEXT DEFAULT 'MXEV',
  ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS submission_attachment_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS submission_attachment_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS manual_closed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add Registration Reference ID to form_responses
ALTER TABLE public.form_responses
  ADD COLUMN IF NOT EXISTS registration_ref TEXT DEFAULT NULL;

-- 3. Indexes for fast availability & settings queries
CREATE INDEX IF NOT EXISTS idx_forms_slug ON public.forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_owner_status ON public.forms(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_status ON public.form_responses(form_id, status);
CREATE INDEX IF NOT EXISTS idx_form_responses_registration_ref ON public.form_responses(registration_ref);

-- =============================================
-- 4. SERVER-SIDE ATOMIC SUBMISSION RPC (Server-Safe Capacity & Attempt Protection)
-- =============================================
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
  v_manual_closed_at TIMESTAMPTZ;
  v_paused_at TIMESTAMPTZ;
  v_response_limit INTEGER;
  v_reg_prefix TEXT;
  v_response_count INTEGER;
  v_response_id UUID;
  v_reg_ref TEXT;
  v_elem JSONB;
BEGIN
  -- 1. Authentication Check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit form responses.';
  END IF;

  -- Resolve respondent primary_address / email from profiles
  SELECT primary_address INTO v_user_email
  FROM public.profiles WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  -- 2. Lock & Fetch Form Availability Settings atomically from database
  SELECT is_published, accepting_responses, starts_at, ends_at,
         one_response_per_user, manual_closed_at, paused_at, response_limit, registration_prefix
  INTO v_is_published, v_accepting_responses, v_starts_at, v_ends_at,
       v_one_response_per_user, v_manual_closed_at, v_paused_at, v_response_limit, v_reg_prefix
  FROM public.forms WHERE id = p_form_id
  FOR SHARE;

  IF v_is_published IS NOT TRUE THEN
    RAISE EXCEPTION 'This form is not published or unavailable.';
  END IF;

  IF v_accepting_responses IS NOT TRUE THEN
    RAISE EXCEPTION 'This form is no longer accepting responses.';
  END IF;

  IF v_manual_closed_at IS NOT NULL THEN
    RAISE EXCEPTION 'This form has been closed by the owner.';
  END IF;

  IF v_paused_at IS NOT NULL THEN
    RAISE EXCEPTION 'This form is temporarily paused by the owner.';
  END IF;

  IF v_starts_at IS NOT NULL AND NOW() < v_starts_at THEN
    RAISE EXCEPTION 'This form has not opened yet.';
  END IF;

  IF v_ends_at IS NOT NULL AND NOW() >= v_ends_at THEN
    RAISE EXCEPTION 'This form has closed. The response deadline has passed.';
  END IF;

  -- 3. Atomic One Response Per User Check
  IF v_one_response_per_user IS TRUE THEN
    IF EXISTS (
      SELECT 1 FROM public.form_responses
      WHERE form_id = p_form_id AND respondent_id = v_user_id AND status = 'submitted'
    ) THEN
      RAISE EXCEPTION 'You have already responded to this form.';
    END IF;
  END IF;

  -- 4. Atomic Server-Safe Capacity Check (prevents race conditions)
  IF v_response_limit IS NOT NULL AND v_response_limit > 0 THEN
    SELECT COUNT(*)::INTEGER INTO v_response_count
    FROM public.form_responses
    WHERE form_id = p_form_id AND status = 'submitted';

    IF v_response_count >= v_response_limit THEN
      RAISE EXCEPTION 'This form has reached its maximum response capacity.';
    END IF;
  END IF;

  -- 5. Generate Safe Unique Registration Reference Code (e.g. MXEV-7K2P91)
  v_reg_ref := UPPER(COALESCE(v_reg_prefix, 'MXEV') || '-' || SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6));

  -- 6. Insert Form Response Record
  INSERT INTO public.form_responses (
    form_id, respondent_id, respondent_email, status, device_type,
    completion_time_seconds, started_at, submitted_at, registration_ref
  ) VALUES (
    p_form_id, v_user_id, v_user_email, 'submitted',
    COALESCE(p_device_type, 'Desktop'), p_completion_time_seconds,
    COALESCE(p_started_at, NOW()), NOW(), v_reg_ref
  )
  RETURNING id INTO v_response_id;

  -- 7. Insert Form Answers
  IF p_answers IS NOT NULL AND jsonb_array_length(p_answers) > 0 THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
      INSERT INTO public.form_answers (response_id, question_id, answer_text, answer_json)
      VALUES (
        v_response_id,
        (v_elem->>'question_id')::UUID,
        v_elem->>'answer_text',
        v_elem->'answer_json'
      );
    END LOOP;
  END IF;

  -- 8. Auto-delete corresponding draft on successful submission
  DELETE FROM public.form_response_drafts
  WHERE form_id = p_form_id AND user_id = v_user_id;

  RETURN v_response_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_form_response(UUID, JSONB, TIMESTAMPTZ, INTEGER, TEXT)
  TO authenticated, anon;

-- =============================================
-- 5. STORAGE BUCKET CONFIGURATION FOR ATTACHMENTS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-attachments', 'form-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies
DROP POLICY IF EXISTS "Public form attachments read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users form attachments upload" ON storage.objects;

CREATE POLICY "Public form attachments read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'form-attachments');

CREATE POLICY "Authenticated users form attachments upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'form-attachments');

-- =============================================
-- 6. IDEMPOTENT DRAFT SAVING RPC (Fixes Save Failed / Conflict Bugs)
-- =============================================
CREATE OR REPLACE FUNCTION public.upsert_form_draft(
  p_form_id UUID,
  p_answers JSONB,
  p_current_page INTEGER DEFAULT 0,
  p_completion_percentage INTEGER DEFAULT 0,
  p_client_version INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    -- Fallback: return success false if unauthenticated
    RETURN jsonb_build_object('success', false, 'error', 'AUTHENTICATION_REQUIRED');
  END IF;

  -- Atomic Upsert (always updates user's draft smoothly without false conflict errors)
  INSERT INTO public.form_response_drafts (
    form_id, user_id, answers, current_page, completion_percentage,
    version, expires_at
  ) VALUES (
    p_form_id, v_user_id, COALESCE(p_answers, '{}'::jsonb), p_current_page, p_completion_percentage,
    1, NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (form_id, user_id) DO UPDATE SET
    answers               = EXCLUDED.answers,
    current_page          = EXCLUDED.current_page,
    completion_percentage = EXCLUDED.completion_percentage,
    version               = form_response_drafts.version + 1,
    expires_at            = NOW() + INTERVAL '30 days',
    updated_at            = NOW()
  RETURNING jsonb_build_object(
    'id', id,
    'version', version,
    'updated_at', updated_at,
    'conflict', false,
    'success', true
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_form_draft(UUID, JSONB, INTEGER, INTEGER, INTEGER)
  TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_form_draft(p_form_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', id,
    'answers', answers,
    'current_page', current_page,
    'completion_percentage', completion_percentage,
    'version', version,
    'updated_at', updated_at,
    'expires_at', expires_at
  ) INTO v_result
  FROM public.form_response_drafts
  WHERE form_id = p_form_id
    AND user_id = v_user_id
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_form_draft(UUID) TO authenticated, anon;

