import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoInput } from '../../components/common/MexoInput';
import {
  Eye, EyeOff, Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, Sparkles, CheckCircle2,
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const SignInPage: React.FC = () => {
  useDocumentTitle('Sign In — MEXO Forms');
  const { signIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect') || (location.state as any)?.from;

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isLoading) return;
    if (!emailOrUsername.trim() || !password.trim()) {
      setError('Please enter your MEXO email/username and password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await signIn(emailOrUsername, password);
    setLoading(false);
    if (result.success) {
      navigate(redirectTarget || '/home', { replace: true });
    } else {
      setError(result.error || 'Sign in failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative font-sans">
      {/* Top back navigation */}
      <div className="absolute top-5 left-5">
        <button
          id="signin-back-website"
          onClick={() => navigate('/welcome')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-app-body hover:text-app-heading bg-white border border-app-border px-3.5 py-2 rounded-xl shadow-mexo-sm transition-all hover:bg-slate-50"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#7C3AED]" /> Back to website
        </button>
      </div>

      {/* Simple Clean Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-app-border shadow-mexo-card p-6 sm:p-8 space-y-6 relative z-10 my-10">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto">
            <img src="/logo.png" alt="MEXO Forms" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-app-heading tracking-tight">Sign In to MEXO Forms</h1>
            <p className="text-xs text-app-muted mt-1">Enter your MEXO credentials to manage your forms</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-app-heading mb-1.5">MEXO Email or Username</label>
            <MexoInput
              id="signin-email"
              type="text"
              placeholder="username or user@mexo.com"
              value={emailOrUsername}
              onChange={e => setEmailOrUsername(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-app-muted" />}
              autoComplete="username"
              className="bg-slate-50/70 border-slate-200 focus:bg-white focus:border-[#7C3AED] focus:ring-4 focus:ring-purple-100 text-app-heading rounded-2xl py-3"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-app-heading">Password</label>
            </div>
            <MexoInput
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-app-muted" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="text-app-muted hover:text-app-heading transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              autoComplete="current-password"
              className="bg-slate-50/70 border-slate-200 focus:bg-white focus:border-[#7C3AED] focus:ring-4 focus:ring-purple-100 text-app-heading rounded-2xl py-3"
            />
          </div>

          <MexoButton
            type="submit"
            variant="primary"
            size="lg"
            loading={loading || isLoading}
            rightIcon={!(loading || isLoading) ? <ArrowRight className="w-4 h-4 ml-1" /> : undefined}
            className="w-full mt-2 py-3.5 text-sm font-extrabold rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 transition-all shadow-sm cursor-pointer"
          >
            Sign In to Account
          </MexoButton>
        </form>

        {/* Footer / MEXO Mail Link */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-app-muted">
            Don't have a MEXO Account?{' '}
            <a
              href={(import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app'}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#7C3AED] hover:underline inline-flex items-center gap-0.5"
            >
              Open MEXO Mail <ArrowRight className="w-3 h-3 inline" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
