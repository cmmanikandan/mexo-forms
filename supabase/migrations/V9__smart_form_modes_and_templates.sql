-- =============================================
-- MEXO Forms V9: Smart Form Modes & Registration Templates
-- =============================================

-- 1. Ensure form_mode column exists on public.forms
ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS form_mode TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'blank';

-- Migrate existing records
UPDATE public.forms
SET form_mode = 'quiz'
WHERE (form_mode IS NULL OR form_mode = 'standard')
  AND (form_type = 'quiz' OR form_mode = 'quiz');

UPDATE public.forms
SET form_mode = 'registration'
WHERE (form_mode IS NULL OR form_mode = 'standard')
  AND (event_name IS NOT NULL OR registration_prefix IS NOT NULL OR response_limit IS NOT NULL);

UPDATE public.forms
SET form_mode = 'standard'
WHERE form_mode IS NULL;

-- 2. Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_forms_mode ON public.forms(form_mode);
CREATE INDEX IF NOT EXISTS idx_forms_template_type ON public.forms(template_type);
