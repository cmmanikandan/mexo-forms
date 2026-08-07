import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoSkeletonCard, MexoEmptyState } from '../../components/common/MexoSkeleton';
import { FormCard } from '../../components/forms/FormCard';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { useAuth } from '../../contexts/AuthContext';
import { Form } from '../../types/forms';
import {
  Share2, RefreshCw, Search, Users, CheckCircle2, Calendar, ExternalLink, Ticket, FileText, UserCheck, Eye,
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

interface SubmittedFormItem {
  response_id: string;
  form_id: string;
  form_title: string;
  form_description: string;
  form_slug: string;
  form_mode: string;
  registration_ref: string;
  submitted_at: string;
  owner_name: string;
  owner_email: string;
}

export const SharedPage: React.FC = () => {
  useDocumentTitle('Shared & Submitted — MEXO Forms');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'submitted' | 'collaborations'>('submitted');
  const [sharedForms, setSharedForms] = useState<Form[]>([]);
  const [submittedItems, setSubmittedItems] = useState<SubmittedFormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sharedList, submittedList] = await Promise.all([
        formService.getSharedForms(user.id),
        responseService.getUserSubmittedForms(user.id),
      ]);
      setSharedForms(sharedList);
      setSubmittedItems(submittedList);
    } catch (e) {
      console.error('[SHARED] Error loading shared data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const filteredSubmitted = submittedItems.filter(item =>
    item.form_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.registration_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.owner_name && item.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCollaborations = sharedForms.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading flex items-center gap-2 tracking-tight">
              <Share2 className="w-6 h-6 text-[#7C3AED]" /> Shared & Submitted Forms
            </h1>
            <p className="text-xs text-app-muted mt-1">
              View forms you answered and forms shared with you for collaboration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl border border-app-border text-app-muted hover:text-app-heading hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <MexoButton variant="secondary" size="sm" onClick={() => navigate('/forms')}>
              My Created Forms
            </MexoButton>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 border-b border-app-border pb-3">
          <button
            onClick={() => setActiveTab('submitted')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'submitted'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#0878e8] text-white shadow-xs'
                : 'bg-white border border-app-border text-app-body hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>My Submitted Responses ({submittedItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('collaborations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'collaborations'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#0878e8] text-white shadow-xs'
                : 'bg-white border border-app-border text-app-body hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Shared Collaborations ({sharedForms.length})</span>
          </button>
        </div>

        {/* Search */}
        {(submittedItems.length > 0 || sharedForms.length > 0) && (
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-app-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'submitted' ? 'Search submitted forms or reference ID...' : 'Search shared forms...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-app-border rounded-xl pl-9 pr-4 py-2 text-xs text-app-heading placeholder-app-muted outline-none focus:border-[#7C3AED]"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <MexoSkeletonCard key={n} />
            ))}
          </div>
        ) : activeTab === 'submitted' ? (
          filteredSubmitted.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubmitted.map((item) => (
                <div
                  key={item.response_id}
                  className="bg-white rounded-3xl border border-app-border p-5 shadow-mexo-card hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-100 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Submitted
                      </span>
                      {item.registration_ref && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-[#7C3AED] text-[10px] font-mono font-bold border border-purple-100 flex items-center gap-1">
                          <Ticket className="w-2.5 h-2.5" /> {item.registration_ref}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-app-heading line-clamp-1">{item.form_title}</h3>
                      {item.form_description && (
                        <p className="text-xs text-app-muted line-clamp-2 mt-1">{item.form_description}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-app-muted font-medium">
                      <div className="flex items-center gap-1 truncate">
                        <UserCheck className="w-3 h-3 text-[#7C3AED] shrink-0" />
                        <span className="truncate">{item.owner_name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(item.submitted_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`/forms/public/${item.form_slug}`, '_blank')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-app-heading text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#7C3AED]" /> Open Form
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <MexoEmptyState
              icon={<CheckCircle2 className="w-10 h-10 text-emerald-500/50" />}
              title={searchQuery ? "No matching submitted forms" : "No submitted forms yet"}
              description={
                searchQuery
                  ? `No submitted responses match "${searchQuery}".`
                  : "When you answer and submit public MEXO Forms, your completed responses will appear here."
              }
              action={
                <MexoButton variant="secondary" size="sm" onClick={() => navigate('/forms')}>
                  View My Created Forms
                </MexoButton>
              }
            />
          )
        ) : filteredCollaborations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCollaborations.map((form) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>
        ) : (
          <MexoEmptyState
            icon={<Share2 className="w-10 h-10 text-[#7C3AED]/50" />}
            title={searchQuery ? "No matching shared forms" : "No shared collaborations yet"}
            description={
              searchQuery
                ? `No shared forms match "${searchQuery}".`
                : "When another MEXO user invites you to collaborate on a form, it will appear here."
            }
            action={
              <MexoButton variant="secondary" size="sm" onClick={() => navigate('/forms')}>
                View My Created Forms
              </MexoButton>
            }
          />
        )}
      </div>
    </AppShell>
  );
};
