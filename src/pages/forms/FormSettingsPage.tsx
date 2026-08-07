import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { formService } from '../../services/formService';
import { Form } from '../../types/forms';
import { THEME_OPTIONS } from '../../utils/themeUtils';
import { MexoModal, MexoConfirmDialog } from '../../components/common/MexoModal';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoInput, MexoTextarea } from '../../components/common/MexoInput';
import { MexoToggle } from '../../components/common/MexoToggle';
import { useToast } from '../../hooks/useToast';
import { MexoToastContainer } from '../../components/common/MexoToast';
import { ArrowLeft, Save, Trash2, Copy, Check } from 'lucide-react';

export const FormSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [trashConfirmOpen, setTrashConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    confirmation_message: '',
    form_type: 'form' as 'form' | 'quiz',
    accepting_responses: true,
    requires_login: false,
    one_response_per_user: false,
    show_quiz_score: true,
    show_response_summary: true,
    show_progress_bar: true,
    shuffle_questions: false,
    time_limit_minutes: 0,
    starts_at: '',
    ends_at: '',
    theme_color: 'violet',
    attachment_url: '',
    attachment_name: '',
    submission_attachment_url: '',
    submission_attachment_name: '',
  });

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
        setFormData({
          title: f.title,
          description: f.description || '',
          confirmation_message: f.confirmation_message || 'Thank you for your response!',
          form_type: f.form_type || 'form',
          accepting_responses: f.accepting_responses ?? true,
          requires_login: f.requires_login ?? false,
          one_response_per_user: f.one_response_per_user ?? false,
          show_quiz_score: f.show_quiz_score ?? true,
          show_response_summary: f.show_response_summary ?? true,
          show_progress_bar: f.show_progress_bar ?? true,
          shuffle_questions: f.shuffle_questions ?? false,
          time_limit_minutes: f.time_limit_minutes ?? 0,
          starts_at: formatDatetimeLocal(f.starts_at),
          ends_at: formatDatetimeLocal(f.ends_at),
          theme_color: f.theme_color || 'violet',
          attachment_url: f.attachment_url || '',
          attachment_name: f.attachment_name || '',
          submission_attachment_url: f.submission_attachment_url || '',
          submission_attachment_name: f.submission_attachment_name || '',
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaved(false);

    const payload = {
      ...formData,
      time_limit_minutes: Number(formData.time_limit_minutes) || 0,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
    };

    const updated = await formService.updateForm(id, payload as any);
    setSaving(false);
    if (updated) {
      setForm(updated);
      setSaved(true);
      addToast({ type: 'success', message: 'Form settings saved successfully!' });
      setTimeout(() => setSaved(false), 3000);
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

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="form-settings-back"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(`/forms/${id}/edit`);
                }
              }}
              className="p-2 rounded-xl text-app-body hover:bg-slate-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-extrabold text-app-heading">Form Settings</h1>
          </div>
          <MexoButton
            id="save-settings"
            variant={saved ? 'primary' : 'primary'}
            size="sm"
            leftIcon={saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            onClick={handleSave}
            loading={saving}
            className={saved ? '!bg-emerald-600 !hover:bg-emerald-700 text-white transition-all font-bold' : ''}
          >
            {saved ? 'Saved ✓' : 'Save Changes'}
          </MexoButton>
        </div>

        {/* General */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-app-heading">General</h2>
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
            <label className="block text-xs font-semibold text-app-heading mb-1.5">Form Purpose / Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(s => ({ ...s, form_type: 'form' }))}
                className={`p-3 rounded-xl border text-left transition-all ${formData.form_type === 'form' ? 'border-[#7C3AED] bg-indigo-50/50 text-[#7C3AED]' : 'border-app-border hover:border-slate-300'}`}
              >
                <div className="text-xs font-bold">Standard Form</div>
                <div className="text-[11px] text-app-muted mt-0.5">Collect feedback, surveys, or registrations</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(s => ({ ...s, form_type: 'quiz' }))}
                className={`p-3 rounded-xl border text-left transition-all ${formData.form_type === 'quiz' ? 'border-[#7C3AED] bg-indigo-50/50 text-[#7C3AED]' : 'border-app-border hover:border-slate-300'}`}
              >
                <div className="text-xs font-bold">Quiz / Assessment</div>
                <div className="text-[11px] text-app-muted mt-0.5">Auto-grade questions with correct answers & scores</div>
              </button>
            </div>
          </div>

          <MexoTextarea
            label="Confirmation Message"
            rows={2}
            value={formData.confirmation_message}
            onChange={e => setFormData(s => ({ ...s, confirmation_message: e.target.value }))}
            hint="Shown to respondent after successful submission"
          />
        </div>

        {/* Header Theme Customizer */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-app-heading">Form Header Theme & Style</h2>
          <div>
            <label className="block text-xs font-semibold text-app-heading mb-2">Select Header Banner Color Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.values(THEME_OPTIONS).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData(s => ({ ...s, theme_color: t.id }))}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
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

        {/* Responses & Attempts */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-app-heading">Responses & Attempts</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-app-heading">Accepting responses</p>
                <p className="text-[11px] text-app-muted mt-0.5">Turn off to temporarily pause new submissions</p>
              </div>
              <MexoToggle
                id="setting-accepting-responses"
                checked={formData.accepting_responses}
                onCheckedChange={v => setFormData(s => ({ ...s, accepting_responses: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-app-heading">Limit to 1 attempt per user</p>
                <p className="text-[11px] text-app-muted mt-0.5">Prevents respondents from submitting more than once</p>
              </div>
              <MexoToggle
                id="setting-one-per-user"
                checked={formData.one_response_per_user}
                onCheckedChange={v => setFormData(s => ({ ...s, one_response_per_user: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-app-heading">Require MEXO Account login</p>
                <p className="text-[11px] text-app-muted mt-0.5">Respondents must sign in to MEXO to submit</p>
              </div>
              <MexoToggle
                id="setting-requires-login"
                checked={formData.requires_login}
                onCheckedChange={v => setFormData(s => ({ ...s, requires_login: v }))}
              />
            </div>
          </div>
        </div>

        {/* Results & Quiz Options */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-app-heading">Results & Answer Review</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-app-heading">Show score & correct answers after submission</p>
                <p className="text-[11px] text-app-muted mt-0.5">Displays student score and correct options upon completion</p>
              </div>
              <MexoToggle
                id="setting-show-quiz-score"
                checked={formData.show_quiz_score}
                onCheckedChange={v => setFormData(s => ({ ...s, show_quiz_score: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-app-heading">Allow viewing response summary</p>
                <p className="text-[11px] text-app-muted mt-0.5">Allows respondents to review their submitted answers</p>
              </div>
              <MexoToggle
                id="setting-show-response-summary"
                checked={formData.show_response_summary}
                onCheckedChange={v => setFormData(s => ({ ...s, show_response_summary: v }))}
              />
            </div>
          </div>
        </div>

        {/* Quiz Timer & Schedule */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-app-heading">Timer & Schedule Expiration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-app-heading mb-1">Quiz Time Limit (Minutes)</label>
              <input
                type="number"
                min={0}
                value={formData.time_limit_minutes}
                onChange={e => setFormData(s => ({ ...s, time_limit_minutes: Number(e.target.value) }))}
                placeholder="0 (Unlimited)"
                className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
              />
              <p className="text-[11px] text-app-muted mt-1">Set countdown timer in minutes for quiz attempts (0 = no time limit)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-app-heading mb-1">Open Date & Time (Starts At)</label>
                <input
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={e => setFormData(s => ({ ...s, starts_at: e.target.value }))}
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-heading mb-1">Expiration Date & Time (Ends At)</label>
                <input
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={e => setFormData(s => ({ ...s, ends_at: e.target.value }))}
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attachments & Downloadable Resources */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-app-heading">Attachments & Resources</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-app-heading mb-1">Header Attachment Name & URL</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.attachment_name}
                  onChange={e => setFormData(s => ({ ...s, attachment_name: e.target.value }))}
                  placeholder="e.g. Form Instructions PDF"
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
                <input
                  type="url"
                  value={formData.attachment_url}
                  onChange={e => setFormData(s => ({ ...s, attachment_url: e.target.value }))}
                  placeholder="https://example.com/file.pdf"
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-app-heading mb-1">Post-Submission Downloadable Resource (Answer Key / Study Material)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.submission_attachment_name}
                  onChange={e => setFormData(s => ({ ...s, submission_attachment_name: e.target.value }))}
                  placeholder="e.g. Quiz Answer Key & Solutions"
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
                <input
                  type="url"
                  value={formData.submission_attachment_url}
                  onChange={e => setFormData(s => ({ ...s, submission_attachment_url: e.target.value }))}
                  placeholder="https://example.com/answers.pdf"
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs text-app-heading outline-none focus:border-[#7C3AED] bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-app-border p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-app-heading">Duplicate Form</p>
            <p className="text-[11px] text-app-muted mt-0.5">Create an exact copy of this form and its questions</p>
          </div>
          <MexoButton variant="secondary" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={handleDuplicate}>
            Duplicate
          </MexoButton>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-rose-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-700">Move to Trash</p>
            <p className="text-[11px] text-rose-600/80 mt-0.5">Form will be moved to trash and un-published</p>
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

      <MexoConfirmDialog
        open={trashConfirmOpen}
        onOpenChange={setTrashConfirmOpen}
        title="Move Form to Trash?"
        description={`"${formData.title}" will be un-published and moved to trash.`}
        confirmLabel="Move to Trash"
        variant="danger"
        onConfirm={async () => {
          if (!id) return;
          await formService.trashForm(id);
          addToast({ type: 'info', message: 'Form moved to trash' });
          navigate('/forms');
        }}
      />
      <MexoToastContainer toasts={toasts} removeToast={removeToast} />
    </AppShell>
  );
};
