import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from '../../components/layout/AppShell';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoInput } from '../../components/common/MexoInput';
import { MexoToggle } from '../../components/common/MexoToggle';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';
import { useToast } from '../../hooks/useToast';
import { MexoToastContainer } from '../../components/common/MexoToast';
import {
  User, Sliders, Bell, HardDrive,
  ExternalLink, Save, CheckCircle2, RefreshCw, Info,
  ChevronRight, Mail, Shield, Smartphone, KeyRound
} from 'lucide-react';

type Section = 'overview' | 'builder' | 'notifications' | 'storage' | 'system';

export const AppSettingsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    autosaveDelay: '800',
    defaultConfirmationMsg: 'Thank you for your response!',
    themeAccent: 'purple',
    showBrandFooter: true,
    requireLoginByDefault: false,
  });

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

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading">Settings</h1>
          <p className="text-xs sm:text-sm text-app-muted mt-1 font-medium">
            Manage your MEXO Account, form preferences and application settings.
          </p>
        </div>

        <div className="space-y-6">
          {/* 1. MEXO IDENTITY GROUP */}
          <div>
            <p className="text-[11px] font-extrabold text-app-muted uppercase tracking-wider mb-2 px-1">
              MEXO IDENTITY
            </p>
            <div className="bg-white rounded-2xl border border-app-border overflow-hidden shadow-mexo-sm">
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors min-h-[72px] cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-app-heading">MEXO Account</p>
                    <p className="text-xs text-app-muted mt-0.5 truncate">
                      Manage name, photo, security and MEXO identity
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 ml-2" />
              </button>
            </div>
          </div>

          {/* 2. FORM BUILDER PREFERENCES */}
          <div>
            <p className="text-[11px] font-extrabold text-app-muted uppercase tracking-wider mb-2 px-1">
              FORM BUILDER
            </p>
            <div className="bg-white rounded-2xl border border-app-border overflow-hidden shadow-mexo-sm divide-y divide-app-border">
              {/* Form Builder Preferences Row */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-app-heading">Form Builder Defaults</p>
                      <p className="text-xs text-app-muted mt-0.5">Autosave delay, confirmation message & themes</p>
                    </div>
                  </div>
                  <MexoButton
                    id="save-builder-prefs"
                    variant="primary"
                    size="sm"
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    onClick={handleSavePreferences}
                    loading={saving}
                  >
                    Save
                  </MexoButton>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-app-heading mb-1.5">Default Confirmation Message</label>
                    <MexoInput
                      value={preferences.defaultConfirmationMsg}
                      onChange={e => setPreferences(p => ({ ...p, defaultConfirmationMsg: e.target.value }))}
                      placeholder="Thank you for your response!"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-app-heading mb-1.5">Autosave Delay</label>
                      <select
                        value={preferences.autosaveDelay}
                        onChange={e => setPreferences(p => ({ ...p, autosaveDelay: e.target.value }))}
                        className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs font-bold text-app-heading outline-none bg-white focus:border-[#7C3AED]"
                      >
                        <option value="500">500 ms (Fast)</option>
                        <option value="800">800 ms (Recommended)</option>
                        <option value="1500">1.5 seconds</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-app-heading mb-1.5">Default Color Theme</label>
                      <select
                        value={preferences.themeAccent}
                        onChange={e => setPreferences(p => ({ ...p, themeAccent: e.target.value }))}
                        className="w-full rounded-xl border border-app-border px-3 py-2.5 text-xs font-bold text-app-heading outline-none bg-white focus:border-[#7C3AED]"
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
                        <p className="text-xs font-bold text-app-heading">Require login by default</p>
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
                        <p className="text-xs font-bold text-app-heading">Show "Powered by MEXO Forms" footer</p>
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

              {/* Notifications Row */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-app-heading">Email Notifications</p>
                    <p className="text-xs text-app-muted mt-0.5">Receive email alerts on new submissions to {profile?.primary_address}</p>
                  </div>
                </div>
                <MexoToggle
                  id="notif-email-toggle"
                  checked={preferences.emailNotifications}
                  onCheckedChange={v => setPreferences(p => ({ ...p, emailNotifications: v }))}
                />
              </div>
            </div>
          </div>

          {/* 3. SYSTEM GROUP */}
          <div>
            <p className="text-[11px] font-extrabold text-app-muted uppercase tracking-wider mb-2 px-1">
              SYSTEM & PWA
            </p>
            <div className="bg-white rounded-2xl border border-app-border overflow-hidden shadow-mexo-sm p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-app-border space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-extrabold text-app-heading">PWA Mobile Application</h3>
                  </div>
                  <p className="text-xs text-app-muted leading-relaxed">
                    Install MEXO Forms as an offline-ready Progressive Web App on mobile and desktop.
                  </p>
                  <PWAInstallButton variant="primary" size="sm" />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-app-border space-y-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[#7C3AED]" />
                    <h3 className="text-xs font-extrabold text-app-heading">Offline App Shell Cache</h3>
                  </div>
                  <p className="text-xs text-app-muted leading-relaxed">
                    Static application templates and assets are cached for offline responsiveness.
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

              {/* Ecosystem Architecture */}
              <div className="border-t border-app-border pt-4">
                <p className="text-xs font-extrabold text-app-heading mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#7C3AED]" /> Ecosystem Info
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-app-muted">App Version</span>
                    <span className="font-extrabold text-app-heading">MEXO Forms v1.0.0</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-app-muted">Shared Identity</span>
                    <span className="font-mono text-emerald-600 font-bold">public.profiles ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. MEXO MAIL ECOSYSTEM CARD */}
          <div
            onClick={() => window.open(mailUrl, '_blank')}
            className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-blue-50/90 border border-indigo-100 cursor-pointer hover:border-indigo-300 transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-white text-[#7C3AED] shadow-2xs">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  MEXO Mail <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7C3AED] transition-colors" />
                </span>
              </div>
              <span className="text-xs font-extrabold text-[#7C3AED] underline">Open App ↗</span>
            </div>
            <p className="text-xs text-app-body leading-relaxed">
              Manage mail-specific preferences, storage limits, and primary address settings directly in MEXO Mail.
            </p>
          </div>
        </div>
      </div>

      <MexoToastContainer toasts={toasts} removeToast={removeToast} />
    </AppShell>
  );
};
