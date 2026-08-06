import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoInput } from '../../components/common/MexoInput';
import {
  Eye, EyeOff, Lock, Mail, ArrowLeft, Sparkles,
  ShieldCheck, Zap, BarChart3, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const SignInPage: React.FC = () => {
  useDocumentTitle('Sign In — MEXO Forms');
  const { signIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password.trim()) {
      setError('Please enter your MEXO email/username and password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await signIn(emailOrUsername, password);
    setLoading(false);
    if (result.success) {
      navigate('/home', { replace: true });
    } else {
      setError(result.error || 'Sign in failed. Please check your credentials.');
    }
  };

  const handleDemoFill = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmailOrUsername('admin@mexo.com');
      setPassword('MexoAdmin#2026!SecureKey');
    } else {
      setEmailOrUsername('demo@mexo.com');
      setPassword('demo1234');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans select-none">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-[#7C3AED]/30 to-[#6366F1]/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-tl from-[#0878e8]/25 to-[#7C3AED]/15 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />
        
        {/* Subtle SVG Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Navigation link: Back to website */}
      <div className="absolute top-6 left-6 z-20">
        <button
          id="signin-back-website"
          onClick={() => navigate('/welcome')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/60 shadow-lg transition-all transform hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" /> Back to website
        </button>
      </div>

      {/* Main Glass Layout Container */}
      <div className="relative w-full max-w-5xl bg-slate-900/80 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        
        {/* Left Side: Brand & Feature Highlights (Desktop) */}
        <div className="lg:col-span-6 p-8 lg:p-12 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-purple-950/40 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80">
          <div>
            {/* Brand Logo & Pill */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#0878e8] p-0.5 shadow-lg shadow-indigo-500/30">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-1.5 overflow-hidden">
                  <img src="/logo.png" alt="MEXO Forms" className="w-full h-full object-contain" />
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-bold text-purple-300">
                  <Sparkles className="w-3 h-3 text-purple-400" /> Unified Ecosystem
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-white mt-0.5">
                  MEXO <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">Forms</span>
                </h2>
              </div>
            </div>

            {/* Main Tagline */}
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight mb-3">
              Form creation & response insights made effortless.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Sign in with your single MEXO identity to build dynamic forms, automate response tracking, and analyze data in real time.
            </p>

            {/* Feature Cards List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/60 backdrop-blur-sm transition-all hover:border-purple-500/30">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Lightning Drag & Drop Builder</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Custom questions, logic flows, matrix fields, and instantly published share links.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/60 backdrop-blur-sm transition-all hover:border-indigo-500/30">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Live Analytics & Export</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Real-time charts, individual response feeds, and CSV dataset downloads.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/60 backdrop-blur-sm transition-all hover:border-blue-500/30">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Single MEXO Auth Security</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use your MEXO Mail or MEXO Ecosystem login with multi-layer data protection.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Operational & Secure
            </span>
            <span>MEXO OS v2026</span>
          </div>
        </div>

        {/* Right Side: Interactive Sign-In Form Container */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-center bg-white text-slate-900">
          <div className="max-w-sm mx-auto w-full">
            {/* Form Header */}
            <div className="mb-8">
              <div className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold mb-3">
                Welcome Back
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign in to MEXO
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Enter your MEXO credentials to access your forms dashboard.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="shrink-0 w-4 h-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px] mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <MexoInput
                  id="signin-email"
                  type="text"
                  label="MEXO Email or Username"
                  placeholder="username or user@mexo.com"
                  value={emailOrUsername}
                  onChange={e => setEmailOrUsername(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  autoComplete="username"
                  className="bg-slate-50/70 border-slate-200 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <MexoInput
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  autoComplete="current-password"
                  className="bg-slate-50/70 border-slate-200 focus:bg-white text-slate-900"
                />
              </div>

              <MexoButton
                type="submit"
                variant="primary"
                size="lg"
                loading={loading || isLoading}
                rightIcon={!(loading || isLoading) ? <ArrowRight className="w-4 h-4 ml-1" /> : undefined}
                className="w-full mt-3 py-3.5 text-sm font-extrabold rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                Sign In to Account
              </MexoButton>
            </form>

            {/* Quick Demo Login Option */}
            <div className="mt-6 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Quick Test Credentials:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoFill('admin')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-white border border-slate-200 text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('user')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                >
                  Demo User
                </button>
              </div>
            </div>

            {/* Signup / MEXO Mail Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Don't have a MEXO Account?{' '}
                <a
                  href={(import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors inline-flex items-center gap-0.5"
                >
                  Open MEXO Mail <ArrowRight className="w-3 h-3 inline" />
                </a>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

