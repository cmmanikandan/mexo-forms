import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { MexoButton } from './MexoButton';

interface MexoConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  loading?: boolean;
}

export const MexoConfirmDialog: React.FC<MexoConfirmDialogProps> = ({
  open, onOpenChange, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', onConfirm, loading = false,
}) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-150" />
      <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md bg-white rounded-2xl shadow-mexo-popover border border-app-border p-6 animate-in fade-in zoom-in-95 duration-150 focus:outline-none">
        <div className="flex items-start justify-between mb-4">
          <Dialog.Title className="text-base font-bold text-app-heading">{title}</Dialog.Title>
          <Dialog.Close asChild>
            <button className="p-1 rounded-lg text-app-muted hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>
        </div>
        <Dialog.Description className="text-sm text-app-body mb-6">{description}</Dialog.Description>
        <div className="flex gap-3 justify-end">
          <Dialog.Close asChild>
            <MexoButton variant="secondary" size="sm">{cancelLabel}</MexoButton>
          </Dialog.Close>
          <MexoButton variant={variant === 'danger' ? 'danger' : 'primary'} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </MexoButton>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

interface MexoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export const MexoModal: React.FC<MexoModalProps> = ({ open, onOpenChange, title, children, maxWidth = 'max-w-lg', footer }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-150" />
      <Dialog.Content className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] ${maxWidth} bg-white rounded-2xl shadow-mexo-popover border border-app-border animate-in fade-in zoom-in-95 duration-150 focus:outline-none overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border">
          <Dialog.Title className="text-sm font-bold text-app-heading">{title}</Dialog.Title>
          <Dialog.Close asChild>
            <button className="p-1.5 rounded-lg text-app-muted hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-app-border bg-slate-50/50">{footer}</div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
