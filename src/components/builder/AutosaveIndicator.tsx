import React from 'react';
import { CheckCircle2, RefreshCw, AlertCircle, WifiOff } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveIndicatorProps {
  status: SaveStatus;
  isOnline: boolean;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ status, isOnline }) => {
  if (!isOnline) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
        <WifiOff className="w-3 h-3" /> Offline
      </span>
    );
  }

  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-[11px] text-app-muted font-medium">
        <RefreshCw className="w-3 h-3 animate-spin" /> Saving…
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
        <CheckCircle2 className="w-3 h-3" /> Saved ✓
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
        <AlertCircle className="w-3 h-3" /> Save failed
      </span>
    );
  }

  return null;
};
