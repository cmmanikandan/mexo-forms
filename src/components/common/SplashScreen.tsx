import React from 'react';

export interface SplashScreenProps {
  progress?: number;
  isFadingOut?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  progress = 80,
  isFadingOut = false,
}) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center min-h-[100dvh] w-screen transition-opacity duration-400 select-none overflow-hidden bg-white ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #f0f6ff 0%, #ffffff 50%, #f5f0ff 100%)',
      }}
      aria-busy="true"
      aria-label="Loading MEXO Forms"
    >
      {/* Ambient gradient blobs */}
      <div
        aria-hidden="true"
        className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0878e8 0%, transparent 70%)' }}
      />

      {/* Main content */}
      <div className="relative flex flex-col items-center text-center px-6 z-10">
        {/* Logo — large on web, medium on mobile */}
        <div
          className="animate-in fade-in zoom-in-90 duration-500 ease-out motion-reduce:animate-none"
          style={{ animationFillMode: 'both' }}
        >
          {/* Glow ring behind logo */}
          <div className="relative inline-flex items-center justify-center">
            <div
              className="absolute w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full opacity-30 blur-2xl"
              style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
            />
            <img
              src="/logo.png"
              alt="MEXO Forms Logo"
              className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 object-contain drop-shadow-xl"
            />
          </div>
        </div>

        {/* Brand Name — big on web */}
        <div
          className="mt-6 sm:mt-7 md:mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out motion-reduce:animate-none"
          style={{ animationDelay: '80ms', animationFillMode: 'both' }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900">
            MEXO{' '}
            <span
              className="font-black"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6366f1 50%, #0878e8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Forms
            </span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm md:text-base text-slate-400 font-medium tracking-widest uppercase">
            Create. Collect. Understand.
          </p>
        </div>

        {/* Premium loading bar */}
        <div
          className="mt-8 sm:mt-10 md:mt-12 animate-in fade-in duration-400 motion-reduce:animate-none"
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          <div className="w-[160px] sm:w-[200px] md:w-[240px] h-[3px] rounded-full bg-slate-200/80 overflow-hidden shadow-sm">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${safeProgress}%`,
                background: 'linear-gradient(90deg, #7C3AED 0%, #6366f1 50%, #0878e8 100%)',
                boxShadow: '0 0 10px rgba(124,58,237,0.5)',
              }}
            />
          </div>
          <p className="mt-3 text-[10px] sm:text-xs text-slate-400 font-medium tracking-wider uppercase">
            {safeProgress < 40
              ? 'Starting up…'
              : safeProgress < 75
              ? 'Loading MEXO Forms…'
              : safeProgress < 95
              ? 'Almost ready…'
              : 'Welcome!'}
          </p>
        </div>
      </div>
    </div>
  );
};
