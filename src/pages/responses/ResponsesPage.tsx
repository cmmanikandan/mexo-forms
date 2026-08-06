import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { Form, FormQuestion, FormResponse, FormAnswer, ResponseAnalytics } from '../../types/forms';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoSkeleton } from '../../components/common/MexoSkeleton';
import { MexoEmptyState } from '../../components/common/MexoSkeleton';
import { ResponseSummaryTab } from '../../components/responses/ResponseSummaryTab';
import { ResponseTableTab } from '../../components/responses/ResponseTableTab';
import { ArrowLeft, Download, BarChart2, Table, User, RefreshCw } from 'lucide-react';

type Tab = 'summary' | 'individual' | 'table';

export const ResponsesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [answers, setAnswers] = useState<FormAnswer[]>([]);
  const [analytics, setAnalytics] = useState<ResponseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const [f, q, r, a, an] = await Promise.all([
      formService.getForm(id),
      formService.getQuestions(id),
      responseService.getResponses(id),
      responseService.getAllAnswersForForm(id),
      responseService.getAnalytics(id),
    ]);
    setForm(f);
    setQuestions(q);
    setResponses(r);
    setAnswers(a);
    setAnalytics(an);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleExportCSV = async () => {
    if (!id) return;
    setExporting(true);
    const csv = await responseService.exportCSV(id, questions.map(q => ({ id: q.id, question_text: q.question_text })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form?.title || 'responses'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Summary', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'individual', label: 'Individual', icon: <User className="w-4 h-4" /> },
    { id: 'table', label: 'Table', icon: <Table className="w-4 h-4" /> },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              id="responses-back"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(`/forms/${id}/edit`);
                }
              }}
              className="p-2 rounded-xl text-app-body hover:bg-slate-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-app-heading">{form?.title || 'Responses'}</h1>
              <p className="text-xs text-app-muted">{analytics?.total ?? 0} total responses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MexoButton
              id="refresh-responses"
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={loadData}
            >
              Refresh
            </MexoButton>
            <MexoButton
              id="export-csv"
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
              loading={exporting}
              disabled={responses.length === 0}
            >
              Export CSV
            </MexoButton>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <MexoSkeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <MexoSkeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Stats cards */}
            {analytics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Responses" value={analytics.total} color="from-[#7C3AED] to-[#6366F1]" />
                <StatCard label="Today" value={analytics.today} color="from-emerald-500 to-emerald-600" />
                <StatCard label="Completion Rate" value={`${analytics.completionRate}%`} color="from-blue-500 to-[#0878e8]" />
                <StatCard
                  label="Avg. Completion Time"
                  value={
                    analytics.avgCompletionTimeSeconds > 0
                      ? analytics.avgCompletionTimeSeconds < 60
                        ? `${analytics.avgCompletionTimeSeconds}s`
                        : `${Math.floor(analytics.avgCompletionTimeSeconds / 60)}m ${analytics.avgCompletionTimeSeconds % 60}s`
                      : '—'
                  }
                  color="from-violet-500 to-purple-600"
                />
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 mb-6 w-fit">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-app-heading shadow-mexo-sm'
                      : 'text-app-muted hover:text-app-body'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {responses.length === 0 ? (
              <MexoEmptyState
                icon={<BarChart2 className="w-8 h-8 text-app-muted" />}
                title="No responses yet"
                description="Share your form to start collecting responses."
                action={
                  form?.is_published ? (
                    <MexoButton
                      variant="primary"
                      size="sm"
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`); }}
                    >
                      Copy Form Link
                    </MexoButton>
                  ) : (
                    <MexoButton variant="primary" size="sm" onClick={() => navigate(`/forms/${id}/edit`)}>
                      Publish Form First
                    </MexoButton>
                  )
                }
              />
            ) : (
              <>
                {activeTab === 'summary' && (
                  <ResponseSummaryTab questions={questions} responses={responses} answers={answers} analytics={analytics} />
                )}
                {activeTab === 'individual' && (
                  <IndividualTab responses={responses} answers={answers} questions={questions} />
                )}
                {activeTab === 'table' && (
                  <ResponseTableTab questions={questions} responses={responses} answers={answers} />
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

const StatCard: React.FC<{ label: string; value: number | string; color: string }> = ({ label, value, color }) => (
  <div className="bg-white rounded-2xl border border-app-border p-4 sm:p-5">
    <div className={`text-2xl sm:text-3xl font-extrabold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-1`}>
      {value}
    </div>
    <p className="text-xs text-app-muted font-semibold">{label}</p>
  </div>
);

const IndividualTab: React.FC<{
  responses: FormResponse[];
  answers: FormAnswer[];
  questions: FormQuestion[];
}> = ({ responses, answers, questions }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const response = responses[selectedIdx];
  const responseAnswers = answers.filter(a => a.response_id === response?.id);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Response list */}
      <div className="bg-white rounded-2xl border border-app-border overflow-hidden">
        <div className="px-4 py-3 border-b border-app-border">
          <p className="text-xs font-bold text-app-heading">{responses.length} Responses</p>
        </div>
        <div className="overflow-y-auto max-h-[500px]">
          {responses.map((r, i) => (
            <button
              key={r.id}
              id={`individual-response-${i}`}
              onClick={() => setSelectedIdx(i)}
              className={`w-full flex items-start gap-2 px-4 py-3 border-b border-app-border text-left transition-colors ${
                selectedIdx === i ? 'bg-indigo-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-app-muted mt-0.5">
                {i + 1}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-app-heading truncate">
                  {r.respondent_email || 'Anonymous'}
                </p>
                <p className="text-[11px] text-app-muted">
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Response detail */}
      <div className="md:col-span-2 bg-white rounded-2xl border border-app-border overflow-hidden">
        <div className="px-5 py-3 border-b border-app-border flex items-center justify-between">
          <p className="text-xs font-bold text-app-heading">Response #{selectedIdx + 1}</p>
          <p className="text-[11px] text-app-muted">
            {response?.submitted_at ? new Date(response.submitted_at).toLocaleString() : ''}
          </p>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto max-h-[500px]">
          {questions.map(q => {
            const ans = responseAnswers.find(a => a.question_id === q.id);
            const answerDisplay = ans?.answer_text || (
              Array.isArray(ans?.answer_json) ? ans.answer_json.join(', ') :
              ans?.answer_json ? JSON.stringify(ans.answer_json) : '—'
            );
            return (
              <div key={q.id} className="border-b border-app-border pb-4 last:border-0 last:pb-0">
                <p className="text-xs font-semibold text-app-muted mb-1">{q.question_text}</p>
                <p className="text-sm text-app-heading">{answerDisplay}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
