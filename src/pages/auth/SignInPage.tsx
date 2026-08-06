import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoInput } from '../../components/common/MexoInput';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const SignInPage: React.FC = () => {
  useDocumentTitle('Sign In');
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
      setError(result.error || 'Sign in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-auth-pageBg flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-indigo-100 to-purple-100 rounded-full opacity-40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to website link */}
        <div className="mb-3">
          <button
            id="signin-back-website"
            onClick={() => navigate('/welcome')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-app-body hover:text-[#7C3AED] transition-colors bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-app-border shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-app-muted" /> Back to website
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-mexo-popover border border-auth-border overflow-hidden">
          {/* Header brand */}
          <div className="bg-gradient-to-br from-[#F7F9FF] to-white px-8 pt-10 pb-6 border-b border-auth-separator text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-mexo-sm">
                <img src="/logo.png" alt="MEXO Forms" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-auth-textPrimary tracking-tight">MEXO Forms</h1>
            <p className="text-sm text-auth-textSecondary mt-1.5 font-medium">Create. Collect. Understand.</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-base font-bold text-auth-textPrimary">Sign in with your MEXO Account</h2>
              <p className="text-xs text-auth-textMuted mt-1">Use the same credentials as MEXO Mail</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <MexoInput
                id="signin-email"
                type="text"
                label="MEXO Email or Username"
                placeholder="username or user@mexo.com"
                value={emailOrUsername}
                onChange={e => setEmailOrUsername(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="username"
              />
              <MexoInput
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Your MEXO password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="text-app-muted hover:text-app-body transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="current-password"
              />

              <MexoButton
                type="submit"
                variant="primary"
                size="lg"
                loading={loading || isLoading}
                className="w-full mt-2"
              >
                Sign In
              </MexoButton>
            </form>

            <div className="mt-6 pt-5 border-t border-auth-separator text-center">
              <p className="text-xs text-auth-textMuted">
                Don't have a MEXO Account?{' '}
                <a
                  href={(import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                >
                  Open MEXO Mail →
                </a>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-auth-textMuted mt-4">
          MEXO Forms is part of the{' '}
          <span className="font-bold text-[#7C3AED]">MEXO</span> ecosystem.
        </p>
      </div>
    </div>
  );
};
