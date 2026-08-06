import React, { useState, useCallback } from 'react';
import { Form, FormQuestion, FormOption } from '../../types/forms';
import { Star, ChevronDown } from 'lucide-react';

interface PublicFormRendererProps {
  form: Form;
  questions: FormQuestion[];
  isPreview?: boolean;
  onSubmit?: (answers: { question_id: string; answer_text?: string; answer_json?: any }[]) => Promise<void>;
  submitting?: boolean;
}

export const PublicFormRenderer: React.FC<PublicFormRendererProps> = ({
  form, questions, isPreview = false, onSubmit, submitting = false,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = useCallback((questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setErrors(prev => { const e = { ...prev }; delete e[questionId]; return e; });
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    questions.forEach(q => {
      if (q.required) {
        const ans = answers[q.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'string' && !ans.trim())) {
          newErrors[q.id] = 'This field is required.';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) return;
    if (!validate()) {
      // Scroll to first error
      const firstErr = Object.keys(errors)[0];
      document.getElementById(`public-q-${firstErr}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const payload = questions.map(q => {
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

  return (
    <div className="min-h-full">
      {/* Form header */}
      <div className="border-b border-app-border">
        <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] rounded-t-2xl" />
        <div className="px-6 sm:px-8 py-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading">{form.title}</h1>
          {form.description && <p className="text-sm text-app-body mt-2">{form.description}</p>}
          {questions.some(q => q.required) && (
            <p className="text-xs text-app-muted mt-3">Fields marked with <span className="text-rose-500">*</span> are required.</p>
          )}
        </div>
      </div>

      {/* Questions */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-6 sm:px-8 py-6 space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} id={`public-q-${q.id}`} className="space-y-2">
              <label className="block text-sm font-semibold text-app-heading">
                {q.question_text}
                {q.required && <span className="text-rose-500 ml-1">*</span>}
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

          {/* Submit */}
          {!isPreview && (
            <div className="pt-4 border-t border-app-border">
              <button
                id="form-submit-btn"
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Submitting…
                  </>
                ) : 'Submit'}
              </button>
            </div>
          )}

          {isPreview && (
            <div className="pt-4 border-t border-app-border">
              <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] opacity-60 select-none cursor-default">
                Submit (Preview)
              </div>
            </div>
          )}
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

  return <div className={inputClass}>Unsupported question type: {type}</div>;
};
