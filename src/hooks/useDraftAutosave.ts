import { useState, useEffect, useRef, useCallback } from 'react';
import { draftService, FormDraft } from '../services/draftService';

export type DraftSaveStatus =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'offline'
  | 'syncing'
  | 'conflict'
  | 'error';

interface UseDraftAutosaveOptions {
  formId: string | undefined;
  userId: string | undefined;
  /** Debounce delay in ms (default 1000) */
  debounceMs?: number;
  /** How often to force-save even without changes (ms, default 30000) */
  forceSaveIntervalMs?: number;
}

interface UseDraftAutosaveReturn {
  saveStatus: DraftSaveStatus;
  currentVersion: number;
  /** Call this whenever answers change — handles debounce internally */
  queueSave: (
    answers: Record<string, any>,
    currentPage: number,
    totalQuestions: number,
  ) => void;
  /** Force immediate save — call before submit */
  forceSave: (
    answers: Record<string, any>,
    currentPage: number,
    totalQuestions: number,
  ) => Promise<boolean>;
  /** Accept server version during conflict resolution */
  resolveConflict: (useServer: boolean, serverAnswers?: Record<string, any>) => void;
  conflictServerAnswers: Record<string, any> | null;
}

export function useDraftAutosave({
  formId,
  userId,
  debounceMs = 1000,
  forceSaveIntervalMs = 30000,
}: UseDraftAutosaveOptions): UseDraftAutosaveReturn {
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('idle');
  const [currentVersion, setCurrentVersion] = useState(1);
  const [conflictServerAnswers, setConflictServerAnswers] = useState<Record<string, any> | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAnswers = useRef<Record<string, any> | null>(null);
  const pendingPage = useRef<number>(0);
  const pendingTotal = useRef<number>(0);
  const isOnline = useRef<boolean>(navigator.onLine);
  const isSaving = useRef<boolean>(false);
  const forceSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track online/offline
  useEffect(() => {
    const onOnline = async () => {
      isOnline.current = true;
      // Sync any pending local-only changes back to Supabase
      if (pendingAnswers.current && formId && userId) {
        setSaveStatus('syncing');
        await performSave(pendingAnswers.current, pendingPage.current, pendingTotal.current);
      }
    };
    const onOffline = () => {
      isOnline.current = false;
      setSaveStatus('offline');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [formId, userId]);

  // Force-save interval (safety net for long forms)
  useEffect(() => {
    if (!formId || !userId) return;

    forceSaveTimer.current = setInterval(() => {
      if (pendingAnswers.current && isOnline.current && !isSaving.current) {
        performSave(pendingAnswers.current, pendingPage.current, pendingTotal.current);
      }
    }, forceSaveIntervalMs);

    return () => {
      if (forceSaveTimer.current) clearInterval(forceSaveTimer.current);
    };
  }, [formId, userId, forceSaveIntervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const performSave = useCallback(async (
    answers: Record<string, any>,
    currentPage: number,
    totalQuestions: number,
  ): Promise<boolean> => {
    if (!formId || !userId || isSaving.current) return false;

    isSaving.current = true;

    const answeredCount = Object.keys(answers).filter(k => {
      const v = answers[k];
      return v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0);
    }).length;
    const completionPct = totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

    // Always save to local first (offline safety layer)
    draftService.saveLocal(formId, userId, {
      answers,
      currentPage,
      completionPercentage: completionPct,
      version: currentVersion,
    });

    // If offline, show offline status and return
    if (!isOnline.current) {
      setSaveStatus('offline');
      isSaving.current = false;
      return false;
    }

    setSaveStatus('saving');

    const result = await draftService.saveDraft(
      formId,
      answers,
      currentPage,
      completionPct,
      currentVersion,
    );

    isSaving.current = false;

    if (result.success) {
      setCurrentVersion(prev => result.version ?? prev + 1);
      setSaveStatus('saved');
      // Auto-reset to idle after 2.5s
      setTimeout(() => setSaveStatus('idle'), 2500);
      return true;
    }

    if (result.conflict && result.serverAnswers) {
      setConflictServerAnswers(result.serverAnswers);
      setSaveStatus('conflict');
      return false;
    }

    // Save failed — show error but keep local copy safe
    setSaveStatus('error');
    setTimeout(() => setSaveStatus('idle'), 4000);
    return false;
  }, [formId, userId, currentVersion]);

  const queueSave = useCallback((
    answers: Record<string, any>,
    currentPage: number,
    totalQuestions: number,
  ) => {
    pendingAnswers.current = answers;
    pendingPage.current = currentPage;
    pendingTotal.current = totalQuestions;

    // Always save locally immediately
    if (formId && userId) {
      draftService.saveLocal(formId, userId, { answers, currentPage, version: currentVersion });
    }

    // Debounce Supabase save
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSave(answers, currentPage, totalQuestions);
    }, debounceMs);
  }, [formId, userId, debounceMs, currentVersion, performSave]);

  const forceSave = useCallback(async (
    answers: Record<string, any>,
    currentPage: number,
    totalQuestions: number,
  ): Promise<boolean> => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    return performSave(answers, currentPage, totalQuestions);
  }, [performSave]);

  const resolveConflict = useCallback((useServer: boolean, serverAnswers?: Record<string, any>) => {
    setConflictServerAnswers(null);
    setSaveStatus('idle');

    if (!useServer && pendingAnswers.current && formId && userId) {
      // Force-push local version regardless of server
      draftService.saveDraft(formId, pendingAnswers.current, pendingPage.current, 0, -1);
    }

    if (useServer && serverAnswers) {
      pendingAnswers.current = serverAnswers;
    }
  }, [formId, userId]);

  return {
    saveStatus,
    currentVersion,
    queueSave,
    forceSave,
    resolveConflict,
    conflictServerAnswers,
  };
}
