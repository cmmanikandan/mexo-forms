import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { useAuth } from '../../contexts/AuthContext';
import { Form, FormQuestion } from '../../types/forms';
import { PublicFormRenderer } from '../../components/public/PublicFormRenderer';
import { MexoSkeleton } from '../../components/common/MexoSkeleton';
import { MexoModal } from '../../components/common/MexoModal';
import {
  CheckCircle2, AlertCircle, XCircle, Award, Eye, Lock, LogIn, RefreshCw,
  Download, LogOut, ExternalLink, ShieldCheck, UserCheck, AlertTriangle,
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const PublicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  const [form, setForm] = useState<Form | null>(null);
  useDocumentTitle(form?.title || 'Form');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formStartedAt] = useState<number>(() => Date.now());
  const [startedAtISO] = useState<string>(() => new Date().toISOString());
  const [submittedPayload, setSubmittedPayload] = useState<{ question_id: string; answer_text?: string; answer_json?: any }[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false);

  useEffect(() => {
    if (!slug || authLoading) return;

    const load = async () => {
      setLoading(true);
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

      setForm(f);

      // Require valid Supabase Session & MEXO Profile for public form views
      if (!isAuthenticated || !session?.user?.id || !profile) {
        setLoading(false);
        return;
      }

      // Check one attempt per user
      if (f.one_response_per_user) {
        const hasResponded = await responseService.hasUserResponded(f.id, session.user.id, profile.primary_address);
        if (hasResponded) {
          setAlreadyResponded(true);
          setLoading(false);
          return;
        }
      }

      const q = await formService.getQuestions(f.id);
      setQuestions(q);
      setLoading(false);
    };

    load();
  }, [slug, isAuthenticated, session, profile, authLoading]);

  // Compute User Initials safely
  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    const f = (firstName || '').trim();
    const l = (lastName || '').trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return 'MX';
  };

  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username : '';
  const primaryEmail = profile?.primary_address || profile?.username || '';
  const initials = getInitials(profile?.first_name, profile?.last_name, primaryEmail);

  const handleSubmit = async (answers: { question_id: string; answer_text?: string; answer_json?: any }[]) => {
    if (!form || submitting) return;
    setSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await responseService.submitResponse(
        form.id,
        answers,
        session?.user?.id || profile?.id,
        profile?.primary_address,
        startedAtISO,
      );

      if (result.success) {
        setSubmittedPayload(answers);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`mexo_submitted_${form.id}`, result.responseId || 'true');
        }
        setSubmitted(true);
      } else {
        setSubmissionError(result.error || 'We couldn\'t submit your response. Please try again.');
        console.error('[MEXO FORMS] Submission error:', result.error);
      }
    } catch (err: any) {
      console.error('[MEXO FORMS] Submission exception:', err);
      setSubmissionError('We couldn\'t submit your response. Please try again.');
    } finally {
      setSubmitting(false);
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

  // Loading Skeleton State
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-3xl p-6 border border-app-border shadow-mexo-card space-y-4">
          <div className="flex items-center justify-between">
            <MexoSkeleton className="h-6 w-36 rounded-xl" />
            <MexoSkeleton className="h-8 w-8 rounded-full" />
          </div>
          <MexoSkeleton className="h-8 w-64 mb-4 rounded-xl" />
          {[...Array(4)].map((_, i) => <MexoSkeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> Show clean MEXO authentication-required screen
  if (!isAuthenticated || !session?.user?.id || !profile) {
    const currentFormUrl = `/f/${slug}`;
    const signinUrl = `/signin?redirect=${encodeURIComponent(currentFormUrl)}`;

    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
        {/* Top Header */}
        <div className="w-full max-w-md flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MEXO Forms" className="w-6 h-6 object-contain" />
            <span className="text-sm font-extrabold text-app-heading">MEXO Forms</span>
          </div>
        </div>

        {/* Clean Auth Card */}
        <div className="w-full max-w-md bg-white rounded-3xl border border-app-border shadow-mexo-card p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8 text-[#7C3AED]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-app-heading">Authentication Required</h1>
            <p className="text-xs text-app-body leading-relaxed">
              {form ? (
                <>To view and respond to <span className="font-bold text-app-heading">{form.title}</span>, please sign in with your MEXO Account.</>
              ) : (
                <>Respondents sign in with their MEXO Account before submitting forms.</>
              )}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              id="mexo-signin-required-btn"
              onClick={() => navigate(signinUrl)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 transition-all shadow-sm active:scale-[0.99]"
            >
              <LogIn className="w-4 h-4" /> Sign In to MEXO Account
            </button>

            <p className="text-[11px] text-app-muted">
              One Supabase MEXO identity is shared across MEXO Mail and MEXO Forms.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Form Error State
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

  // 3. Already Responded State
  if (alreadyResponded) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
        {/* Top Header */}
        <HeaderBar
          fullName={fullName}
          primaryEmail={primaryEmail}
          avatarUrl={profile.avatar_url}
          initials={initials}
          onOpenProfile={() => setProfileCardOpen(true)}
        />

        <div className="w-full max-w-md bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden mt-6">
          <div className="h-1.5 bg-amber-400" />
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-extrabold text-app-heading mb-2">You've already responded</h2>
            <p className="text-sm text-app-body mb-6">
              Your response to <span className="font-semibold text-app-heading">{form?.title}</span> has already been recorded with your MEXO account.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <ProfileModal
          open={profileCardOpen}
          onOpenChange={setProfileCardOpen}
          fullName={fullName}
          primaryEmail={primaryEmail}
          avatarUrl={profile.avatar_url}
          initials={initials}
          onSignOut={signOut}
        />
      </div>
    );
  }

  // 4. Post-Submit Confirmation Screen
  if (submitted) {
    const showScore = (form?.show_quiz_score ?? true) && quizResults.maxScore > 0;
    const allowReview = (form?.show_response_summary ?? true) && submittedPayload.length > 0;

    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
        {/* Header */}
        <HeaderBar
          fullName={fullName}
          primaryEmail={primaryEmail}
          avatarUrl={profile.avatar_url}
          initials={initials}
          onOpenProfile={() => setProfileCardOpen(true)}
        />

        <div className="w-full max-w-lg bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden mt-6">
          <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8]" />
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-extrabold text-app-heading mb-1">Response submitted</h2>
            <p className="text-xs text-app-body mb-6">
              Your response to <span className="font-bold text-app-heading">{form?.title}</span> has been recorded.
            </p>

            {/* Submitted Identity Box */}
            <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-3 text-left">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#0878e8] text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">
                  {initials}
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-app-muted block">Submitted as</span>
                <p className="text-xs font-bold text-app-heading">{fullName}</p>
                <p className="text-[11px] text-app-muted font-mono">{primaryEmail}</p>
              </div>
            </div>

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

            {/* Download Attachment */}
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

              {/* Submit another response ONLY if one_response_per_user is FALSE */}
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

        {/* Breakdown Modal */}
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
              </div>
            ))}
          </div>
        </MexoModal>

        <ProfileModal
          open={profileCardOpen}
          onOpenChange={setProfileCardOpen}
          fullName={fullName}
          primaryEmail={primaryEmail}
          avatarUrl={profile.avatar_url}
          initials={initials}
          onSignOut={signOut}
        />
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-app-bg py-4 sm:py-6 px-3 sm:px-4 flex flex-col items-center">
      {/* 1. Header Bar */}
      <HeaderBar
        fullName={fullName}
        primaryEmail={primaryEmail}
        avatarUrl={profile.avatar_url}
        initials={initials}
        onOpenProfile={() => setProfileCardOpen(true)}
      />

      {/* 2. Main Form Container */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden mt-4">
        {/* Compact Identity Banner above form */}
        <div className="px-6 sm:px-8 pt-5 pb-1">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#0878e8] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
                  {initials}
                </div>
              )}
              <div className="min-w-0 text-xs">
                <span className="text-app-muted block text-[10px] font-semibold">Responding as</span>
                <div className="truncate font-bold text-app-heading">{fullName}</div>
                <div className="truncate text-app-muted text-[11px] font-mono">{primaryEmail}</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-[#7C3AED] text-[10px] font-extrabold border border-purple-100 flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3 h-3" /> MEXO Verified
            </span>
          </div>
        </div>

        {/* Submission Error Banner */}
        {submissionError && (
          <div className="mx-6 sm:mx-8 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{submissionError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(submissionError.includes('Authentication') || submissionError.includes('session') || submissionError.includes('AUTH_SESSION_MISSING')) && (
                <button
                  onClick={() => navigate(`/signin?redirect=${encodeURIComponent(`/f/${slug}`)}`)}
                  className="px-3 py-1 rounded-xl bg-[#7C3AED] text-white text-[11px] font-bold hover:bg-[#6D28D9] transition-colors"
                >
                  Sign In Again
                </button>
              )}
              <button
                onClick={() => setSubmissionError(null)}
                className="px-3 py-1 rounded-xl bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <PublicFormRenderer
          form={form}
          questions={questions}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>

      <ProfileModal
        open={profileCardOpen}
        onOpenChange={setProfileCardOpen}
        fullName={fullName}
        primaryEmail={primaryEmail}
        avatarUrl={profile.avatar_url}
        initials={initials}
        onSignOut={signOut}
      />
    </div>
  );
};

// =============================================
// Header Bar Component
// =============================================
interface HeaderBarProps {
  fullName: string;
  primaryEmail: string;
  avatarUrl?: string;
  initials: string;
  onOpenProfile: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ fullName, primaryEmail, avatarUrl, initials, onOpenProfile }) => {
  return (
    <div className="w-full max-w-2xl flex items-center justify-between px-2 py-1">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="MEXO Forms" className="w-5 h-5 object-contain" />
        <span className="text-xs font-extrabold text-app-heading">MEXO Forms</span>
      </div>

      {/* DP Profile Header */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-full bg-white border border-app-border shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
        title="View MEXO Profile"
      >
        {/* Desktop text */}
        <div className="hidden sm:flex flex-col text-right leading-tight min-w-0 pr-1">
          <span className="text-xs font-bold text-app-heading truncate max-w-[140px]">{fullName}</span>
          <span className="text-[10px] text-app-muted font-mono truncate max-w-[140px]">{primaryEmail}</span>
        </div>

        {/* Avatar DP */}
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 shrink-0" />
        ) : (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#0878e8] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
            {initials}
          </div>
        )}
      </button>
    </div>
  );
};

// =============================================
// Profile Popover / Modal Card
// =============================================
interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullName: string;
  primaryEmail: string;
  avatarUrl?: string;
  initials: string;
  onSignOut: () => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange, fullName, primaryEmail, avatarUrl, initials, onSignOut }) => {
  const mailUrl = (import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app';

  return (
    <MexoModal open={open} onOpenChange={onOpenChange} title="MEXO Account Profile" maxWidth="max-w-xs">
      <div className="text-center py-2 space-y-4">
        {/* Profile DP */}
        <div className="relative inline-block">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 mx-auto shadow-md" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white flex items-center justify-center font-black text-xl mx-auto shadow-md">
              {initials}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Active" />
        </div>

        {/* Identity Details */}
        <div>
          <h3 className="text-sm font-extrabold text-app-heading">{fullName}</h3>
          <p className="text-xs text-app-muted font-mono mt-0.5">{primaryEmail}</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full mt-2">
            <UserCheck className="w-3 h-3" /> Signed in with MEXO
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <a
            href={mailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-app-border text-xs font-bold text-app-heading hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#7C3AED]" /> Manage Account
          </a>

          <button
            type="button"
            onClick={async () => {
              onOpenChange(false);
              await onSignOut();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>
    </MexoModal>
  );
};
