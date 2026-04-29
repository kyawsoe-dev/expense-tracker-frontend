export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  groupId?: string;
  groupName?: string;
  createdAt: string;
}

export interface CreateExpenseInput {
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  groupId?: string;
}

export interface ExpenseMonthSummary {
  total: number;
  transactionCount: number;
  topCategory: string;
  currency: string;
}

export interface ExpenseYearAnalytics {
  monthly: { month: number; total: number; transactionCount: number }[];
  byCategory: { category: string; total: number; percentage: number }[];
  year: number;
  currency: string;
}

export interface ExpenseGroup {
  id: string;
  name: string;
  ownerId: string;
  members: GroupMember[];
  expenses?: Expense[];
  balances?: { userId: string; name: string; balance: number }[];
  createdAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  role: string;
  name?: string;
  email?: string;
}

export interface CreateGroupInput {
  name: string;
}

export interface MonthlyParams {
  year: number;
  month: number;
}

export interface YearlyParams {
  year: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DashboardData {
  summary: ExpenseMonthSummary;
  recentExpenses: Expense[];
  analytics?: ExpenseYearAnalytics;
}
