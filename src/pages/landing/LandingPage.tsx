import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  FileText, Sparkles, Shield, Zap, BarChart2,
  ExternalLink, CheckCircle2, ArrowRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  useDocumentTitle('MEXO Forms — Create. Collect. Understand.', false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const mailUrl = (import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-purple-100 selection:text-[#7C3AED]">
      {/* Top Header Bar */}
      <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/welcome')}>
          <img src="/logo.png" alt="MEXO Forms" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight flex items-center">
            MEXO <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent font-extrabold text-base sm:text-lg ml-1">Forms</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              id="landing-dashboard-btn"
              onClick={() => navigate('/home')}
              className="px-5 py-2.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 transition-all shadow-md shadow-indigo-500/20"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              id="landing-signin-btn"
              onClick={() => navigate('/signin')}
              className="px-5 py-2.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 transition-all shadow-md shadow-indigo-500/20"
            >
              Sign in with MEXO
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        {/* Top Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-[#7C3AED]">
          <Sparkles className="w-3.5 h-3.5" /> MEXO Forms
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Forms, made{' '}
            <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent">
              simpler.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
            A fast, intuitive and beautiful form builder built to help you collect responses, analyze data and get things done.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 transition-all shadow-md"
            >
              Open Form Builder
            </button>
          ) : (
            <>
              <button
                onClick={() => window.open(mailUrl, '_blank')}
                className="px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 transition-all shadow-md"
              >
                Create account
              </button>
              <button
                onClick={() => navigate('/signin')}
                className="px-6 py-3 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-2xs"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Hero App Mockup Card */}
        <div className="pt-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-left p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="MEXO Forms" className="w-5 h-5 object-contain" />
                <span className="text-xs font-extrabold text-slate-900">MEXO Forms</span>
              </div>
              <div className="w-48 bg-slate-100 rounded-lg px-3 py-1 text-[11px] text-slate-400 font-medium">
                Search in forms...
              </div>
              <div className="w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-[10px]">
                M
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Customer Satisfaction Survey</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Gather user satisfaction ratings and feedback</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400">142 responses</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Event Registration Form</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Collect participant details and contact info</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400">89 responses</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Product Research & NPS</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Understand customer demographics & habits</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400">312 responses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Column Feature Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">13 Question Types</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Build short text, multi-choice, rating scales, date, time and dropdown forms effortlessly.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Privacy & Analytics</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated charts, device breakdown, average completion metrics, and secure RLS storage.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Instant Autosave & PWA</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Continuous 800ms debounced autosave with offline app shell caching and native PWA support.
            </p>
          </div>
        </div>
      </section>

      {/* Ready to get started? CTA Banner */}
      <section className="py-16 px-4 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Ready to get started?</h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Create your MEXO account and start using MEXO Forms.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 transition-all shadow-md"
            >
              Open Form Builder
            </button>
          ) : (
            <>
              <button
                onClick={() => window.open(mailUrl, '_blank')}
                className="px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 transition-all shadow-md"
              >
                Create account
              </button>
              <button
                onClick={() => navigate('/signin')}
                className="px-6 py-3 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-2xs"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </section>

      {/* Dark Navy Ecosystem Footer */}
      <footer className="mt-auto bg-[#0B132B] text-slate-400 py-12 px-4 sm:px-8 border-t border-slate-800">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="MEXO Forms" className="w-6 h-6 object-contain" />
                <span className="font-extrabold text-base text-white tracking-tight">MEXO Forms</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Forms, made simpler. Fast, private and organized.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-extrabold text-white text-[11px] uppercase tracking-wider mb-2">Important Pages</p>
              <p className="hover:text-white cursor-pointer transition-colors" onClick={() => window.open(mailUrl, '_blank')}>MEXO Mail Platform</p>
              <p className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/welcome')}>Public Welcome</p>
              <p className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/settings')}>App Settings</p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-extrabold text-white text-[11px] uppercase tracking-wider mb-2">Account & Access</p>
              <p className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/signin')}>Sign in</p>
              <p className="hover:text-white cursor-pointer transition-colors" onClick={() => window.open(mailUrl, '_blank')}>Create account</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-semibold">
            <p>© 2026 MEXO Forms. All rights reserved.</p>
            <p className="tracking-wider uppercase text-slate-400 font-bold">MADE TO CONNECT.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
