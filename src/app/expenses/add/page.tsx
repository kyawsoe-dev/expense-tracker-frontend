'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useExpenseStore } from '@/store/expenseStore';
import { useGroupStore } from '@/store/groupStore';
import { CreateExpenseInput } from '@/types';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Travel', 'Other'
];

export default function AddExpensePage() {
  const router = useRouter();
  const { createExpense, isLoading } = useExpenseStore();
  const { groups } = useGroupStore();
  const [formData, setFormData] = useState<CreateExpenseInput>({
    title: '',
    amount: 0,
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.amount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createExpense(formData);
      toast.success('Expense added successfully!');
      router.push('/');
    } catch {
      // Error handled by store
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Add Expense</h1>
          <p className="text-text-secondary">Track where your money goes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-surface rounded-3xl p-6 border border-border space-y-4">
            {/* Title */}
            <div>
              <label className="text-text-secondary text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="What did you spend on?"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-text-secondary text-sm font-medium">Amount (MMK)</label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-text-secondary text-sm font-medium">Category</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      formData.category === cat
                        ? 'bg-primary text-white'
                        : 'bg-surface-muted text-text-secondary hover:bg-border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-text-secondary text-sm font-medium">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            {/* Group (Optional) */}
            {groups.length > 0 && (
              <div>
                <label className="text-text-secondary text-sm font-medium">Group (Optional)</label>
                <select
                  value={formData.groupId || ''}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value || undefined })}
                  className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Personal Expense</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="text-text-secondary text-sm font-medium">Note (Optional)</label>
              <textarea
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Add a note..."
                rows={3}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 hero-gradient text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg shadow-primary/30"
          >
            {isLoading ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
