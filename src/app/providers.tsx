'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import ErrorBoundary from '@/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Apply stored theme on mount
    const stored = localStorage.getItem('theme-storage');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.theme) {
        applyTheme(state.theme);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SessionProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </SessionProvider>
  );
}

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', systemDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}
