import React, { useState } from 'react';
import { Form } from '../../types/forms';
import { MexoModal } from '../common/MexoModal';
import {
  Copy, Check, ExternalLink, Download, QrCode, Share2, Code, Mail,
  MessageCircle, Send, Globe, GraduationCap,
} from 'lucide-react';

interface ShareFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form | null;
}

export const ShareFormModal: React.FC<ShareFormModalProps> = ({ open, onOpenChange, form }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'embed'>('link');

  if (!form) return null;

  const formSlugOrId = form.slug || form.id;
  const shareUrl = `${window.location.origin}/f/${formSlugOrId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(shareUrl)}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="650" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;
  const mexoMailUrl = (import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const handleSendMexoMail = () => {
    const subject = encodeURIComponent(`Fill out form: ${form.title}`);
    const body = encodeURIComponent(`Hi,\n\nPlease fill out this form:\n${shareUrl}\n\nThank you!`);
    window.open(`${mexoMailUrl}?compose=1&subject=${subject}&body=${body}`, '_blank');
  };

  const handleDownloadQR = async () => {
    try {
      const resp = await fetch(qrUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formSlugOrId}-qr-code.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <MexoModal
      open={open}
      onOpenChange={onOpenChange}
      title="Share Form"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {/* Segmented control tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'link' ? 'bg-white text-app-heading shadow-mexo-sm' : 'text-app-muted hover:text-app-body'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-[#7C3AED]" /> Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'qr' ? 'bg-white text-app-heading shadow-mexo-sm' : 'text-app-muted hover:text-app-body'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#7C3AED]" /> QR Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'embed' ? 'bg-white text-app-heading shadow-mexo-sm' : 'text-app-muted hover:text-app-body'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-[#7C3AED]" /> Embed
          </button>
        </div>

        {/* Tab 1: Link & Quick Share */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-app-heading mb-1.5">Public Form Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-app-heading outline-none select-all focus:border-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    copiedLink ? 'bg-emerald-600 text-white' : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-app-heading mb-2">Quick Share & Messaging</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Please fill out this form: ${form.title} - ${shareUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200 text-[11px] font-bold gap-1 text-center"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleSendMexoMail}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors border border-purple-200 text-[11px] font-bold gap-1 text-center"
                >
                  <Send className="w-4 h-4 text-[#7C3AED]" />
                  <span>MEXO Mail</span>
                </button>

                <a
                  href={`mailto:?subject=${encodeURIComponent(form.title)}&body=${encodeURIComponent(`Please fill out this form:\n\n${shareUrl}`)}`}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors border border-blue-200 text-[11px] font-bold gap-1 text-center"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Email</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(form.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors border border-slate-300 text-[11px] font-bold gap-1 text-center"
                >
                  <Share2 className="w-4 h-4 text-slate-800" />
                  <span>Twitter / X</span>
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 transition-colors border border-indigo-200 text-[11px] font-bold gap-1 text-center"
                >
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

            {/* Feature App Integrations */}
            <div>
              <label className="block text-xs font-bold text-app-heading mb-2">Connected App Integrations</label>
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700">
                    <GraduationCap className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-app-heading">Google Classroom Integration</p>
                    <p className="text-[11px] text-app-muted">Directly assign quiz/form to class students</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-800 flex-shrink-0">
                  Coming Soon
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:underline"
              >
                Open Form in New Tab <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: QR Code */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-2">
            <div className="p-4 bg-white rounded-3xl border-2 border-indigo-100 shadow-mexo-card flex items-center justify-center">
              <img src={qrUrl} alt="Form QR Code" className="w-48 h-48 object-contain" />
            </div>
            <p className="text-xs text-app-muted text-center max-w-xs">
              Scan this QR code with any mobile device to open <strong>{form.title}</strong> directly.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#0878e8] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
              >
                <Download className="w-4 h-4" /> Download QR Code PNG
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-app-border text-app-heading hover:bg-slate-50 transition-colors"
                title="Test Link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Tab 3: Embed */}
        {activeTab === 'embed' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-app-heading mb-1.5">HTML Iframe Embed Code</label>
              <textarea
                readOnly
                rows={4}
                value={embedCode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-medium text-app-heading outline-none select-all resize-none"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyEmbed}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                copiedEmbed ? 'bg-emerald-600 text-white' : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
              }`}
            >
              {copiedEmbed ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedEmbed ? 'Embed Code Copied!' : 'Copy HTML Embed Code'}
            </button>
          </div>
        )}
      </div>
    </MexoModal>
  );
};
