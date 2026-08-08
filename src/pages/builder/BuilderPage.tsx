import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formService } from '../../services/formService';
import { useAutosave } from '../../hooks/useAutosave';
import { useToast } from '../../hooks/useToast';
import { Form, FormQuestion, QuestionType } from '../../types/forms';
import { MexoToastContainer } from '../../components/common/MexoToast';
import { QuestionCard } from '../../components/builder/QuestionCard';
import { AutosaveIndicator } from '../../components/builder/AutosaveIndicator';
import { QuickOwnerControls } from '../../components/publishing/QuickOwnerControls';
import { PublishModal } from '../../components/publishing/PublishModal';
import { PreviewModal } from '../../components/builder/PreviewModal';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoSkeleton } from '../../components/common/MexoSkeleton';
import { ShareFormModal } from '../../components/forms/ShareFormModal';
import {
  ArrowLeft, Plus, Eye, Globe, Settings, ChevronDown,
  Type, AlignLeft, AtSign, Phone, Hash, Circle,
  CheckSquare, List, ToggleLeft, Star, Sliders, Calendar, Clock, Upload, Layers, Share2,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ReactNode; group: string }[] = [
  { type: 'short_text', label: 'Short Text', icon: <Type className="w-4 h-4" />, group: 'Basic' },
  { type: 'long_text', label: 'Long Text', icon: <AlignLeft className="w-4 h-4" />, group: 'Basic' },
  { type: 'email', label: 'Email', icon: <AtSign className="w-4 h-4" />, group: 'Basic' },
  { type: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" />, group: 'Basic' },
  { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" />, group: 'Basic' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: <Circle className="w-4 h-4" />, group: 'Choice' },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" />, group: 'Choice' },
  { type: 'dropdown', label: 'Dropdown', icon: <List className="w-4 h-4" />, group: 'Choice' },
  { type: 'yes_no', label: 'Yes / No', icon: <ToggleLeft className="w-4 h-4" />, group: 'Choice' },
  { type: 'rating', label: 'Rating', icon: <Star className="w-4 h-4" />, group: 'Scale' },
  { type: 'linear_scale', label: 'Linear Scale', icon: <Sliders className="w-4 h-4" />, group: 'Scale' },
  { type: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" />, group: 'Date & Time' },
  { type: 'time', label: 'Time', icon: <Clock className="w-4 h-4" />, group: 'Date & Time' },
  { type: 'file_upload', label: 'File Upload', icon: <Upload className="w-4 h-4" />, group: 'Basic' },
  { type: 'page_break', label: 'Page Break (New Page)', icon: <Layers className="w-4 h-4" />, group: 'Page & Layout' },
];

import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const BuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState<Form | null>(null);
  useDocumentTitle(form?.title || 'Untitled Form');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQId, setSelectedQId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [formData, setFormData] = useState<{ title: string; description: string } | null>(null);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Autosave
  const { saveStatus, saveNow } = useAutosave(id, formData, questions, !!form);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([formService.getForm(id), formService.getQuestions(id)]).then(([f, q]) => {
      if (!f) { navigate('/forms'); return; }
      setForm(f);
      setFormData({ title: f.title, description: f.description || '' });
      setQuestions(q);
      setLoading(false);
    });
  }, [id, navigate]);

  const handleTitleChange = useCallback((title: string) => {
    setFormData(prev => prev ? { ...prev, title } : null);
    setForm(prev => prev ? { ...prev, title } : null);
  }, []);

  const handleDescChange = useCallback((description: string) => {
    setFormData(prev => prev ? { ...prev, description } : null);
    setForm(prev => prev ? { ...prev, description } : null);
  }, []);

  const handleAddQuestion = async (type: QuestionType) => {
    if (!id) return;
    setAddingQuestion(true);
    const position = questions.length;
    const q = await formService.addQuestion(id, type, position);
    if (q) {
      setQuestions(prev => [...prev, q]);
      setSelectedQId(q.id);
      // Scroll to new question
      setTimeout(() => {
        document.getElementById(`question-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    setAddingQuestion(false);
  };

  const handleQuestionUpdate = useCallback((updatedQ: FormQuestion) => {
    setQuestions(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    formService.updateQuestion(updatedQ.id, updatedQ);
  }, []);

  const handleQuestionDelete = useCallback(async (questionId: string) => {
    await formService.deleteQuestion(questionId);
    setQuestions(prev => {
      const remaining = prev.filter(q => q.id !== questionId);
      // Re-order positions
      return remaining.map((q, i) => ({ ...q, position: i }));
    });
    if (selectedQId === questionId) setSelectedQId(null);
    addToast({ type: 'info', message: 'Question deleted' });
  }, [selectedQId, addToast]);

  const handleQuestionDuplicate = useCallback(async (question: FormQuestion) => {
    const dupe = await formService.duplicateQuestion(question);
    if (dupe) {
      setQuestions(prev => {
        const idx = prev.findIndex(q => q.id === question.id);
        const newArr = [...prev];
        newArr.splice(idx + 1, 0, dupe);
        return newArr.map((q, i) => ({ ...q, position: i }));
      });
      setSelectedQId(dupe.id);
    }
  }, []);

  const handleMoveQuestion = useCallback((questionId: string, direction: 'up' | 'down') => {
    setQuestions(prev => {
      const idx = prev.findIndex(q => q.id === questionId);
      if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === prev.length - 1)) return prev;
      const newArr = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
      const reordered = newArr.map((q, i) => ({ ...q, position: i }));
      formService.reorderQuestions(reordered.map(q => ({ id: q.id, position: q.position })));
      return reordered;
    });
  }, []);

  const handlePublished = useCallback((updatedForm: Form) => {
    setForm(updatedForm);
    setPublishOpen(false);
    addToast({ type: 'success', message: 'Form published successfully!' });
  }, [addToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <MexoSkeleton className="h-8 w-8 rounded-xl" />
          <MexoSkeleton className="h-6 w-64" />
        </div>
        {[...Array(3)].map((_, i) => <MexoSkeleton key={i} className="h-32 w-full rounded-2xl mb-4" />)}
      </div>
    );
  }

  if (!form) return null;

  const groups = ['Basic', 'Choice', 'Scale', 'Date & Time', 'Page & Layout'];

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      {/* Toolbar */}
      <header className="h-14 bg-white border-b border-app-border px-4 flex items-center justify-between sticky top-0 z-30 shadow-mexo-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            id="builder-back"
            onClick={async () => {
              await saveNow();
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/forms');
              }
            }}
            className="p-2 rounded-xl text-app-body hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-bold text-app-heading truncate max-w-[140px] sm:max-w-[300px]">{form.title}</p>
            <AutosaveIndicator status={saveStatus} isOnline={isOnline} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MexoButton
            id="builder-preview"
            variant="ghost"
            size="sm"
            leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => setPreviewOpen(true)}
          >
            <span className="hidden sm:inline">Preview</span>
          </MexoButton>

          <MexoButton
            id="builder-settings"
            variant="ghost"
            size="sm"
            leftIcon={<Settings className="w-4 h-4" />}
            onClick={() => navigate(`/forms/${id}/settings`)}
          >
            <span className="hidden sm:inline">Settings</span>
          </MexoButton>

          {form.is_published ? (
            <div className="flex items-center gap-1.5">
              <MexoButton
                id="builder-share"
                variant="primary"
                size="sm"
                leftIcon={<Share2 className="w-4 h-4" />}
                onClick={() => navigate(`/forms/${id}/share`)}
              >
                Share
              </MexoButton>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="p-2 rounded-xl text-app-body hover:bg-slate-100 transition-colors border border-app-border cursor-pointer"
                    aria-label="More actions"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="w-48 bg-white rounded-2xl shadow-mexo-popover border border-app-border p-1.5 z-50 text-xs font-semibold"
                    align="end"
                  >
                    <DropdownMenu.Item
                      onClick={() => window.open(`/f/${form.slug}`, '_blank')}
                      className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer outline-none text-app-heading"
                    >
                      <Globe className="w-4 h-4 mr-2 text-[#7C3AED]" /> View Public Form
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`);
                        addToast({ type: 'success', message: 'Form link copied!' });
                      }}
                      className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer outline-none text-app-heading"
                    >
                      <Share2 className="w-4 h-4 mr-2 text-indigo-500" /> Copy Link
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={async () => {
                        const isResuming = !form.accepting_responses;
                        const updated = await formService.updateForm(form.id, {
                          accepting_responses: isResuming,
                          status: isResuming ? 'published' : 'closed',
                          manual_closed_at: isResuming ? (null as any) : new Date().toISOString(),
                          paused_at: isResuming ? (null as any) : new Date().toISOString(),
                        });
                        if (updated) {
                          setForm(updated);
                          addToast({
                            type: 'info',
                            message: updated.accepting_responses ? 'Responses resumed (LIVE)' : 'Responses paused',
                          });
                        }
                      }}
                      className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer outline-none text-app-heading"
                    >
                      <Clock className="w-4 h-4 mr-2 text-amber-500" />
                      {form.accepting_responses ? 'Pause Responses' : 'Resume Responses'}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={() => navigate(`/forms/${id}/settings`)}
                      className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer outline-none text-app-heading"
                    >
                      <Settings className="w-4 h-4 mr-2 text-slate-500" /> Form Settings
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          ) : (
            <MexoButton
              id="builder-publish"
              variant="primary"
              size="sm"
              leftIcon={<Globe className="w-4 h-4" />}
              onClick={() => setPublishOpen(true)}
            >
              Publish
            </MexoButton>
          )}
        </div>
      </header>

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700 text-center">
          ⚠ You're offline. Changes will sync when connection returns.
        </div>
      )}

      {/* Main canvas */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Quick Owner Status & Controls Header */}
        <QuickOwnerControls
          form={form}
          onUpdateForm={async updates => {
            const updated = await formService.updateForm(form.id, updates);
            if (updated) setForm(updated);
          }}
          onShareForm={() => navigate(`/forms/${id}/share`)}
        />

        {/* Form header editor */}
        <div className="bg-white rounded-2xl border border-app-border overflow-hidden shadow-mexo-card">
          <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8]" />
          <div className="p-5 sm:p-6 space-y-3">
            <textarea
              id="form-title-editor"
              value={formData?.title ?? ''}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Form title"
              rows={1}
              className="w-full text-xl sm:text-2xl font-extrabold text-app-heading placeholder-slate-300 outline-none resize-none border-none bg-transparent leading-tight"
              style={{ overflow: 'hidden' }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }}
            />
            <textarea
              id="form-description-editor"
              value={formData?.description ?? ''}
              onChange={e => handleDescChange(e.target.value)}
              placeholder="Form description (optional)"
              rows={1}
              className="w-full text-sm text-app-body placeholder-slate-300 outline-none resize-none border-none bg-transparent"
              style={{ overflow: 'hidden' }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }}
            />
          </div>
        </div>

        {/* Questions */}
        {questions.map((question, idx) => (
          <QuestionCard
            key={question.id}
            question={question}
            isSelected={selectedQId === question.id}
            index={idx}
            totalQuestions={questions.length}
            allQuestions={questions}
            onClick={() => setSelectedQId(selectedQId === question.id ? null : question.id)}
            onUpdate={handleQuestionUpdate}
            onDelete={() => handleQuestionDelete(question.id)}
            onDuplicate={() => handleQuestionDuplicate(question)}
            onMoveUp={() => handleMoveQuestion(question.id, 'up')}
            onMoveDown={() => handleMoveQuestion(question.id, 'down')}
          />
        ))}

        {/* Add Question Button */}
        <div className="flex justify-center py-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                id="add-question-btn"
                disabled={addingQuestion}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-indigo-200 text-sm font-semibold text-[#7C3AED] hover:border-indigo-400 hover:bg-indigo-50/50 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Question
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="w-64 bg-white rounded-2xl shadow-mexo-popover border border-app-border p-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto"
                sideOffset={8}
              >
                {groups.map(group => (
                  <div key={group} className="mb-2">
                    <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider px-2 py-1">{group}</p>
                    {QUESTION_TYPES.filter(qt => qt.group === group).map(qt => (
                      <DropdownMenu.Item
                        key={qt.type}
                        id={`add-question-${qt.type}`}
                        onClick={() => handleAddQuestion(qt.type)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-app-body hover:bg-indigo-50 hover:text-[#7C3AED] cursor-pointer outline-none transition-colors"
                      >
                        <span className="text-app-muted">{qt.icon}</span>
                        {qt.label}
                      </DropdownMenu.Item>
                    ))}
                  </div>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </main>

      {/* Modals */}
      {id && (
        <>
          <PublishModal
            open={publishOpen}
            onOpenChange={setPublishOpen}
            form={form}
            onSavePublishSettings={async (updates: Partial<Form>) => {
              const updated = await formService.updateForm(form.id, updates);
              if (updated) {
                setForm(updated);
                addToast({ type: 'success', message: 'Form published successfully!' });
              }
            }}
          />
          <PreviewModal
            open={previewOpen}
            form={form}
            questions={questions}
            onClose={() => setPreviewOpen(false)}
          />
          <ShareFormModal
            open={shareOpen}
            onOpenChange={setShareOpen}
            form={form}
          />
        </>
      )}

      <MexoToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};
