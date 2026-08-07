import React from 'react';
import { MexoModal } from '../common/MexoModal';
import { ShieldCheck, Mail, Sparkles, ExternalLink } from 'lucide-react';

interface AboutMexoFormsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutMexoFormsModal: React.FC<AboutMexoFormsModalProps> = ({ open, onOpenChange }) => {
  const mailUrl = (import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app';

  return (
    <MexoModal open={open} onOpenChange={onOpenChange} title="About MEXO Forms" maxWidth="max-w-sm">
      <div className="text-center py-2 space-y-4">
        <div className="w-14 h-14 mx-auto bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center p-2.5 shadow-2xs">
          <img src="/logo.png" alt="MEXO Forms" className="w-full h-full object-contain" />
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900">MEXO Forms</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Professional form builder, event registration and quiz platform powered by MEXO Account identity.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Version</span>
            <span className="font-extrabold text-slate-900">v1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Identity System</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> MEXO Verified
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Ecosystem</span>
            <span className="font-bold text-[#7C3AED]">MEXO Mail & Forms</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <a
            href={mailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-app-border text-xs font-bold text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-[#7C3AED]" /> Visit MEXO Mail <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </MexoModal>
  );
};
