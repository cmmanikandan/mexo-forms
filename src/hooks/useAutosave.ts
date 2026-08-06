import { useState, useEffect, useRef, useCallback } from 'react';
import { formService } from '../services/formService';
import { FormQuestion } from '../types/forms';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutosave(
  formId: string | undefined,
  data: { title?: string; description?: string } | null,
  questions: FormQuestion[],
  enabled: boolean = true
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');
  const isOnline = useRef(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => { isOnline.current = true; };
    const handleOffline = () => { isOnline.current = false; };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const save = useCallback(async () => {
    if (!formId || !data || !enabled) return;
    if (!isOnline.current) {
      setSaveStatus('error');
      return;
    }

    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;

    setSaveStatus('saving');
    try {
      await formService.updateForm(formId, data);
      lastSavedRef.current = serialized;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    }
  }, [formId, data, enabled]);

  useEffect(() => {
    if (!enabled || !formId || !data) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data, save, enabled, formId]);

  const saveNow = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await save();
  }, [save]);

  return { saveStatus, saveNow };
}
