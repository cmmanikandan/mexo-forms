export interface ThemeOption {
  id: string;
  name: string;
  gradient: string;
  previewBg: string;
  accentColor: string;
}

export const THEME_OPTIONS: Record<string, ThemeOption> = {
  violet: {
    id: 'violet',
    name: 'Violet Glow',
    gradient: 'from-[#7C3AED] via-[#6366F1] to-[#0878e8]',
    previewBg: 'bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8]',
    accentColor: '#7C3AED',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Teal',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    previewBg: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600',
    accentColor: '#10B981',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    gradient: 'from-blue-600 via-sky-500 to-indigo-600',
    previewBg: 'bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600',
    accentColor: '#0284C7',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Amber',
    gradient: 'from-amber-500 via-rose-500 to-pink-600',
    previewBg: 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600',
    accentColor: '#F59E0B',
  },
  charcoal: {
    id: 'charcoal',
    name: 'Dark Charcoal',
    gradient: 'from-slate-800 via-zinc-800 to-slate-950',
    previewBg: 'bg-gradient-to-r from-slate-800 via-zinc-800 to-slate-950',
    accentColor: '#334155',
  },
};

export const getThemeGradient = (theme?: string): string => {
  return THEME_OPTIONS[theme || 'violet']?.gradient || THEME_OPTIONS.violet.gradient;
};
