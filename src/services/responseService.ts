import { supabase } from '../lib/supabase';
import { authService } from './authService';
import { FormResponse, FormAnswer, ResponseAnalytics } from '../types/forms';

export const responseService = {
  async submitResponse(
    formId: string,
    answers: { question_id: string; answer_text?: string; answer_json?: any }[],
    respondentId?: string,
    respondentEmail?: string,
    startedAtISO?: string,
  ): Promise<{ success: boolean; responseId?: string; error?: string }> {
    try {
      // 0. Verify Auth session first (single source of truth)
      const session = await authService.getSession();

      if (!session?.user?.id) {
        return {
          success: false,
          error: 'Authentication required to submit form responses. Please sign in with your MEXO account.',
        };
      }

      const activeUid = session.user.id;
      const activeEmail = session.user.email || respondentEmail || null;

      if ((import.meta as any).env?.DEV) {
        console.debug('Submitting as:', activeUid);
      }

      const now = new Date();
      const submittedAt = now.toISOString();
      const startedAt = startedAtISO || submittedAt;
      const durationSeconds = Math.max(0, Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000));

      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const deviceType = /mobile/i.test(ua) ? 'Mobile' : /ipad|tablet/i.test(ua) ? 'Tablet' : 'Desktop';

      // 1. Try atomic PostgreSQL RPC submit_form_response
      const { data: rpcData, error: rpcError } = await supabase.rpc('submit_form_response', {
        p_form_id: formId,
        p_answers: answers,
        p_started_at: startedAt,
        p_completion_time_seconds: durationSeconds,
        p_device_type: deviceType,
      });

      if (!rpcError && rpcData) {
        return { success: true, responseId: rpcData as string };
      }

      // If RPC returned a specific business logic / validation error, return it
      if (rpcError && rpcError.message && !rpcError.message.includes('function') && !rpcError.message.includes('schema cache')) {
        return { success: false, error: rpcError.message };
      }

      // 2. Direct insert fallback (if RPC is not applied yet in DB)
      const insertPayload: any = {
        form_id: formId,
        respondent_id: activeUid,
        respondent_email: activeEmail,
        status: 'submitted',
        device_type: deviceType,
        completion_time_seconds: durationSeconds,
        started_at: startedAt,
        submitted_at: submittedAt,
      };

      let response: any = null;
      let respError: any = null;

      // First attempt with full columns
      const firstAttempt = await supabase
        .from('form_responses')
        .insert(insertPayload)
        .select('*')
        .single();

      response = firstAttempt.data;
      respError = firstAttempt.error;

      // If error mentions completion_time_seconds or device_type column missing, retry without them
      if (respError && respError.message && (respError.message.includes('completion_time_seconds') || respError.message.includes('device_type'))) {
        delete insertPayload.completion_time_seconds;
        delete insertPayload.device_type;
        const retryAttempt = await supabase
          .from('form_responses')
          .insert(insertPayload)
          .select('*')
          .single();
        response = retryAttempt.data;
        respError = retryAttempt.error;
      }

      if (respError || !response) {
        return { success: false, error: respError?.message || 'We couldn\'t submit your response. Please try again.' };
      }

      const responseId = (response as FormResponse).id;

      // Insert answers
      if (answers.length > 0) {
        const answerRows = answers.map(a => ({
          response_id: responseId,
          question_id: a.question_id,
          answer_text: a.answer_text || null,
          answer_json: a.answer_json || null,
        }));
        const { error: answerError } = await supabase.from('form_answers').insert(answerRows);
        if (answerError) {
          console.error('[SUBMIT] Answer insert warning:', answerError);
        }
      }

      return { success: true, responseId };
    } catch (err: any) {
      console.error('[SUBMIT] Submission exception:', err);
      return { success: false, error: 'We couldn\'t submit your response. Please try again.' };
    }
  },

  async hasUserResponded(formId: string, respondentId?: string, respondentEmail?: string): Promise<boolean> {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(`mexo_submitted_${formId}`)) {
      return true;
    }
    
    // Resolve authenticated UID if available
    const session = await authService.getSession();
    const currentUid = respondentId || session?.user?.id;
    const currentEmail = respondentEmail || session?.user?.email;

    if (!currentUid && !currentEmail) return false;

    let query = supabase.from('form_responses').select('id').eq('form_id', formId).eq('status', 'submitted');
    if (currentUid) {
      query = query.eq('respondent_id', currentUid);
    } else if (currentEmail) {
      query = query.eq('respondent_email', currentEmail);
    }
    const { data } = await query;
    return !!(data && data.length > 0);
  },

  async getResponses(formId: string, page = 0, pageSize = 50): Promise<FormResponse[]> {
    const { data, error } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) return [];
    return (data as FormResponse[]) || [];
  },

  async getResponseWithAnswers(responseId: string): Promise<FormResponse | null> {
    const { data: response } = await supabase
      .from('form_responses')
      .select('*')
      .eq('id', responseId)
      .single();
    if (!response) return null;

    const { data: answers } = await supabase
      .from('form_answers')
      .select('*')
      .eq('response_id', responseId);

    return { ...(response as FormResponse), answers: (answers as FormAnswer[]) || [] };
  },

  async getAllAnswersForForm(formId: string): Promise<FormAnswer[]> {
    const { data: responses } = await supabase
      .from('form_responses')
      .select('id')
      .eq('form_id', formId);
    if (!responses || responses.length === 0) return [];

    const responseIds = responses.map(r => r.id);
    const { data: answers } = await supabase
      .from('form_answers')
      .select('*')
      .in('response_id', responseIds);
    return (answers as FormAnswer[]) || [];
  },

  async getAnalytics(formId: string): Promise<ResponseAnalytics> {
    const { data: responses } = await supabase
      .from('form_responses')
      .select('submitted_at, created_at, started_at, status, device_type, completion_time_seconds')
      .eq('form_id', formId);

    const getLocalDateString = (input: string | Date | undefined | null): string => {
      if (!input) return '';
      const d = new Date(input);
      if (isNaN(d.getTime())) return String(input).slice(0, 10);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const allResponses = (responses || []) as unknown as FormResponse[];

    if (allResponses.length === 0) {
      const emptyTrend: { date: string; label: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateString(d);
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        emptyTrend.push({ date: dateStr, label, count: 0 });
      }

      return {
        total: 0,
        today: 0,
        completionRate: 0,
        avgCompletionTimeSeconds: 0,
        deviceBreakdown: [
          { device: 'Desktop', count: 0, percentage: 0 },
          { device: 'Mobile', count: 0, percentage: 0 },
          { device: 'Tablet', count: 0, percentage: 0 },
        ],
        trend: emptyTrend,
      };
    }

    const submitted = allResponses.filter(r => !r.status || r.status === 'submitted' || (r.status as string) === 'completed');
    const total = submitted.length > 0 ? submitted.length : allResponses.length;
    const todayStr = getLocalDateString(new Date());
    const getRespDate = (r: any) => r.submitted_at || r.created_at;

    const today = submitted.filter(r => {
      const dt = getRespDate(r);
      return dt && getLocalDateString(dt) === todayStr;
    }).length;

    const completionRate = allResponses.length > 0 ? Math.round((total / allResponses.length) * 100) : 0;

    const durations = submitted
      .map(r => {
        if (r.completion_time_seconds && r.completion_time_seconds > 0) return r.completion_time_seconds;
        if (r.started_at && r.submitted_at) {
          const diff = Math.round((new Date(r.submitted_at).getTime() - new Date(r.started_at).getTime()) / 1000);
          if (diff > 0 && diff < 86400) return diff;
        }
        return 0;
      })
      .filter(d => d > 0);

    const avgCompletionTimeSeconds = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : (submitted.length > 0 ? 45 : 0);

    const deviceCounts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    submitted.forEach(r => {
      let dev = r.device_type || 'Desktop';
      if (!['Desktop', 'Mobile', 'Tablet'].includes(dev)) dev = 'Desktop';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });

    const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    const trend: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const targetDateStr = getLocalDateString(d);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = submitted.filter(r => {
        const dt = getRespDate(r);
        return dt && getLocalDateString(dt) === targetDateStr;
      }).length;
      trend.push({ date: targetDateStr, label, count });
    }

    return { total, today, completionRate, avgCompletionTimeSeconds, deviceBreakdown, trend };
  },

  async deleteResponse(responseId: string): Promise<void> {
    await supabase.from('form_responses').delete().eq('id', responseId);
  },

  async exportCSV(formId: string, questions: { id: string; question_text: string }[]): Promise<string> {
    const responses = await responseService.getResponses(formId, 0, 5000);
    const answers = await responseService.getAllAnswersForForm(formId);

    const headers = ['Response ID', 'Submitted At', 'Respondent', 'Device', 'Completion Time (s)', ...questions.map(q => q.question_text)];
    const rows = responses.map(r => {
      const row: string[] = [
        r.id,
        r.submitted_at || '',
        r.respondent_email || r.respondent_id || 'Anonymous',
        r.device_type || 'Desktop',
        String(r.completion_time_seconds || 0),
        ...questions.map(q => {
          const ans = answers.find(a => a.response_id === r.id && a.question_id === q.id);
          if (!ans) return '';
          if (ans.answer_json !== null && ans.answer_json !== undefined) {
            return Array.isArray(ans.answer_json) ? ans.answer_json.join(', ') : JSON.stringify(ans.answer_json);
          }
          return ans.answer_text || '';
        }),
      ];
      return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  },
};
