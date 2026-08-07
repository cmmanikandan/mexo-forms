-- =============================================
-- MEXO Forms V7: Attachment Display Mode Column
-- =============================================

ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS attachment_display_mode TEXT DEFAULT 'original';
