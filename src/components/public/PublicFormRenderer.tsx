import React, { useState, useCallback, useEffect } from 'react';
import { Form, FormQuestion, FormOption } from '../../types/forms';
import { getThemeGradient } from '../../utils/themeUtils';
import { Star, ChevronDown, Clock, AlertTriangle, Paperclip, Upload, X } from 'lucide-react';

interface PublicFormRendererProps {
  form: Form;
  questions: FormQuestion[];
  isPreview?: boolean;
  initialAnswers?: Record<string, any>;
  onAnswerChange?: (answers: Record<string, any>) => void;
  onSubmit?: (answers: { question_id: string; answer_text?: string; answer_json?: any }[]) => Promise<void>;
  submitting?: boolean;
  /** Optional slot rendered to the right of the form title (e.g. three-dot action menu) */
  headerSlot?: React.ReactNode;
}

export const PublicFormRenderer: React.FC<PublicFormRendererProps> = ({
  form, questions, isPreview = false, initialAnswers, onAnswerChange, onSubmit, submitting = false, headerSlot,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>(() => initialAnswers || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [displayQuestions, setDisplayQuestions] = useState<FormQuestion[]>(questions);

  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      setAnswers(prev => ({ ...initialAnswers, ...prev }));
    }
  }, [initialAnswers]);

  // Quiz Timer State
  const timeLimitSec = (form.time_limit_minutes || 0) * 60;
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(timeLimitSec > 0 ? timeLimitSec : null);

  useEffect(() => {
    if (form.shuffle_questions && questions.length > 1) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      setDisplayQuestions(shuffled);
    } else {
      setDisplayQuestions(questions);
    }
  }, [questions, form.shuffle_questions]);

  // Countdown timer effect
  useEffect(() => {
    if (isPreview || !timeLeftSec || timeLeftSec <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSec(prev => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          // Auto submit when time expires
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSec, isPreview]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const setAnswer = useCallback((questionId: string, value: any) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: value };
      onAnswerChange?.(updated);
      return updated;
    });
    setErrors(prev => { const e = { ...prev }; delete e[questionId]; return e; });
  }, [onAnswerChange]);

  const answeredCount = questions.filter(q => {
    const a = answers[q.id];
    return a !== undefined && a !== null && a !== '' && (!Array.isArray(a) || a.length > 0);
  }).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // Group questions into pages by page_break
  const pages = React.useMemo(() => {
    interface FormPage {
      pageIndex: number;
      title?: string;
      description?: string;
      questions: FormQuestion[];
    }

    const result: FormPage[] = [];
    let current: FormPage = { pageIndex: 1, questions: [] };

    displayQuestions.forEach(q => {
      if (q.question_type === 'page_break') {
        if (current.questions.length > 0 || result.length > 0) {
          result.push(current);
        }
        current = {
          pageIndex: result.length + 1,
          title: q.question_text || `Section ${result.length + 2}`,
          description: q.description,
          questions: [],
        };
      } else {
        current.questions.push(q);
      }
    });

    if (current.questions.length > 0 || result.length === 0) {
      result.push(current);
    }

    return result;
  }, [displayQuestions]);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const validatePage = (pageQuestions: FormQuestion[]) => {
    const newErrors: Record<string, string> = {};
    pageQuestions.forEach(q => {
      if (q.required) {
        const ans = answers[q.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'string' && !ans.trim())) {
          newErrors[q.id] = 'This field is required.';
        }
      }
    });
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNextPage = () => {
    const currentQuestions = pages[currentPageIndex]?.questions || [];
    if (!validatePage(currentQuestions)) {
      const firstErr = currentQuestions.find(q => q.required && !answers[q.id]);
      if (firstErr) {
        document.getElementById(`public-q-${firstErr.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isQuestionVisible = useCallback((q: FormQuestion): boolean => {
    if (!q.settings?.show_if_question_id || !q.settings?.show_if_option_value) return true;
    const parentAns = answers[q.settings.show_if_question_id];
    if (!parentAns) return false;
    const targetVal = String(q.settings.show_if_option_value).trim().toLowerCase();
    if (Array.isArray(parentAns)) {
      return parentAns.some(a => String(a).trim().toLowerCase() === targetVal);
    }
    return String(parentAns).trim().toLowerCase() === targetVal;
  }, [answers]);

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    questions.forEach(q => {
      if (q.required && q.question_type !== 'page_break' && isQuestionVisible(q)) {
        const ans = answers[q.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'string' && !ans.trim())) {
          newErrors[q.id] = 'This field is required.';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAutoSubmit = async () => {
    const payload = questions.filter(q => q.question_type !== 'page_break' && isQuestionVisible(q)).map(q => {
      const ans = answers[q.id];
      const isJson = Array.isArray(ans) || (typeof ans === 'object' && ans !== null);
      return {
        question_id: q.id,
        answer_text: isJson ? undefined : String(ans ?? ''),
        answer_json: isJson ? ans : undefined,
      };
    });
    await onSubmit?.(payload);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;
    if (!validateAll()) {
      const firstErr = questions.find(q => q.required && isQuestionVisible(q) && !answers[q.id]);
      if (firstErr) {
        // Find page of error
        const errPageIndex = pages.findIndex(p => p.questions.some(q => q.id === firstErr.id));
        if (errPageIndex !== -1) setCurrentPageIndex(errPageIndex);
        setTimeout(() => {
          document.getElementById(`public-q-${firstErr.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      return;
    }

    const payload = questions.filter(q => q.question_type !== 'page_break' && isQuestionVisible(q)).map(q => {
      const ans = answers[q.id];
      const isJson = Array.isArray(ans) || (typeof ans === 'object' && ans !== null);
      return {
        question_id: q.id,
        answer_text: isJson ? undefined : String(ans ?? ''),
        answer_json: isJson ? ans : undefined,
      };
    });

    await onSubmit?.(payload);
  };

  const currentQuestions = (pages[currentPageIndex]?.questions || []).filter(isQuestionVisible);

  return (
    <div className="min-h-full relative">
      {/* Sticky Quiz Timer Banner */}
      {timeLeftSec !== null && !isPreview && (
        <div className={`sticky top-0 z-40 px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-md transition-colors ${
          timeLeftSec < 120 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-900 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Quiz Timer</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-mono tracking-wider">
            {timeLeftSec < 120 && <AlertTriangle className="w-4 h-4 text-amber-300" />}
            Time Remaining: {formatTimer(timeLeftSec)}
          </div>
        </div>
      )}

      {/* Form header */}
      <div className="border-b border-app-border">
        <div className={`h-2.5 bg-gradient-to-r ${getThemeGradient(form.theme_color)} rounded-t-2xl`} />
        <div className="px-6 sm:px-8 py-6">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading">{form.title}</h1>
              {form.form_type === 'quiz' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 shrink-0">
                  Quiz
                </span>
              )}
            </div>
            {/* Three-dot / action menu slot */}
            {!isPreview && headerSlot && (
              <div className="shrink-0 -mr-2 -mt-1">{headerSlot}</div>
            )}
          </div>
          {form.description && <p className="text-sm text-app-body mt-2">{form.description}</p>}

          {/* Form Header Attachment */}
          {form.attachment_url && (
            <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-app-border flex items-center gap-3">
              <Paperclip className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-app-heading truncate">{form.attachment_name || 'Form Attachment'}</p>
                <a
                  href={form.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#7C3AED] font-bold hover:underline"
                >
                  View / Download Attachment →
                </a>
              </div>
            </div>
          )}

          {questions.some(q => q.required) && (
            <p className="text-xs text-app-muted mt-3">
              Fields marked with <span className="text-rose-500 font-bold ml-0.5">*</span> are required.
            </p>
          )}
        </div>

        {/* Multi-Page Step Progress Header */}
        {pages.length > 1 && (
          <div className="bg-indigo-50/70 border-t border-app-border px-6 py-3 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold text-[#7C3AED]">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
              {pages[currentPageIndex]?.title && (
                <h2 className="text-xs font-bold text-app-heading mt-0.5">
                  {pages[currentPageIndex].title}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {pages.map((p, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentPageIndex
                      ? 'w-6 bg-[#7C3AED]'
                      : idx < currentPageIndex
                      ? 'w-2 bg-indigo-300'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Question Progress bar */}
        {form.show_progress_bar !== false && questions.length > 0 && (
          <div className="bg-slate-50 border-t border-app-border px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-app-muted flex-shrink-0">
              {answeredCount} of {questions.filter(q => q.question_type !== 'page_break').length} answered ({progressPercent}%)
            </span>
          </div>
        )}
      </div>

      {/* Questions */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-6 sm:px-8 py-6 space-y-6">
          {currentQuestions.map((q, idx) => (
            <div key={q.id} id={`public-q-${q.id}`} className="space-y-2">
              <label className="block text-sm font-semibold text-app-heading">
                {q.question_text}
                {q.required && <span className="text-rose-500 font-bold ml-1">*</span>}
              </label>
              {q.description && <p className="text-xs text-app-muted">{q.description}</p>}

              <PublicQuestionInput
                question={q}
                value={answers[q.id]}
                onChange={v => setAnswer(q.id, v)}
                error={errors[q.id]}
                disabled={isPreview}
              />
            </div>
          ))}

          {/* Page Navigation & Submit Controls */}
          <div className="pt-6 border-t border-app-border flex items-center justify-between gap-3">
            {currentPageIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevPage}
                className="px-5 py-2.5 rounded-2xl border border-app-border text-sm font-bold text-app-heading hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
            ) : <div />}

            {currentPageIndex < pages.length - 1 ? (
              <button
                type="button"
                onClick={handleNextPage}
                className="px-6 py-2.5 rounded-2xl font-bold text-sm text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors shadow-sm"
              >
                Next Page →
              </button>
            ) : (
              !isPreview ? (
                <button
                  id="form-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm"
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              ) : (
                <div className="px-6 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] opacity-60">
                  Submit (Preview)
                </div>
              )
            )}
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="px-6 sm:px-8 py-4 border-t border-app-border bg-slate-50/50 flex items-center justify-center gap-2 text-[11px] text-app-muted">
        <img src="/logo.png" alt="MEXO Forms" className="w-4 h-4 object-contain" />
        Powered by <span className="font-bold text-app-heading">MEXO Forms</span>
      </div>
    </div>
  );
};

interface PublicQuestionInputProps {
  question: FormQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const PublicQuestionInput: React.FC<PublicQuestionInputProps> = ({ question, value, onChange, error, disabled }) => {
  const inputClass = `w-full rounded-xl border px-3 py-2.5 text-sm text-app-heading placeholder-app-muted outline-none transition-all ${
    error ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-app-border focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100'
  } ${disabled ? 'bg-slate-50 cursor-default' : 'bg-white'}`;

  const type = question.question_type;

  if (type === 'short_text' || type === 'email' || type === 'phone') {
    return (
      <>
        <input
          type={type === 'email' ? 'email' : type === 'phone' ? 'tel' : 'text'}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={type === 'email' ? 'your@email.com' : type === 'phone' ? '+91 XXXX XXXXXX' : 'Your answer'}
          className={inputClass}
          disabled={disabled}
        />
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'number') {
    return (
      <>
        <input type="number" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Enter a number" className={inputClass} disabled={disabled} />
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'long_text') {
    return (
      <>
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Your answer" rows={3} className={`${inputClass} resize-y min-h-[80px]`} disabled={disabled} />
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'date') {
    return (
      <>
        <input type="date" value={value || ''} onChange={e => onChange(e.target.value)} className={inputClass} disabled={disabled} />
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'time') {
    return (
      <>
        <input type="time" value={value || ''} onChange={e => onChange(e.target.value)} className={inputClass} disabled={disabled} />
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'yes_no') {
    return (
      <>
        <div className="flex gap-3">
          {['Yes', 'No'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => !disabled && onChange(opt)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                value === opt
                  ? 'border-[#7C3AED] bg-indigo-50 text-[#7C3AED]'
                  : 'border-app-border text-app-body hover:border-indigo-300'
              } ${disabled ? 'cursor-default' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'multiple_choice') {
    return (
      <>
        <div className="space-y-2">
          {(question.options || []).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => !disabled && onChange(opt.label)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all text-left ${
                value === opt.label
                  ? 'border-[#7C3AED] bg-indigo-50'
                  : 'border-app-border hover:border-indigo-200'
              } ${disabled ? 'cursor-default' : ''}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${value === opt.label ? 'border-[#7C3AED]' : 'border-app-border'}`}>
                {value === opt.label && <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />}
              </div>
              <span className={value === opt.label ? 'text-[#7C3AED] font-semibold' : 'text-app-heading'}>{opt.label}</span>
            </button>
          ))}
        </div>
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'checkbox') {
    const checked = Array.isArray(value) ? value : [];
    return (
      <>
        <div className="space-y-2">
          {(question.options || []).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (disabled) return;
                const next = checked.includes(opt.label)
                  ? checked.filter((v: string) => v !== opt.label)
                  : [...checked, opt.label];
                onChange(next);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all text-left ${
                checked.includes(opt.label)
                  ? 'border-[#7C3AED] bg-indigo-50'
                  : 'border-app-border hover:border-indigo-200'
              } ${disabled ? 'cursor-default' : ''}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${checked.includes(opt.label) ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-app-border'}`}>
                {checked.includes(opt.label) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 5l2.5 2.5 4.5-4.5" />
                  </svg>
                )}
              </div>
              <span className={checked.includes(opt.label) ? 'text-[#7C3AED] font-semibold' : 'text-app-heading'}>{opt.label}</span>
            </button>
          ))}
        </div>
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'dropdown') {
    return (
      <>
        <div className="relative">
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={`${inputClass} appearance-none pr-9 cursor-pointer`}
            disabled={disabled}
          >
            <option value="">Select an option</option>
            {(question.options || []).map(opt => (
              <option key={opt.id} value={opt.label}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted pointer-events-none" />
        </div>
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'rating') {
    const maxRating = question.settings?.max_rating || 5;
    const current = Number(value) || 0;
    return (
      <>
        <div className="flex gap-1">
          {[...Array(maxRating)].map((_, i) => {
            const starVal = i + 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => !disabled && onChange(starVal)}
                className={`p-1 transition-transform ${!disabled ? 'hover:scale-110' : 'cursor-default'}`}
                title={`${starVal} star${starVal !== 1 ? 's' : ''}`}
              >
                <Star
                  className={`w-7 h-7 transition-colors ${starVal <= current ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                />
              </button>
            );
          })}
          {current > 0 && <span className="ml-2 text-xs text-app-muted self-center">{current} / {maxRating}</span>}
        </div>
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'linear_scale') {
    const min = question.settings?.min ?? 1;
    const max = question.settings?.max ?? 10;
    const current = Number(value) || 0;
    return (
      <>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[...Array(max - min + 1)].map((_, i) => {
              const v = min + i;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => !disabled && onChange(v)}
                  className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all ${
                    current === v
                      ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                      : 'border-app-border text-app-body hover:border-indigo-300'
                  } ${disabled ? 'cursor-default' : ''}`}
                >
                  {v}
                </button>
              );
            })}
          </div>
          {(question.settings?.min_label || question.settings?.max_label) && (
            <div className="flex justify-between mt-1.5 text-[11px] text-app-muted">
              <span>{question.settings?.min_label}</span>
              <span>{question.settings?.max_label}</span>
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  if (type === 'file_upload') {
    return (
      <>
        <div className="space-y-2">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-app-border hover:border-indigo-300 rounded-2xl p-4 cursor-pointer bg-slate-50/50 transition-colors">
            <Upload className="w-6 h-6 text-[#7C3AED] mb-1" />
            <span className="text-xs font-semibold text-app-heading">
              {value ? (typeof value === 'string' ? value : value.name) : 'Choose file to attach'}
            </span>
            <span className="text-[10px] text-app-muted mt-0.5">Click to browse file</span>
            <input
              type="file"
              disabled={disabled}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(file.name);
                }
              }}
              className="hidden"
            />
          </label>
          {value && (
            <div className="flex items-center justify-between text-xs bg-indigo-50 text-[#7C3AED] px-3 py-2 rounded-xl border border-indigo-100 font-semibold">
              <span>📎 Attached: {typeof value === 'string' ? value : value.name}</span>
              {!disabled && (
                <button type="button" onClick={() => onChange('')} className="text-rose-500 hover:text-rose-700 ml-2">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </>
    );
  }

  return <div className={inputClass}>Unsupported question type: {type}</div>;
};
