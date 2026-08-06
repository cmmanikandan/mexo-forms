import React from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Toast } from '../../hooks/useToast';

interface MexoToastProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export const MexoToastContainer: React.FC<MexoToastProps> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-[100] flex flex-col gap-2 items-end" role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 min-w-[280px] max-w-[360px] rounded-2xl px-4 py-3 shadow-mexo-popover border text-sm font-medium animate-in slide-in-from-right-8 fade-in duration-200 ${
            toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-800' :
            toast.type === 'error' ? 'bg-white border-rose-200 text-rose-800' :
            toast.type === 'warning' ? 'bg-white border-amber-200 text-amber-800' :
            'bg-white border-app-border text-app-heading'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-app-muted hover:text-app-heading transition-colors ml-1 flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
