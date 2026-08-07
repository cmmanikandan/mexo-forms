import React, { useState } from 'react';
import { Form } from '../../types/forms';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface ExtendDeadlineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form;
  onSave: (newEndsAt: string) => Promise<void>;
}

export const ExtendDeadlineModal: React.FC<ExtendDeadlineModalProps> = ({
  open,
  onOpenChange,
  form,
  onSave,
}) => {
  const defaultDate = form.ends_at
    ? form.ends_at.slice(0, 10)
    : new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const defaultTime = form.ends_at ? form.ends_at.slice(11, 16) : '20:00';

  const [date, setDate] = useState<string>(defaultDate);
  const [time, setTime] = useState<string>(defaultTime);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    setSaving(true);
    try {
      const iso = new Date(`${date}T${time}:00`).toISOString();
      await onSave(iso);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MexoModal open={open} onOpenChange={onOpenChange} title="Extend Form Deadline" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <p className="text-xs text-app-muted">
          Extending the deadline will update the end timestamp and re-open the form to accept new responses.
        </p>

        {form.ends_at && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-semibold text-app-muted">Previous deadline: </span>
            <span className="font-bold text-app-heading">{new Date(form.ends_at).toLocaleString()}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-app-heading mb-1">New End Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold text-app-heading bg-white outline-none focus:border-[#7C3AED]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-app-heading mb-1">New End Time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold text-app-heading bg-white outline-none focus:border-[#7C3AED]"
              required
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-app-body hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <MexoButton type="submit" variant="primary" size="md" loading={saving}>
            Extend Deadline
          </MexoButton>
        </div>
      </form>
    </MexoModal>
  );
};
