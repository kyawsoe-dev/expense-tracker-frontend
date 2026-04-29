'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useExpenseStore } from '@/store/expenseStore';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import MonthlyChart from '@/components/charts/MonthlyChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import { fetchSummary, fetchAnalytics, fetchRecentExpenses } from '@/lib/data-fetch';

export default function DashboardContent() {
  const user = useAuthStore((s) => s.user);
  const { recentExpenses, currentSummary, currentAnalytics, fetchRecentExpenses: loadRecent } = useExpenseStore();
  const { groups, fetchGroups } = useGroupStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear, selectedAnalyticsYear]);

  const loadData = async () => {
    await Promise.all([
      fetchSummary(selectedYear, selectedMonth),
      fetchAnalytics(selectedAnalyticsYear),
      loadRecent(),
      fetchGroups(),
    ]);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Safe data access with defaults
  const safeRecentExpenses = recentExpenses || [];
  const safeCurrentSummary = currentSummary;
  const safeCurrentAnalytics = currentAnalytics;

  return (
    <div className="space-y-6">
      {/* Greeting & Quick Stats - Matching Mobile UI */}
      <div className="hero-gradient rounded-3xl p-6 text-white relative overflow-hidden">
        {/* Header with greeting and profile avatar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{greeting()}, {user?.name || 'User'}!</h2>
            <p className="text-white/80 mt-1">Track your MMK spending with a cleaner snapshot</p>
          </div>
          <Link
            href="/profile"
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold"
          >
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </Link>
        </div>

        {/* Balance Card - Matching Mobile */}
        {safeCurrentSummary && (
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="px-3 py-1 bg-white/20 rounded-full">
                <span className="text-xs font-semibold">Monthly overview</span>
              </div>
              <div className="flex-1" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-2 py-1 bg-white/20 rounded-lg text-white text-xs border-0 outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1} className="text-black">
                    {new Date(2000, i).toLocaleString('default', { month: 'short' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <p className="text-3xl font-bold">MMK{safeCurrentSummary.total.toLocaleString()}</p>
              <p className="text-white/70 text-sm mt-1">
                Your {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} total across all tracked expenses.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs">Transactions</p>
                <p className="text-xl font-bold mt-1">{safeCurrentSummary.transactionCount}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs">Top category</p>
                <p className="text-lg font-semibold mt-1">{safeCurrentSummary.topCategory || 'None'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Section - Matching Mobile */}
      <div className="bg-surface rounded-3xl p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-text-primary font-semibold text-lg">Analytics</h3>
            <p className="text-text-muted text-xs mt-1">Your spending patterns</p>
          </div>
          <select
            value={selectedAnalyticsYear}
            onChange={(e) => setSelectedAnalyticsYear(Number(e.target.value))}
            className="px-3 py-2 bg-surface-muted rounded-xl text-text-primary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {Array.from({ length: 6 }, (_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>

        {safeCurrentAnalytics && safeCurrentAnalytics.monthly && (
          <div className="bg-surface-muted rounded-2xl p-4">
            <MonthlyChart data={safeCurrentAnalytics.monthly} />
          </div>
        )}
      </div>

      {/* AI Spending Forecast - Matching Mobile */}
      <div className="bg-surface rounded-3xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-text-primary font-semibold text-lg">AI Spending Forecast</h3>
          <span className="text-text-muted text-xs">Next Month</span>
        </div>
        <div className="bg-surface-muted rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-text-primary font-bold text-lg">
                MMK{safeCurrentSummary ? Math.round(safeCurrentSummary.total * 1.1).toLocaleString() : '0'}
              </p>
              <p className="text-text-muted text-xs mt-1">Total Est.</p>
            </div>
            <div>
              <p className="text-orange-500 font-bold text-lg">↑</p>
              <p className="text-text-muted text-xs mt-1">Increasing</p>
            </div>
            <div>
              <p className="text-green-500 font-bold text-lg">2</p>
              <p className="text-text-muted text-xs mt-1">Decreasing</p>
            </div>
          </div>
        </div>
        <p className="text-text-muted text-xs mt-4">
          Add more expenses to get AI predictions
        </p>
      </div>

      {/* Category Breakdown */}
      {safeCurrentAnalytics && safeCurrentAnalytics.byCategory && safeCurrentAnalytics.byCategory.length > 0 && (
        <div className="bg-surface rounded-3xl p-6 border border-border">
          <h3 className="text-text-primary font-semibold text-lg mb-4">By Category</h3>
          <CategoryPieChart data={safeCurrentAnalytics.byCategory} />
        </div>
      )}

      {/* Recent Expenses - Matching Mobile */}
      <div className="bg-surface rounded-3xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-text-primary font-semibold text-lg">Recent transactions</h3>
          <Link href="/history" className="text-primary text-sm font-medium">
            See All
          </Link>
        </div>
        <div className="space-y-3">
          {safeRecentExpenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-surface-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.5A2.5 2.5 0 00 15.5 15h-11dA2.5 2.5 0 003 12.5V8a3 3 0 013-3m-3 12a3 3 0 106 0m-6 0a3 3 0 106 0m10 0a3 3 0 106 0" />
                </svg>
              </div>
              <p className="text-text-muted">No expenses yet</p>
              <p className="text-text-muted text-sm mt-1">Tap the add button to create your first expense</p>
            </div>
          ) : (
            safeRecentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-surface-muted rounded-xl hover:bg-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="text-primary text-lg">
                      {getCategoryEmoji(expense.category)}
                    </span>
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">{expense.title}</p>
                    <p className="text-text-muted text-xs">
                      {expense.category} • {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className="text-text-primary font-semibold">MMK{expense.amount.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Groups Quick Access - Matching Mobile */}
      <div className="bg-surface rounded-3xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-text-primary font-semibold text-lg">Your Groups</h3>
          <Link href="/groups" className="text-primary text-sm font-medium">
            Manage
          </Link>
        </div>
        <div className="space-y-3">
          {groups.length === 0 ? (
            <p className="text-text-muted text-center py-4">No groups yet</p>
          ) : (
            groups.slice(0, 3).map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="flex items-center justify-between p-3 bg-surface-muted rounded-xl hover:bg-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">{group.name}</p>
                    <p className="text-text-muted text-xs">{group.members.length} members</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    Food: '🍕',
    Transport: '🚗',
    Shopping: '🛒',
    Entertainment: '🎬',
    Bills: '📄',
    Health: '🏥',
    Education: '📚',
    Travel: '✈️',
    Other: '📦',
  };
  return emojis[category] || '📦';
}
