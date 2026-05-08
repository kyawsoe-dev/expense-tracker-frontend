"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import LoadingState from "@/components/ui/LoadingState";
import { useExpenseStore } from "@/store/expenseStore";

type MenuState = string | null;

export default function HistoryPage() {
  const {
    expenses: rawExpenses,
    totalExpenses,
    isLoading,
    fetchExpenses,
    fetchMoreExpenses,
    deleteExpense,
  } = useExpenseStore();

  const expenses = useMemo(() => rawExpenses || [], [rawExpenses]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeMenuId, setActiveMenuId] = useState<MenuState>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => {
    const unique = new Set(expenses.map((expense) => expense.category));
    return ["All", ...unique];
  }, [expenses]);

  const historyTotal = useMemo(
    () =>
      expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses],
  );

  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const expense of expenses) {
      grouped.set(
        expense.category,
        (grouped.get(expense.category) ?? 0) + Number(expense.amount || 0),
      );
    }

    const total = [...grouped.values()].reduce((sum, value) => sum + value, 0);

    return [...grouped.entries()]
      .map(([category, totalAmount]) => ({
        category,
        total: totalAmount,
        percentage: total > 0 ? (totalAmount / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const selectedCategoryLabel =
    selectedCategory === "All" ? "All categories" : selectedCategory;

  const formatAmount = (amount: number | string) =>
    `MMK ${Number(amount).toLocaleString("en-US")}`;

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const params = {
        page,
        limit: 20,
        search: search || undefined,
        category: selectedCategory === "All" ? undefined : selectedCategory,
      };

      if (page === 1) {
        await fetchExpenses(params);
        return;
      }

      setIsLoadingMore(true);
      try {
        await fetchMoreExpenses(params);
      } finally {
        setIsLoadingMore(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [page, selectedCategory, search, fetchExpenses, fetchMoreExpenses]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(  
      (entries) => {
        const [entry] = entries;
        const hasMore = totalExpenses > expenses.length;

        if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage((current) => current + 1);
        }
      },
      { rootMargin: "180px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [expenses.length, isLoading, isLoadingMore, totalExpenses]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!activeMenuId) return;
      const target = event.target as Element | null;
      if (target?.closest("[data-expense-menu]")) {
        return;
      }
      setActiveMenuId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeMenuId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      Food: "🍕",
      Transport: "🚗",
      Shopping: "🛒",
      Entertainment: "🎬",
      Bills: "📄",
      Health: "🏥",
      Education: "📚",
      Travel: "✈️",
      Other: "📦",
    };
    return emojis[category] || "📦";
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      setShowDeleteConfirm(null);
      setActiveMenuId(null);
    } catch {
      // Error handled by store
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">History</h1>
          <p className="text-text-secondary">Filter and review every record</p>
        </div>

        <div className="hero-gradient rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                {selectedCategoryLabel}
              </div>
              <p className="mt-4 text-3xl font-bold">
                {formatAmount(historyTotal)}
              </p>
              <p className="mt-2 text-sm text-white/75">
                {expenses.length} transactions selected
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/15 p-4">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v1m0 8v-1m0 1a9 9 0 100-18 9 9 0 000 18z"
                />
              </svg>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-3 rounded-3xl border border-border bg-surface p-4"
        >
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-border bg-surface-muted py-3 pl-12 pr-4 text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search title, note, category, or group"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setPage(1);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    selected
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-surface-muted text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </form>

        <div className="rounded-3xl border border-border bg-surface p-5 overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-text-primary text-lg font-semibold">
                Analytics
              </h3>
              <p className="mt-1 text-xs text-text-muted">
                {selectedCategory === "All"
                  ? "Top categories"
                  : "Filtered view"}
              </p>
            </div>
            <div className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">
              {totalExpenses} items
            </div>
          </div>

          <div className="mt-5">
            {chartData.length ? (
              <div className="space-y-4">
                <CategoryPieChart data={chartData} />
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-muted p-4 text-sm text-text-muted">
                No analytics available for this category yet.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-text-primary text-lg font-semibold">
            Recent records
          </h3>
          <div className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-primary">
            {totalExpenses} items
          </div>
        </div>

        {isLoading && page === 1 ? (
          <div className="rounded-3xl border border-border bg-surface p-6">
            <div className="flex justify-center">
              <LoadingState label="Loading records" />
            </div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-text-muted">
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
                  d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-text-primary">
              No expenses found
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {search.trim()
                ? "Try another keyword or clear search to load more records."
                : selectedCategory === "All"
                  ? "Add a new expense to start building your history."
                  : "Try another category or add a new expense to see it here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="rounded-3xl border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-xl">
                    {getCategoryEmoji(expense.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-text-primary">
                          {expense.title}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {expense.category}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatDate(expense.date)}
                        </p>
                        {expense.groupName && (
                          <div className="mt-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {expense.groupName}
                          </div>
                        )}
                        {expense.note && expense.note.trim().length > 0 && (
                          <p className="mt-2 truncate text-xs text-text-secondary">
                            {expense.note}
                          </p>
                        )}
                      </div>

                      <div className="relative" data-expense-menu>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId((current) =>
                              current === expense.id ? null : expense.id,
                            );
                          }}
                          className="rounded-xl p-2 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                          aria-label="Expense actions"
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
                              d="M12 5v.01M12 12v.01M12 19v.01"
                            />
                          </svg>
                        </button>

                        {activeMenuId === expense.id && (
                          <div
                            onPointerDown={(e) => e.stopPropagation()}
                            className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
                          >
                            <Link
                              href={`/expense/${expense.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="block px-4 py-3 text-sm text-text-primary hover:bg-surface-muted"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(expense.id);
                                setActiveMenuId(null);
                              }}
                              className="block w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-surface-muted"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-text-muted">
                        {expense.groupName
                          ? "Shared expense"
                          : "Personal expense"}
                      </div>
                      <p className="text-base font-bold text-success">
                        {formatAmount(expense.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div
              ref={loadMoreRef}
              className="py-2 text-center text-sm text-text-muted"
            >
              {isLoadingMore
                ? (
                  <LoadingState
                    label="Loading more records"
                    className="justify-center"
                  />
                )
                : totalExpenses > expenses.length
                  ? "Scroll for more records"
                  : "You reached the end"}
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl">
              <div className="mb-2 flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-text-primary">
                  Delete Expense?
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="rounded-xl p-2 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                  aria-label="Close dialog"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <p className="mb-5 text-sm text-text-secondary">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-xl bg-surface-muted py-3 font-semibold text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 rounded-xl bg-red-500 py-3 font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
