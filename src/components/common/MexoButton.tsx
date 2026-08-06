import React from 'react';
import { clsx } from 'clsx';

interface MexoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const MexoButton: React.FC<MexoButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none';

  const variants = {
    primary: 'bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white hover:opacity-90 active:scale-[0.98] shadow-sm focus-visible:ring-indigo-500',
    secondary: 'bg-white border border-app-border text-app-heading hover:bg-slate-50 active:scale-[0.98] focus-visible:ring-app-primary',
    ghost: 'bg-transparent text-app-body hover:bg-slate-100 active:scale-[0.98] focus-visible:ring-app-primary',
    danger: 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 active:scale-[0.98] focus-visible:ring-rose-500',
    success: 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] focus-visible:ring-emerald-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-sm gap-2',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], (disabled || loading) && 'opacity-50 cursor-not-allowed', className)}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
};
