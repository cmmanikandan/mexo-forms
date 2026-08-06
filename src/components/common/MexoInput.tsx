import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface MexoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hint?: string;
}

export const MexoInput = forwardRef<HTMLInputElement, MexoInputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  hint,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `mexo-input-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-app-heading mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-app-muted pointer-events-none">{leftIcon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-xl border bg-white text-sm text-app-heading placeholder-app-muted transition-all duration-150',
            'px-3 py-2.5 outline-none',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200'
              : 'border-app-border focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-app-muted">{rightIcon}</span>
        )}
      </div>
      {hint && !error && <p className="mt-1 text-[11px] text-app-muted">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
});

MexoInput.displayName = 'MexoInput';

interface MexoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const MexoTextarea = forwardRef<HTMLTextAreaElement, MexoTextareaProps>(({
  label, error, hint, className, id, ...props
}, ref) => {
  const inputId = id || `mexo-ta-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-app-heading mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full rounded-xl border bg-white text-sm text-app-heading placeholder-app-muted transition-all duration-150 resize-none',
          'px-3 py-2.5 outline-none',
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200'
            : 'border-app-border focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-[11px] text-app-muted">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
});

MexoTextarea.displayName = 'MexoTextarea';
