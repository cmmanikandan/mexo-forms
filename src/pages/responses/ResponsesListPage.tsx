import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { Form, FormResponse } from '../../types/forms';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoSkeleton, MexoEmptyState } from '../../components/common/MexoSkeleton';
import {
  ClipboardList, MessageSquare, ChevronRight, Search,
  Calendar, ExternalLink, ArrowUpRight, BarChart2, TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ResponsesListPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [recentResponses, setRecentResponses] = useState<{ response: FormResponse; formTitle: string; formId: string }[]>([]);
  const [totalResponseCount, setTotalResponseCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      setLoading(true);
      const userForms = await formService.getUserForms(profile.id);
      setForms(userForms);

      let total = 0;
      const recentList: { response: FormResponse; formTitle: string; formId: string }[] = [];

      for (const form of userForms) {
        total += form.response_count || 0;
        if (form.response_count && form.response_count > 0) {
          const resps = await responseService.getResponses(form.id, 0, 5);
          resps.forEach(r => {
            recentList.push({ response: r, formTitle: form.title, formId: form.id });
          });
        }
      }

      recentList.sort((a, b) => new Date(b.response.submitted_at || 0).getTime() - new Date(a.response.submitted_at || 0).getTime());
      setRecentResponses(recentList.slice(0, 10));
      setTotalResponseCount(total);
      setLoading(false);
    };

    loadData();
  }, [profile]);

  const filteredForms = useMemo(() => {
    let r = forms.filter(f => (f.response_count || 0) > 0 || f.is_published);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(f => f.title.toLowerCase().includes(q));
    }
    return r;
  }, [forms, search]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#7C3AED]" /> Responses Hub
            </h1>
            <p className="text-xs text-app-muted mt-1">View and analyze responses across all your forms.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <MexoSkeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <MexoSkeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-app-border p-5 shadow-mexo-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-app-muted">Total Responses</span>
                  <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-[#7C3AED] to-[#0878e8] bg-clip-text text-transparent">
                  {totalResponseCount}
                </p>
                <p className="text-[11px] text-app-muted mt-1">Across all created forms</p>
              </div>

              <div className="bg-white rounded-2xl border border-app-border p-5 shadow-mexo-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-app-muted">Active Forms</span>
                  <BarChart2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-extrabold text-app-heading">
                  {forms.filter(f => f.is_published).length}
                </p>
                <p className="text-[11px] text-app-muted mt-1">Accepting live submissions</p>
              </div>

              <div className="bg-white rounded-2xl border border-app-border p-5 shadow-mexo-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-app-muted">Total Forms Created</span>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-3xl font-extrabold text-app-heading">
                  {forms.length}
                </p>
                <p className="text-[11px] text-app-muted mt-1">In your MEXO account</p>
              </div>
            </div>

            {/* Forms with Responses */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-app-heading">Forms & Response Count</h2>
                <div className="relative max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter forms..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-app-border text-xs text-app-heading placeholder-app-muted outline-none focus:border-[#7C3AED] bg-white"
                  />
                </div>
              </div>

              {filteredForms.length === 0 ? (
                <MexoEmptyState
                  icon={<ClipboardList className="w-8 h-8 text-app-muted" />}
                  title="No responses recorded yet"
                  description="Publish your forms and share them to collect responses."
                  action={<MexoButton variant="primary" size="sm" onClick={() => navigate('/forms')}>Manage Forms</MexoButton>}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredForms.map(form => (
                    <div
                      key={form.id}
                      onClick={() => navigate(`/forms/${form.id}/responses`)}
                      className="group bg-white rounded-2xl border border-app-border hover:border-indigo-200 hover:shadow-mexo-md transition-all p-5 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-app-heading text-sm group-hover:text-[#7C3AED] transition-colors truncate">
                            {form.title}
                          </h3>
                          <ArrowUpRight className="w-4 h-4 text-app-muted group-hover:text-[#7C3AED] transition-colors flex-shrink-0" />
                        </div>
                        <p className="text-xs text-app-muted truncate mb-4">{form.description || 'No description'}</p>
                      </div>

                      <div className="pt-3 border-t border-app-border flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7C3AED] bg-indigo-50 px-2.5 py-1 rounded-full">
                          {form.response_count || 0} {form.response_count === 1 ? 'response' : 'responses'}
                        </span>
                        <span className="text-[11px] text-app-muted font-medium">View Analytics →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Submissions Feed */}
            {recentResponses.length > 0 && (
              <div className="bg-white rounded-3xl border border-app-border p-6 shadow-mexo-card">
                <h2 className="text-sm font-bold text-app-heading mb-4">Recent Submissions Feed</h2>
                <div className="divide-y divide-app-border">
                  {recentResponses.map(({ response, formTitle, formId }, i) => (
                    <div
                      key={response.id || i}
                      onClick={() => navigate(`/forms/${formId}/responses`)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-xl px-3 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#7C3AED] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          #{i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-app-heading truncate">{formTitle}</p>
                          <p className="text-[11px] text-app-muted truncate">
                            By {response.respondent_email || 'Anonymous respondent'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-app-muted font-medium flex-shrink-0 ml-3">
                        {response.submitted_at ? formatDistanceToNow(new Date(response.submitted_at), { addSuffix: true }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};
