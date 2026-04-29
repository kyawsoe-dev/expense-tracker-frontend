import { expensesAPI } from './api';
import { useExpenseStore } from '@/store/expenseStore';

// Server-side data fetching functions
export async function fetchSummary(year?: number, month?: number) {
  try {
    const { data } = year && month
      ? await expensesAPI.summaryMonthly(year, month)
      : await expensesAPI.summaryCurrentMonth();
    const store = useExpenseStore.getState();
    store.currentSummary = data;
    return data;
  } catch (error) {
    console.error('Failed to fetch summary:', error);
    throw error;
  }
}

export async function fetchAnalytics(year: number) {
  try {
    const { data } = await expensesAPI.analyticsYearly(year);
    const store = useExpenseStore.getState();
    store.currentAnalytics = data;
    return data;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    // Return empty analytics structure to prevent crashes
    return {
      monthly: [],
      byCategory: [],
      year,
      currency: 'MMK',
    };
  }
}

export async function fetchRecentExpenses() {
  try {
    const { data } = await expensesAPI.list({ limit: 5 });
    const store = useExpenseStore.getState();
    store.recentExpenses = data.items || [];
    return data.items || [];
  } catch (error) {
    console.error('Failed to fetch recent expenses:', error);
    return [];
  }
}
