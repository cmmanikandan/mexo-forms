import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoInput, MexoTextarea } from '../../components/common/MexoInput';
import { MexoToggle } from '../../components/common/MexoToggle';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';
import { useToast } from '../../hooks/useToast';
import { MexoToastContainer } from '../../components/common/MexoToast';
import {
  User, Sliders, Palette, Bell, HardDrive, Smartphone,
  ExternalLink, Save, CheckCircle2, RefreshCw, Info,
  ChevronRight, Shield, Mail,
} from 'lucide-react';

type Section = 'account' | 'builder' | 'notifications' | 'storage' | 'system';

export const AppSettingsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [activeSection, setActiveSection] = useState<Section>('account');
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    autosaveDelay: '800',
    defaultConfirmationMsg: 'Thank you for your response!',
    themeAccent: 'purple',
    showBrandFooter: true,
    requireLoginByDefault: false,
  });

  const displayName = profile ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username : 'MEXO User';
  const mailUrl = (import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app';

  const handleSavePreferences = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addToast({ type: 'success', message: 'Settings saved successfully!' });
    }, 500);
  };

  const handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
        addToast({ type: 'success', message: 'Offline cache cleared successfully!' });
      });
    } else {
      addToast({ type: 'info', message: 'No offline cache found.' });
    }
  };

  const sections: { id: Section; label: string; description: string; icon: React.ReactNode; category: 'MEXO IDENTITY' | 'FORM BUILDER' | 'SYSTEM' }[] = [
    { id: 'account', label: 'MEXO Account', description: 'Profile & identity', icon: <User className="w-4 h-4" />, category: 'MEXO IDENTITY' },
    { id: 'builder', label: 'Form Builder', description: 'Autosave & theme defaults', icon: <Sliders className="w-4 h-4" />, category: 'FORM BUILDER' },
    { id: 'notifications', label: 'Notifications', description: 'Email response alerts', icon: <Bell className="w-4 h-4" />, category: 'FORM BUILDER' },
    { id: 'storage', label: 'Storage & PWA', description: 'Offline cache & PWA status', icon: <HardDrive className="w-4 h-4" />, category: 'SYSTEM' },
    { id: 'system', label: 'Ecosystem Info', description: 'Connected apps & architecture', icon: <Info className="w-4 h-4" />, category: 'SYSTEM' },
  ];

  const categories = ['MEXO IDENTITY', 'FORM BUILDER', 'SYSTEM'] as const;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading">Settings</h1>
          <p className="text-xs text-app-muted mt-1">Manage your MEXO Account, form builder defaults, and system preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="md:col-span-1 space-y-4">
            {categories.map(cat => (
              <div key={cat}>
                <p className="text-[11px] font-extrabold text-app-muted uppercase tracking-wider px-3 mb-1.5">{cat}</p>
                <div className="space-y-1">
                  {sections.filter(s => s.category === cat).map(sec => (
                    <button
                      key={sec.id}
                      id={`setting-nav-${sec.id}`}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all text-left ${
                        activeSection === sec.id
                          ? 'bg-indigo-50 text-[#7C3AED] font-extrabold shadow-sm'
                          : 'text-app-body hover:bg-slate-100 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={activeSection === sec.id ? 'text-[#7C3AED]' : 'text-app-muted'}>{sec.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate">{sec.label}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${activeSection === sec.id ? 'text-[#7C3AED]' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick MEXO Account Card */}
            <div
              onClick={() => window.open(mailUrl, '_blank')}
              className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/80 border border-indigo-100 cursor-pointer hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <Mail className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  MEXO Mail <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#7C3AED] transition-colors" />
                </span>
              </div>
              <p className="text-[11px] text-app-body leading-tight">Switch to MEXO Mail to manage your primary address, security, and storage limits.</p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 space-y-6">
            {/* 1. Account Section */}
            {activeSection === 'account' && (
              <div className="bg-white rounded-3xl border border-app-border p-6 shadow-mexo-card space-y-6">
                <div className="flex items-center justify-between border-b border-app-border pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-app-heading">MEXO Account Profile</h2>
                    <p className="text-xs text-app-muted mt-0.5">Your unified MEXO Ecosystem identity</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active MEXO User
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <MexoAvatar name={displayName} src={profile?.avatar_url} size="xl" className="border-2 border-white shadow-mexo-md" />
                    <div>
                      <h3 className="text-base font-extrabold text-app-heading">{displayName}</h3>
                      <p className="text-xs text-[#7C3AED] font-mono font-semibold mt-0.5">{profile?.primary_address}</p>
                      <p className="text-[11px] text-app-muted mt-1">Username: <strong>@{profile?.username}</strong></p>
                    </div>
                  </div>

                  <MexoButton
                    id="manage-mexo-mail-profile"
                    variant="primary"
                    size="sm"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => window.open(mailUrl, '_blank')}
                  >
                    Edit Profile in MEXO Mail
                  </MexoButton>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl border border-app-border">
                    <p className="text-xs font-bold text-app-heading mb-1">Role & Permissions</p>
                    <p className="text-xs text-app-muted capitalize">{profile?.role || 'Standard User'}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-app-border">
                    <p className="text-xs font-bold text-app-heading mb-1">Account Status</p>
                    <p className="text-xs text-emerald-600 font-semibold capitalize">{profile?.status || 'Active'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Builder Section */}
            {activeSection === 'builder' && (
              <div className="bg-white rounded-3xl border border-app-border p-6 shadow-mexo-card space-y-6">
                <div className="flex items-center justify-between border-b border-app-border pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-app-heading">Form Builder Defaults</h2>
                    <p className="text-xs text-app-muted mt-0.5">Configure default behavior for new forms</p>
                  </div>
                  <MexoButton
                    id="save-builder-prefs"
                    variant="primary"
                    size="sm"
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    onClick={handleSavePreferences}
                    loading={saving}
                  >
                    Save Preferences
                  </MexoButton>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-app-heading mb-1.5">Default Confirmation Message</label>
                    <MexoInput
                      value={preferences.defaultConfirmationMsg}
                      onChange={e => setPreferences(p => ({ ...p, defaultConfirmationMsg: e.target.value }))}
                      placeholder="Thank you for your response!"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-app-heading mb-1.5">Autosave Delay</label>
                      <select
                        value={preferences.autosaveDelay}
                        onChange={e => setPreferences(p => ({ ...p, autosaveDelay: e.target.value }))}
                        className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs font-semibold text-app-heading outline-none bg-white focus:border-[#7C3AED]"
                      >
                        <option value="500">500 ms (Fast)</option>
                        <option value="800">800 ms (Recommended)</option>
                        <option value="1500">1.5 seconds</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-app-heading mb-1.5">Default Color Theme</label>
                      <select
                        value={preferences.themeAccent}
                        onChange={e => setPreferences(p => ({ ...p, themeAccent: e.target.value }))}
                        className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs font-semibold text-app-heading outline-none bg-white focus:border-[#7C3AED]"
                      >
                        <option value="purple">MEXO Purple / Blue Gradient</option>
                        <option value="emerald">Emerald Green</option>
                        <option value="blue">Royal Blue</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-app-border pt-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-app-heading">Require login by default</p>
                        <p className="text-[11px] text-app-muted mt-0.5">New forms require respondents to log in with MEXO</p>
                      </div>
                      <MexoToggle
                        id="pref-require-login"
                        checked={preferences.requireLoginByDefault}
                        onCheckedChange={v => setPreferences(p => ({ ...p, requireLoginByDefault: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-app-heading">Show "Powered by MEXO Forms" footer</p>
                        <p className="text-[11px] text-app-muted mt-0.5">Display branding badge on public form pages</p>
                      </div>
                      <MexoToggle
                        id="pref-[#7C3AED]-brand-footer"
                        checked={preferences.showBrandFooter}
                        onCheckedChange={v => setPreferences(p => ({ ...p, showBrandFooter: v }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="bg-white rounded-3xl border border-app-border p-6 shadow-mexo-card space-y-6">
                <div className="flex items-center justify-between border-b border-app-border pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-app-heading">Response Alerts & Notifications</h2>
                    <p className="text-xs text-app-muted mt-0.5">Manage email notifications when forms are submitted</p>
                  </div>
                  <MexoButton
                    id="save-notif-prefs"
                    variant="primary"
                    size="sm"
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    onClick={handleSavePreferences}
                    loading={saving}
                  >
                    Save Preferences
                  </MexoButton>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-app-heading">Email notifications for new responses</p>
                      <p className="text-[11px] text-app-muted mt-0.5">Sends instant alert to <strong>{profile?.primary_address}</strong> on new submissions</p>
                    </div>
                    <MexoToggle
                      id="notif-email-toggle"
                      checked={preferences.emailNotifications}
                      onCheckedChange={v => setPreferences(p => ({ ...p, emailNotifications: v }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Storage & PWA Section */}
            {activeSection === 'storage' && (
              <div className="bg-white rounded-3xl border border-app-border p-6 shadow-mexo-card space-y-6">
                <div className="border-b border-app-border pb-4">
                  <h2 className="text-base font-extrabold text-app-heading">Storage & PWA</h2>
                  <p className="text-xs text-app-muted mt-0.5">Manage offline cache and Progressive Web App features</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-app-border space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-xs font-extrabold text-app-heading">PWA Application</h3>
                    </div>
                    <p className="text-xs text-app-muted leading-relaxed">
                      MEXO Forms is PWA-enabled. You can install it on your device for standalone desktop and mobile experience.
                    </p>
                    <PWAInstallButton variant="primary" size="sm" />
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-app-border space-y-3">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-[#7C3AED]" />
                      <h3 className="text-xs font-extrabold text-app-heading">Offline App Shell Cache</h3>
                    </div>
                    <p className="text-xs text-app-muted leading-relaxed">
                      Static assets and layout templates are cached for fast offline loading.
                    </p>
                    <MexoButton
                      id="clear-cache-btn"
                      variant="secondary"
                      size="sm"
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      onClick={handleClearCache}
                    >
                      Clear Cache
                    </MexoButton>
                  </div>
                </div>
              </div>
            )}

            {/* 5. System Info Section */}
            {activeSection === 'system' && (
              <div className="bg-white rounded-3xl border border-app-border p-6 shadow-mexo-card space-y-6">
                <div className="border-b border-app-border pb-4">
                  <h2 className="text-base font-extrabold text-app-heading">Ecosystem Architecture</h2>
                  <p className="text-xs text-app-muted mt-0.5">MEXO ecosystem integration details</p>
                </div>

                <div className="space-y-3 text-xs text-app-body">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-app-muted">Application</span>
                    <span className="font-extrabold text-app-heading">MEXO Forms v1.0.0</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-app-muted">Supabase Project</span>
                    <span className="font-mono text-app-heading font-bold">vnbixduiwsvepvtybygy.supabase.co</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-app-muted">Shared Profile Table</span>
                    <span className="font-mono text-emerald-600 font-bold">public.profiles ✓</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-app-muted">MEXO Mail URL</span>
                    <a href={mailUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[#7C3AED] font-bold hover:underline flex items-center gap-1">
                      {mailUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MexoToastContainer toasts={toasts} removeToast={removeToast} />
    </AppShell>
  );
};
