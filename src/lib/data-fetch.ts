import { expensesAPI } from './api';
import { useExpenseStore } from '@/store/expenseStore';

function normalizeYearAnalytics(data: Awaited<ReturnType<typeof expensesAPI.analyticsYearly>>['data']) {
  return {
    ...data,
    monthly: (data.byMonth ?? []).map((item) => ({
      month: item.month,
      total: item.total,
      transactionCount: 0,
    })),
  };
}

// Server-side data fetching functions
export async function fetchSummary(year?: number, month?: number) {
  try {
    const { data } = year && month
      ? await expensesAPI.summaryMonthly(year, month)
      : await expensesAPI.summaryCurrentMonth();
    useExpenseStore.setState({ currentSummary: data });
    return data;
  } catch (error) {
    console.error('Failed to fetch summary:', error);
    throw error;
  }
}

export async function fetchAnalytics(year: number) {
  try {
    const { data } = await expensesAPI.analyticsYearly(year);
    const normalized = normalizeYearAnalytics(data);
    useExpenseStore.setState({ currentAnalytics: normalized });
    return normalized;
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

export async function fetchAllTimeSummary() {
  try {
    const { data } = await expensesAPI.summaryAllTime();
    useExpenseStore.setState({ allTimeSummary: data });
    return data;
  } catch (error) {
    console.error('Failed to fetch all-time summary:', error);
    return {
      total: 0,
      transactionCount: 0,
      topCategory: null,
      byCategory: [],
      currency: 'MMK',
    };
  }
}

export async function fetchRecentExpenses() {
  try {
    const { data } = await expensesAPI.list({ limit: 5 });
    useExpenseStore.setState({ recentExpenses: data.items || [] });
    return data.items || [];
  } catch (error) {
    console.error('Failed to fetch recent expenses:', error);
    return [];
  }
}
