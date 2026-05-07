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
  topCategory: string | null;
  currency: string;
}

export interface ExpenseYearAnalytics {
  monthly?: { month: number; total: number; transactionCount: number }[];
  byMonth?: { month: number; label: string; total: number }[];
  byCategory: { category: string; total: number; percentage?: number }[];
  year: number;
  currency: string;
  total?: number;
  topCategory?: string | null;
}

export interface ExpenseGroup {
  id: string;
  name: string;
  ownerId?: string;
  owner?: { id: string; name?: string | null; email?: string | null };
  members: GroupMember[];
  expenses?: Expense[];
  balances?: { userId: string; name: string; email?: string; paid: number; owes: number; balance: number }[];
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
  memberEmails?: string[];
}

export interface GroupMemberSuggestion {
  id: string;
  name?: string;
  email: string;
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

export interface PaginatedExpenseResponse {
  items: Expense[];
  total: number;
  take: number;
  skip: number;
  hasMore: boolean;
  nextSkip: number | null;
}

export type ExpenseDetail = Expense;

export interface AdminOverviewResponse {
  totals: {
    users: number;
    expenses: number;
    groups: number;
    members: number;
    amount: number;
  };
  recentUsers: {
    id: string;
    email: string;
    name?: string | null;
    createdAt: string;
    expenseCount: number;
    ownedGroupCount: number;
    membershipCount: number;
  }[];
  recentExpenses: {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    createdAt: string;
    user: {
      id: string;
      name?: string | null;
      email: string;
    };
    group: {
      id: string;
      name: string;
    } | null;
  }[];
  recentGroups: {
    id: string;
    name: string;
    createdAt: string;
    owner: {
      id: string;
      name?: string | null;
      email: string;
    } | null;
    memberCount: number;
    expenseCount: number;
  }[];
}

export interface AdminAnalyticsResponse {
  year: number;
  totals: {
    users: number;
    groups: number;
    expenses: number;
    amount: number;
  };
  byMonth: {
    month: number;
    label: string;
    total: number;
    transactionCount: number;
  }[];
  byCategory: {
    category: string;
    total: number;
    transactionCount: number;
  }[];
  byUser: {
    userId: string;
    name: string;
    email: string;
    total: number;
    expenseCount: number;
    ownedGroupCount: number;
    membershipCount: number;
  }[];
  byGroup: {
    groupId: string;
    name: string;
    total: number;
    expenseCount: number;
    memberCount: number;
    owner: {
      id: string;
      name?: string | null;
      email: string;
    };
  }[];
  currency: string;
}

export interface AdminPaginationResponse<T> {
  items: T[];
  total: number;
  take: number;
  skip: number;
  hasMore: boolean;
  nextSkip: number | null;
}

export interface AdminUserItem {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  expenseCount: number;
  ownedGroupCount: number;
  membershipCount: number;
}

export interface AdminGroupItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name?: string | null;
    email: string;
  };
  memberCount: number;
  expenseCount: number;
}

export interface AdminExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
}

export interface AdminUserExpensesResponse {
  year: number;
  items: {
    userId: string;
    name: string;
    email: string;
    total: number;
    expenseCount: number;
    ownedGroupCount: number;
    membershipCount: number;
  }[];
  chart: {
    userId: string;
    name: string;
    total: number;
  }[];
  totalExpenseAmount: number;
  totalExpenseCount: number;
  currency: string;
}
