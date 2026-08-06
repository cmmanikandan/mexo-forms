import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { formService } from '../../services/formService';
import { Form } from '../../types/forms';
import { MexoModal, MexoConfirmDialog } from '../../components/common/MexoModal';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoInput, MexoTextarea } from '../../components/common/MexoInput';
import { MexoToggle } from '../../components/common/MexoToggle';
import { useToast } from '../../hooks/useToast';
import { MexoToastContainer } from '../../components/common/MexoToast';
import { ArrowLeft, Save, Trash2, Copy } from 'lucide-react';

export const FormSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trashConfirmOpen, setTrashConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    confirmation_message: '',
    accepting_responses: true,
    requires_login: false,
    one_response_per_user: false,
  });

  useEffect(() => {
    if (!id) return;
    formService.getForm(id).then(f => {
      if (f) {
        setForm(f);
        setFormData({
          title: f.title,
          description: f.description || '',
          confirmation_message: f.confirmation_message || 'Thank you for your response!',
          accepting_responses: f.accepting_responses,
          requires_login: f.requires_login,
          one_response_per_user: f.one_response_per_user,
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const updated = await formService.updateForm(id, formData);
    setSaving(false);
    if (updated) {
      setForm(updated);
      addToast({ type: 'success', message: 'Form settings saved!' });
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
          <MexoButton id="save-settings" variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave} loading={saving}>
            Save Changes
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
          <MexoTextarea
            label="Confirmation Message"
            rows={2}
            value={formData.confirmation_message}
            onChange={e => setFormData(s => ({ ...s, confirmation_message: e.target.value }))}
            hint="Shown to respondent after successful submission"
          />
        </div>

        {/* Responses */}
        <div className="bg-white rounded-2xl border border-app-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-app-heading">Responses</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-app-heading">Accepting responses</p>
                <p className="text-[11px] text-app-muted mt-0.5">Turn off to temporarily pause submissions</p>
              </div>
              <MexoToggle
                id="setting-accepting-responses"
                checked={formData.accepting_responses}
                onCheckedChange={v => setFormData(s => ({ ...s, accepting_responses: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-app-heading">Require MEXO Account login</p>
                <p className="text-[11px] text-app-muted mt-0.5">Respondents must be signed in to MEXO</p>
              </div>
              <MexoToggle
                id="setting-requires-login"
                checked={formData.requires_login}
                onCheckedChange={v => setFormData(s => ({ ...s, requires_login: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-app-heading">Limit to 1 response per user</p>
                <p className="text-[11px] text-app-muted mt-0.5">Requires respondents to be logged in</p>
              </div>
              <MexoToggle
                id="setting-one-per-user"
                checked={formData.one_response_per_user}
                onCheckedChange={v => setFormData(s => ({ ...s, one_response_per_user: v }))}
              />
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
