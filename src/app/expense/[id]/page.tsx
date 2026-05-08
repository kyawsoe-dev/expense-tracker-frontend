'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import LoadingState from '@/components/ui/LoadingState';
import { useExpenseStore } from '@/store/expenseStore';
import { CATEGORIES } from '@/lib/constants';
import { toast } from 'react-hot-toast';

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { fetchExpense, updateExpense, isLoading } = useExpenseStore();
  const { id } = use(params);
  const [formData, setFormData] = useState({
    title: '',
    amount: 0,
    category: 'Food',
    date: '',
    note: '',
    groupId: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExpense = async () => {
      try {
        const expense = await fetchExpense(id);
        setFormData({
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          date: expense.date.split('T')[0],
          note: expense.note || '',
          groupId: expense.groupId || '',
        });
      } catch {
        toast.error('Could not load expense');
        router.push('/history');
      } finally {
        setLoading(false);
      }
    };

    void loadExpense();
  }, [fetchExpense, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        ...(formData.groupId ? { groupId: formData.groupId } : {}),
      };

      await updateExpense(id, payload);
      toast.success('Expense updated!');
      router.push('/history');
    } catch {
      // Error handled by store
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-8">
          <LoadingState label="Loading expense" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Edit Expense</h1>
          <p className="text-text-secondary">Update expense details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-surface rounded-3xl p-6 border border-border space-y-4">
            <div>
              <label className="text-text-secondary text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div>
              <label className="text-text-secondary text-sm font-medium">Amount (MMK)</label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                min="0"
                step="0.01"
                required
              />
            </div>

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
                        : 'bg-surface-muted text-text-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

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

            <div>
              <label className="text-text-secondary text-sm font-medium">Note (Optional)</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 hero-gradient text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg shadow-primary/30"
          >
            {isLoading ? 'Updating...' : 'Update Expense'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
