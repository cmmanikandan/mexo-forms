import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { formService } from '../../services/formService';
import { Form, MexoProfile } from '../../types/forms';
import { FormStatusBadge } from '../../components/forms/FormStatusBadge';
import { MexoSkeleton } from '../../components/common/MexoSkeleton';
import { useToast } from '../../hooks/useToast';
import { MexoToastContainer } from '../../components/common/MexoToast';
import {
  ArrowLeft, Copy, Check, ExternalLink, Download, QrCode, Share2, Code, Mail,
  MessageCircle, Send, Globe, GraduationCap, AlertCircle, Users, UserPlus, Trash2, User,
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const FormSharePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState<Form | null>(null);
  useDocumentTitle(form ? `Share — ${form.title}` : 'Share Form');
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [collabInput, setCollabInput] = useState('');
  const [addingCollab, setAddingCollab] = useState(false);

  useEffect(() => {
    if (!id) return;
    formService.getForm(id).then(f => {
      setForm(f);
      setLoading(false);
    });
    formService.getFormCollaborators(id).then(list => setCollaborators(list));
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <MexoSkeleton className="h-8 w-48 rounded-xl" />
          <MexoSkeleton className="h-64 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!form) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-app-heading">Form Not Found</h2>
          <button
            onClick={() => navigate('/forms')}
            className="mt-4 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-xs font-bold"
          >
            Back to My Forms
          </button>
        </div>
      </AppShell>
    );
  }

  const formSlugOrId = form.slug || form.id;
  const shareUrl = `${window.location.origin}/f/${formSlugOrId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="650" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;
  const mexoMailUrl = (import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    addToast({ type: 'success', message: 'Public form link copied to clipboard!' });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    addToast({ type: 'success', message: 'HTML Iframe embed code copied!' });
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

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabInput.trim()) return;
    setAddingCollab(true);

    try {
      const result = await formService.addCollaborator(form.id, collabInput.trim());
      if (result.success && result.collaborator) {
        setCollaborators(prev => [...prev, result.collaborator]);
        setCollabInput('');
        addToast({ type: 'success', message: `Form shared with ${result.collaborator.profile?.username || collabInput}!` });
      } else {
        addToast({ type: 'error', message: result.error || 'Failed to add collaborator.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Error adding collaborator.' });
    } finally {
      setAddingCollab(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    const ok = await formService.removeCollaborator(form.id, userId);
    if (ok) {
      setCollaborators(prev => prev.filter(c => c.user_id !== userId));
      addToast({ type: 'success', message: 'Removed collaborator.' });
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-app-border pb-4">
          <div className="flex items-center gap-3">
            <button
              id="share-page-back"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(`/forms/${form.id}/edit`);
                }
              }}
              className="p-2 rounded-xl text-app-body hover:bg-slate-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-app-heading">{form.title}</h1>
                <FormStatusBadge status={form.status} />
              </div>
              <p className="text-xs text-app-muted mt-0.5">Share and distribute your form to respondents</p>
            </div>
          </div>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity shadow-sm flex-shrink-0"
          >
            Open Live Form <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Link, Quick Share, Collaborators, Embed */}
          <div className="lg:col-span-7 space-y-6">
            {/* Form URL Card */}
            <div className="bg-white rounded-2xl border border-app-border p-6 shadow-mexo-card space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-app-heading flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#7C3AED]" /> Public Form Link
                </label>
                {!form.is_published && (
                  <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Draft (Publish to accept responses)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-app-heading outline-none select-all focus:border-[#7C3AED]"
                />
                <button
                  type="button"
                  id="share-copy-link-btn"
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    copiedLink ? 'bg-emerald-600 text-white' : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Invite Collaborators Card */}
            <div className="bg-white rounded-2xl border border-app-border p-6 shadow-mexo-card space-y-4">
              <h2 className="text-xs font-bold text-app-heading flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7C3AED]" /> Invite MEXO Users (Collaborators)
              </h2>
              <p className="text-xs text-app-muted">
                Invite other MEXO Account users to collaborate on this form. It will appear in their <strong>Shared with me</strong> tab.
              </p>

              <form onSubmit={handleAddCollaborator} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="MEXO Username or Email (e.g. 927624bit060)"
                  value={collabInput}
                  onChange={(e) => setCollabInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-app-heading outline-none focus:border-[#7C3AED]"
                />
                <button
                  type="submit"
                  disabled={addingCollab || !collabInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" /> {addingCollab ? 'Inviting...' : 'Invite'}
                </button>
              </form>

              {collaborators.length > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-bold text-app-heading">Form Collaborators</p>
                  <div className="space-y-2">
                    {collaborators.map((c) => {
                      const prof: MexoProfile | undefined = c.profile;
                      const displayName = prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || prof.username : 'MEXO User';
                      const email = prof?.primary_address || c.user_id;

                      return (
                        <div
                          key={c.id || c.user_id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {prof?.avatar_url ? (
                              <img src={prof.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold text-xs">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-app-heading truncate">{displayName}</p>
                              <p className="text-[11px] text-app-muted truncate">{email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#7C3AED]">
                              {c.role || 'Editor'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCollaborator(c.user_id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove collaborator"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Share Grid */}
            <div className="bg-white rounded-2xl border border-app-border p-6 shadow-mexo-card space-y-3">
              <h2 className="text-xs font-bold text-app-heading">Quick Share & Social Channels</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Please fill out this form: ${form.title} - ${shareUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200 text-xs font-bold"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleSendMexoMail}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors border border-purple-200 text-xs font-bold text-left"
                >
                  <Send className="w-5 h-5 text-[#7C3AED] flex-shrink-0" />
                  <span>MEXO Mail</span>
                </button>

                <a
                  href={`mailto:?subject=${encodeURIComponent(form.title)}&body=${encodeURIComponent(`Please fill out this form:\n\n${shareUrl}`)}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors border border-blue-200 text-xs font-bold"
                >
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Email App</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(form.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors border border-slate-300 text-xs font-bold"
                >
                  <Share2 className="w-5 h-5 text-slate-800 flex-shrink-0" />
                  <span>Twitter / X</span>
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 transition-colors border border-indigo-200 text-xs font-bold"
                >
                  <Globe className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

            {/* HTML Embed Code */}
            <div className="bg-white rounded-2xl border border-app-border p-6 shadow-mexo-card space-y-3">
              <h2 className="text-xs font-bold text-app-heading flex items-center gap-2">
                <Code className="w-4 h-4 text-[#7C3AED]" /> HTML Iframe Embed Code
              </h2>
              <textarea
                readOnly
                rows={3}
                value={embedCode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-medium text-app-heading outline-none select-all resize-none"
              />
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
          </div>

          {/* Right Column: QR Code Display */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-app-border p-6 shadow-mexo-card text-center space-y-4 sticky top-20">
              <h2 className="text-xs font-bold text-app-heading flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4 text-[#7C3AED]" /> QR Code Generator
              </h2>
              <div className="p-4 bg-white rounded-3xl border-2 border-indigo-100 shadow-mexo-card inline-block">
                <img src={qrUrl} alt="Form QR Code" className="w-52 h-52 object-contain mx-auto" />
              </div>
              <p className="text-xs text-app-muted max-w-xs mx-auto">
                Scan this QR code with any smartphone camera to open <strong>{form.title}</strong> directly.
              </p>
              <button
                type="button"
                id="share-download-qr"
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#0878e8] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
              >
                <Download className="w-4 h-4" /> Download QR Code PNG
              </button>
            </div>
          </div>
        </div>
      </div>
      <MexoToastContainer toasts={toasts} removeToast={removeToast} />
    </AppShell>
  );
};
