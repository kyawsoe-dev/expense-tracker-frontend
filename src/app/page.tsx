'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DashboardContent from '@/components/expenses/DashboardContent';
import LoadingState from '@/components/ui/LoadingState';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <AppShell>
        <div className="flex justify-center py-8">
          <LoadingState label="Loading" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
