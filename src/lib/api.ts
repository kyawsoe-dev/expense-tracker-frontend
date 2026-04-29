import api from './axios';
import { Expense, CreateExpenseInput, ExpenseMonthSummary, ExpenseYearAnalytics, ExpenseGroup, CreateGroupInput, GroupMember } from '@/types';

// Auth API
export const authAPI = {
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  socialLogin: (provider: 'google' | 'github', token: string) =>
    api.post('/auth/social-login', { provider, token }),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () =>
    api.post('/auth/logout'),
};

// Expenses API
export const expensesAPI = {
  list: (params?: { page?: number; limit?: number; search?: string; category?: string; year?: number; month?: number }) =>
    api.get<{ items: Expense[]; total: number }>('/expenses', { params }),

  create: (data: CreateExpenseInput) =>
    api.post<Expense>('/expenses', data),

  update: (id: string, data: Partial<CreateExpenseInput>) =>
    api.patch<Expense>(`/expenses/${id}`, data),

  delete: (id: string) =>
    api.delete(`/expenses/${id}`),

  summaryCurrentMonth: () =>
    api.get<ExpenseMonthSummary>('/expenses/summary/current-month'),

  summaryMonthly: (year: number, month: number) =>
    api.get<ExpenseMonthSummary>('/expenses/summary/monthly', { params: { year, month } }),

  analyticsYearly: (year: number) =>
    api.get<ExpenseYearAnalytics>('/expenses/analytics/yearly', { params: { year } }),

  byGroup: (groupId: string) =>
    api.get<Expense[]>(`/expenses/by-group/${groupId}`),
};

// Groups API
export const groupsAPI = {
  list: () =>
    api.get<ExpenseGroup[]>('/groups'),

  create: (data: CreateGroupInput) =>
    api.post<ExpenseGroup>('/groups', data),

  get: (id: string) =>
    api.get<ExpenseGroup>(`/groups/${id}`),

  rename: (id: string, name: string) =>
    api.patch<ExpenseGroup>(`/groups/${id}`, { name }),

  addMember: (id: string, email: string) =>
    api.post(`/groups/${id}/members`, { email }),

  removeMember: (id: string, memberId: string) =>
    api.delete(`/groups/${id}/members/${memberId}`),

  memberSuggestions: (query: string) =>
    api.get(`/groups/member-suggestions`, { params: { q: query } }),
};
