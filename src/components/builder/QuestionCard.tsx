import React, { useState, useCallback, useEffect } from 'react';
import { FormQuestion, FormOption, QuestionType } from '../../types/forms';
import { formService } from '../../services/formService';
import { MexoInput } from '../common/MexoInput';
import { MexoToggle } from '../common/MexoToggle';
import * as Select from '@radix-ui/react-select';
import {
  Trash2, Copy, ChevronUp, ChevronDown, GripVertical, Plus, X,
  Type, AlignLeft, AtSign, Phone, Hash, Circle, CheckSquare,
  List, ToggleLeft, Star, Sliders, Calendar, Clock, Upload, CheckCircle, Layers, ChevronDown as ChevronDownIcon,
} from 'lucide-react';

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  email: 'Email',
  phone: 'Phone',
  number: 'Number',
  multiple_choice: 'Multiple Choice',
  checkbox: 'Checkbox',
  dropdown: 'Dropdown',
  yes_no: 'Yes / No',
  rating: 'Rating',
  linear_scale: 'Linear Scale',
  date: 'Date',
  time: 'Time',
  file_upload: 'File Upload',
  page_break: 'Page Break (New Page)',
};

interface QuestionCardProps {
  question: FormQuestion;
  isSelected: boolean;
  index: number;
  totalQuestions: number;
  onClick: () => void;
  onUpdate: (q: FormQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question, isSelected, index, totalQuestions,
  onClick, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown,
}) => {
  const [localText, setLocalText] = useState(question.question_text);
  const [localDesc, setLocalDesc] = useState(question.description || '');
  const [localExplanation, setLocalExplanation] = useState(question.explanation || '');
  const [options, setOptions] = useState<FormOption[]>(question.options || []);
  const [addingOption, setAddingOption] = useState(false);

  useEffect(() => {
    setLocalText(question.question_text);
    setLocalDesc(question.description || '');
    setLocalExplanation(question.explanation || '');
    setOptions(question.options || []);
  }, [question.id]);

  const hasOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(question.question_type);
  const isRating = question.question_type === 'rating';
  const isLinearScale = question.question_type === 'linear_scale';

  const commitText = useCallback(() => {
    if (localText !== question.question_text || localDesc !== question.description || localExplanation !== question.explanation) {
      onUpdate({ ...question, question_text: localText, description: localDesc, explanation: localExplanation });
      formService.updateQuestion(question.id, { question_text: localText, description: localDesc, explanation: localExplanation });
    }
  }, [localText, localDesc, localExplanation, question, onUpdate]);

  const handleTypeChange = useCallback(async (newType: QuestionType) => {
    await formService.updateQuestion(question.id, { question_type: newType });
    onUpdate({ ...question, question_type: newType });
  }, [question, onUpdate]);

  const handleRequiredChange = useCallback((checked: boolean) => {
    onUpdate({ ...question, required: checked });
    formService.updateQuestion(question.id, { required: checked });
  }, [question, onUpdate]);

  const handleAddOption = useCallback(async () => {
    if (!question.id) return;
    setAddingOption(true);
    const pos = options.length;
    const label = `Option ${pos + 1}`;
    const opt = await formService.addOption(question.id, label, pos);
    if (opt) {
      const newOptions = [...options, opt];
      setOptions(newOptions);
      onUpdate({ ...question, options: newOptions });
    }
    setAddingOption(false);
  }, [question, options, onUpdate]);

  const handleOptionChange = useCallback(async (optId: string, label: string) => {
    const newOptions = options.map(o => o.id === optId ? { ...o, label } : o);
    setOptions(newOptions);
    onUpdate({ ...question, options: newOptions });
    await formService.updateOption(optId, { label, value: label.toLowerCase().replace(/\s+/g, '_') });
  }, [options, question, onUpdate]);

  const handleToggleCorrectOption = useCallback(async (optId: string) => {
    const isSingleChoice = question.question_type === 'multiple_choice' || question.question_type === 'dropdown';
    const newOptions = options.map(o => {
      if (o.id === optId) {
        const nextCorrect = !o.is_correct;
        return { ...o, is_correct: nextCorrect, points: nextCorrect ? (o.points || 1) : 0 };
      }
      if (isSingleChoice) {
        return { ...o, is_correct: false, points: 0 };
      }
      return o;
    });
    setOptions(newOptions);
    onUpdate({ ...question, options: newOptions });
    const targetOpt = newOptions.find(o => o.id === optId);
    if (targetOpt) {
      await formService.updateOption(optId, { is_correct: targetOpt.is_correct, points: targetOpt.points });
    }
  }, [options, question, onUpdate]);

  const handleOptionPointsChange = useCallback(async (optId: string, pts: number) => {
    const newOptions = options.map(o => o.id === optId ? { ...o, points: pts } : o);
    setOptions(newOptions);
    onUpdate({ ...question, options: newOptions });
    await formService.updateOption(optId, { points: pts });
  }, [options, question, onUpdate]);

  const handleDeleteOption = useCallback(async (optId: string) => {
    await formService.deleteOption(optId);
    const newOptions = options.filter(o => o.id !== optId).map((o, i) => ({ ...o, position: i }));
    setOptions(newOptions);
    onUpdate({ ...question, options: newOptions });
  }, [options, question, onUpdate]);

  const handleSettingChange = useCallback((key: string, value: any) => {
    const newSettings = { ...question.settings, [key]: value };
    onUpdate({ ...question, settings: newSettings });
    formService.updateQuestion(question.id, { settings: newSettings });
  }, [question, onUpdate]);

  if (question.question_type === 'page_break') {
    return (
      <div
        id={`question-${question.id}`}
        className={`bg-[#F8FAFC] rounded-2xl border-2 border-dashed transition-all p-4 sm:p-5 group ${
          isSelected ? 'border-[#7C3AED] bg-indigo-50/40 ring-2 ring-purple-100' : 'border-indigo-200 hover:border-indigo-300'
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED]">
            <Layers className="w-4 h-4" />
            <span>--- Page Break (New Page) ---</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={e => { e.stopPropagation(); onMoveUp(); }}
              disabled={index === 0}
              className="p-1 rounded-lg text-app-muted hover:bg-slate-200 disabled:opacity-30 transition-colors"
              title="Move up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onMoveDown(); }}
              disabled={index === totalQuestions - 1}
              className="p-1 rounded-lg text-app-muted hover:bg-slate-200 disabled:opacity-30 transition-colors"
              title="Move down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded-lg text-app-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Page Break"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <input
          type="text"
          value={localText}
          onChange={e => setLocalText(e.target.value)}
          onBlur={commitText}
          placeholder="Section / Page Title (e.g. Section 2: Contact Information)"
          className="w-full text-sm font-extrabold text-app-heading bg-transparent border-b border-indigo-200 outline-none focus:border-[#7C3AED] pb-1 mb-2"
        />

        <input
          type="text"
          value={localDesc}
          onChange={e => setLocalDesc(e.target.value)}
          onBlur={commitText}
          placeholder="Section description (optional)"
          className="w-full text-xs text-app-body bg-transparent outline-none placeholder-slate-400"
        />
      </div>
    );
  }

  return (
    <div
      id={`question-${question.id}`}
      className={`bg-white rounded-2xl border transition-all shadow-mexo-card group ${
        isSelected ? 'border-[#7C3AED] ring-2 ring-purple-100' : 'border-app-border hover:border-slate-300'
      }`}
      onClick={onClick}
    >
      {/* Question header */}
      <div className="flex items-start gap-2 p-4 sm:p-5">
        <div className="flex-shrink-0 mt-1 text-app-muted opacity-0 group-hover:opacity-60 transition-opacity cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-app-muted font-semibold">
            <span>Q{index + 1}</span>
            <span>•</span>
            <span>{QUESTION_TYPE_LABELS[question.question_type]}</span>
            {question.required && <span className="text-rose-500">• Required</span>}
          </div>

          {isSelected ? (
            <textarea
              id={`question-text-${question.id}`}
              value={localText}
              onChange={e => setLocalText(e.target.value)}
              onBlur={commitText}
              onClick={e => e.stopPropagation()}
              placeholder="Question text"
              rows={1}
              className="w-full text-sm font-semibold text-app-heading placeholder-slate-300 outline-none resize-none border-none bg-transparent leading-snug"
              style={{ overflow: 'hidden' }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }}
            />
          ) : (
            <p className={`text-sm font-semibold ${localText ? 'text-app-heading' : 'text-slate-300'}`}>
              {localText || 'Question text'}
              {question.required && <span className="text-rose-500 ml-1" title="Required">*</span>}
            </p>
          )}

          {!isSelected && (
            <QuestionPreview question={question} />
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-1">
          <button
            id={`move-up-${question.id}`}
            onClick={e => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-app-muted hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            id={`move-down-${question.id}`}
            onClick={e => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === totalQuestions - 1}
            className="p-1.5 rounded-lg text-app-muted hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="border-t border-app-border" onClick={e => e.stopPropagation()}>
          <div className="p-4 sm:p-5 space-y-4">
            <textarea
              id={`question-desc-${question.id}`}
              value={localDesc}
              onChange={e => setLocalDesc(e.target.value)}
              onBlur={commitText}
              placeholder="Description (optional)"
              rows={1}
              className="w-full text-xs text-app-body placeholder-slate-300 outline-none resize-none border border-transparent bg-slate-50 rounded-xl px-3 py-2 focus:border-app-border transition-colors"
            />

            <div>
              <label className="block text-xs font-semibold text-app-heading mb-1.5">Question Type</label>
              <select
                id={`question-type-${question.id}`}
                value={question.question_type}
                onChange={e => handleTypeChange(e.target.value as QuestionType)}
                className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold text-app-heading outline-none focus:border-[#7C3AED] bg-white"
              >
                {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
                  <option key={type} value={type}>{label}</option>
                ))}
              </select>
            </div>

            {hasOptions && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-app-heading">Options & Correct Answer</label>
                  <span className="text-[11px] text-app-muted">Click checkmark to set correct answer</span>
                </div>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCorrectOption(opt.id)}
                        className={`p-1 rounded-lg border transition-colors ${opt.is_correct ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-app-border text-slate-300 hover:text-slate-500'}`}
                        title={opt.is_correct ? 'Correct Answer' : 'Mark as Correct Answer'}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <input
                        id={`option-${opt.id}`}
                        type="text"
                        value={opt.label}
                        onChange={e => handleOptionChange(opt.id, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 text-xs text-app-heading border-b border-app-border bg-transparent outline-none focus:border-[#7C3AED] pb-1 transition-colors"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-app-muted">pts:</span>
                        <input
                          type="number"
                          min={0}
                          value={opt.points ?? (opt.is_correct ? 1 : 0)}
                          onChange={e => handleOptionPointsChange(opt.id, Number(e.target.value))}
                          className="w-12 text-xs border border-app-border rounded-lg px-1.5 py-0.5 text-center font-bold outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteOption(opt.id)}
                        className="p-1 rounded-lg text-app-muted hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Remove option"
                        aria-label={`Remove option ${opt.label}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    id={`add-option-${question.id}`}
                    onClick={handleAddOption}
                    disabled={addingOption}
                    className="text-xs text-[#7C3AED] font-semibold flex items-center gap-1.5 hover:text-[#6D28D9] transition-colors mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add option
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-app-heading mb-1">Answer Explanation (Optional)</label>
              <input
                type="text"
                value={localExplanation}
                onChange={e => setLocalExplanation(e.target.value)}
                onBlur={commitText}
                placeholder="Explain why this answer is correct (shown to students after quiz)"
                className="w-full text-xs rounded-xl border border-app-border px-3 py-2 outline-none focus:border-[#7C3AED] bg-white placeholder-slate-300"
              />
            </div>

            {/* Rating settings */}
            {isRating && (
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-app-muted mb-1">Max Rating</label>
                  <select
                    value={question.settings?.max_rating || 5}
                    onChange={e => handleSettingChange('max_rating', Number(e.target.value))}
                    className="rounded-lg border border-app-border px-2 py-1.5 text-xs font-semibold text-app-heading outline-none"
                  >
                    {[3, 4, 5, 7, 10].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Linear scale settings */}
            {isLinearScale && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-app-muted mb-1">Min</label>
                  <input
                    type="number"
                    value={question.settings?.min ?? 1}
                    onChange={e => handleSettingChange('min', Number(e.target.value))}
                    className="w-full rounded-lg border border-app-border px-2 py-1.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-app-muted mb-1">Max</label>
                  <input
                    type="number"
                    value={question.settings?.max ?? 10}
                    onChange={e => handleSettingChange('max', Number(e.target.value))}
                    className="w-full rounded-lg border border-app-border px-2 py-1.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-app-muted mb-1">Min Label</label>
                  <input
                    type="text"
                    value={question.settings?.min_label ?? ''}
                    onChange={e => handleSettingChange('min_label', e.target.value)}
                    placeholder="e.g. Not at all"
                    className="w-full rounded-lg border border-app-border px-2 py-1.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-app-muted mb-1">Max Label</label>
                  <input
                    type="text"
                    value={question.settings?.max_label ?? ''}
                    onChange={e => handleSettingChange('max_label', e.target.value)}
                    placeholder="e.g. Extremely"
                    className="w-full rounded-lg border border-app-border px-2 py-1.5 text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-4 sm:px-5 py-3 border-t border-app-border flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-app-body flex items-center gap-2 cursor-pointer" htmlFor={`required-${question.id}`}>
                <MexoToggle
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={handleRequiredChange}
                />
                Required
              </label>
            </div>
            <div className="flex items-center gap-1">
              <button
                id={`duplicate-${question.id}`}
                onClick={onDuplicate}
                className="p-1.5 rounded-xl text-app-muted hover:bg-slate-200 hover:text-app-body transition-colors"
                title="Duplicate question"
                aria-label="Duplicate question"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                id={`delete-${question.id}`}
                onClick={onDelete}
                className="p-1.5 rounded-xl text-app-muted hover:bg-rose-50 hover:text-rose-600 transition-colors"
                title="Delete question"
                aria-label="Delete question"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Preview of the answer input shown in collapsed state
const QuestionPreview: React.FC<{ question: FormQuestion }> = ({ question }) => {
  const type = question.question_type;
  const baseInput = 'border border-app-border rounded-xl px-3 py-2 text-xs text-app-muted bg-slate-50 pointer-events-none select-none';

  if (type === 'short_text' || type === 'email' || type === 'phone' || type === 'number') {
    return <div className={`${baseInput} w-full`}>Short answer</div>;
  }
  if (type === 'long_text') {
    return <div className={`${baseInput} w-full h-12`}>Long answer</div>;
  }
  if (type === 'date') return <div className={`${baseInput} w-36`}>DD / MM / YYYY</div>;
  if (type === 'time') return <div className={`${baseInput} w-28`}>HH : MM</div>;
  if (type === 'yes_no') {
    return (
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border bg-slate-50 text-xs text-app-muted">
          <div className="w-3 h-3 rounded-full border border-app-border" /> Yes
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border bg-slate-50 text-xs text-app-muted">
          <div className="w-3 h-3 rounded-full border border-app-border" /> No
        </div>
      </div>
    );
  }
  if (type === 'rating') {
    const max = question.settings?.max_rating || 5;
    return (
      <div className="flex gap-1">
        {[...Array(max)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-slate-200" />
        ))}
      </div>
    );
  }
  if (type === 'linear_scale') {
    const min = question.settings?.min ?? 1;
    const max = question.settings?.max ?? 10;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {[...Array(max - min + 1)].map((_, i) => (
          <div key={i} className="w-6 h-6 rounded-lg border border-app-border bg-slate-50 text-[10px] text-app-muted flex items-center justify-center">
            {min + i}
          </div>
        ))}
      </div>
    );
  }
  if (['multiple_choice', 'checkbox', 'dropdown'].includes(type)) {
    const opts = question.options || [];
    if (type === 'dropdown') {
      return <div className={`${baseInput} w-48 flex items-center justify-between`}>
        <span>Select an option</span>
        <ChevronDownIcon className="w-3.5 h-3.5" />
      </div>;
    }
    return (
      <div className="space-y-1">
        {opts.slice(0, 3).map(o => (
          <div key={o.id} className="flex items-center gap-2 text-xs text-app-muted">
            {type === 'multiple_choice'
              ? <div className="w-3.5 h-3.5 rounded-full border border-app-border flex-shrink-0" />
              : <div className="w-3.5 h-3.5 rounded border border-app-border flex-shrink-0" />}
            {o.label}
          </div>
        ))}
        {opts.length > 3 && <p className="text-[11px] text-app-muted">+{opts.length - 3} more</p>}
      </div>
    );
  }
  return null;
};
