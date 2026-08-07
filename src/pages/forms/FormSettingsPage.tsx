import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { formService } from '../../services/formService';
import { Form } from '../../types/forms';
import { THEME_OPTIONS } from '../../utils/themeUtils';
import { MexoConfirmDialog, MexoModal } from '../../components/common/MexoModal';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoInput, MexoTextarea } from '../../components/common/MexoInput';
import { MexoToggle } from '../../components/common/MexoToggle';
import { useToast } from '../../hooks/useToast';
import { MexoToastContainer } from '../../components/common/MexoToast';
import { useAuth } from '../../contexts/AuthContext';
import { isImageFile, FormResourceRenderer } from '../../components/public/FormResourceRenderer';
import {
  ArrowLeft, Save, Trash2, Copy, Check, Upload, Paperclip, X,
  ExternalLink, Calendar, Clock, Globe, ShieldCheck, Users, Lock, AlertCircle, HelpCircle,
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const TIMEZONES = [
  { label: 'Asia/Kolkata (IST • UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
  { label: 'America/New_York (EST • UTC-5)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (PST • UTC-8)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT • UTC+0)', value: 'Europe/London' },
  { label: 'Asia/Dubai (GST • UTC+4)', value: 'Asia/Dubai' },
  { label: 'Asia/Singapore (SGT • UTC+8)', value: 'Asia/Singapore' },
];

export const FormSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState<Form | null>(null);
  useDocumentTitle(form ? `Settings — ${form.title}` : 'Form Settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [trashConfirmOpen, setTrashConfirmOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const pendingNavigate = useRef<(() => void) | null>(null);

  // File upload state
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingPost, setUploadingPost] = useState(false);

  // Mode Change Warning Dialog
  const [modeConfirmOpen, setModeConfirmOpen] = useState(false);
  const [targetMode, setTargetMode] = useState<'standard' | 'registration' | 'quiz'>('standard');

  // Consolidated Form Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    confirmation_message: '',
    form_type: 'form' as 'form' | 'quiz',
    form_mode: 'standard' as 'standard' | 'registration' | 'quiz',

    // Appearance
    theme_color: 'violet',

    // Responses & Access
    accepting_responses: true,
    one_response_per_user: false,
    requires_login: true,
    allow_response_editing: false,
    allow_draft_save: true,

    // Results & Answer Review
    show_quiz_score: true,
    show_response_summary: true,

    // Availability & Schedule
    start_mode: 'immediately' as 'immediately' | 'scheduled',
    starts_at: '',
    enable_auto_close: false,
    ends_at: '',
    timezone: 'Asia/Kolkata',

    // Quiz Timer
    enable_quiz_timer: false,
    time_limit_minutes: 30,
    auto_submit_on_expiry: true,

    // Capacity & Registration
    enable_response_limit: false,
    response_limit: 100,

    // Event & Registration Features
    enable_event_features: false,
    event_name: '',
    event_venue: '',
    event_date: '',
    event_time: '',
    registration_prefix: 'MXEV',

    // Closed Form Experience
    closed_title: 'Registration Closed',
    closed_message: 'Registration for this event has ended. Thank you for your interest.',
    closed_button_text: '',
    closed_button_url: '',

    // Attachments & Resources
    attachment_url: '',
    attachment_name: '',
    attachment_display_mode: 'original' as 'original' | 'banner' | 'compact',
    submission_attachment_url: '',
    submission_attachment_name: '',
  });

  const [initialDataJSON, setInitialDataJSON] = useState<string>('');

  const formatDatetimeLocal = (isoStr?: string | null): string => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr.replace(' ', 'T').slice(0, 16);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  useEffect(() => {
    if (!id) return;
    formService.getForm(id).then(f => {
      if (f) {
        setForm(f);
        const resolvedMode = (f as any).form_mode || (f.form_type === 'quiz' ? 'quiz' : (f.event_name || f.registration_prefix ? 'registration' : 'standard'));
        const data = {
          title: f.title || '',
          description: f.description || '',
          confirmation_message: f.confirmation_message || 'Thank you for your response!',
          form_type: f.form_type || 'form',
          form_mode: resolvedMode as 'standard' | 'registration' | 'quiz',

          theme_color: f.theme_color || 'violet',

          accepting_responses: f.accepting_responses ?? true,
          one_response_per_user: f.one_response_per_user ?? false,
          requires_login: f.requires_login ?? true,
          allow_response_editing: f.allow_response_editing ?? false,
          allow_draft_save: (f as any).allow_draft_save ?? true,

          show_quiz_score: f.show_quiz_score ?? true,
          show_response_summary: f.show_response_summary ?? true,

          start_mode: (f.starts_at ? 'scheduled' : 'immediately') as 'immediately' | 'scheduled',
          starts_at: formatDatetimeLocal(f.starts_at),
          enable_auto_close: Boolean(f.ends_at),
          ends_at: formatDatetimeLocal(f.ends_at),
          timezone: f.timezone || 'Asia/Kolkata',

          enable_quiz_timer: Boolean(f.time_limit_minutes && f.time_limit_minutes > 0),
          time_limit_minutes: f.time_limit_minutes || 30,
          auto_submit_on_expiry: true,

          enable_response_limit: Boolean(f.response_limit && f.response_limit > 0),
          response_limit: f.response_limit || 100,

          enable_event_features: Boolean(f.event_name || f.event_venue || f.registration_prefix),
          event_name: f.event_name || '',
          event_venue: f.event_venue || '',
          event_date: f.event_date || '',
          event_time: '',
          registration_prefix: f.registration_prefix || 'MXEV',

          closed_title: f.closed_title || 'Registration Closed',
          closed_message: f.closed_message || 'Registration for this event has ended. Thank you for your interest.',
          closed_button_text: f.closed_button_text || '',
          closed_button_url: f.closed_button_url || '',

          attachment_url: f.attachment_url || '',
          attachment_name: f.attachment_name || '',
          attachment_display_mode: (f as any).attachment_display_mode || 'original',
          submission_attachment_url: f.submission_attachment_url || '',
          submission_attachment_name: f.submission_attachment_name || '',
        };
        setFormData(data);
        setInitialDataJSON(JSON.stringify(data));
      }
      setLoading(false);
    });
  }, [id]);

  const hasUnsavedChanges = JSON.stringify(formData) !== initialDataJSON;

  // Unsaved changes prompt before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleBack = () => {
    const action = () => {
      if (window.history.length > 1) navigate(-1);
      else navigate(`/forms/${id}/edit`);
    };
    if (hasUnsavedChanges) {
      pendingNavigate.current = action;
      setLeaveConfirmOpen(true);
    } else {
      action();
    }
  };

  const { session } = useAuth();

  const handleSave = async () => {
    if (!id || !form) return;

    // Compute updated fields
    const startsAtISO = formData.start_mode === 'scheduled' && formData.starts_at
      ? new Date(formData.starts_at).toISOString()
      : null;

    const endsAtISO = formData.enable_auto_close && formData.ends_at
      ? new Date(formData.ends_at).toISOString()
      : null;

    // Deadline validation
    if (startsAtISO && endsAtISO && new Date(endsAtISO) <= new Date(startsAtISO)) {
      addToast({ type: 'error', message: 'End time must be after the form start time.' });
      return;
    }

    setSaving(true);
    setSaved(false);

    // Live extension check: if form was closed by deadline, but new end date is in future + accepting_responses is ON
    let status = form.status;
    let manualClosedAt: string | undefined = form.manual_closed_at;

    if (!formData.accepting_responses) {
      manualClosedAt = new Date().toISOString();
    } else {
      manualClosedAt = undefined;
    }

    if (form.is_published) {
      const now = new Date();
      if (endsAtISO && new Date(endsAtISO) > now && formData.accepting_responses) {
        status = 'published'; // Re-opened / Live
      }
    }

    const payload: Partial<Form> = {
      title: formData.title,
      description: formData.description,
      confirmation_message: formData.confirmation_message,
      form_type: formData.form_mode === 'quiz' ? 'quiz' : 'form',
      form_mode: formData.form_mode,
      theme_color: formData.theme_color,

      accepting_responses: formData.accepting_responses,
      one_response_per_user: formData.one_response_per_user,
      requires_login: true, // Always required for MEXO ecosystem
      allow_response_editing: formData.allow_response_editing,

      show_quiz_score: formData.show_quiz_score,
      show_response_summary: formData.show_response_summary,

      starts_at: startsAtISO || undefined,
      ends_at: endsAtISO || undefined,
      timezone: formData.timezone,
      manual_closed_at: manualClosedAt || undefined,
      status: status,

      time_limit_minutes: formData.enable_quiz_timer ? Number(formData.time_limit_minutes) || 0 : 0,

      response_limit: formData.enable_response_limit ? Number(formData.response_limit) || 0 : undefined,

      event_name: formData.enable_event_features ? formData.event_name : undefined,
      event_venue: formData.enable_event_features ? formData.event_venue : undefined,
      event_date: formData.enable_event_features ? formData.event_date : undefined,
      registration_prefix: formData.enable_event_features ? formData.registration_prefix : undefined,

      closed_title: formData.closed_title,
      closed_message: formData.closed_message,
      closed_button_text: formData.closed_button_text,
      closed_button_url: formData.closed_button_url,

      attachment_url: formData.attachment_url,
      attachment_name: formData.attachment_name,
      attachment_display_mode: formData.attachment_display_mode,
      submission_attachment_url: formData.submission_attachment_url,
      submission_attachment_name: formData.submission_attachment_name,
    } as any;

    const updated = await formService.updateForm(id, payload);
    setSaving(false);

    if (updated) {
      setForm(updated);
      setSaved(true);
      setInitialDataJSON(JSON.stringify(formData));
      addToast({
        type: 'success',
        message: '✓ Form settings saved successfully!',
      });
      setTimeout(() => setSaved(false), 3000);
    } else {
      addToast({
        type: 'error',
        message: 'Failed to save settings. Please try again.',
      });
    }
  };

  const handleFileUpload = async (file: File, type: 'header' | 'post') => {
    if (!id) return;
    if (type === 'header') setUploadingHeader(true);
    else setUploadingPost(true);

    const res = await formService.uploadResourceAttachment(file, id);
    if (type === 'header') setUploadingHeader(false);
    else setUploadingPost(false);

    if (res) {
      if (type === 'header') {
        setFormData(s => ({ ...s, attachment_url: res.url, attachment_name: res.name }));
      } else {
        setFormData(s => ({ ...s, submission_attachment_url: res.url, submission_attachment_name: res.name }));
      }
      addToast({ type: 'success', message: `Uploaded ${res.name}` });
    } else {
      addToast({ type: 'error', message: 'File upload failed. Please try again.' });
    }
  };

  const handleDuplicate = async () => {
    if (!form || !form.owner_id) return;
    const dupe = await formService.duplicateForm(form, form.owner_id);
    if (dupe) {
      addToast({ type: 'success', message: 'Form duplicated!' });
      navigate(`/forms/${dupe.id}/edit`);
    }
  };

  if (loading || !form) return null;

  const currentResponsesCount = form.response_count || 0;
  const maxLimit = formData.enable_response_limit ? Number(formData.response_limit) || 100 : 0;
  const spotsRemaining = maxLimit > 0 ? Math.max(0, maxLimit - currentResponsesCount) : 0;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
        {/* Sticky Header */}
        <div className="flex items-center justify-between sticky top-14 bg-app-bg/90 backdrop-blur-md py-3 z-20 border-b border-app-border/50">
          <div className="flex items-center gap-3">
            <button
              id="form-settings-back"
              onClick={handleBack}
              className="p-2 rounded-xl text-app-body hover:bg-slate-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-app-heading flex items-center gap-2">
                Form Settings
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />
                )}
              </h1>
              <p className="text-[11px] text-app-muted truncate max-w-[200px] sm:max-w-xs">{form.title}</p>
            </div>
          </div>

          <MexoButton
            id="save-settings"
            variant="primary"
            size="sm"
            leftIcon={saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            onClick={handleSave}
            loading={saving}
            className={saved ? '!bg-emerald-600 !hover:bg-emerald-700 text-white font-bold' : ''}
          >
            {saved ? 'Saved ✓' : 'Save Changes'}
          </MexoButton>
        </div>

        {/* 1. GENERAL */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4 shadow-mexo-card">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold text-xs">1</span>
            <h2 className="text-sm font-bold text-app-heading">General</h2>
          </div>

          <MexoInput
            label="Form Title"
            value={formData.title}
            onChange={e => setFormData(s => ({ ...s, title: e.target.value }))}
          />

          <MexoTextarea
            label="Description"
            rows={2}
            value={formData.description}
            onChange={e => setFormData(s => ({ ...s, description: e.target.value }))}
          />

          <div>
            <label className="block text-xs font-bold text-app-heading mb-2">Form Purpose / Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'standard', title: 'Standard Form', desc: 'Feedback, surveys, contact forms & general data collection' },
                { id: 'registration', title: 'Registration / Event', desc: 'Events, workshops, seminars, conferences & registrations' },
                { id: 'quiz', title: 'Quiz / Assessment', desc: 'Tests, quizzes, exams & auto-graded assessments' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    if (formData.form_mode === m.id) return;
                    if ((form?.response_count || 0) > 0) {
                      setTargetMode(m.id as any);
                      setModeConfirmOpen(true);
                    } else {
                      setFormData(s => ({
                        ...s,
                        form_mode: m.id as any,
                        form_type: m.id === 'quiz' ? 'quiz' : 'form',
                        enable_event_features: m.id === 'registration',
                      }));
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    formData.form_mode === m.id
                      ? 'border-[#7C3AED] bg-purple-50/60 text-[#7C3AED] ring-2 ring-purple-100 font-bold'
                      : 'border-app-border hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="text-xs font-extrabold">{m.title}</div>
                  <div className="text-[10px] text-app-muted mt-1 leading-relaxed">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <MexoTextarea
            label="Confirmation Message"
            rows={2}
            value={formData.confirmation_message}
            onChange={e => setFormData(s => ({ ...s, confirmation_message: e.target.value }))}
            hint="Shown to respondents immediately after successful submission"
          />
        </div>

        {/* 2. APPEARANCE */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4 shadow-mexo-card">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">2</span>
            <h2 className="text-sm font-bold text-app-heading">Appearance</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-heading mb-2">Form Header Banner Color Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.values(THEME_OPTIONS).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData(s => ({ ...s, theme_color: t.id }))}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    formData.theme_color === t.id
                      ? 'border-[#7C3AED] ring-2 ring-purple-200 bg-purple-50/40'
                      : 'border-app-border hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-full h-8 rounded-xl ${t.previewBg} shadow-xs`} />
                  <span className="text-xs font-bold text-app-heading">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. RESPONSES & ACCESS */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4 shadow-mexo-card">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">3</span>
            <h2 className="text-sm font-bold text-app-heading">Responses & Access</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-app-heading">Accepting Responses</p>
                <p className="text-[11px] text-app-muted mt-0.5">Toggle OFF to temporarily pause new form submissions</p>
              </div>
              <MexoToggle
                id="setting-accepting-responses"
                checked={formData.accepting_responses}
                onCheckedChange={v => setFormData(s => ({ ...s, accepting_responses: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-app-heading">Limit to 1 attempt per user</p>
                <p className="text-[11px] text-app-muted mt-0.5">Prevents respondents from submitting more than once</p>
              </div>
              <MexoToggle
                id="setting-one-per-user"
                checked={formData.one_response_per_user}
                onCheckedChange={v => setFormData(s => ({ ...s, one_response_per_user: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
              <div>
                <p className="text-xs font-bold text-app-heading flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#7C3AED]" /> MEXO Account Authentication
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-[#7C3AED]">✓ Required</span>
                </p>
                <p className="text-[11px] text-app-muted mt-0.5">Respondents sign in with their MEXO Account before submitting</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-app-heading">Allow response editing</p>
                <p className="text-[11px] text-app-muted mt-0.5">Allows respondents to modify their submitted response later</p>
              </div>
              <MexoToggle
                checked={formData.allow_response_editing}
                onCheckedChange={v => setFormData(s => ({ ...s, allow_response_editing: v }))}
              />
            </div>
          </div>
        </div>

        {/* 4. RESULTS & ANSWER REVIEW (Quiz only) */}
        {formData.form_type === 'quiz' && (
          <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4 shadow-mexo-card">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">4</span>
              <h2 className="text-sm font-bold text-app-heading">Results & Answer Review</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-app-heading">Show score & correct answers after submission</p>
                  <p className="text-[11px] text-app-muted mt-0.5">Displays score breakdown and correct options upon completion</p>
                </div>
                <MexoToggle
                  id="setting-show-quiz-score"
                  checked={formData.show_quiz_score}
                  onCheckedChange={v => setFormData(s => ({ ...s, show_quiz_score: v }))}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-app-heading">Allow viewing response summary</p>
                  <p className="text-[11px] text-app-muted mt-0.5">Allows respondents to review their answers on completion</p>
                </div>
                <MexoToggle
                  id="setting-show-response-summary"
                  checked={formData.show_response_summary}
                  onCheckedChange={v => setFormData(s => ({ ...s, show_response_summary: v }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. AVAILABILITY & SCHEDULE */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-5 shadow-mexo-card">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">5</span>
              <h2 className="text-sm font-bold text-app-heading">Availability & Schedule</h2>
            </div>
          </div>

          {/* Start Schedule */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-app-muted">Form Availability</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(s => ({ ...s, start_mode: 'immediately', starts_at: '' }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.start_mode === 'immediately'
                    ? 'border-[#7C3AED] bg-purple-50/50 text-[#7C3AED] font-bold'
                    : 'border-app-border hover:border-slate-300'
                }`}
              >
                <div className="text-xs">Immediately after publishing</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(s => ({ ...s, start_mode: 'scheduled' }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.start_mode === 'scheduled'
                    ? 'border-[#7C3AED] bg-purple-50/50 text-[#7C3AED] font-bold'
                    : 'border-app-border hover:border-slate-300'
                }`}
              >
                <div className="text-xs">Schedule start date & time</div>
              </button>
            </div>

            {formData.start_mode === 'scheduled' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-app-heading">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={e => setFormData(s => ({ ...s, starts_at: e.target.value }))}
                  className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
              </div>
            )}
          </div>

          {/* Closing Schedule */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-app-muted">Closing & Deadline</h3>
              <MexoToggle
                checked={formData.enable_auto_close}
                onCheckedChange={v => setFormData(s => ({ ...s, enable_auto_close: v, ends_at: v ? formData.ends_at : '' }))}
              />
            </div>

            {formData.enable_auto_close ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-app-heading">End Date & Time (Deadline)</label>
                <input
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={e => setFormData(s => ({ ...s, ends_at: e.target.value }))}
                  className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
                <button
                  type="button"
                  onClick={() => setFormData(s => ({ ...s, enable_auto_close: false, ends_at: '' }))}
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  Remove deadline (No deadline)
                </button>
              </div>
            ) : (
              <p className="text-xs text-app-muted">No deadline set — form will remain open indefinitely.</p>
            )}
          </div>

          {/* Timezone */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-app-heading mb-1">Form Timezone</label>
            <select
              value={formData.timezone}
              onChange={e => setFormData(s => ({ ...s, timezone: e.target.value }))}
              className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 6. QUIZ TIMER (Quiz only) */}
        {formData.form_type === 'quiz' && (
          <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4 shadow-mexo-card">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">6</span>
                <h2 className="text-sm font-bold text-app-heading">Quiz / Assessment Timer</h2>
              </div>
              <MexoToggle
                checked={formData.enable_quiz_timer}
                onCheckedChange={v => setFormData(s => ({ ...s, enable_quiz_timer: v }))}
              />
            </div>

            {formData.enable_quiz_timer && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-app-heading mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.time_limit_minutes}
                    onChange={e => setFormData(s => ({ ...s, time_limit_minutes: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                  />
                  <p className="text-[11px] text-app-muted mt-1">Timer starts when respondent opens the quiz attempt</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REGISTRATION SPECIFIC SECTIONS */}
        {formData.form_mode === 'registration' && (
          <>
            {/* 6. CAPACITY & REGISTRATION */}
            <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4 shadow-mexo-card">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold text-xs">6</span>
                  <h2 className="text-sm font-bold text-app-heading">Registration Capacity & Limit</h2>
                </div>
                <MexoToggle
                  checked={formData.enable_response_limit}
                  onCheckedChange={v => setFormData(s => ({ ...s, enable_response_limit: v }))}
                />
              </div>

              {formData.enable_response_limit && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-app-heading mb-1">Maximum Registrations Allowed</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.response_limit}
                      onChange={e => setFormData(s => ({ ...s, response_limit: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white font-bold text-slate-900"
                    />
                  </div>

                  {/* Live capacity counter */}
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between text-xs font-bold text-purple-900">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#7C3AED]" /> Spots Remaining:
                    </span>
                    <span>{spotsRemaining} spots available ({currentResponsesCount} registered / {maxLimit} max)</span>
                  </div>
                </div>
              )}
            </div>

            {/* 7. EVENT / REGISTRATION DETAILS */}
            <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4 shadow-mexo-card">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">7</span>
                  <h2 className="text-sm font-bold text-app-heading">Event / Registration Details</h2>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <MexoInput
                  label="Event Name"
                  value={formData.event_name}
                  onChange={e => setFormData(s => ({ ...s, event_name: e.target.value }))}
                  placeholder="e.g. Annual Tech Symposium 2026"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MexoInput
                    label="Venue / Location"
                    value={formData.event_venue}
                    onChange={e => setFormData(s => ({ ...s, event_venue: e.target.value }))}
                    placeholder="e.g. Main Auditorium / Zoom"
                  />
                  <MexoInput
                    label="Event Date"
                    value={formData.event_date}
                    onChange={e => setFormData(s => ({ ...s, event_date: e.target.value }))}
                    placeholder="e.g. August 20, 2026"
                  />
                </div>
                <MexoInput
                  label="Registration ID Prefix"
                  value={formData.registration_prefix}
                  onChange={e => setFormData(s => ({ ...s, registration_prefix: e.target.value.toUpperCase() }))}
                  placeholder="MXEV"
                  hint="Generated ticket code example: MXEV-8F92A1"
                />
              </div>
            </div>

            {/* 8. CLOSED REGISTRATION EXPERIENCE */}
            <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4 shadow-mexo-card">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">8</span>
                <h2 className="text-sm font-bold text-app-heading">Closed Registration Experience</h2>
              </div>

              <div className="space-y-3">
                <MexoInput
                  label="Closed Title"
                  value={formData.closed_title}
                  onChange={e => setFormData(s => ({ ...s, closed_title: e.target.value }))}
                  placeholder="Registration Closed"
                />
                <MexoTextarea
                  label="Closed Message"
                  rows={2}
                  value={formData.closed_message}
                  onChange={e => setFormData(s => ({ ...s, closed_message: e.target.value }))}
                  placeholder="Registration for this event has ended..."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MexoInput
                    label="Button Label (Optional)"
                    value={formData.closed_button_text}
                    onChange={e => setFormData(s => ({ ...s, closed_button_text: e.target.value }))}
                    placeholder="Visit Website"
                  />
                  <MexoInput
                    label="Button URL (Optional)"
                    value={formData.closed_button_url}
                    onChange={e => setFormData(s => ({ ...s, closed_button_url: e.target.value }))}
                    placeholder="https://mexo.com"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* 10. ATTACHMENTS & RESOURCES */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4 shadow-mexo-card">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">10</span>
            <h2 className="text-sm font-bold text-app-heading">Attachments & Resources</h2>
          </div>

          <div className="space-y-4">
            {/* Header Attachment */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-app-heading">Header / Form Resource (Image, Poster, Guidelines)</label>
              {formData.attachment_name || formData.attachment_url ? (
                <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs pb-2 border-b border-slate-100">
                    <span className="font-bold text-app-heading truncate flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-[#7C3AED]" />
                      {formData.attachment_name || 'Header Resource'}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="px-3 py-1.5 rounded-xl bg-purple-50 text-[#7C3AED] text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer">
                        Replace
                        <input
                          type="file"
                          disabled={uploadingHeader}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'header');
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(s => ({ ...s, attachment_name: '', attachment_url: '' }))}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 font-bold"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Live Attachment Preview Component */}
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-black tracking-wider text-app-muted mb-1">Live Resource Preview</p>
                    <FormResourceRenderer
                      url={formData.attachment_url}
                      name={formData.attachment_name}
                      displayMode={formData.attachment_display_mode}
                    />
                  </div>

                  {/* Image Display Mode Selector */}
                  {isImageFile(formData.attachment_url, formData.attachment_name) && (
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-bold text-app-heading mb-1.5">Image Display Mode</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'original', label: 'Original Ratio', desc: 'Full image without cropping' },
                          { id: 'banner', label: 'Banner Mode', desc: 'Wide header presentation' },
                          { id: 'compact', label: 'Compact', desc: 'Centered, smaller instructions' },
                        ].map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setFormData(s => ({ ...s, attachment_display_mode: m.id as any }))}
                            className={`p-2 rounded-xl border text-left transition-all ${
                              formData.attachment_display_mode === m.id
                                ? 'border-[#7C3AED] bg-purple-50 text-[#7C3AED] font-bold'
                                : 'border-slate-200 hover:border-slate-300 text-app-heading'
                            }`}
                          >
                            <div className="text-[11px]">{m.label}</div>
                            <div className="text-[9px] text-app-muted mt-0.5 leading-tight">{m.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingHeader ? 'Uploading...' : '+ Upload File'}
                    <input
                      type="file"
                      disabled={uploadingHeader}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'header');
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-app-muted">or paste URL below</span>
                </div>
              )}
              {!formData.attachment_url && (
                <input
                  type="url"
                  value={formData.attachment_url}
                  onChange={e => setFormData(s => ({ ...s, attachment_url: e.target.value }))}
                  placeholder="https://example.com/guidelines.pdf"
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
              )}
            </div>

            {/* Post-Submission Attachment */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-app-heading">Post-Submission Resource (Answer Key, Study Material)</label>
              {formData.submission_attachment_name || formData.submission_attachment_url ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-100 text-xs">
                  <span className="font-semibold text-app-heading truncate flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-[#7C3AED]" />
                    {formData.submission_attachment_name || 'Post-Submission Resource'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {formData.submission_attachment_url && (
                      <a href={formData.submission_attachment_url} target="_blank" rel="noreferrer" className="text-[#7C3AED] hover:underline font-bold">
                        Preview
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setFormData(s => ({ ...s, submission_attachment_name: '', submission_attachment_url: '' }))}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingPost ? 'Uploading...' : '+ Upload File'}
                    <input
                      type="file"
                      disabled={uploadingPost}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'post');
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-app-muted">or paste URL below</span>
                </div>
              )}
              {!formData.submission_attachment_url && (
                <input
                  type="url"
                  value={formData.submission_attachment_url}
                  onChange={e => setFormData(s => ({ ...s, submission_attachment_url: e.target.value }))}
                  placeholder="https://example.com/answers.pdf"
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
              )}
            </div>
          </div>
        </div>

        {/* 11. FORM MANAGEMENT */}
        <div className="bg-white rounded-2xl border border-app-border p-6 flex items-center justify-between shadow-mexo-card">
          <div>
            <p className="text-xs font-bold text-app-heading">Duplicate Form</p>
            <p className="text-[11px] text-app-muted mt-0.5">Create an exact copy of this form and its settings</p>
          </div>
          <MexoButton variant="secondary" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={handleDuplicate}>
            Duplicate
          </MexoButton>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-rose-200 p-6 flex items-center justify-between shadow-mexo-card">
          <div>
            <p className="text-xs font-bold text-rose-700">Move to Trash</p>
            <p className="text-[11px] text-rose-600/80 mt-0.5">Form will be moved to trash and public access stopped</p>
          </div>
          <MexoButton
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setTrashConfirmOpen(true)}
          >
            Move to Trash
          </MexoButton>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <MexoModal open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen} title="Unsaved Changes" maxWidth="max-w-xs">
        <div className="space-y-4 text-center py-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            You have unsaved changes in Form Settings. Do you want to save them before leaving?
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={async () => {
                await handleSave();
                setLeaveConfirmOpen(false);
                pendingNavigate.current?.();
                pendingNavigate.current = null;
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity min-h-[44px]"
            >
              Save & Exit
            </button>
            <button
              onClick={() => {
                setLeaveConfirmOpen(false);
                pendingNavigate.current?.();
                pendingNavigate.current = null;
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors min-h-[44px]"
            >
              Discard Changes
            </button>
          </div>
        </div>
      </MexoModal>

      {/* Move to Trash Confirm Modal */}
      <MexoConfirmDialog
        open={trashConfirmOpen}
        onOpenChange={setTrashConfirmOpen}
        title="Move Form to Trash?"
        description={`"${formData.title}" will be un-published and moved to trash.`}
        confirmLabel="Move to Trash"
        variant="danger"
        onConfirm={async () => {
          if (!id) return;
          const formId = id;
          const formTitle = formData.title;
          await formService.trashForm(formId);
          addToast({
            type: 'info',
            message: `"${formTitle}" moved to trash.`,
            duration: 5000,
            action: {
              label: 'Undo',
              onClick: async () => {
                await formService.restoreForm(formId);
                addToast({ type: 'success', message: `"${formTitle}" restored successfully.` });
              },
            },
          });
          navigate('/forms');
        }}
      />
      {/* Purpose Mode Change Warning Modal */}
      <MexoConfirmDialog
        open={modeConfirmOpen}
        onOpenChange={setModeConfirmOpen}
        title="Change Form Purpose Mode?"
        description={`Changing to ${targetMode.toUpperCase()} mode will adjust visible settings sections for this form. Existing responses, registration IDs, and saved settings will be preserved.`}
        confirmLabel="Change Purpose Mode"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={() => {
          setFormData(s => ({
            ...s,
            form_mode: targetMode,
            form_type: targetMode === 'quiz' ? 'quiz' : 'form',
            enable_event_features: targetMode === 'registration',
          }));
          setModeConfirmOpen(false);
        }}
      />

      <MexoToastContainer toasts={toasts} removeToast={removeToast} />
    </AppShell>
  );
};
