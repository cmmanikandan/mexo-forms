import React, { useState } from 'react';
import { Form } from '../../types/forms';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { Users, TrendingUp } from 'lucide-react';

interface IncreaseCapacityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form;
  onSave: (newLimit: number) => Promise<void>;
}

export const IncreaseCapacityModal: React.FC<IncreaseCapacityModalProps> = ({
  open,
  onOpenChange,
  form,
  onSave,
}) => {
  const currentCount = form.response_count || 0;
  const currentLimit = form.response_limit || 100;
  const [newLimit, setNewLimit] = useState<number>(Math.max(currentLimit + 25, currentCount + 25));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newLimit <= currentCount) return;
    setSaving(true);
    try {
      await onSave(newLimit);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MexoModal open={open} onOpenChange={onOpenChange} title="Increase Capacity / Response Limit" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <p className="text-xs text-app-muted leading-relaxed">
          Increase the maximum response limit to allow additional registrations. If the form was previously full, it will automatically resume accepting responses.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-semibold text-app-muted block">Responses received</span>
            <span className="text-sm font-extrabold text-app-heading">{currentCount} responses</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs">
            <span className="font-semibold text-purple-700 block">Current Capacity</span>
            <span className="text-sm font-extrabold text-[#7C3AED]">{currentLimit} seats</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-app-heading mb-1.5">New Maximum Limit</label>
          <input
            type="number"
            min={currentCount + 1}
            value={newLimit}
            onChange={e => setNewLimit(Number(e.target.value))}
            className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs font-extrabold text-app-heading bg-white outline-none focus:border-[#7C3AED]"
            required
          />
          {newLimit <= currentCount && (
            <p className="text-[11px] text-rose-600 mt-1">New limit must be greater than current response count ({currentCount}).</p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-app-body hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <MexoButton type="submit" variant="primary" size="md" loading={saving} disabled={newLimit <= currentCount}>
            Update Capacity
          </MexoButton>
        </div>
      </form>
    </MexoModal>
  );
};
