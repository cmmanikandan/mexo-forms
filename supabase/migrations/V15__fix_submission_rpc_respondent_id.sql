-- =============================================
-- MEXO Forms V15: Submission RPC Support for Respondent ID Fallback
-- =============================================

CREATE OR REPLACE FUNCTION public.submit_form_response(
  p_form_id UUID,
  p_answers JSONB,
  p_started_at TIMESTAMPTZ DEFAULT NULL,
  p_completion_time_seconds INTEGER DEFAULT 0,
  p_device_type TEXT DEFAULT 'Desktop',
  p_idempotency_key UUID DEFAULT NULL,
  p_respondent_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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
  v_existing_id UUID;
  v_existing_ref TEXT;
BEGIN
  -- 1. Single Source of Truth Authentication Check (auth.uid() or explicit session respondent ID)
  v_user_id := COALESCE(auth.uid(), p_respondent_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit form responses. Please sign in with your MEXO account.';
  END IF;

  -- 2. Idempotency Check (prevent duplicate submissions from double clicks or network retries)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, registration_ref INTO v_existing_id, v_existing_ref
    FROM public.form_responses
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'response_id', v_existing_id,
        'registration_ref', v_existing_ref,
        'idempotent_retry', true
      );
    END IF;
  END IF;

  -- Resolve respondent primary address / email from public.profiles or auth.users
  SELECT primary_address INTO v_user_email
  FROM public.profiles WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  -- 3. Lock & Fetch Form Availability Settings atomically
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

  -- 4. Atomic One Response Per User Check
  IF v_one_response_per_user IS TRUE THEN
    IF EXISTS (
      SELECT 1 FROM public.form_responses
      WHERE form_id = p_form_id AND respondent_id = v_user_id AND status = 'submitted'
    ) THEN
      RAISE EXCEPTION 'You have already responded to this form.';
    END IF;
  END IF;

  -- 5. Atomic Capacity Limit Check
  IF v_response_limit IS NOT NULL AND v_response_limit > 0 THEN
    SELECT COUNT(*)::INTEGER INTO v_response_count
    FROM public.form_responses
    WHERE form_id = p_form_id AND status = 'submitted';

    IF v_response_count >= v_response_limit THEN
      RAISE EXCEPTION 'This form has reached its maximum response capacity.';
    END IF;
  END IF;

  -- 6. Generate Unique Ticket Reference Code
  v_reg_ref := UPPER(COALESCE(v_reg_prefix, 'MXEV') || '-' || SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6));

  -- 7. Insert Form Response Record
  INSERT INTO public.form_responses (
    form_id, respondent_id, respondent_email, status, device_type,
    completion_time_seconds, started_at, submitted_at, registration_ref, idempotency_key
  ) VALUES (
    p_form_id, v_user_id, v_user_email, 'submitted',
    COALESCE(p_device_type, 'Desktop'), p_completion_time_seconds,
    COALESCE(p_started_at, NOW()), NOW(), v_reg_ref, p_idempotency_key
  )
  RETURNING id INTO v_response_id;

  -- 8. Insert Form Answers
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

  -- 9. Auto-delete corresponding draft on successful submission
  DELETE FROM public.form_response_drafts
  WHERE form_id = p_form_id AND user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'response_id', v_response_id,
    'registration_ref', v_reg_ref
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_form_response(UUID, JSONB, TIMESTAMPTZ, INTEGER, TEXT, UUID, UUID)
  TO authenticated, anon;
