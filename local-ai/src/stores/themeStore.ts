import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/types';

type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme-storage';

export const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const resolveTheme = (theme: Theme): ResolvedTheme => {
  return theme === 'system' ? getSystemTheme() : theme;
};

export const applyThemeClass = (resolvedTheme: ResolvedTheme) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.dataset.theme = resolvedTheme;
};

export const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return 'system';
    }

    const parsed = JSON.parse(raw) as { state?: { theme?: Theme } };
    return parsed.state?.theme ?? 'system';
  } catch {
    return 'system';
  }
};

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  syncWithSystem: () => void;
}

const initialTheme = getStoredTheme();
const initialResolvedTheme = resolveTheme(initialTheme);

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: initialTheme,
      resolvedTheme: initialResolvedTheme,

      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme);
        applyThemeClass(resolvedTheme);
        set({ theme, resolvedTheme });
      },

      syncWithSystem: () => {
        if (get().theme !== 'system') {
          return;
        }

        const resolvedTheme = getSystemTheme();
        applyThemeClass(resolvedTheme);
        set({ resolvedTheme });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        const resolvedTheme = resolveTheme(state.theme);
        applyThemeClass(resolvedTheme);
        state.resolvedTheme = resolvedTheme;
      },
    }
  )
);
