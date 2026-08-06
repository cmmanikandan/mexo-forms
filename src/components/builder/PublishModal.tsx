import React, { useState } from 'react';
import { Form } from '../../types/forms';
import { formService } from '../../services/formService';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { MexoToggle } from '../common/MexoToggle';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy, ExternalLink, Mail, Code, QrCode, CheckCircle2,
  Share2, Settings, Globe,
} from 'lucide-react';

interface PublishModalProps {
  open: boolean;
  form: Form;
  onClose: () => void;
  onPublished: (form: Form) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ open, form, onClose, onPublished }) => {
  const [activeTab, setActiveTab] = useState<'share' | 'settings'>('share');
  const [settings, setSettings] = useState({
    accepting_responses: form.accepting_responses,
    one_response_per_user: form.one_response_per_user,
    requires_login: form.requires_login,
  });
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const formUrl = `${window.location.origin}/f/${form.slug}`;
  const embedCode = `<iframe src="${formUrl}" width="100%" height="600" frameborder="0"></iframe>`;
  const mailUrl = (import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app';

  const handlePublishOrSave = async () => {
    setPublishing(true);
    await formService.updateForm(form.id, settings);
    const updated = await formService.publishForm(form.id);
    setPublishing(false);
    if (updated) {
      onPublished(updated);
      navigator.clipboard.writeText(formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleSendViaMexoMail = () => {
    const subject = encodeURIComponent(`Fill out: ${form.title}`);
    const body = encodeURIComponent(`Hi,\n\nPlease fill out this form:\n${formUrl}\n\nThank you!`);
    window.open(`${mailUrl}?compose=1&subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <MexoModal
      open={open}
      onOpenChange={o => { if (!o) onClose(); }}
      title={form.is_published ? 'Form Live & Share' : 'Publish Form'}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            {form.is_published && <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Form is live</span>}
          </div>
          <div className="flex gap-2">
            <MexoButton variant="secondary" size="sm" onClick={onClose}>Close</MexoButton>
            <MexoButton
              id="publish-save-btn"
              variant="primary"
              size="sm"
              onClick={handlePublishOrSave}
              loading={publishing}
              leftIcon={<Globe className="w-3.5 h-3.5" />}
            >
              {form.is_published ? 'Save & Copy Link' : 'Publish Form'}
            </MexoButton>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header banner if published */}
        {form.is_published && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">✓</div>
              <div>
                <p className="text-xs font-extrabold text-emerald-900">Your form is published & live!</p>
                <p className="text-[11px] text-emerald-700/80">Anyone with the link can submit responses.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
          <button
            id="tab-share"
            onClick={() => setActiveTab('share')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'share' ? 'bg-white text-[#7C3AED] shadow-mexo-sm' : 'text-app-muted hover:text-app-body'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> Share & Link
          </button>
          <button
            id="tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'settings' ? 'bg-white text-[#7C3AED] shadow-mexo-sm' : 'text-app-muted hover:text-app-body'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Response Settings
          </button>
        </div>

        {/* Tab 1: Share & Link */}
        {activeTab === 'share' && (
          <div className="space-y-4">
            {/* Copy Public Link */}
            <div>
              <label className="block text-xs font-semibold text-app-heading mb-1.5">Public Form Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-app-border rounded-xl px-3 py-2.5 text-xs font-mono text-app-heading truncate">
                  {formUrl}
                </div>
                <MexoButton
                  id="copy-public-link"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  onClick={handleCopyLink}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </MexoButton>
                <MexoButton
                  id="open-public-link"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(formUrl, '_blank')}
                  title="Open form in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </MexoButton>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                id="share-mexo-mail"
                onClick={handleSendViaMexoMail}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-app-border hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#0878e8] text-white flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-app-heading">MEXO Mail</span>
                <span className="text-[10px] text-app-muted">Send invite</span>
              </button>

              <button
                id="share-qr-code"
                onClick={() => setShowQR(!showQR)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-1.5 ${
                  showQR ? 'border-[#7C3AED] bg-indigo-50/50 ring-2 ring-purple-100' : 'border-app-border hover:border-indigo-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-app-heading">QR Code</span>
                <span className="text-[10px] text-app-muted">{showQR ? 'Hide QR' : 'Show QR'}</span>
              </button>

              <button
                id="share-embed-code"
                onClick={handleCopyEmbed}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-app-border hover:border-indigo-200 hover:bg-slate-50 transition-all text-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Code className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-app-heading">Embed</span>
                <span className="text-[10px] text-app-muted">{embedCopied ? '✓ Copied' : 'Copy iframe'}</span>
              </button>
            </div>

            {/* QR Code Card */}
            {showQR && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-app-border flex flex-col items-center text-center space-y-3 animate-in fade-in duration-150">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                  <QRCodeSVG value={formUrl} size={140} level="M" />
                </div>
                <p className="text-[11px] text-app-muted">Scan QR code with smartphone camera to open form</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-app-heading">Accept responses</p>
                <p className="text-[11px] text-app-muted mt-0.5">When off, respondents will see form closed message</p>
              </div>
              <MexoToggle
                id="publish-accepting"
                checked={settings.accepting_responses}
                onCheckedChange={v => setSettings(s => ({ ...s, accepting_responses: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-app-heading">Require MEXO Account login</p>
                <p className="text-[11px] text-app-muted mt-0.5">Only authenticated MEXO users can submit</p>
              </div>
              <MexoToggle
                id="publish-require-login"
                checked={settings.requires_login}
                onCheckedChange={v => setSettings(s => ({ ...s, requires_login: v }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-app-heading">One response per user</p>
                <p className="text-[11px] text-app-muted mt-0.5">Limit users to a single submission</p>
              </div>
              <MexoToggle
                id="publish-one-per-user"
                checked={settings.one_response_per_user}
                onCheckedChange={v => setSettings(s => ({ ...s, one_response_per_user: v }))}
              />
            </div>
          </div>
        )}
      </div>
    </MexoModal>
  );
};
