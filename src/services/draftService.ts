import { supabase } from '../lib/supabase';

export interface FormDraft {
  id?: string;
  formId: string;
  userId: string;
  answers: Record<string, any>;
  currentPage: number;
  completionPercentage: number;
  version: number;
  updatedAt?: string;
  expiresAt?: string;
}

export interface DraftSaveResult {
  success: boolean;
  version?: number;
  updatedAt?: string;
  conflict?: boolean;
  serverAnswers?: Record<string, any>;
  serverVersion?: number;
  error?: string;
}

// Local storage key helper
const localKey = (formId: string, userId: string) =>
  `mexo_form_draft:${formId}:${userId}`;

export const draftService = {
  // =============================================
  // LOCAL STORAGE (offline safety layer)
  // =============================================

  saveLocal(formId: string, userId: string, draft: Partial<FormDraft>): void {
    try {
      const key = localKey(formId, userId);
      const existing = draftService.getLocal(formId, userId);
      const payload = {
        ...existing,
        ...draft,
        formId,
        userId,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      // Storage may be full or unavailable — fail silently
    }
  },

  getLocal(formId: string, userId: string): Partial<FormDraft> | null {
    try {
      const key = localKey(formId, userId);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  removeLocal(formId: string, userId: string): void {
    try {
      localStorage.removeItem(localKey(formId, userId));
    } catch (e) {}
  },

  // Also clear legacy sessionStorage drafts (backwards compat)
  removeLegacySession(formId: string): void {
    try {
      sessionStorage.removeItem(`mexo_form_draft_${formId}`);
    } catch (e) {}
  },

  // =============================================
  // SUPABASE (persistent authenticated draft)
  // =============================================

  /** Load existing draft for this user+form from Supabase */
  async getDraft(formId: string): Promise<FormDraft | null> {
    try {
      const { data, error } = await supabase.rpc('get_form_draft', {
        p_form_id: formId,
      });

      if (error || !data) return null;

      return {
        formId,
        userId: '',  // filled in by caller from auth context
        answers: data.answers || {},
        currentPage: data.current_page || 0,
        completionPercentage: data.completion_percentage || 0,
        version: data.version || 1,
        updatedAt: data.updated_at,
        expiresAt: data.expires_at,
      };
    } catch (err) {
      console.warn('[DRAFT] getDraft error:', err);
      return null;
    }
  },

  /** Upsert draft — handles optimistic concurrency */
  async saveDraft(
    formId: string,
    answers: Record<string, any>,
    currentPage: number,
    completionPercentage: number,
    clientVersion: number,
  ): Promise<DraftSaveResult> {
    try {
      const { data, error } = await supabase.rpc('upsert_form_draft', {
        p_form_id: formId,
        p_answers: answers,
        p_current_page: currentPage,
        p_completion_percentage: completionPercentage,
        p_client_version: clientVersion,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'No response from server' };
      }

      // Conflict detected
      if (data.conflict === true) {
        return {
          success: false,
          conflict: true,
          serverAnswers: data.server_answers,
          serverVersion: data.server_version,
          error: 'Conflict: server has a newer version',
        };
      }

      return {
        success: true,
        version: data.version,
        updatedAt: data.updated_at,
      };
    } catch (err: any) {
      console.warn('[DRAFT] saveDraft error:', err);
      return { success: false, error: err?.message || 'Save failed' };
    }
  },

  /** Delete draft after successful submission */
  async deleteDraft(formId: string): Promise<void> {
    try {
      await supabase.rpc('delete_form_draft', { p_form_id: formId });
    } catch (err) {
      console.warn('[DRAFT] deleteDraft error:', err);
    }
  },

  /** Load draft with local-first fallback:
   *  1. Try Supabase
   *  2. Fallback to localStorage if offline
   *  3. Merge if localStorage is newer (by version) */
  async loadBestDraft(
    formId: string,
    userId: string,
  ): Promise<{ draft: FormDraft | null; source: 'supabase' | 'local' | 'none' }> {
    let supabaseDraft: FormDraft | null = null;
    let localDraft = draftService.getLocal(formId, userId);

    // Legacy sessionStorage migration
    try {
      const legacyStr = sessionStorage.getItem(`mexo_form_draft_${formId}`);
      if (legacyStr && !localDraft) {
        const parsed = JSON.parse(legacyStr);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          localDraft = {
            formId,
            userId,
            answers: parsed,
            currentPage: 0,
            completionPercentage: 0,
            version: 0,
          };
          // Migrate to new key
          draftService.saveLocal(formId, userId, localDraft);
          sessionStorage.removeItem(`mexo_form_draft_${formId}`);
        }
      }
    } catch (e) {}

    // Try Supabase
    try {
      supabaseDraft = await draftService.getDraft(formId);
    } catch (e) {
      // Offline — fall through to local
    }

    if (supabaseDraft && localDraft) {
      // Compare versions, prefer the newer
      const sbVersion = supabaseDraft.version || 0;
      const localVersion = localDraft.version || 0;
      if (localVersion > sbVersion) {
        // Local is newer — return local, it will be synced soon
        return { draft: localDraft as FormDraft, source: 'local' };
      }
      return { draft: supabaseDraft, source: 'supabase' };
    }

    if (supabaseDraft) return { draft: supabaseDraft, source: 'supabase' };
    if (localDraft && Object.keys(localDraft.answers || {}).length > 0) {
      return { draft: localDraft as FormDraft, source: 'local' };
    }

    return { draft: null, source: 'none' };
  },
};
