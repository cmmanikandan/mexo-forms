import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { useAuth } from '../../contexts/AuthContext';
import { Form, FormQuestion } from '../../types/forms';
import { PublicFormRenderer } from '../../components/public/PublicFormRenderer';
import { MexoSkeleton } from '../../components/common/MexoSkeleton';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const PublicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [form, setForm] = useState<Form | null>(null);
  useDocumentTitle(form?.title || 'Form');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const f = await formService.getFormBySlug(slug);
      if (!f) {
        setError('Form not found or no longer available.');
        setLoading(false);
        return;
      }
      if (!f.is_published || f.status !== 'published') {
        setError('This form is not currently available.');
        setLoading(false);
        return;
      }
      if (!f.accepting_responses) {
        setError('This form is no longer accepting responses.');
        setLoading(false);
        return;
      }

      const q = await formService.getQuestions(f.id);
      setForm(f);
      setQuestions(q);
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleSubmit = async (answers: { question_id: string; answer_text?: string; answer_json?: any }[]) => {
    if (!form) return;
    setSubmitting(true);
    const result = await responseService.submitResponse(
      form.id,
      answers,
      profile?.id,
      profile?.primary_address,
      startedAt,
    );
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      alert(result.error || 'Submission failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <MexoSkeleton className="h-8 w-64 mb-4" />
          {[...Array(4)].map((_, i) => <MexoSkeleton key={i} className="h-24 w-full rounded-2xl mb-4" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-app-heading mb-2">Form Unavailable</h2>
          <p className="text-sm text-app-body">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8]" />
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-extrabold text-app-heading mb-2">Response Submitted!</h2>
            <p className="text-sm text-app-body mb-6">
              {form?.confirmation_message || 'Thank you for your response!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {form?.accepting_responses && (
                <button
                  id="submit-another"
                  onClick={() => { setSubmitted(false); window.scrollTo(0, 0); }}
                  className="px-5 py-2.5 rounded-xl border border-app-border text-sm font-semibold text-app-heading hover:bg-slate-50 transition-colors"
                >
                  Submit another response
                </button>
              )}
              <button
                id="done-btn"
                onClick={() => {
                  try {
                    window.close();
                  } catch (e) {
                    // Ignored
                  }
                  setTimeout(() => {
                    navigate('/home');
                  }, 100);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
          <div className="px-8 py-4 border-t border-app-border bg-slate-50/50 flex items-center justify-center gap-2 text-[11px] text-app-muted">
            <img src="/logo.png" alt="MEXO Forms" className="w-4 h-4 object-contain" />
            Powered by <span className="font-bold text-app-heading">MEXO Forms</span>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-app-bg py-6 px-4">
      {/* MEXO Forms header (minimal) */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <img src="/logo.png" alt="MEXO Forms" className="w-5 h-5 object-contain" />
        <span className="text-xs font-bold text-app-muted">MEXO Forms</span>
      </div>

      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden">
        <PublicFormRenderer
          form={form}
          questions={questions}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  );
};
