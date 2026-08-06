import { supabase } from '../lib/supabase';
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
      const now = new Date();
      const submittedAt = now.toISOString();
      const startedAt = startedAtISO || submittedAt;
      const durationSeconds = Math.max(1, Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000));

      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const deviceType = /mobile/i.test(ua) ? 'Mobile' : /ipad|tablet/i.test(ua) ? 'Tablet' : 'Desktop';

      const { data: response, error: respError } = await supabase
        .from('form_responses')
        .insert({
          form_id: formId,
          respondent_id: respondentId || null,
          respondent_email: respondentEmail || null,
          status: 'submitted',
          device_type: deviceType,
          completion_time_seconds: durationSeconds,
          started_at: startedAt,
          submitted_at: submittedAt,
        })
        .select('*')
        .single();

      if (respError || !response) {
        return { success: false, error: respError?.message || 'Failed to submit response' };
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
          console.error('Answer insert error:', answerError);
        }
      }

      return { success: true, responseId };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Submission failed' };
    }
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
      .eq('form_id', formId)
      .eq('status', 'submitted');
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
      .select('submitted_at, started_at, status, device_type, completion_time_seconds')
      .eq('form_id', formId);

    if (!responses || responses.length === 0) {
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
        trend: [],
      };
    }

    const submitted = responses.filter(r => r.status === 'submitted');
    const total = submitted.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const today = submitted.filter(r => r.submitted_at?.startsWith(todayStr)).length;
    const completionRate = responses.length > 0 ? Math.round((total / responses.length) * 100) : 0;

    // Average completion time
    const durations = submitted
      .map(r => r.completion_time_seconds || 0)
      .filter(d => d > 0);
    const avgCompletionTimeSeconds = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 45; // Default estimate if legacy

    // Device breakdown
    const deviceCounts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    submitted.forEach(r => {
      const dev = r.device_type || 'Desktop';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });

    const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    // Trend: last 7 days
    const trend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = submitted.filter(r => r.submitted_at?.startsWith(dateStr)).length;
      trend.push({ date: dateStr, count });
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
