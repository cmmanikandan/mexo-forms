import React from 'react';
import { DraftSaveStatus } from '../../hooks/useDraftAutosave';
import { Check, Loader2, WifiOff, RefreshCw, AlertTriangle, GitMerge } from 'lucide-react';

interface DraftSaveIndicatorProps {
  status: DraftSaveStatus;
  className?: string;
}

export const DraftSaveIndicator: React.FC<DraftSaveIndicatorProps> = ({
  status,
  className = '',
}) => {
  if (status === 'idle') return null;

  const config: Record<DraftSaveStatus, { icon: React.ReactNode; label: string; color: string } | null> = {
    idle: null,
    saving: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: 'Saving...',
      color: 'text-slate-400',
    },
    saved: {
      icon: <Check className="w-3 h-3" />,
      label: 'Saved',
      color: 'text-emerald-500',
    },
    offline: {
      icon: <WifiOff className="w-3 h-3" />,
      label: 'Offline · saved on device',
      color: 'text-amber-500',
    },
    syncing: {
      icon: <RefreshCw className="w-3 h-3 animate-spin" />,
      label: 'Syncing...',
      color: 'text-[#7C3AED]',
    },
    conflict: {
      icon: <GitMerge className="w-3 h-3" />,
      label: 'Updated on another device',
      color: 'text-amber-600',
    },
    error: {
      icon: <AlertTriangle className="w-3 h-3" />,
      label: 'Save failed · retrying',
      color: 'text-rose-500',
    },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <div
      className={`flex items-center gap-1 text-[11px] font-semibold transition-all duration-300 ${c.color} ${className}`}
      role="status"
      aria-live="polite"
    >
      {c.icon}
      <span>{c.label}</span>
    </div>
  );
};
