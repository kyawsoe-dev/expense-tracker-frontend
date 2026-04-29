'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useExpenseStore } from '@/store/expenseStore';
import { CATEGORIES } from '@/lib/constants';

export default function HistoryPage() {
  const { expenses: rawExpenses, totalExpenses, isLoading, fetchExpenses, deleteExpense } = useExpenseStore();
  const expenses = rawExpenses || [];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    loadExpenses();
  }, [page, selectedCategory]);

  const loadExpenses = () => {
    fetchExpenses({
      page,
      limit,
      search: search || undefined,
      category: selectedCategory || undefined,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadExpenses();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      // Error handled by store
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      Food: '🍕', Transport: '🚗', Shopping: '🛒', Entertainment: '🎬',
      Bills: '📄', Health: '🏥', Education: '📚', Travel: '✈️', Other: '📦',
    };
    return emojis[category] || '📦';
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">History</h1>
          <p className="text-text-secondary">All your transactions</p>
        </div>

        {/* Search & Filter */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 bg-surface rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border"
              placeholder="Search expenses..."
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
            >
              Search
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => { setSelectedCategory(''); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                !selectedCategory ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </form>

        {/* Expense List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-text-muted">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted text-lg">No expenses found</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg">
                    {getCategoryEmoji(expense.category)}
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">{expense.title}</p>
                    <p className="text-text-muted text-xs">
                      {formatDate(expense.date)} • {expense.category}
                      {expense.groupName && ` • ${expense.groupName}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-text-primary font-semibold">MMK{expense.amount.toLocaleString()}</p>
                  <button
                    onClick={() => setShowDeleteConfirm(expense.id)}
                    className="p-2 text-text-muted hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === expense.id && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-3xl p-6 max-w-sm w-full">
                      <h3 className="text-text-primary font-semibold text-lg mb-2">Delete Expense?</h3>
                      <p className="text-text-secondary mb-4">This action cannot be undone.</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 py-3 bg-surface-muted rounded-xl font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalExpenses > limit && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-surface rounded-xl disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-text-primary">
              Page {page} of {Math.ceil(totalExpenses / limit)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalExpenses / limit)}
              className="px-4 py-2 bg-surface rounded-xl disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
