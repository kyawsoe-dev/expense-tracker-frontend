"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import MonthlyChart from "@/components/charts/MonthlyChart";
import UserExpenseBarChart from "@/components/admin/UserExpenseBarChart";
import LoadingState from "@/components/ui/LoadingState";
import { generateAdminSecret, verifyAdminToken } from "@/lib/admin-2fa";
import { adminAPI } from "@/lib/admin-api";
import { useThemeStore } from "@/store/themeStore";
import {
  encryptedStorage,
  removeCookie,
  setEncryptedCookie,
} from "@/lib/secure-storage";
import type {
  AdminAnalyticsResponse,
  AdminExpenseItem,
  AdminGroupItem,
  AdminOverviewResponse,
  AdminPaginationResponse,
  AdminUserExpensesResponse,
  AdminUserItem,
} from "@/types";

type UserFormState = {
  email: string;
  name: string;
  password: string;
};

type GroupFormState = {
  name: string;
  ownerId: string;
};

type ExpenseFormState = {
  title: string;
  amount: string;
  category: string;
  userId: string;
  groupId: string;
  date: string;
  note: string;
};

const emptyUserForm: UserFormState = {
  email: "",
  name: "",
  password: "",
};

const emptyGroupForm: GroupFormState = {
  name: "",
  ownerId: "",
};

const emptyExpenseForm: ExpenseFormState = {
  title: "",
  amount: "",
  category: "",
  userId: "",
  groupId: "",
  date: "",
  note: "",
};

const formatAmount = (amount: number | string) =>
  `MMK ${Number(amount).toLocaleString("en-US")}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const normalizeCurrencyInput = (value: string) => value.replace(/[^\d.]/g, "");

const PAGE_SIZE = 10;

function PaginationControls({
  page,
  total,
  take,
  onPageChange,
}: {
  page: number;
  total: number;
  take: number;
  onPageChange: (nextPage: number) => void;
}) {
  if (total <= take) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-xl border border-border bg-surface-muted px-4 py-2 font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-xl border border-border bg-surface-muted px-4 py-2 font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();
  const [setup2FA, setSetup2FA] = useState(false);
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(
    null,
  );
  const [users, setUsers] =
    useState<AdminPaginationResponse<AdminUserItem> | null>(null);
  const [groups, setGroups] =
    useState<AdminPaginationResponse<AdminGroupItem> | null>(null);
  const [expenses, setExpenses] =
    useState<AdminPaginationResponse<AdminExpenseItem> | null>(null);
  const [expensesByUser, setExpensesByUser] =
    useState<AdminUserExpensesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [userExpenseSearch, setUserExpenseSearch] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [showMobileHeaderActions, setShowMobileHeaderActions] =
    useState(false);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
  const [expenseForm, setExpenseForm] =
    useState<ExpenseFormState>(emptyExpenseForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const effectiveTheme =
    theme === "system"
      ? typeof document !== "undefined" &&
        document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light"
      : theme;

  const handleSetup2FA = () => {
    const adminEmail =
      localStorage.getItem("adminEmail") || "admin@example.com";
    const data = generateAdminSecret(adminEmail);
    setSecret(data.secret);
    setOtpauthUrl(data.otpauthUrl);
    setSetup2FA(true);
  };

  const loadOverview = useCallback(async () => {
    const { data } = await adminAPI.overview();
    setOverview(data);
  }, []);

  const loadAnalytics = useCallback(async () => {
    const { data } = await adminAPI.analytics();
    setAnalytics(data);
  }, []);

  const loadUsers = useCallback(async (search = "", page = 1) => {
    const { data } = await adminAPI.users({
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      search: search.trim() || undefined,
    });
    setUsers(data);
  }, []);

  const loadGroups = useCallback(async (search = "", page = 1) => {
    const { data } = await adminAPI.groups({
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      search: search.trim() || undefined,
    });
    setGroups(data);
  }, []);

  const loadExpenses = useCallback(async (search = "", page = 1) => {
    const { data } = await adminAPI.expenses({
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      search: search.trim() || undefined,
    });
    setExpenses(data);
  }, []);

  const loadExpensesByUser = useCallback(async (search = "") => {
    const { data } = await adminAPI.expensesByUser({
      search: search.trim() || undefined,
    });
    setExpensesByUser(data);
  }, []);

  const loadAll = useCallback(
    async (
      options: {
        userSearch?: string;
        usersPage?: number;
        groupSearch?: string;
        groupsPage?: number;
        expenseSearch?: string;
        expensesPage?: number;
      } = {},
    ) => {
      setError("");
      await Promise.all([
        loadOverview(),
        loadAnalytics(),
        loadUsers(options.userSearch ?? "", options.usersPage ?? 1),
        loadGroups(options.groupSearch ?? "", options.groupsPage ?? 1),
        loadExpenses(options.expenseSearch ?? "", options.expensesPage ?? 1),
        loadExpensesByUser(""),
      ]);
    },
    [
      loadOverview,
      loadAnalytics,
      loadUsers,
      loadGroups,
      loadExpenses,
      loadExpensesByUser,
    ],
  );

  useEffect(() => {
    let active = true;

    const run = async () => {
      setIsLoading(true);
      try {
        await loadAll();
      } catch {
        if (active) {
          setError("Unable to load admin dashboard right now.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [loadAll]);

  const handleVerify2FA = async () => {
    const adminSecret =
      secret ||
      encryptedStorage.getItem("admin-2fa-secret") ||
      process.env.NEXT_PUBLIC_ADMIN_2FA_SECRET ||
      "";
    const isValid = await verifyAdminToken(verificationToken, adminSecret);

    if (isValid) {
      encryptedStorage.setItem("admin-2fa-secret", adminSecret);
      setEncryptedCookie(
        "adminAuthenticated",
        JSON.stringify({ authenticated: true, admin: true }),
      );
      toast.success("2FA setup complete!");
      setSetup2FA(false);
    } else {
      toast.error("Invalid verification code");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAll({
        userSearch,
        usersPage,
        groupSearch,
        groupsPage,
        expenseSearch,
        expensesPage,
      });
      toast.success("Admin data refreshed");
    } catch {
      toast.error("Unable to refresh admin data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    removeCookie("adminAuthenticated");
    localStorage.removeItem("adminEmail");
    toast.success("Logged out from admin");
    router.push("/admin/login");
  };

  const stats = useMemo(
    () =>
      overview?.totals ??
      analytics?.totals ?? {
        users: 0,
        expenses: 0,
        groups: 0,
        members: 0,
        amount: 0,
      },
    [overview, analytics],
  );

  const userOptions = useMemo(() => {
    const source = users?.items?.length
      ? users.items
      : (overview?.recentUsers ?? []);
    return source.map((user) => ({
      id: user.id,
      label: user.name || user.email,
      email: user.email,
    }));
  }, [users, overview]);

  const groupOptions = useMemo(() => {
    const source = groups?.items?.length
      ? groups.items
      : (overview?.recentGroups ?? []);
    return source.map((group) => ({
      id: group.id,
      label: group.name,
    }));
  }, [groups, overview]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
  };

  const resetGroupForm = () => {
    setEditingGroupId(null);
    setGroupForm(emptyGroupForm);
  };

  const resetExpenseForm = () => {
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm);
  };

  const submitUser = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingUserId) {
        await adminAPI.updateUser(editingUserId, {
          email: userForm.email.trim(),
          name: userForm.name.trim() || undefined,
          password: userForm.password.trim() || undefined,
        });
        toast.success("User updated");
      } else {
        await adminAPI.createUser({
          email: userForm.email.trim(),
          password: userForm.password,
          name: userForm.name.trim() || undefined,
        });
        toast.success("User created");
      }
      resetUserForm();
      setUsersPage(1);
      await loadUsers(userSearch, 1);
      await loadAll({
        userSearch,
        usersPage,
        groupSearch,
        groupsPage,
        expenseSearch,
        expensesPage,
      });
    } catch {
      toast.error("Unable to save user");
    }
  };

  const submitGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingGroupId) {
        await adminAPI.updateGroup(editingGroupId, {
          name: groupForm.name.trim(),
        });
        toast.success("Group updated");
      } else {
        await adminAPI.createGroup({
          name: groupForm.name.trim(),
          ownerId: groupForm.ownerId,
        });
        toast.success("Group created");
      }
      resetGroupForm();
      setGroupsPage(1);
      await loadGroups(groupSearch, 1);
      await loadAll({
        userSearch,
        usersPage,
        groupSearch,
        groupsPage,
        expenseSearch,
        expensesPage,
      });
    } catch {
      toast.error("Unable to save group");
    }
  };

  const submitExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        title: expenseForm.title.trim(),
        amount: Number(expenseForm.amount),
        category: expenseForm.category.trim(),
        userId: expenseForm.userId,
        groupId: expenseForm.groupId.trim() || null,
        date: expenseForm.date,
        note: expenseForm.note.trim() || undefined,
      };

      if (editingExpenseId) {
        await adminAPI.updateExpense(editingExpenseId, payload);
        toast.success("Expense updated");
      } else {
        await adminAPI.createExpense(payload);
        toast.success("Expense created");
      }
      resetExpenseForm();
      setExpensesPage(1);
      await loadExpenses(expenseSearch, 1);
      await loadAll({
        userSearch,
        usersPage,
        groupSearch,
        groupsPage,
        expenseSearch,
        expensesPage,
      });
    } catch {
      toast.error("Unable to save expense");
    }
  };

  const deleteUser = async (user: AdminUserItem) => {
    if (!confirm(`Delete ${user.email}? This will remove their data too.`)) {
      return;
    }
    try {
      await adminAPI.deleteUser(user.id);
      toast.success("User deleted");
      if (users?.items.length === 1 && usersPage > 1) {
        setUsersPage(usersPage - 1);
        await loadUsers(userSearch, usersPage - 1);
      } else {
        await loadUsers(userSearch, usersPage);
      }
      await loadAll({
        userSearch,
        usersPage,
        groupSearch,
        groupsPage,
        expenseSearch,
        expensesPage,
      });
    } catch {
      toast.error("Unable to delete user");
    }
  };

  const deleteGroup = async (group: AdminGroupItem) => {
    if (!confirm(`Delete group "${group.name}"?`)) {
      return;
    }
    try {
      await adminAPI.deleteGroup(group.id);
      toast.success("Group deleted");
      if (groups?.items.length === 1 && groupsPage > 1) {
        setGroupsPage(groupsPage - 1);
        await loadGroups(groupSearch, groupsPage - 1);
      } else {
        await loadGroups(groupSearch, groupsPage);
      }
      await loadAll({
        userSearch,
        usersPage,
        groupSearch,
        groupsPage,
        expenseSearch,
        expensesPage,
      });
    } catch {
      toast.error("Unable to delete group");
    }
  };

  const deleteExpense = async (expense: AdminExpenseItem) => {
    if (!confirm(`Delete expense "${expense.title}"?`)) {
      return;
    }
    try {
      await adminAPI.deleteExpense(expense.id);
      toast.success("Expense deleted");
      if (expenses?.items.length === 1 && expensesPage > 1) {
        setExpensesPage(expensesPage - 1);
        await loadExpenses(expenseSearch, expensesPage - 1);
      } else {
        await loadExpenses(expenseSearch, expensesPage);
      }
      await loadAll();
    } catch {
      toast.error("Unable to delete expense");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 text-text-primary backdrop-blur">
        <div className="relative mx-auto flex max-w-[1700px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold sm:text-2xl">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-xs text-text-muted sm:text-sm">
                Overview, analytics, and admin tools at a glance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowMobileHeaderActions((current) => !current)
            }
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted text-text-primary transition-colors hover:bg-border md:hidden"
            aria-label={
              showMobileHeaderActions
                ? "Collapse header actions"
                : "Expand header actions"
            }
            aria-expanded={showMobileHeaderActions}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="hidden items-center gap-2 md:flex md:flex-wrap md:justify-end">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-border"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-border"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={() =>
                setTheme(effectiveTheme === "dark" ? "light" : "dark")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-border"
              aria-label="Toggle theme"
            >
              {effectiveTheme === "dark" ? (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  Light
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  Dark
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Logout
            </button>
          </div>

          {showMobileHeaderActions && (
            <div className="absolute left-4 right-4 top-full z-50 mt-2 rounded-2xl border border-border bg-surface p-2 shadow-2xl shadow-black/10 md:hidden">
              <button
                onClick={() => {
                  setShowMobileHeaderActions(false);
                  handleRefresh();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8 8 0 004.582 9m0 0H9m11 11v-5h-.581m0 0A8.001 8.001 0 0119.418 15m0 0H15"
                  />
                </svg>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={() => {
                  setShowMobileHeaderActions(false);
                  router.push("/");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobileHeaderActions(false);
                  setTheme(effectiveTheme === "dark" ? "light" : "dark");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted"
                aria-label="Toggle theme"
              >
                {effectiveTheme === "dark" ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
                {effectiveTheme === "dark" ? "Light" : "Dark"}
              </button>
              <button
                onClick={() => {
                  setShowMobileHeaderActions(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-primary px-3 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1700px] space-y-6 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-text-muted">Total Users</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">
              {stats.users}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-text-muted">Total Expenses</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">
              {stats.expenses}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-text-muted">Total Groups</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">
              {stats.groups}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-text-muted">Group Members</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">
              {"members" in stats ? stats.members : 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-text-muted">Total Amount</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">
              {formatAmount(stats.amount)}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div
            id="recent-users"
            className="scroll-mt-6 rounded-3xl border border-border bg-surface p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  Recent Users
                </h2>
                <p className="text-sm text-text-muted">
                  Latest registered accounts and activity.
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-primary"
              >
                Reload
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <LoadingState label="Loading users" />
              </div>
            ) : (
              <div className="space-y-3">
                {overview?.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-muted px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">
                        {user.name || "Unnamed User"}
                      </p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-text-muted">
                      <p>{user.expenseCount} expenses</p>
                      <p>{user.ownedGroupCount} groups</p>
                      <p>{user.membershipCount} memberships</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            id="recent-groups"
            className="scroll-mt-6 rounded-3xl border border-border bg-surface p-6"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold text-text-primary">
                Recent Groups
              </h2>
              <p className="text-sm text-text-muted">
                Newest shared expense groups.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <LoadingState label="Loading groups" />
              </div>
            ) : (
              <div className="space-y-3">
                {overview?.recentGroups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-border bg-surface-muted px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-text-primary">
                          {group.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {group.owner?.name ||
                            group.owner?.email ||
                            "Unknown owner"}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          Created {formatDate(group.createdAt)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-text-muted">
                        <p>{group.memberCount} members</p>
                        <p>{group.expenseCount} expenses</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          id="recent-expenses"
          className="scroll-mt-6 rounded-3xl border border-border bg-surface p-6"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-text-primary">
              Recent Expenses
            </h2>
            <p className="text-sm text-text-muted">
              Latest expense activity across the app.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <LoadingState label="Loading expenses" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[1.5fr_0.8fr_1fr_1fr] gap-3 border-b border-border bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <span>Title</span>
                <span>Amount</span>
                <span>User</span>
                <span>Group</span>
              </div>
              {overview?.recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="grid grid-cols-[1.5fr_0.8fr_1fr_1fr] gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-text-primary">
                      {expense.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {expense.category}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDate(expense.createdAt)}
                    </p>
                  </div>
                  <div className="font-semibold text-text-primary">
                    {formatAmount(expense.amount)}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {expense.user.name || expense.user.email}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {expense.group?.name || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          id="analytics-overview"
          className="scroll-mt-6 rounded-3xl border border-border bg-surface p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Analytics Overview
              </h2>
              <p className="text-sm text-text-muted">
                Trends, categories, and total app spending.
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection("expenses-by-user")}
              className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-primary"
            >
              Jump to user spending
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <LoadingState label="Loading analytics" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface-muted p-4">
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  Spending by Month
                </h3>
                <MonthlyChart data={analytics?.byMonth ?? []} />
              </div>
              <div className="rounded-2xl border border-border bg-surface-muted p-4">
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  Spending by Category
                </h3>
                <CategoryPieChart data={analytics?.byCategory ?? []} />
              </div>
            </div>
          )}
        </div>

        <div
          id="users-MANAGEMENT"
          className="scroll-mt-6 rounded-3xl border border-border bg-surface p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Users Management
              </h2>
              <p className="text-sm text-text-muted">
                Create, update, and remove users.
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection("analytics-overview")}
              className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-primary"
            >
              Back to analytics
            </button>
          </div>

          <form
            onSubmit={submitUser}
            className="mb-6 grid gap-3 md:grid-cols-4"
          >
            <input
              value={userForm.email}
              onChange={(e) =>
                setUserForm((current) => ({
                  ...current,
                  email: e.target.value,
                }))
              }
              placeholder="Email"
              type="email"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <input
              value={userForm.name}
              onChange={(e) =>
                setUserForm((current) => ({ ...current, name: e.target.value }))
              }
              placeholder="Name"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <input
              value={userForm.password}
              onChange={(e) =>
                setUserForm((current) => ({
                  ...current,
                  password: e.target.value,
                }))
              }
              placeholder={
                editingUserId ? "New password (optional)" : "Password"
              }
              type="password"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white"
              >
                {editingUserId ? "Update User" : "Create User"}
              </button>
              {editingUserId && (
                <button
                  type="button"
                  onClick={resetUserForm}
                  className="rounded-xl border border-border bg-surface-muted px-4 py-3 font-semibold text-text-primary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mb-4 flex gap-2">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by email or name"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <button
              type="button"
              onClick={async () => {
                setUsersPage(1);
                await loadUsers(userSearch, 1);
              }}
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 font-semibold text-text-primary"
            >
              Search
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto] gap-3 border-b border-border bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <span>User</span>
              <span>Created</span>
              <span>Expenses</span>
              <span>Groups</span>
              <span>Actions</span>
            </div>
            {(users?.items ?? []).map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto] gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-text-primary">
                    {user.name || "Unnamed User"}
                  </p>
                  <p className="text-xs text-text-muted">{user.email}</p>
                </div>
                <p className="text-sm text-text-secondary">
                  {formatDate(user.createdAt)}
                </p>
                <p className="text-sm text-text-secondary">
                  {user.expenseCount}
                </p>
                <p className="text-sm text-text-secondary">
                  {user.ownedGroupCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUserId(user.id);
                      setUserForm({
                        email: user.email,
                        name: user.name || "",
                        password: "",
                      });
                      scrollToSection("users-management");
                    }}
                    className="rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteUser(user)}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            page={usersPage}
            total={users?.total ?? 0}
            take={users?.take ?? PAGE_SIZE}
            onPageChange={async (nextPage) => {
              setUsersPage(nextPage);
              await loadUsers(userSearch, nextPage);
            }}
          />
        </div>

        <div
          id="groups-management"
          className="scroll-mt-6 rounded-3xl border border-border bg-surface p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Groups Management
              </h2>
              <p className="text-sm text-text-muted">
                Create groups and rename existing ones.
              </p>
            </div>
          </div>

          <form
            onSubmit={submitGroup}
            className="mb-6 grid gap-3 md:grid-cols-3"
          >
            <input
              value={groupForm.name}
              onChange={(e) =>
                setGroupForm((current) => ({
                  ...current,
                  name: e.target.value,
                }))
              }
              placeholder="Group name"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <select
              value={groupForm.ownerId}
              onChange={(e) =>
                setGroupForm((current) => ({
                  ...current,
                  ownerId: e.target.value,
                }))
              }
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            >
              <option value="">Select owner</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white"
              >
                {editingGroupId ? "Update Group" : "Create Group"}
              </button>
              {editingGroupId && (
                <button
                  type="button"
                  onClick={resetGroupForm}
                  className="rounded-xl border border-border bg-surface-muted px-4 py-3 font-semibold text-text-primary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mb-4 flex gap-2">
            <input
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Search groups by name"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <button
              type="button"
              onClick={async () => {
                setGroupsPage(1);
                await loadGroups(groupSearch, 1);
              }}
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 font-semibold text-text-primary"
            >
              Search
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_auto] gap-3 border-b border-border bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <span>Group</span>
              <span>Created</span>
              <span>Members</span>
              <span>Expenses</span>
              <span>Actions</span>
            </div>
            {(groups?.items ?? []).map((group) => (
              <div
                key={group.id}
                className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_auto] gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-text-primary">
                    {group.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    Owner: {group.owner.name || group.owner.email}
                  </p>
                </div>
                <p className="text-sm text-text-secondary">
                  {formatDate(group.createdAt)}
                </p>
                <p className="text-sm text-text-secondary">
                  {group.memberCount}
                </p>
                <p className="text-sm text-text-secondary">
                  {group.expenseCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setGroupForm({
                        name: group.name,
                        ownerId: group.owner.id,
                      });
                      scrollToSection("groups-management");
                    }}
                    className="rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGroup(group)}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            page={groupsPage}
            total={groups?.total ?? 0}
            take={groups?.take ?? PAGE_SIZE}
            onPageChange={async (nextPage) => {
              setGroupsPage(nextPage);
              await loadGroups(groupSearch, nextPage);
            }}
          />
        </div>

        <div
          id="expenses-management"
          className="scroll-mt-6 rounded-3xl border border-border bg-surface p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Expenses Management
              </h2>
              <p className="text-sm text-text-muted">
                Create, edit, and delete all expenses.
              </p>
            </div>
          </div>

          <form
            onSubmit={submitExpense}
            className="mb-6 grid gap-3 lg:grid-cols-3"
          >
            <input
              value={expenseForm.title}
              onChange={(e) =>
                setExpenseForm((current) => ({
                  ...current,
                  title: e.target.value,
                }))
              }
              placeholder="Title"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <input
              value={expenseForm.amount}
              onChange={(e) =>
                setExpenseForm((current) => ({
                  ...current,
                  amount: normalizeCurrencyInput(e.target.value),
                }))
              }
              placeholder="Amount"
              inputMode="decimal"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <input
              value={expenseForm.category}
              onChange={(e) =>
                setExpenseForm((current) => ({
                  ...current,
                  category: e.target.value,
                }))
              }
              placeholder="Category"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <select
              value={expenseForm.userId}
              onChange={(e) =>
                setExpenseForm((current) => ({
                  ...current,
                  userId: e.target.value,
                }))
              }
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            >
              <option value="">Select user</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
            <select
              value={expenseForm.groupId}
              onChange={(e) =>
                setExpenseForm((current) => ({
                  ...current,
                  groupId: e.target.value,
                }))
              }
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            >
              <option value="">No group</option>
              {groupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={expenseForm.date}
              onChange={(e) =>
                setExpenseForm((current) => ({
                  ...current,
                  date: e.target.value,
                }))
              }
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <input
              value={expenseForm.note}
              onChange={(e) =>
                setExpenseForm((current) => ({
                  ...current,
                  note: e.target.value,
                }))
              }
              placeholder="Note"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary lg:col-span-2"
            />
            <div className="flex gap-2 lg:col-span-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white"
              >
                {editingExpenseId ? "Update Expense" : "Create Expense"}
              </button>
              {editingExpenseId && (
                <button
                  type="button"
                  onClick={resetExpenseForm}
                  className="rounded-xl border border-border bg-surface-muted px-4 py-3 font-semibold text-text-primary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mb-4 flex gap-2">
            <input
              value={expenseSearch}
              onChange={(e) => setExpenseSearch(e.target.value)}
              placeholder="Search expenses"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <button
              type="button"
              onClick={async () => {
                setExpensesPage(1);
                await loadExpenses(expenseSearch, 1);
              }}
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 font-semibold text-text-primary"
            >
              Search
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_0.8fr_auto] gap-3 border-b border-border bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <span>Expense</span>
              <span>Amount</span>
              <span>User</span>
              <span>Group</span>
              <span>Date</span>
              <span>Actions</span>
            </div>
            {(expenses?.items ?? []).map((expense) => (
              <div
                key={expense.id}
                className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_0.8fr_auto] gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-text-primary">
                    {expense.title}
                  </p>
                  <p className="text-xs text-text-muted">{expense.category}</p>
                  {expense.note && expense.note.trim().length > 0 && (
                    <p className="mt-1 truncate text-xs text-text-secondary">
                      {expense.note}
                    </p>
                  )}
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {formatAmount(expense.amount)}
                </p>
                <p className="text-sm text-text-secondary">
                  {expense.user.name || expense.user.email}
                </p>
                <p className="text-sm text-text-secondary">
                  {expense.group?.name || "-"}
                </p>
                <p className="text-sm text-text-secondary">
                  {formatDate(expense.date)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpenseId(expense.id);
                      setExpenseForm({
                        title: expense.title,
                        amount: String(expense.amount),
                        category: expense.category,
                        userId: expense.user.id,
                        groupId: expense.group?.id || "",
                        date: new Date(expense.date).toISOString().slice(0, 10),
                        note: expense.note || "",
                      });
                      scrollToSection("expenses-management");
                    }}
                    className="rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteExpense(expense)}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            page={expensesPage}
            total={expenses?.total ?? 0}
            take={expenses?.take ?? PAGE_SIZE}
            onPageChange={async (nextPage) => {
              setExpensesPage(nextPage);
              await loadExpenses(expenseSearch, nextPage);
            }}
          />
        </div>

        <div
          id="expenses-by-user"
          className="scroll-mt-6 rounded-3xl border border-border bg-surface p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Expenses by User
              </h2>
              <p className="text-sm text-text-muted">
                List and chart of spending across all users.
              </p>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <input
              value={userExpenseSearch}
              onChange={(e) => setUserExpenseSearch(e.target.value)}
              placeholder="Search user spending"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface-muted px-4 py-3 text-text-primary"
            />
            <button
              type="button"
              onClick={() => loadExpensesByUser(userExpenseSearch)}
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 font-semibold text-text-primary"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-2xl border border-border bg-surface-muted p-4">
              <UserExpenseBarChart data={expensesByUser?.chart ?? []} />
            </div>
            <div className="rounded-2xl border border-border bg-surface-muted p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  User spending list
                </h3>
                <p className="text-xs text-text-muted">
                  {expensesByUser?.totalExpenseCount ?? 0} transactions
                </p>
              </div>
              <div className="space-y-3">
                {(expensesByUser?.items ?? []).map((item) => (
                  <div
                    key={item.userId}
                    className="rounded-2xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-text-primary">
                          {item.name}
                        </p>
                        <p className="text-xs text-text-muted">{item.email}</p>
                      </div>
                      <p className="font-semibold text-text-primary">
                        {formatAmount(item.total)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
                      <span>{item.expenseCount} expenses</span>
                      <span>{item.ownedGroupCount} groups</span>
                      <span>{item.membershipCount} memberships</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xl font-bold text-text-primary">
            Security Settings
          </h2>

          {!setup2FA ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="max-w-2xl text-text-secondary">
                Set up Two-Factor Authentication to secure admin access.
              </p>
              <button
                onClick={handleSetup2FA}
                className="rounded-xl bg-primary px-6 py-3 font-medium text-white"
              >
                Setup 2FA
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <h3 className="mb-2 font-semibold text-text-primary">
                  1. Scan QR Code
                </h3>
                <p className="mb-4 text-sm text-text-secondary">
                  Use Google Authenticator, Authy, or another authenticator app
                  to scan this QR code.
                </p>
                {otpauthUrl && (
                  <div className="mx-auto inline-flex rounded-2xl bg-white p-4 shadow-sm">
                    <QRCodeSVG value={otpauthUrl} size={192} />
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-text-primary">
                  2. Manual Entry
                </h3>
                <p className="mb-2 text-sm text-text-secondary">
                  Or enter this secret manually:
                </p>
                <div className="break-all rounded-xl bg-surface-muted p-4 font-mono text-sm">
                  {secret}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-text-primary">
                  3. Verify
                </h3>
                <p className="mb-4 text-sm text-text-secondary">
                  Enter the 6-digit code from the app to finish setup.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={verificationToken}
                    onChange={(e) =>
                      setVerificationToken(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    className="flex-1 rounded-xl bg-surface-muted px-4 py-3 text-center font-mono text-2xl tracking-widest text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerify2FA}
                    disabled={verificationToken.length !== 6}
                    className="rounded-xl bg-primary px-6 py-3 font-medium text-white disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xl font-bold text-text-primary">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <button
              type="button"
              onClick={() => scrollToSection("users-management")}
              className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border"
            >
              Users
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("groups-management")}
              className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border"
            >
              Groups
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("expenses-management")}
              className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border"
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("expenses-by-user")}
              className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border"
            >
              User Chart
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("analytics-overview")}
              className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border"
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border"
              aria-label="Back to top"
            >
              <svg
                className="mx-auto h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
