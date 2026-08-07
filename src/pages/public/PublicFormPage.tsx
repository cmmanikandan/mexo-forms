import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { useAuth } from '../../contexts/AuthContext';
import { Form, FormQuestion } from '../../types/forms';
import { PublicFormRenderer } from '../../components/public/PublicFormRenderer';
import { MexoSkeleton } from '../../components/common/MexoSkeleton';
import { MexoModal } from '../../components/common/MexoModal';
import { CheckCircle2, AlertCircle, XCircle, Award, Eye, Lock, LogIn, RefreshCw, Download } from 'lucide-react';
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
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());
  const [submittedPayload, setSubmittedPayload] = useState<{ question_id: string; answer_text?: string; answer_json?: any }[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);

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

      // Check start date & expiration
      const now = new Date();
      if (f.starts_at && now < new Date(f.starts_at)) {
        setError(`This form is not open yet. Scheduled to open on ${new Date(f.starts_at).toLocaleString()}`);
        setLoading(false);
        return;
      }
      if (f.ends_at && now > new Date(f.ends_at)) {
        setError(`This form expired on ${new Date(f.ends_at).toLocaleString()} and is no longer accepting responses.`);
        setLoading(false);
        return;
      }

      // Check login requirement
      if (f.requires_login && !profile) {
        setForm(f);
        setLoading(false);
        return;
      }

      // Check one attempt per user
      if (f.one_response_per_user) {
        const hasResponded = await responseService.hasUserResponded(f.id, profile?.id, profile?.primary_address);
        if (hasResponded) {
          setForm(f);
          setAlreadyResponded(true);
          setLoading(false);
          return;
        }
      }

      const q = await formService.getQuestions(f.id);
      setForm(f);
      setQuestions(q);
      setLoading(false);
    };
    load();
  }, [slug, profile]);

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
      setSubmittedPayload(answers);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`mexo_submitted_${form.id}`, result.responseId || 'true');
      }
      setSubmitted(true);
    } else {
      alert(result.error || 'Submission failed. Please try again.');
    }
  };

  // Compute Quiz Score if applicable
  const computeQuizResults = () => {
    if (!questions || questions.length === 0 || submittedPayload.length === 0) {
      return { totalScore: 0, maxScore: 0, percentage: 0, details: [] };
    }

    let totalScore = 0;
    let maxScore = 0;

    const details = questions.map(q => {
      const ansObj = submittedPayload.find(a => a.question_id === q.id);
      const studentAnsText = ansObj?.answer_text;
      const studentAnsJson = ansObj?.answer_json;

      let isCorrect: boolean | undefined = undefined;
      let questionPoints = 0;
      let earnedPoints = 0;
      const correctOptions = (q.options || []).filter(o => o.is_correct);

      if (correctOptions.length > 0) {
        questionPoints = correctOptions.reduce((acc, o) => acc + (o.points || 1), 0);
        maxScore += questionPoints;

        if (q.question_type === 'multiple_choice' || q.question_type === 'dropdown' || q.question_type === 'yes_no') {
          const matchedOpt = (q.options || []).find(o => o.label === studentAnsText);
          if (matchedOpt && matchedOpt.is_correct) {
            isCorrect = true;
            earnedPoints = matchedOpt.points || 1;
            totalScore += earnedPoints;
          } else {
            isCorrect = false;
          }
        } else if (q.question_type === 'checkbox') {
          const selectedLabels = Array.isArray(studentAnsJson) ? studentAnsJson : [];
          const correctLabels = correctOptions.map(o => o.label);
          const allCorrectSelected = correctLabels.every(l => selectedLabels.includes(l));
          const noExtraSelected = selectedLabels.every(l => correctLabels.includes(l));
          if (allCorrectSelected && noExtraSelected) {
            isCorrect = true;
            earnedPoints = questionPoints;
            totalScore += earnedPoints;
          } else {
            isCorrect = false;
          }
        }
      }

      return {
        question: q,
        studentAnsText,
        studentAnsJson,
        isCorrect,
        questionPoints,
        earnedPoints,
        correctLabels: (q.options || []).filter(o => o.is_correct).map(o => o.label),
      };
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    return { totalScore, maxScore, percentage, details };
  };

  const quizResults = computeQuizResults();

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
        <div className="text-center max-w-sm bg-white p-8 rounded-3xl border border-app-border shadow-mexo-card">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-app-heading mb-2">Form Unavailable</h2>
          <p className="text-sm text-app-body mb-6">{error}</p>
          <button
            onClick={() => navigate('/home')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7C3AED]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Requires login notice
  if (form?.requires_login && !profile) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-app-border shadow-mexo-card">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <h2 className="text-xl font-extrabold text-app-heading mb-2">Authentication Required</h2>
          <p className="text-sm text-app-body mb-6">
            The creator of <span className="font-bold text-app-heading">{form.title}</span> requires respondents to sign in with a MEXO account.
          </p>
          <button
            onClick={() => navigate('/auth/login')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8]"
          >
            <LogIn className="w-4 h-4" /> Sign In to MEXO
          </button>
        </div>
      </div>
    );
  }

  // Already Responded notice (1 attempt only)
  if (alreadyResponded) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden">
          <div className="h-1.5 bg-amber-400" />
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-extrabold text-app-heading mb-2">Already Submitted</h2>
            <p className="text-sm text-app-body mb-6">
              You have already responded to <span className="font-semibold text-app-heading">{form?.title}</span>. Only 1 attempt per respondent is permitted.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8]"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Post-submit confirmation screen
  if (submitted) {
    const showScore = (form?.show_quiz_score ?? true) && quizResults.maxScore > 0;
    const allowReview = (form?.show_response_summary ?? true) && submittedPayload.length > 0;

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

            {/* Quiz Score Badge */}
            {showScore && (
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED] mb-1">
                  <Award className="w-4 h-4" /> Quiz Result
                </div>
                <div className="text-2xl font-black text-app-heading">
                  {quizResults.totalScore} / {quizResults.maxScore} <span className="text-sm font-semibold text-app-muted">points</span>
                </div>
                <div className="text-xs font-semibold text-emerald-600 mt-0.5">
                  Score: {quizResults.percentage}%
                </div>
              </div>
            )}

            {/* Post-submission Resource Attachment */}
            {form?.submission_attachment_url && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-app-border flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-[#7C3AED]" />
                  <div>
                    <p className="text-xs font-bold text-app-heading">{form.submission_attachment_name || 'Submission Resource / Answer Key'}</p>
                    <p className="text-[11px] text-app-muted">Attachment provided by form creator</p>
                  </div>
                </div>
                <a
                  href={form.submission_attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  Download
                </a>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 justify-center">
              {allowReview && (
                <button
                  id="view-answers-btn"
                  onClick={() => setReviewOpen(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-app-border text-sm font-semibold text-app-heading hover:bg-slate-50 transition-colors"
                >
                  <Eye className="w-4 h-4 text-[#7C3AED]" /> Review Answers & Details
                </button>
              )}

              {/* Submit another response ONLY if 1 attempt per user is FALSE */}
              {!form?.one_response_per_user && form?.accepting_responses && (
                <button
                  id="submit-another"
                  onClick={() => { setSubmitted(false); window.scrollTo(0, 0); }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-app-border text-sm font-semibold text-app-heading hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-app-muted" /> Submit another response
                </button>
              )}

              <button
                id="done-btn"
                onClick={() => {
                  try { window.close(); } catch (e) { /* ignore */ }
                  setTimeout(() => navigate('/home'), 100);
                }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity"
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

        {/* Answer Breakdown Review Modal */}
        <MexoModal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          title="Submitted Answers & Breakdown"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {quizResults.details.map((item, idx) => (
              <div key={item.question.id} className="p-4 rounded-2xl border border-app-border bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-bold text-app-heading">
                    {idx + 1}. {item.question.question_text}
                  </div>
                  {item.isCorrect !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex-shrink-0 ${item.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.isCorrect ? `✓ Correct (+${item.earnedPoints} pts)` : `✗ Incorrect (0 / ${item.questionPoints} pts)`}
                    </span>
                  )}
                </div>

                <div className="text-xs text-app-body">
                  <span className="font-semibold text-app-muted">Your answer: </span>
                  {item.studentAnsText || (Array.isArray(item.studentAnsJson) ? item.studentAnsJson.join(', ') : 'No answer provided')}
                </div>

                {item.isCorrect === false && item.correctLabels.length > 0 && (
                  <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    Correct answer: {item.correctLabels.join(', ')}
                  </div>
                )}

                {item.question.explanation && (
                  <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded-xl border border-purple-100 italic">
                    💡 Explanation: {item.question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </MexoModal>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-app-bg py-6 px-4">
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

