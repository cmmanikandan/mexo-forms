import React from 'react';
import { Form, FormStatus } from '../../types/forms';
import { getFormAvailability } from '../../utils/formLifecycle';

interface FormStatusBadgeProps {
  form?: Form;
  status?: FormStatus;
}

export const FormStatusBadge: React.FC<FormStatusBadgeProps> = ({ form, status }) => {
  if (form) {
    const avail = getFormAvailability(form, form.response_count || 0);
    const badgeLabel = avail.status === 'OPEN' ? 'LIVE' : avail.badgeLabel;

    const colorConfig: Record<string, string> = {
      LIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold',
      SCHEDULED: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold',
      PAUSED: 'bg-amber-50 text-amber-800 border border-amber-200 font-bold',
      CLOSED: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
      FULL: 'bg-purple-50 text-purple-700 border border-purple-200 font-extrabold',
      DRAFT: 'bg-slate-100 text-slate-600 font-semibold',
      ARCHIVED: 'bg-slate-100 text-slate-500 font-semibold',
    };

    const cls = colorConfig[badgeLabel] || 'bg-slate-100 text-slate-600';

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-wide ${cls}`}>
        {badgeLabel === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        {badgeLabel === 'SCHEDULED' && <span className="text-[10px]">◷</span>}
        {badgeLabel}
      </span>
    );
  }

  const legacyConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'DRAFT', className: 'bg-slate-100 text-slate-600' },
    published: { label: 'LIVE', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    closed: { label: 'CLOSED', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
    archived: { label: 'ARCHIVED', className: 'bg-slate-100 text-slate-500' },
    trashed: { label: 'TRASHED', className: 'bg-rose-50 text-rose-600 border border-rose-200' },
  };

  const item = legacyConfig[status || 'draft'] || legacyConfig.draft;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${item.className}`}>
      {item.label}
    </span>
  );
};
