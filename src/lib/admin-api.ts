import api from "./axios";
import type {
  AdminAnalyticsResponse,
  AdminExpenseItem,
  AdminGroupItem,
  AdminOverviewResponse,
  AdminPaginationResponse,
  AdminUserExpensesResponse,
  AdminUserItem,
} from "@/types";

const adminHeaders = () => {
  const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
  return apiKey ? { "x-admin-api-key": apiKey } : undefined;
};

const headers = () => ({
  headers: adminHeaders(),
});

export const adminAPI = {
  overview: () => api.get<AdminOverviewResponse>("/admin/overview", headers()),
  analytics: () => api.get<AdminAnalyticsResponse>("/admin/analytics", headers()),
  users: (params?: { take?: number; skip?: number; search?: string }) =>
    api.get<AdminPaginationResponse<AdminUserItem>>("/admin/users", {
      ...headers(),
      params,
    }),
  createUser: (payload: { email: string; password: string; name?: string }) =>
    api.post("/admin/users", payload, headers()),
  updateUser: (id: string, payload: { email?: string; password?: string; name?: string }) =>
    api.patch(`/admin/users/${id}`, payload, headers()),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`, headers()),
  groups: (params?: { take?: number; skip?: number; search?: string }) =>
    api.get<AdminPaginationResponse<AdminGroupItem>>("/admin/groups", {
      ...headers(),
      params,
    }),
  createGroup: (payload: { name: string; ownerId: string; memberIds?: string[] }) =>
    api.post("/admin/groups", payload, headers()),
  updateGroup: (id: string, payload: { name?: string }) =>
    api.patch(`/admin/groups/${id}`, payload, headers()),
  deleteGroup: (id: string) => api.delete(`/admin/groups/${id}`, headers()),
  expenses: (params?: {
    take?: number;
    skip?: number;
    search?: string;
    userId?: string;
    groupId?: string;
    category?: string;
  }) =>
    api.get<AdminPaginationResponse<AdminExpenseItem>>("/admin/expenses", {
      ...headers(),
      params,
    }),
  createExpense: (payload: {
    title: string;
    amount: number;
    category: string;
    userId: string;
    groupId?: string | null;
    date: string;
    note?: string;
  }) => api.post("/admin/expenses", payload, headers()),
  updateExpense: (
    id: string,
    payload: {
      title?: string;
      amount?: number;
      category?: string;
      userId?: string;
      groupId?: string | null;
      date?: string;
      note?: string | null;
    },
  ) => api.patch(`/admin/expenses/${id}`, payload, headers()),
  deleteExpense: (id: string) => api.delete(`/admin/expenses/${id}`, headers()),
  expensesByUser: (params?: { year?: number; search?: string }) =>
    api.get<AdminUserExpensesResponse>("/admin/expenses/by-user", {
      ...headers(),
      params,
    }),
};
