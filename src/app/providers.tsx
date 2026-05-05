'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import ErrorBoundary from '@/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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
