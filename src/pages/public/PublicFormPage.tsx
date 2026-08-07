import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { draftService } from '../../services/draftService';
import { useDraftAutosave } from '../../hooks/useDraftAutosave';
import { useAuth } from '../../contexts/AuthContext';
import { Form, FormQuestion } from '../../types/forms';
import { PublicFormRenderer } from '../../components/public/PublicFormRenderer';
import { FormActionsMenu } from '../../components/public/FormActionsMenu';
import { AboutMexoFormsModal } from '../../components/public/AboutMexoFormsModal';
import { DraftSaveIndicator } from '../../components/public/DraftSaveIndicator';
import { MexoSkeleton } from '../../components/common/MexoSkeleton';
import { MexoModal } from '../../components/common/MexoModal';
import { getFormAvailability } from '../../utils/formLifecycle';
import {
  CheckCircle2, AlertCircle, XCircle, Award, Eye, Lock, LogIn, RefreshCw,
  Download, LogOut, ExternalLink, ShieldCheck, UserCheck, AlertTriangle,
  Calendar, MapPin, Ticket, Mail, Clock, Users, ArrowLeft, GitMerge,
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

/* =============================================
   APPROVED MEXO ECOSYSTEM RETURN ORIGINS
   ============================================= */
const APPROVED_RETURN_ORIGINS = [
  'https://mexo-mail.vercel.app',
  'https://mail.mexo.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

function isSafeReturnUrl(url: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return APPROVED_RETURN_ORIGINS.some(o => {
      const origin = new URL(o);
      return parsed.origin === origin.origin;
    });
  } catch {
    // relative paths are safe
    return url.startsWith('/');
  }
}

function getReturnSource(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('mexo-mail') || parsed.hostname.includes('mail.mexo')) return 'MEXO Mail';
  } catch {}
  return null;
}

/* =============================================
   HELPERS
   ============================================= */
function formatDeadline(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString('en-IN', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export const PublicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, authStatus, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  const [form, setForm] = useState<Form | null>(null);
  useDocumentTitle(form?.title || 'Form');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftSource, setDraftSource] = useState<'supabase' | 'local' | 'none'>('none');
  const [error, setError] = useState<string | null>(null);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [registrationRef, setRegistrationRef] = useState<string>('');
  const [startedAtISO] = useState<string>(() => new Date().toISOString());
  const [submittedPayload, setSubmittedPayload] = useState<{ question_id: string; answer_text?: string; answer_json?: any }[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Live answers + current page tracking for autosave
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [restoredAnswers, setRestoredAnswers] = useState<Record<string, any>>({});
  const [restoredPage, setRestoredPage] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);

  // Autosave hook
  const {
    saveStatus,
    queueSave,
    forceSave,
    setVersion,
    resolveConflict,
    conflictServerAnswers,
  } = useDraftAutosave({
    formId: form?.id,
    userId: session?.user?.id,
    debounceMs: 1000,
  });

  // Leave Confirmation State
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const pendingLeaveAction = useRef<(() => void) | null>(null);

  // Return URL from query param (verified safe only)
  const searchParams = new URLSearchParams(location.search);
  const rawReturnTo = searchParams.get('return_to') || sessionStorage.getItem('mexo_form_return_to');
  const returnTo = isSafeReturnUrl(rawReturnTo) ? rawReturnTo : null;
  const returnSource = getReturnSource(returnTo);

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
      setForm(f);

      if (!isAuthenticated || !session?.user?.id || !profile) {
        setLoading(false);
        return;
      }

      // Check if already submitted (idempotency guard on refresh)
      if (f.one_response_per_user) {
        const submittedId = localStorage.getItem(`mexo_submitted_${f.id}`);
        if (submittedId) {
          const hasResponded = await responseService.hasUserResponded(f.id, session.user.id, profile.primary_address);
          if (hasResponded) {
            setAlreadyResponded(true);
            // Clean up any stale draft
            draftService.removeLocal(f.id, session.user.id);
            draftService.removeLegacySession(f.id);
            setLoading(false);
            return;
          }
        }
      }

      // Load best draft: Supabase > local > sessionStorage (legacy)
      const { draft, source } = await draftService.loadBestDraft(f.id, session.user.id);
      if (draft && Object.keys(draft.answers || {}).length > 0) {
        setRestoredAnswers(draft.answers);
        setCurrentAnswers(draft.answers);
        setRestoredPage(draft.currentPage || 0);
        if (draft.version) setVersion(draft.version);
        setHasDraft(true);
        setDraftSource(source);
      }

      const isOwner = session?.user?.id === f.owner_id;
      const q = await formService.getPublicQuestions(f.id, isOwner);
      setQuestions(q);
      setLoading(false);
    };
    load();
  }, [slug, isAuthenticated, session, profile, authLoading]);

  // Android / browser back button interception
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const answeredCount = Object.keys(currentAnswers).filter(k => {
        const v = currentAnswers[k];
        return v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0);
      }).length;
      if (answeredCount > 0 && !submitted) {
        e.preventDefault();
        history.pushState(null, '', location.pathname);
        pendingLeaveAction.current = () => navigate(-1);
        setLeaveConfirmOpen(true);
      }
    };
    history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentAnswers, submitted, navigate, location.pathname]);

  const handleAnswerChange = useCallback((answersMap: Record<string, any>, page?: number) => {
    setCurrentAnswers(answersMap);
    const pageNum = page ?? currentPage;
    setCurrentPage(pageNum);
    // Queue debounced autosave (local + Supabase)
    const totalNonPage = questions.filter(q => q.question_type !== 'page_break').length;
    queueSave(answersMap, pageNum, totalNonPage);
  }, [currentPage, questions, queueSave]);

  const handleClearAnswers = useCallback(() => {
    setCurrentAnswers({});
    setRestoredAnswers({});
    setRestoredPage(0);
    if (form?.id && session?.user?.id) {
      draftService.removeLocal(form.id, session.user.id);
      draftService.removeLegacySession(form.id);
      draftService.deleteDraft(form.id);
    }
  }, [form?.id, session?.user?.id]);

  const handleSaveProgress = useCallback(() => {
    if (!form?.id || !session?.user?.id) return;
    const totalNonPage = questions.filter(q => q.question_type !== 'page_break').length;
    forceSave(currentAnswers, currentPage, totalNonPage);
  }, [form?.id, session?.user?.id, currentAnswers, currentPage, questions, forceSave]);

  const handleSignInRedirect = () => {
    const returnTo = location.pathname + location.search + location.hash;
    sessionStorage.setItem('mexo_auth_return_to', returnTo);
    navigate(`/signin?redirect=${encodeURIComponent(returnTo)}`);
  };

  const handleClose = () => {
    const answeredCount = Object.keys(currentAnswers).filter(k => {
      const v = currentAnswers[k];
      return v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0);
    }).length;

    if (answeredCount > 0 && !submitted) {
      pendingLeaveAction.current = () => {
        if (returnTo) window.location.href = returnTo;
        else navigate('/home');
      };
      setLeaveConfirmOpen(true);
      return;
    }

    if (returnTo) window.location.href = returnTo;
    else navigate('/home');
  };

  // Compute User Initials
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

  const generateRegRef = (prefix = 'MXF') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefix}-${code}`;
  };

  const handleSubmit = async (answers: { question_id: string; answer_text?: string; answer_json?: any }[]) => {
    if (!form || submitting) return;

    const avail = getFormAvailability(form, form.response_count || 0);
    if (!avail.canSubmit) {
      setSubmissionError(`${avail.closedTitle}: ${avail.closedMessage}`);
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);

    // Step 1: Force-save latest answers before submitting
    const totalNonPage = questions.filter(q => q.question_type !== 'page_break').length;
    await forceSave(currentAnswers, currentPage, totalNonPage);

    const regRef = generateRegRef(form.registration_prefix || 'MXF');

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
        setRegistrationRef(regRef);
        setSubmittedAt(new Date());
        // Step 2: Cleanup draft & local backup
        try {
          localStorage.setItem(`mexo_submitted_${form.id}`, result.responseId || 'true');
        } catch (e) {}
        if (session?.user?.id) {
          draftService.removeLocal(form.id, session.user.id);
          draftService.removeLegacySession(form.id);
          // DB draft is deleted by submit_form_response RPC automatically
        }
        setCurrentAnswers({});
        setSubmitted(true);
      } else {
        // Draft is kept safe — user can retry
        setSubmissionError(result.error || "We couldn't submit your response. Please try again.");
      }
    } catch (err: any) {
      setSubmissionError("We couldn't submit your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute Quiz Score
  const computeQuizResults = () => {
    if (!questions || questions.length === 0 || submittedPayload.length === 0)
      return { totalScore: 0, maxScore: 0, percentage: 0, details: [] };

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
            isCorrect = true; earnedPoints = matchedOpt.points || 1; totalScore += earnedPoints;
          } else { isCorrect = false; }
        } else if (q.question_type === 'checkbox') {
          const selectedLabels = Array.isArray(studentAnsJson) ? studentAnsJson : [];
          const correctLabels = correctOptions.map(o => o.label);
          const allCorrectSelected = correctLabels.every(l => selectedLabels.includes(l));
          const noExtraSelected = selectedLabels.every(l => correctLabels.includes(l));
          if (allCorrectSelected && noExtraSelected) {
            isCorrect = true; earnedPoints = questionPoints; totalScore += earnedPoints;
          } else { isCorrect = false; }
        }
      }

      return {
        question: q, studentAnsText, studentAnsJson,
        isCorrect, questionPoints, earnedPoints,
        correctLabels: (q.options || []).filter(o => o.is_correct).map(o => o.label),
      };
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    return { totalScore, maxScore, percentage, details };
  };

  const quizResults = computeQuizResults();

  const answeredCount = Object.keys(currentAnswers).filter(k => {
    const v = currentAnswers[k];
    return v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0);
  }).length;

  // =============================================
  // LOADING SKELETON
  // =============================================
  if (loading || authLoading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-3xl p-6 border border-app-border shadow-mexo-card space-y-4">
          <div className="flex items-center justify-between">
            <MexoSkeleton className="h-6 w-36 rounded-xl" />
            <MexoSkeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex items-center justify-between text-xs text-app-muted font-semibold">
            <span>Loading your response...</span>
          </div>
          <MexoSkeleton className="h-8 w-64 mb-4 rounded-xl" />
          {[...Array(4)].map((_, i) => <MexoSkeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // =============================================
  // UNAUTHENTICATED
  // =============================================
  if (!isAuthenticated || !session?.user?.id || !profile) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MEXO Forms" className="w-6 h-6 object-contain" />
            <span className="text-sm font-extrabold text-app-heading">MEXO Forms</span>
          </div>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl border border-app-border shadow-mexo-card p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-app-heading">Sign In Required</h1>
            <p className="text-xs text-app-body leading-relaxed">
              {form ? (
                <>To respond to <span className="font-bold text-app-heading">{form.title}</span>, please sign in with your MEXO Account.</>
              ) : (
                <>MEXO Forms requires a MEXO Account to submit responses.</>
              )}
            </p>
          </div>
          <div className="pt-2 space-y-3">
            <button
              id="mexo-signin-required-btn"
              onClick={handleSignInRedirect}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Sign In to MEXO Account
            </button>
            <p className="text-[11px] text-app-muted">
              Your MEXO identity works across MEXO Mail & MEXO Forms.
            </p>
          </div>
        </div>

        <button onClick={() => setAboutOpen(true)} className="mt-4 flex items-center gap-1.5 text-[11px] text-app-muted hover:text-app-body transition-colors">
          <img src="/logo.png" alt="MEXO Forms" className="w-4 h-4 object-contain" />
          Powered by <span className="font-bold text-app-heading hover:underline">MEXO Forms</span>
        </button>
        <AboutMexoFormsModal open={aboutOpen} onOpenChange={setAboutOpen} />
      </div>
    );
  }

  // =============================================
  // ERROR STATE
  // =============================================
  if (error || !form) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm bg-white p-8 rounded-3xl border border-app-border shadow-mexo-card">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-app-heading mb-2">Form Unavailable</h2>
          <p className="text-sm text-app-body mb-6">{error || 'Form not found.'}</p>
          <button onClick={handleClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7C3AED]">
            {returnTo ? `Return to ${returnSource || 'Previous App'}` : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // =============================================
  // FORM AVAILABILITY CHECK (lifecycle states)
  // =============================================
  const availability = getFormAvailability(form, form.response_count || 0);

  if (!availability.canSubmit) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
        <HeaderBar
          fullName={fullName} primaryEmail={primaryEmail}
          avatarUrl={profile.avatar_url} initials={initials}
          onOpenProfile={() => setProfileCardOpen(true)}
          onClose={handleClose} returnSource={returnSource}
        />

        <div className="w-full max-w-md bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden mt-4">
          <div className={`h-1.5 ${
            availability.status === 'PAUSED' ? 'bg-amber-400' :
            availability.status === 'SCHEDULED' ? 'bg-indigo-500' : 'bg-rose-500'
          }`} />

          <div className="px-8 py-10 text-center space-y-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-xs ${
              availability.status === 'PAUSED' ? 'bg-amber-50 border-amber-100 text-amber-600' :
              availability.status === 'SCHEDULED' ? 'bg-indigo-50 border-indigo-100 text-[#7C3AED]' :
              'bg-rose-50 border-rose-100 text-rose-600'
            }`}>
              {availability.status === 'SCHEDULED' ? <Clock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${availability.badgeColorClass}`}>
                {availability.badgeLabel}
              </span>
              <h2 className="text-xl font-extrabold text-app-heading">{availability.closedTitle}</h2>
              <h3 className="text-sm font-bold text-[#7C3AED]">{form.title}</h3>
              <p className="text-xs text-app-body leading-relaxed">{availability.closedMessage}</p>

              {/* Scheduled — show opening time prominently */}
              {availability.status === 'SCHEDULED' && form.starts_at && (
                <div className="mt-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500 mb-1">Opens On</p>
                  <p className="text-sm font-extrabold text-slate-900">{formatDeadline(form.starts_at)}</p>
                </div>
              )}

              {/* Closed — show closed time */}
              {availability.status === 'CLOSED' && form.ends_at && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Closed</p>
                  <p className="text-sm font-extrabold text-slate-900">{formatDeadline(form.ends_at)}</p>
                </div>
              )}

              {/* Full */}
              {availability.status === 'FULL' && availability.totalCapacity && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-sm font-extrabold text-slate-900">
                    {availability.currentResponseCount} / {availability.totalCapacity} registered
                  </p>
                </div>
              )}
            </div>

            {form.closed_button_url && form.closed_button_text && (
              <a
                href={form.closed_button_url}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity"
              >
                {form.closed_button_text} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl font-semibold text-xs text-app-heading border border-app-border hover:bg-slate-50 transition-colors"
              >
                {returnTo ? `← Return to ${returnSource || 'Previous App'}` : 'Back to Dashboard'}
              </button>
            </div>
          </div>

          <PoweredByFooter onAboutClick={() => setAboutOpen(true)} />
        </div>

        <ProfileModal open={profileCardOpen} onOpenChange={setProfileCardOpen}
          fullName={fullName} primaryEmail={primaryEmail} avatarUrl={profile.avatar_url}
          initials={initials} onSignOut={signOut} />
        <AboutMexoFormsModal open={aboutOpen} onOpenChange={setAboutOpen} />
      </div>
    );
  }

  // =============================================
  // ALREADY RESPONDED
  // =============================================
  if (alreadyResponded) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
        <HeaderBar
          fullName={fullName} primaryEmail={primaryEmail}
          avatarUrl={profile.avatar_url} initials={initials}
          onOpenProfile={() => setProfileCardOpen(true)}
          onClose={handleClose} returnSource={returnSource}
        />

        <div className="w-full max-w-md bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden mt-4">
          <div className="h-1.5 bg-amber-400" />
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-extrabold text-app-heading mb-2">Already Responded</h2>
            <p className="text-sm text-app-body mb-6">
              Your response to <span className="font-semibold text-app-heading">{form?.title}</span> is already recorded with your MEXO account. Each account can only respond once.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8]"
            >
              {returnTo ? `Return to ${returnSource || 'Previous App'}` : 'Done'}
            </button>
          </div>
          <PoweredByFooter onAboutClick={() => setAboutOpen(true)} />
        </div>

        <ProfileModal open={profileCardOpen} onOpenChange={setProfileCardOpen}
          fullName={fullName} primaryEmail={primaryEmail} avatarUrl={profile.avatar_url}
          initials={initials} onSignOut={signOut} />
        <AboutMexoFormsModal open={aboutOpen} onOpenChange={setAboutOpen} />
      </div>
    );
  }

  // =============================================
  // POST-SUBMIT CONFIRMATION SCREEN
  // =============================================
  if (submitted) {
    const showScore = (form?.show_quiz_score ?? true) && quizResults.maxScore > 0;
    const allowReview = (form?.show_response_summary ?? true) && submittedPayload.length > 0;
    const mailComposerUrl = (import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app';

    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
        <HeaderBar
          fullName={fullName} primaryEmail={primaryEmail}
          avatarUrl={profile.avatar_url} initials={initials}
          onOpenProfile={() => setProfileCardOpen(true)}
          onClose={handleClose} returnSource={returnSource}
        />

        <div className="w-full max-w-lg bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden mt-4">
          <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8]" />
          <div className="px-6 sm:px-8 py-8 sm:py-10 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-extrabold text-app-heading mb-1">Response Submitted</h2>
            <p className="text-xs text-app-body mb-1">
              {form?.confirmation_message || `Thank you for your response to ${form?.title}.`}
            </p>
            {submittedAt && (
              <p className="text-[11px] text-app-muted mb-6">
                Submitted {submittedAt.toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            )}

            {/* Registration Reference Badge */}
            {registrationRef && (
              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block flex items-center justify-center gap-1">
                  <Ticket className="w-3.5 h-3.5" /> Response ID
                </span>
                <div className="text-xl font-black text-slate-900 font-mono tracking-widest">{registrationRef}</div>
              </div>
            )}

            {/* Event Details */}
            {(form.event_name || form.event_venue || form.event_date) && (
              <div className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <h4 className="font-extrabold text-app-heading border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" /> Event Details
                </h4>
                {form.event_name && <p><span className="font-semibold text-app-muted">Event:</span> {form.event_name}</p>}
                {form.event_date && <p><span className="font-semibold text-app-muted">Date:</span> {form.event_date}</p>}
                {form.event_venue && <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#7C3AED]" /> {form.event_venue}</p>}
              </div>
            )}

            {/* Submitted Identity */}
            <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-3 text-left">
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

            {/* Quiz Score */}
            {showScore && (
              <div className="mb-5 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED] mb-1">
                  <Award className="w-4 h-4" /> Quiz Score
                </div>
                <div className="text-2xl font-black text-app-heading">
                  {quizResults.totalScore} / {quizResults.maxScore} <span className="text-sm font-semibold text-app-muted">pts</span>
                </div>
                <div className="text-xs font-semibold text-emerald-600 mt-0.5">{quizResults.percentage}%</div>
              </div>
            )}

            {/* Download Attachment */}
            {form?.submission_attachment_url && (
              <div className="mb-5 p-4 rounded-2xl bg-slate-50 border border-app-border flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-[#7C3AED]" />
                  <div>
                    <p className="text-xs font-bold text-app-heading">{form.submission_attachment_name || 'Submission Resource'}</p>
                    <p className="text-[11px] text-app-muted">Provided by form creator</p>
                  </div>
                </div>
                <a href={form.submission_attachment_url} target="_blank" rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0">
                  Download
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              {allowReview && (
                <button id="view-answers-btn" onClick={() => setReviewOpen(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-app-border text-sm font-semibold text-app-heading hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]">
                  <Eye className="w-4 h-4 text-[#7C3AED]" /> View My Response
                </button>
              )}

              {/* Return to source app button if applicable */}
              {returnTo && (
                <a href={returnTo}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-indigo-200 bg-indigo-50/70 text-sm font-bold text-[#7C3AED] hover:bg-indigo-100 transition-colors min-h-[44px]">
                  <ArrowLeft className="w-4 h-4" /> Return to {returnSource || 'Previous App'}
                </a>
              )}

              {!returnTo && (
                <a href={mailComposerUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-indigo-200 bg-indigo-50/70 text-sm font-bold text-[#7C3AED] hover:bg-indigo-100 transition-colors min-h-[44px]">
                  <Mail className="w-4 h-4" /> Open MEXO Mail
                </a>
              )}

              {!form?.one_response_per_user && form?.accepting_responses && (
                <button id="submit-another" onClick={() => { setSubmitted(false); window.scrollTo(0, 0); }}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-app-border text-sm font-semibold text-app-heading hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]">
                  <RefreshCw className="w-4 h-4 text-app-muted" /> Submit another response
                </button>
              )}

              <button id="done-btn"
                onClick={handleClose}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity cursor-pointer min-h-[44px]">
                Done
              </button>
            </div>
          </div>

          <PoweredByFooter onAboutClick={() => setAboutOpen(true)} />
        </div>

        {/* Answers Breakdown Modal */}
        <MexoModal open={reviewOpen} onOpenChange={setReviewOpen} title="Your Submitted Responses" maxWidth="max-w-xl">
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {quizResults.details.map((item, idx) => (
              <div key={item.question.id} className="p-4 rounded-2xl border border-app-border bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-bold text-app-heading">{idx + 1}. {item.question.question_text}</div>
                  {item.isCorrect !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex-shrink-0 ${item.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.isCorrect ? `✓ +${item.earnedPoints} pts` : `✗ 0/${item.questionPoints}`}
                    </span>
                  )}
                </div>
                <div className="text-xs text-app-body">
                  <span className="font-semibold text-app-muted">Your answer: </span>
                  {item.studentAnsText || (Array.isArray(item.studentAnsJson) ? item.studentAnsJson.join(', ') : 'No answer')}
                </div>
              </div>
            ))}
          </div>
        </MexoModal>

        <ProfileModal open={profileCardOpen} onOpenChange={setProfileCardOpen}
          fullName={fullName} primaryEmail={primaryEmail} avatarUrl={profile.avatar_url}
          initials={initials} onSignOut={signOut} />
        <AboutMexoFormsModal open={aboutOpen} onOpenChange={setAboutOpen} />
      </div>
    );
  }

  // =============================================
  // DRAFT CONTINUE PROMPT
  // =============================================
  if (hasDraft && Object.keys(restoredAnswers).length > 0) {
    const draftCount = Object.keys(restoredAnswers).filter(k => {
      const v = restoredAnswers[k];
      return v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0);
    }).length;

    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
        <HeaderBar
          fullName={fullName} primaryEmail={primaryEmail}
          avatarUrl={profile.avatar_url} initials={initials}
          onOpenProfile={() => setProfileCardOpen(true)}
          onClose={handleClose} returnSource={returnSource}
        />

        <div className="w-full max-w-md bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden mt-4">
          <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] to-[#0878e8]" />
          <div className="px-8 py-10 text-center space-y-4">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7 text-[#7C3AED]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-app-heading mb-1">Continue Your Response?</h2>
              <p className="text-xs text-app-body leading-relaxed">
                You previously answered <span className="font-bold text-app-heading">{draftCount} of {questions.length}</span> questions in <span className="font-bold text-app-heading">{form.title}</span>.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => setHasDraft(false)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity min-h-[44px]"
              >
                Continue Where I Left Off
              </button>
              <button
                onClick={() => {
                  handleClearAnswers();
                  setRestoredAnswers({});
                  setHasDraft(false);
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-app-heading border border-app-border hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                Start Over
              </button>
            </div>
          </div>
          <PoweredByFooter onAboutClick={() => setAboutOpen(true)} />
        </div>

        <ProfileModal open={profileCardOpen} onOpenChange={setProfileCardOpen}
          fullName={fullName} primaryEmail={primaryEmail} avatarUrl={profile.avatar_url}
          initials={initials} onSignOut={signOut} />
        <AboutMexoFormsModal open={aboutOpen} onOpenChange={setAboutOpen} />
      </div>
    );
  }

  // =============================================
  // MAIN FORM VIEW
  // =============================================
  return (
    <div className="min-h-screen bg-app-bg py-4 sm:py-6 px-3 sm:px-4 flex flex-col items-center">
      {/* Header */}
      <HeaderBar
        fullName={fullName} primaryEmail={primaryEmail}
        avatarUrl={profile.avatar_url} initials={initials}
        onOpenProfile={() => setProfileCardOpen(true)}
        onClose={handleClose} returnSource={returnSource}
      />

      {/* Main Form Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-app-border shadow-mexo-card overflow-hidden mt-4">
        {/* Respondent Identity Banner */}
        <div className="px-6 sm:px-8 pt-5 pb-1 space-y-2.5">
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

          {/* Deadline Strip */}
          {form.ends_at && new Date(form.ends_at) > new Date() && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Responses close {formatDeadline(form.ends_at)}</span>
            </div>
          )}

          {/* Remaining Capacity Indicator */}
          {form.show_remaining_capacity && availability.totalCapacity !== undefined && (
            <div className="px-3.5 py-2 rounded-xl bg-purple-50/70 border border-purple-100 text-xs font-bold text-purple-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#7C3AED]">
                <Users className="w-3.5 h-3.5" /> Spots:
              </span>
              <span>{availability.currentResponseCount} / {availability.totalCapacity} registered · {availability.remainingCapacity} remaining</span>
            </div>
          )}

          {/* Event details (for registration forms) */}
          {(form.event_name || form.event_date || form.event_venue) && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1.5 text-xs">
              {form.event_name && <p className="font-extrabold text-slate-900">{form.event_name}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-app-muted font-semibold">
                {form.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#7C3AED]" /> {form.event_date}</span>}
                {form.event_venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#7C3AED]" /> {form.event_venue}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Submission Error Banner */}
        {submissionError && !submissionError.includes('Authentication required') && (
          <div className="mx-6 sm:mx-8 mt-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{submissionError}</span>
            </div>
            <button onClick={() => setSubmissionError(null)}
              className="px-3 py-1 rounded-xl bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors shrink-0">
              Dismiss
            </button>
          </div>
        )}

        {/* Form Renderer — passes three-dot menu and save indicator into form header via slot */}
        <PublicFormRenderer
          form={form}
          questions={questions}
          initialAnswers={restoredAnswers}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          headerSlot={
            <div className="flex items-center gap-2">
              <DraftSaveIndicator status={saveStatus} />
              <FormActionsMenu
                form={form}
                answersCount={answeredCount}
                totalQuestionsCount={questions.filter(q => q.question_type !== 'page_break').length}
                onClearAnswers={handleClearAnswers}
                onSaveProgress={handleSaveProgress}
              />
            </div>
          }
        />

        <PoweredByFooter onAboutClick={() => setAboutOpen(true)} />
      </div>

      {/* Conflict Resolution Modal */}
      <MexoModal
        open={saveStatus === 'conflict' && Boolean(conflictServerAnswers)}
        onOpenChange={(op) => { if (!op) resolveConflict(false); }}
        title="Conflict Detected"
        maxWidth="max-w-xs"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-app-heading mb-1">Updated on another device</h4>
            <p className="text-[11px] text-app-body leading-relaxed">
              This response was updated on another device. Would you like to use the latest version from the server or keep your local changes?
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => {
                if (conflictServerAnswers) {
                  setRestoredAnswers(conflictServerAnswers);
                  setCurrentAnswers(conflictServerAnswers);
                  resolveConflict(true, conflictServerAnswers);
                }
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity min-h-[44px]"
            >
              Use Latest Server Version
            </button>
            <button
              onClick={() => resolveConflict(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-app-heading border border-app-border hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              Keep My Local Changes
            </button>
          </div>
        </div>
      </MexoModal>

      {/* Leave Confirmation Dialog */}
      <MexoModal open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen} title="Leave This Form?" maxWidth="max-w-xs">
        <div className="space-y-4 text-center py-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            You have answers that haven't been submitted yet. If you leave, your current answers will not be submitted.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                handleSaveProgress();
                setLeaveConfirmOpen(false);
                pendingLeaveAction.current?.();
                pendingLeaveAction.current = null;
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity min-h-[44px]"
            >
              Save Progress & Leave
            </button>
            <button
              onClick={() => {
                setLeaveConfirmOpen(false);
                pendingLeaveAction.current?.();
                pendingLeaveAction.current = null;
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors min-h-[44px]"
            >
              Leave Without Saving
            </button>
            <button
              onClick={() => { setLeaveConfirmOpen(false); pendingLeaveAction.current = null; }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-app-heading border border-app-border hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              Stay & Finish Form
            </button>
          </div>
        </div>
      </MexoModal>

      <ProfileModal open={profileCardOpen} onOpenChange={setProfileCardOpen}
        fullName={fullName} primaryEmail={primaryEmail} avatarUrl={profile.avatar_url}
        initials={initials} onSignOut={signOut} />
      <AboutMexoFormsModal open={aboutOpen} onOpenChange={setAboutOpen} />
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
  onClose?: () => void;
  returnSource?: string | null;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ fullName, primaryEmail, avatarUrl, initials, onOpenProfile, onClose, returnSource }) => {
  return (
    <div className="w-full max-w-2xl flex items-center justify-between px-2 py-1">
      {/* Brand / Back */}
      <div className="flex items-center gap-1.5">
        <img src="/logo.png" alt="MEXO Forms" className="w-5 h-5 object-contain" />
        <span className="text-xs font-extrabold text-app-heading">MEXO Forms</span>
      </div>

      {/* Right side: profile button */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-full bg-white border border-app-border shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
        title="View MEXO Profile"
      >
        <div className="hidden sm:flex flex-col text-right leading-tight min-w-0 pr-1">
          <span className="text-xs font-bold text-app-heading truncate max-w-[140px]">{fullName}</span>
          <span className="text-[10px] text-app-muted font-mono truncate max-w-[140px]">{primaryEmail}</span>
        </div>
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
// Powered By Footer
// =============================================
interface PoweredByFooterProps {
  onAboutClick: () => void;
}

const PoweredByFooter: React.FC<PoweredByFooterProps> = ({ onAboutClick }) => (
  <div className="px-8 py-4 border-t border-app-border bg-slate-50/50 flex items-center justify-center gap-2 text-[11px] text-app-muted">
    <img src="/logo.png" alt="MEXO Forms" className="w-4 h-4 object-contain" />
    Powered by{' '}
    <button
      type="button"
      onClick={onAboutClick}
      className="font-bold text-app-heading hover:text-[#7C3AED] hover:underline transition-colors cursor-pointer"
    >
      MEXO Forms
    </button>
  </div>
);

// =============================================
// Profile Modal
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
    <MexoModal open={open} onOpenChange={onOpenChange} title="MEXO Account" maxWidth="max-w-xs">
      <div className="text-center py-2 space-y-4">
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

        <div>
          <h3 className="text-sm font-extrabold text-app-heading">{fullName}</h3>
          <p className="text-xs text-app-muted font-mono mt-0.5">{primaryEmail}</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#7C3AED] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full mt-2">
            <UserCheck className="w-3 h-3" /> MEXO Verified Account
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-2">
          <a href={mailUrl} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-app-border text-xs font-bold text-app-heading hover:bg-slate-50 transition-colors">
            <ExternalLink className="w-3.5 h-3.5 text-[#7C3AED]" /> Manage MEXO Account
          </a>
          <button type="button"
            onClick={async () => { onOpenChange(false); await onSignOut(); }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </MexoModal>
  );
};
