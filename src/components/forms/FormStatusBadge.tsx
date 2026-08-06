import React from 'react';
import { FormStatus } from '../../types/forms';

interface FormStatusBadgeProps {
  status: FormStatus;
}

export const FormStatusBadge: React.FC<FormStatusBadgeProps> = ({ status }) => {
  const config = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
    published: { label: 'Published', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    closed: { label: 'Closed', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    archived: { label: 'Archived', className: 'bg-slate-100 text-slate-500' },
    trashed: { label: 'Trashed', className: 'bg-rose-50 text-rose-600 border border-rose-200' },
  };

  const { label, className } = config[status] || config.draft;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
};
