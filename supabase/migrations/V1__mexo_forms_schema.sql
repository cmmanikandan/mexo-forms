-- =============================================
-- MEXO Forms Database Schema
-- Project: vnbixduiwsvepvtybygy
-- Run in Supabase SQL Editor
-- =============================================

-- 1. FORMS TABLE
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Form',
  description TEXT DEFAULT '',
  slug TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'draft',
  form_type TEXT NOT NULL DEFAULT 'form',
  is_published BOOLEAN NOT NULL DEFAULT false,
  accepting_responses BOOLEAN NOT NULL DEFAULT true,
  requires_login BOOLEAN NOT NULL DEFAULT false,
  one_response_per_user BOOLEAN NOT NULL DEFAULT false,
  confirmation_message TEXT DEFAULT 'Thank you for your response!',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. FORM SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.form_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. FORM QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.form_sections(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  question_type TEXT NOT NULL DEFAULT 'short_text',
  required BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. FORM OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.form_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  value TEXT NOT NULL DEFAULT '',
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);

-- 5. FORM RESPONSES TABLE
CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  respondent_email TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

-- 6. FORM ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.form_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FORM COLLABORATORS TABLE
CREATE TABLE IF NOT EXISTS public.form_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT form_collaborators_unique UNIQUE(form_id, user_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_forms_owner_id ON public.forms(owner_id);
CREATE INDEX IF NOT EXISTS idx_forms_slug ON public.forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_status ON public.forms(status);
CREATE INDEX IF NOT EXISTS idx_form_questions_form_id ON public.form_questions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_questions_position ON public.form_questions(form_id, position);
CREATE INDEX IF NOT EXISTS idx_form_options_question_id ON public.form_options(question_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON public.form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_answers_response_id ON public.form_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_form_collaborators_user_id ON public.form_collaborators(user_id);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_collaborators ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (Full Access for Ecosystem Users)
-- =============================================

-- FORMS TABLE
DROP POLICY IF EXISTS "Forms: owner full access" ON public.forms;
DROP POLICY IF EXISTS "Forms: collaborator read" ON public.forms;
DROP POLICY IF EXISTS "Forms: public read published" ON public.forms;
DROP POLICY IF EXISTS "Forms: all access" ON public.forms;

CREATE POLICY "Forms: all access"
  ON public.forms FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- FORM SECTIONS TABLE
DROP POLICY IF EXISTS "Form sections: owner access" ON public.form_sections;
DROP POLICY IF EXISTS "Form sections: public read" ON public.form_sections;
DROP POLICY IF EXISTS "Form sections: all access" ON public.form_sections;

CREATE POLICY "Form sections: all access"
  ON public.form_sections FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- FORM QUESTIONS TABLE
DROP POLICY IF EXISTS "Form questions: owner access" ON public.form_questions;
DROP POLICY IF EXISTS "Form questions: public read" ON public.form_questions;
DROP POLICY IF EXISTS "Form questions: all access" ON public.form_questions;

CREATE POLICY "Form questions: all access"
  ON public.form_questions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- FORM OPTIONS TABLE
DROP POLICY IF EXISTS "Form options: owner access" ON public.form_options;
DROP POLICY IF EXISTS "Form options: public read" ON public.form_options;
DROP POLICY IF EXISTS "Form options: all access" ON public.form_options;

CREATE POLICY "Form options: all access"
  ON public.form_options FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- FORM RESPONSES TABLE
DROP POLICY IF EXISTS "Form responses: owner read" ON public.form_responses;
DROP POLICY IF EXISTS "Form responses: public insert" ON public.form_responses;
DROP POLICY IF EXISTS "Form responses: respondent read own" ON public.form_responses;
DROP POLICY IF EXISTS "Form responses: all access" ON public.form_responses;

CREATE POLICY "Form responses: all access"
  ON public.form_responses FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- FORM ANSWERS TABLE
DROP POLICY IF EXISTS "Form answers: owner read" ON public.form_answers;
DROP POLICY IF EXISTS "Form answers: public insert" ON public.form_answers;
DROP POLICY IF EXISTS "Form answers: all access" ON public.form_answers;

CREATE POLICY "Form answers: all access"
  ON public.form_answers FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- FORM COLLABORATORS TABLE
DROP POLICY IF EXISTS "Form collaborators: owner access" ON public.form_collaborators;
DROP POLICY IF EXISTS "Form collaborators: user read own" ON public.form_collaborators;
DROP POLICY IF EXISTS "Form collaborators: all access" ON public.form_collaborators;

CREATE POLICY "Form collaborators: all access"
  ON public.form_collaborators FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- UPDATED_AT trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.forms_update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forms_updated_at ON public.forms;
CREATE TRIGGER forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.forms_update_updated_at();

DROP TRIGGER IF EXISTS form_questions_updated_at ON public.form_questions;
CREATE TRIGGER form_questions_updated_at
  BEFORE UPDATE ON public.form_questions
  FOR EACH ROW EXECUTE FUNCTION public.forms_update_updated_at();

-- =============================================
-- HELPER: Get response count for a form
-- =============================================
CREATE OR REPLACE FUNCTION public.get_form_response_count(p_form_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER FROM public.form_responses
  WHERE form_id = p_form_id AND status = 'submitted';
$$;

GRANT EXECUTE ON FUNCTION public.get_form_response_count TO anon, authenticated;
