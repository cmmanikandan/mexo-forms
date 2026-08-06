import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form } from '../../types/forms';
import { formService } from '../../services/formService';
import { MexoConfirmDialog } from '../common/MexoModal';
import { FormStatusBadge } from './FormStatusBadge';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Edit2, BarChart2, Star, Trash2, Copy, ExternalLink,
  MoreVertical, Clock, MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FormCardProps {
  form: Form;
  onDeleted?: (id: string) => void;
  onStarred?: (id: string, starred: boolean) => void;
}

export const FormCard: React.FC<FormCardProps> = ({ form, onDeleted, onStarred }) => {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await formService.trashForm(form.id);
    setDeleting(false);
    setDeleteOpen(false);
    onDeleted?.(form.id);
  };

  const handleStar = async () => {
    const newStarred = !form.is_starred;
    await formService.toggleStar(form.id, newStarred);
    onStarred?.(form.id, newStarred);
  };

  const handleDuplicate = async () => {
    // Navigate to forms list after duplicate
    navigate('/forms');
  };

  const relativeTime = form.updated_at
    ? formatDistanceToNow(new Date(form.updated_at), { addSuffix: true })
    : '';

  return (
    <div
      id={`form-card-${form.id}`}
      className="group bg-white rounded-2xl border border-app-border hover:border-indigo-200 hover:shadow-mexo-md transition-all cursor-pointer overflow-hidden"
      onClick={() => navigate(`/forms/${form.id}/edit`)}
      role="article"
      aria-label={form.title}
    >
      {/* Top color strip */}
      <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8]" />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-app-heading text-sm truncate">{form.title}</h3>
            {form.description && (
              <p className="text-xs text-app-muted mt-0.5 truncate">{form.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <FormStatusBadge status={form.status} />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  id={`form-menu-${form.id}`}
                  className="p-1.5 rounded-xl text-app-muted hover:bg-slate-100 hover:text-app-heading transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Form options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="w-48 bg-white rounded-2xl shadow-mexo-popover border border-app-border p-1 z-50 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
                  align="end"
                  onClick={e => e.stopPropagation()}
                >
                  <DropdownMenu.Item
                    onClick={() => navigate(`/forms/${form.id}/edit`)}
                    className="flex items-center px-3 py-2 rounded-xl text-app-body hover:bg-slate-100 cursor-pointer outline-none"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-2 text-app-muted" /> Edit
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => navigate(`/forms/${form.id}/responses`)}
                    className="flex items-center px-3 py-2 rounded-xl text-app-body hover:bg-slate-100 cursor-pointer outline-none"
                  >
                    <BarChart2 className="w-3.5 h-3.5 mr-2 text-app-muted" /> View Responses
                  </DropdownMenu.Item>
                  {form.is_published && (
                    <DropdownMenu.Item
                      onClick={() => window.open(`/f/${form.slug}`, '_blank')}
                      className="flex items-center px-3 py-2 rounded-xl text-app-body hover:bg-slate-100 cursor-pointer outline-none"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-2 text-app-muted" /> Open Form
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item
                    onClick={handleStar}
                    className="flex items-center px-3 py-2 rounded-xl text-app-body hover:bg-slate-100 cursor-pointer outline-none"
                  >
                    <Star className={`w-3.5 h-3.5 mr-2 ${form.is_starred ? 'text-amber-400 fill-amber-400' : 'text-app-muted'}`} />
                    {form.is_starred ? 'Unstar' : 'Star'}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-app-border my-1" />
                  <DropdownMenu.Item
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2 text-rose-500" /> Move to Trash
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px] text-app-muted">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {form.response_count ?? 0} {form.response_count === 1 ? 'response' : 'responses'}
          </span>
          {relativeTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {relativeTime}
            </span>
          )}
        </div>
      </div>

      <MexoConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Move to Trash"
        description={`"${form.title}" will be moved to Trash. You can restore it later.`}
        confirmLabel="Move to Trash"
        variant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
};
