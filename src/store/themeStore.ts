import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ThemeMode } from '@/types';
import { encryptedStorage } from '@/lib/secure-storage';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme: ThemeMode) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const current = get().theme;
        const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
        set({ theme: next });
        applyTheme(next);
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => encryptedStorage),
    }
  )
);

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', systemDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}
