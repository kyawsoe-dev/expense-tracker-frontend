'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useGroupStore } from '@/store/groupStore';
import { useExpenseStore } from '@/store/expenseStore';
import { ThemeMode } from '@/types';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { groups: rawGroups = [] } = useGroupStore();
  const groups = rawGroups || [];
  const { expenses: rawExpenses = [] } = useExpenseStore();
  const expenses = rawExpenses || [];
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const destructiveButtonClass =
    'w-full py-4 rounded-xl font-semibold transition-colors bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600';
  const destructiveGhostClass =
    'flex-1 py-3 rounded-xl font-medium bg-surface-muted text-text-primary border border-border hover:bg-border';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Profile</h1>
          <p className="text-text-secondary">Manage your account</p>
        </div>

        {/* User Info Card */}
        <div className="bg-surface rounded-3xl p-6 border border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 hero-gradient rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-text-primary text-xl font-semibold">{user?.name || 'User'}</h2>
              <p className="text-text-secondary text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/history"
            className="group bg-surface rounded-2xl p-4 border border-border transition-all hover:border-primary/50 hover:-translate-y-0.5"
          >
            <p className="text-text-muted text-sm">Total Expenses</p>
            <p className="text-text-primary text-2xl font-bold group-hover:text-primary">
              {expenses.length}
            </p>
          </Link>
          <Link
            href="/groups"
            className="group bg-surface rounded-2xl p-4 border border-border transition-all hover:border-primary/50 hover:-translate-y-0.5"
          >
            <p className="text-text-muted text-sm">Groups</p>
            <p className="text-text-primary text-2xl font-bold group-hover:text-primary">
              {groups.length}
            </p>
          </Link>
        </div>

        {/* Settings */}
        <div className="bg-surface rounded-3xl border border-border overflow-hidden">
          <h3 className="px-6 py-4 text-text-primary font-semibold border-b border-border">
            Preferences
          </h3>

          {/* Theme Selector */}
          <div className="px-6 py-4 border-b border-border">
            <div className="space-y-3">
              <div>
                <p className="text-text-primary font-medium">Theme</p>
                <p className="text-text-muted text-sm">Choose your preferred theme</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTheme(mode)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      theme === mode
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'bg-surface-muted text-text-secondary hover:bg-border'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={destructiveButtonClass}
        >
          Sign Out
        </button>

        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-3xl p-6 max-w-sm w-full">
              <div className="mb-2 flex items-start justify-between gap-4">
                <h3 className="text-text-primary font-semibold text-lg">Sign Out?</h3>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="rounded-xl p-2 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                  aria-label="Close dialog"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <p className="text-text-secondary mb-4">You&apos;ll need to sign in again to access your data.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={destructiveGhostClass}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
