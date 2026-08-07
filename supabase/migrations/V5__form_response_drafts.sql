-- =============================================
-- MEXO Forms V5: Auto-Draft Save System
-- Project: vnbixduiwsvepvtybygy
-- =============================================

-- 1. Create form_response_drafts table
CREATE TABLE IF NOT EXISTS public.form_response_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers       JSONB NOT NULL DEFAULT '{}',
  current_page  INTEGER NOT NULL DEFAULT 0,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  CONSTRAINT form_response_drafts_unique_user_form UNIQUE (form_id, user_id)
);

-- 2. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_form_response_drafts_form_user
  ON public.form_response_drafts(form_id, user_id);

CREATE INDEX IF NOT EXISTS idx_form_response_drafts_user
  ON public.form_response_drafts(user_id);

-- 3. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_draft_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS draft_updated_at_trigger ON public.form_response_drafts;
CREATE TRIGGER draft_updated_at_trigger
  BEFORE UPDATE ON public.form_response_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_draft_updated_at();

-- 4. RLS
ALTER TABLE public.form_response_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Draft: user read own" ON public.form_response_drafts;
DROP POLICY IF EXISTS "Draft: user insert own" ON public.form_response_drafts;
DROP POLICY IF EXISTS "Draft: user update own" ON public.form_response_drafts;
DROP POLICY IF EXISTS "Draft: user delete own" ON public.form_response_drafts;

-- SELECT: only own drafts
CREATE POLICY "Draft: user read own"
  ON public.form_response_drafts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: only own user_id
CREATE POLICY "Draft: user insert own"
  ON public.form_response_drafts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: only own drafts, with optimistic concurrency (version must increment)
CREATE POLICY "Draft: user update own"
  ON public.form_response_drafts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: only own drafts
CREATE POLICY "Draft: user delete own"
  ON public.form_response_drafts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Upsert Draft RPC (atomic, server-side, handles version increment)
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
  v_server_version INTEGER;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- Get current server version if draft exists
  SELECT version INTO v_server_version
  FROM public.form_response_drafts
  WHERE form_id = p_form_id AND user_id = v_user_id;

  -- Conflict: client version is older than server version → reject
  IF v_server_version IS NOT NULL
     AND p_client_version IS NOT NULL
     AND p_client_version < v_server_version THEN
    SELECT jsonb_build_object(
      'conflict', true,
      'server_version', v_server_version,
      'server_answers', answers,
      'server_updated_at', updated_at
    ) INTO v_result
    FROM public.form_response_drafts
    WHERE form_id = p_form_id AND user_id = v_user_id;
    RETURN v_result;
  END IF;

  -- Upsert
  INSERT INTO public.form_response_drafts (
    form_id, user_id, answers, current_page, completion_percentage,
    version, expires_at
  ) VALUES (
    p_form_id, v_user_id, p_answers, p_current_page, p_completion_percentage,
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
    'conflict', false
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_form_draft(UUID, JSONB, INTEGER, INTEGER, INTEGER)
  TO authenticated;

-- 6. Get Draft RPC
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

GRANT EXECUTE ON FUNCTION public.get_form_draft(UUID) TO authenticated;

-- 7. Delete Draft RPC (called after successful submission)
CREATE OR REPLACE FUNCTION public.delete_form_draft(p_form_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  DELETE FROM public.form_response_drafts
  WHERE form_id = p_form_id AND user_id = v_user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_form_draft(UUID) TO authenticated;

-- 8. Cleanup expired drafts (can be called via pg_cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_expired_drafts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.form_response_drafts
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_drafts() TO service_role;

-- 9. Update submit_form_response to delete draft on successful submission
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
  v_response_limit INTEGER;
  v_response_count INTEGER;
  v_response_id UUID;
  v_elem JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit form responses.';
  END IF;

  SELECT primary_address INTO v_user_email
  FROM public.profiles WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  SELECT is_published, accepting_responses, starts_at, ends_at,
         one_response_per_user, manual_closed_at, response_limit
  INTO v_is_published, v_accepting_responses, v_starts_at, v_ends_at,
       v_one_response_per_user, v_manual_closed_at, v_response_limit
  FROM public.forms WHERE id = p_form_id;

  IF v_is_published IS NOT TRUE THEN
    RAISE EXCEPTION 'This form is not published or unavailable.';
  END IF;

  IF v_accepting_responses IS NOT TRUE THEN
    RAISE EXCEPTION 'This form is no longer accepting responses.';
  END IF;

  IF v_manual_closed_at IS NOT NULL THEN
    RAISE EXCEPTION 'This form has been closed by the owner.';
  END IF;

  IF v_starts_at IS NOT NULL AND NOW() < v_starts_at THEN
    RAISE EXCEPTION 'This form has not opened yet.';
  END IF;

  IF v_ends_at IS NOT NULL AND NOW() > v_ends_at THEN
    RAISE EXCEPTION 'This form has expired.';
  END IF;

  IF v_one_response_per_user IS TRUE THEN
    IF EXISTS (
      SELECT 1 FROM public.form_responses
      WHERE form_id = p_form_id AND respondent_id = v_user_id AND status = 'submitted'
    ) THEN
      RAISE EXCEPTION 'You have already responded to this form.';
    END IF;
  END IF;

  -- Check response limit (only counting submitted, not drafts)
  IF v_response_limit IS NOT NULL AND v_response_limit > 0 THEN
    SELECT COUNT(*) INTO v_response_count
    FROM public.form_responses
    WHERE form_id = p_form_id AND status = 'submitted';

    IF v_response_count >= v_response_limit THEN
      RAISE EXCEPTION 'This form has reached its maximum number of responses.';
    END IF;
  END IF;

  INSERT INTO public.form_responses (
    form_id, respondent_id, respondent_email, status, device_type,
    completion_time_seconds, started_at, submitted_at
  ) VALUES (
    p_form_id, v_user_id, v_user_email, 'submitted',
    COALESCE(p_device_type, 'Desktop'), p_completion_time_seconds,
    COALESCE(p_started_at, NOW()), NOW()
  )
  RETURNING id INTO v_response_id;

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

  -- Auto-delete the draft on successful submission
  DELETE FROM public.form_response_drafts
  WHERE form_id = p_form_id AND user_id = v_user_id;

  RETURN v_response_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_form_response(UUID, JSONB, TIMESTAMPTZ, INTEGER, TEXT)
  TO authenticated, anon;
