import React, { useState } from 'react';
import { Form, FormQuestion } from '../../types/forms';
import { MexoModal } from '../common/MexoModal';
import { PublicFormRenderer } from '../public/PublicFormRenderer';
import { Monitor, Smartphone } from 'lucide-react';

interface PreviewModalProps {
  open: boolean;
  form: Form;
  questions: FormQuestion[];
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ open, form, questions, onClose }) => {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${open ? '' : 'hidden'}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Preview container */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Preview toolbar */}
        <div className="relative z-10 bg-white border-b border-app-border px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-app-heading">Preview</span>
          <div className="flex items-center gap-2">
            <button
              id="preview-desktop"
              onClick={() => setView('desktop')}
              className={`p-2 rounded-xl transition-colors ${view === 'desktop' ? 'bg-indigo-50 text-[#7C3AED]' : 'text-app-muted hover:bg-slate-100'}`}
              title="Desktop preview"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              id="preview-mobile"
              onClick={() => setView('mobile')}
              className={`p-2 rounded-xl transition-colors ${view === 'mobile' ? 'bg-indigo-50 text-[#7C3AED]' : 'text-app-muted hover:bg-slate-100'}`}
              title="Mobile preview"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-app-body bg-slate-100 hover:bg-slate-200 transition-colors ml-2"
            >
              Close
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="relative flex-1 bg-slate-100 overflow-auto flex items-start justify-center py-6 px-4">
          <div
            className={`bg-white min-h-full transition-all duration-300 shadow-xl overflow-y-auto ${
              view === 'mobile' ? 'w-[390px] rounded-3xl' : 'w-full max-w-2xl rounded-2xl'
            }`}
          >
            <PublicFormRenderer form={form} questions={questions} isPreview />
          </div>
        </div>
      </div>
    </div>
  );
};
