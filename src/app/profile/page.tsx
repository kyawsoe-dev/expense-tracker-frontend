'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useGroupStore } from '@/store/groupStore';
import { useExpenseStore } from '@/store/expenseStore';
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

  const handleLogout = () => {
    logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
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
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <p className="text-text-muted text-sm">Total Expenses</p>
            <p className="text-text-primary text-2xl font-bold">{expenses.length}</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <p className="text-text-muted text-sm">Groups</p>
            <p className="text-text-primary text-2xl font-bold">{groups.length}</p>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-surface rounded-3xl border border-border overflow-hidden">
          <h3 className="px-6 py-4 text-text-primary font-semibold border-b border-border">
            Preferences
          </h3>

          {/* Theme Selector */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-primary font-medium">Theme</p>
                <p className="text-text-muted text-sm">Choose your preferred theme</p>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="px-3 py-2 bg-surface-muted rounded-xl text-text-primary border border-border"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          {/* Admin Access */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-primary font-medium">Admin Dashboard</p>
                <p className="text-text-muted text-sm">Manage application settings</p>
              </div>
              <button
                onClick={() => router.push('/admin/login')}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium"
              >
                Access
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-4 bg-red-50 text-red-500 rounded-xl font-semibold"
        >
          Sign Out
        </button>

        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-3xl p-6 max-w-sm w-full">
              <h3 className="text-text-primary font-semibold text-lg mb-2">Sign Out?</h3>
              <p className="text-text-secondary mb-4">You'll need to sign in again to access your data.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-surface-muted rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
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
