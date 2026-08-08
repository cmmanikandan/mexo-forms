import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoSkeletonCard, MexoEmptyState } from '../../components/common/MexoSkeleton';
import { FormCard } from '../../components/forms/FormCard';
import { CreateFormModal } from '../../components/forms/CreateFormModal';
import { formService } from '../../services/formService';
import { Form } from '../../types/forms';
import { useToast } from '../../hooks/useToast';
import { MexoToastContainer } from '../../components/common/MexoToast';
import {
  Plus, FileText, MessageSquare, Users, Layout,
  ClipboardCheck, Zap,
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const QUICK_TEMPLATES = [
  { id: 'blank', label: 'Blank Form', icon: <FileText className="w-5 h-5" />, color: 'from-slate-400 to-slate-600' },
  { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-5 h-5" />, color: 'from-blue-400 to-blue-600' },
  { id: 'registration', label: 'Registration', icon: <Users className="w-5 h-5" />, color: 'from-emerald-400 to-emerald-600' },
  { id: 'quiz', label: 'Quiz', icon: <Zap className="w-5 h-5" />, color: 'from-amber-400 to-amber-600' },
  { id: 'survey', label: 'Survey', icon: <ClipboardCheck className="w-5 h-5" />, color: 'from-violet-400 to-violet-600' },
];

export const HomePage: React.FC = () => {
  useDocumentTitle('Dashboard');
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const rawName = profile?.first_name ? profile.first_name.trim().split(/\s+/)[0] : profile?.username || 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

  useEffect(() => {
    if (!profile) return;
    formService.getUserForms(profile.id).then(f => {
      setForms(f.slice(0, 6));
      setLoading(false);
    });
  }, [profile]);

  const handleFormCreated = (form: Form) => {
    setCreateOpen(false);
    navigate(`/forms/${form.id}/edit`);
  };

  const handleOpenCreate = (templateId: string = 'blank') => {
    setSelectedTemplateId(templateId);
    setCreateOpen(true);
  };

  const handleFormDeleted = (formId: string) => {
    setForms(prev => prev.filter(f => f.id !== formId));
  };

  const handleFormRestored = (restoredForm: Form) => {
    setForms(prev => {
      if (prev.some(f => f.id === restoredForm.id)) return prev;
      return [restoredForm, ...prev];
    });
  };

  const handleFormStarred = (formId: string, starred: boolean) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, is_starred: starred } : f));
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Card Header */}
        <div className="bg-white rounded-3xl border border-app-border p-6 sm:p-8 shadow-mexo-card flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-app-heading tracking-tight">
              {greeting}, <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent">{firstName}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-app-body mt-1.5 font-medium">
              Create forms, collect responses and understand your data.
            </p>
          </div>
          <MexoButton
            id="home-create-form"
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateOpen(true)}
            className="flex-shrink-0 shadow-md shadow-indigo-500/20"
          >
            Create Form
          </MexoButton>
        </div>

        {/* Quick start templates */}
        <div className="mb-10">
          <h2 className="text-sm font-bold text-app-heading mb-3">Start with a template</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {QUICK_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                id={`quick-template-${tmpl.id}`}
                onClick={() => handleOpenCreate(tmpl.id)}
                className="group flex flex-col items-center gap-2.5 p-4 bg-white rounded-2xl border border-app-border hover:border-indigo-200 hover:shadow-mexo-md transition-all text-center cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tmpl.color} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  {tmpl.icon}
                </div>
                <span className="text-xs font-semibold text-app-heading">{tmpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent forms */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-app-heading">Recent Forms</h2>
            {forms.length > 0 && (
              <button
                id="view-all-forms"
                onClick={() => navigate('/forms')}
                className="text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer"
              >
                View all →
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <MexoSkeletonCard key={i} />)}
            </div>
          ) : forms.length === 0 ? (
            <MexoEmptyState
              icon={<FileText className="w-8 h-8 text-app-muted" />}
              title="Create your first form"
              description="Collect registrations, feedback, surveys, quizzes and more with MEXO Forms."
              action={
                <div className="flex flex-col sm:flex-row gap-3">
                  <MexoButton id="empty-create-form" variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
                    Create Form
                  </MexoButton>
                  <MexoButton id="empty-browse-templates" variant="secondary" size="md" leftIcon={<Layout className="w-4 h-4" />} onClick={() => navigate('/templates')}>
                    Browse Templates
                  </MexoButton>
                </div>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {forms.map(f => (
                <FormCard
                  key={f.id}
                  form={f}
                  onDeleted={handleFormDeleted}
                  onRestored={handleFormRestored}
                  onStarred={handleFormStarred}
                  onShowToast={addToast}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleFormCreated}
        initialTemplateId={selectedTemplateId}
      />
      <MexoToastContainer toasts={toasts} removeToast={removeToast} />
    </AppShell>
  );
};
