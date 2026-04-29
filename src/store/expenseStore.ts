import { create } from "zustand";
import {
  Expense,
  CreateExpenseInput,
  ExpenseMonthSummary,
  ExpenseYearAnalytics,
} from "@/types";
import { expensesAPI } from "@/lib/api";

interface ExpenseState {
  expenses: Expense[];
  recentExpenses: Expense[];
  currentSummary: ExpenseMonthSummary | null;
  currentAnalytics: ExpenseYearAnalytics | null;
  totalExpenses: number;
  isLoading: boolean;
  error: string | null;

  fetchExpenses: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    year?: number;
    month?: number;
  }) => Promise<void>;
  fetchRecentExpenses: () => Promise<void>;
  fetchSummary: (year?: number, month?: number) => Promise<void>;
  fetchAnalytics: (year: number) => Promise<void>;
  createExpense: (data: CreateExpenseInput) => Promise<Expense>;
  updateExpense: (
    id: string,
    data: Partial<CreateExpenseInput>,
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  recentExpenses: [],
  currentSummary: null,
  currentAnalytics: null,
  totalExpenses: 0,
  isLoading: false,
  error: null,

  fetchExpenses: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await expensesAPI.list(params);
      set({
        expenses: data.items,
        totalExpenses: data.total,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchRecentExpenses: async () => {
    try {
      const { data } = await expensesAPI.list({ limit: 5 });
      set({ recentExpenses: data.items || [] });
    } catch (error: any) {
      console.error("Failed to fetch recent expenses:", error);
      set({ recentExpenses: [] });
    }
  },

  fetchSummary: async (year, month) => {
    try {
      const { data } =
        year && month
          ? await expensesAPI.summaryMonthly(year, month)
          : await expensesAPI.summaryCurrentMonth();
      set({ currentSummary: data });
    } catch (error: any) {
      console.error("Failed to fetch summary:", error);
    }
  },

  fetchAnalytics: async (year) => {
    try {
      const { data } = await expensesAPI.analyticsYearly(year);
      set({ currentAnalytics: data });
    } catch (error: any) {
      console.error("Failed to fetch analytics:", error);
    }
  },

  createExpense: async (data) => {
    set({ isLoading: true });
    try {
      const { data: expense } = await expensesAPI.create(data);
      set((state) => ({
        expenses: [expense, ...state.expenses],
        isLoading: false,
      }));
      return expense;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateExpense: async (id, data) => {
    try {
      const { data: updated } = await expensesAPI.update(id, data);
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    try {
      await expensesAPI.delete(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        recentExpenses: state.recentExpenses.filter((e) => e.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
