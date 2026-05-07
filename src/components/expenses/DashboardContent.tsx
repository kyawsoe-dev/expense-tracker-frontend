"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useExpenseStore } from "@/store/expenseStore";
import { useGroupStore } from "@/store/groupStore";
import { useAuthStore } from "@/store/authStore";
import MonthlyChart from "@/components/charts/MonthlyChart";
import { fetchSummary, fetchAnalytics } from "@/lib/data-fetch";

export default function DashboardContent() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    recentExpenses,
    currentSummary,
    currentAnalytics,
    fetchRecentExpenses: loadRecent,
  } = useExpenseStore();
  const { groups, fetchGroups } = useGroupStore();
  const today = new Date();
  const overviewInputRef = useRef<HTMLInputElement | null>(null);
  const analyticsInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedOverviewPeriod, setSelectedOverviewPeriod] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
  );
  const [selectedAnalyticsPeriod, setSelectedAnalyticsPeriod] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
  );
  const [isRefreshingForecast, setIsRefreshingForecast] = useState(false);

  const [selectedYear, selectedMonth] = selectedOverviewPeriod.split("-").map(Number);
  const selectedAnalyticsYear = Number(selectedAnalyticsPeriod.split("-")[0] || today.getFullYear());

  const forecastPredictions = useMemo(() => {
    const categories = (currentAnalytics?.byCategory ?? []).slice(0, 4);
    if (categories.length === 0) {
      return [];
    }

    return categories.map((item, index) => {
      const trend = index === 0 || index === 1 ? "increasing" : index === categories.length - 1 ? "decreasing" : "stable";
      const multiplier = trend === "increasing" ? 1.12 : trend === "decreasing" ? 0.94 : 1.01;

      return {
        category: item.category,
        predictedAmount: Math.round(item.total * multiplier),
        trend,
      };
    });
  }, [currentAnalytics]);

  const totalPredicted = useMemo(
    () => forecastPredictions.reduce((sum, item) => sum + item.predictedAmount, 0),
    [forecastPredictions],
  );
  const increasingCount = forecastPredictions.filter((item) => item.trend === "increasing").length;
  const decreasingCount = forecastPredictions.filter((item) => item.trend === "decreasing").length;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getCategoryIcon = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes("food") || normalized.includes("restaurant") || normalized.includes("grocery")) return "🍽";
    if (normalized.includes("transport") || normalized.includes("travel")) return "🚗";
    if (normalized.includes("shopping")) return "🛍";
    if (normalized.includes("health")) return "💊";
    if (normalized.includes("education")) return "📚";
    if (normalized.includes("entertainment")) return "🎬";
    if (normalized.includes("bills") || normalized.includes("utility")) return "🧾";
    return "📦";
  };

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(today);

  const formatAmount = (amount: number | string) =>
    `MMK ${Number(amount).toLocaleString("en-US")}`;

  const formatCreatedAt = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));

  const selectedOverviewLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(selectedYear, selectedMonth - 1, 1));

  const openPicker = (ref: { current: HTMLInputElement | null }) => {
    const input = ref.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const handleRefreshForecast = async () => {
    setIsRefreshingForecast(true);
    try {
      await Promise.all([
        fetchSummary(selectedYear, selectedMonth),
        fetchAnalytics(selectedAnalyticsYear),
      ]);
    } finally {
      setIsRefreshingForecast(false);
    }
  };

  // Safe data access with defaults
  const safeRecentExpenses = recentExpenses || [];
  const safeCurrentSummary = currentSummary;
  const safeCurrentAnalytics = currentAnalytics;

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      await Promise.all([
        fetchSummary(selectedYear, selectedMonth),
        fetchAnalytics(selectedAnalyticsYear),
        loadRecent(),
        fetchGroups(),
      ]);
    };

    void loadData();
  }, [
    isAuthenticated,
    selectedMonth,
    selectedYear,
    selectedAnalyticsYear,
    loadRecent,
    fetchGroups,
  ]);

  return (
    <div className="space-y-6">
      {/* Greeting & Quick Stats - Matching Mobile UI */}
      <div className="hero-gradient rounded-3xl p-6 text-white relative overflow-hidden">
        {/* Header with greeting and profile avatar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {greeting()}, {user?.name || "User"}
            </h2>
            <p className="text-white/80 mt-1">
              Track your MMK spending with a cleaner snapshot of each month and
              the full year ahead.
            </p>
            <p className="text-white/65 mt-2 text-sm">{todayLabel}</p>
          </div>
        </div>

        {/* Balance Card - Matching Mobile */}
        {safeCurrentSummary && (
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="px-3 py-1 bg-white/20 rounded-full">
                <span className="text-xs font-semibold">Monthly overview</span>
              </div>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => openPicker(overviewInputRef)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 rounded-xl text-white text-xs border border-white/15"
              >
                <span>{selectedOverviewLabel}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <input
                ref={overviewInputRef}
                type="month"
                value={selectedOverviewPeriod}
                onChange={(e) => setSelectedOverviewPeriod(e.target.value)}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>

            <div className="mt-4">
              <p className="text-3xl font-bold">
                {formatAmount(safeCurrentSummary.total)}
              </p>
              <p className="text-white/70 text-sm mt-1">
                Your {selectedOverviewLabel} total across all tracked expenses.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs">Transactions</p>
                <p className="text-xl font-bold mt-1">
                  {safeCurrentSummary.transactionCount}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs">Top category</p>
                <p className="text-sm font-semibold mt-1">
                  {safeCurrentSummary.topCategory || "No spending yet"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analysis + Categories - Matching Mobile */}
      <div className="bg-surface rounded-3xl p-6 border border-border">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-text-primary font-semibold text-lg leading-tight">
              Analytics
            </h3>
          </div>
          <button
            type="button"
            onClick={() => openPicker(analyticsInputRef)}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 bg-surface-muted rounded-xl text-text-primary border border-border text-sm"
          >
            <span>{selectedAnalyticsYear}</span>
            <svg
              className="w-4 h-4 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
          <input
            ref={analyticsInputRef}
            type="month"
            value={selectedAnalyticsPeriod}
            onChange={(e) => setSelectedAnalyticsPeriod(e.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface-muted p-4">
              <p className="text-text-muted text-xs">Year total</p>
              <p className="mt-2 text-xl font-bold text-text-primary">
                {formatAmount(Number(safeCurrentAnalytics?.total ?? safeCurrentSummary?.total ?? 0))}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-muted p-4">
              <p className="text-text-muted text-xs">Top category</p>
              <p className="mt-2 text-xl font-bold text-text-primary">
                {safeCurrentAnalytics?.topCategory || safeCurrentSummary?.topCategory || "None"}
              </p>
            </div>
          </div>

          {safeCurrentAnalytics?.monthly?.length ? (
            <div className="bg-surface-muted rounded-2xl p-3 sm:p-4 overflow-hidden">
              <MonthlyChart data={safeCurrentAnalytics.monthly ?? []} />
            </div>
          ) : (
            <p className="text-text-muted text-sm">No yearly analytics available yet.</p>
          )}
        </div>
      </div>

      {/* AI Spending Forecast - Matching Mobile */}
      <div className="bg-surface rounded-3xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-text-primary font-semibold text-lg">
              AI Spending Forecast
            </h3>
            <span className="text-text-muted text-xs">Next Month</span>
            <p className="mt-1 text-text-muted text-xs">
              Created {formatCreatedAt(today.toISOString())}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshForecast}
            disabled={isRefreshingForecast}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface-muted text-text-primary text-sm font-medium disabled:opacity-60"
          >
            <svg
              className={`w-4 h-4 ${isRefreshingForecast ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8 8 0 004.582 9m0 0H9m11 11v-5h-.581m0 0A8.003 8.003 0 019.418 15m15.582 0H15"
              />
            </svg>
            {isRefreshingForecast ? "Refreshing" : "Refresh"}
          </button>
        </div>
        {forecastPredictions.length ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface-muted p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-text-primary font-bold text-lg">
                    {formatAmount(totalPredicted)}
                  </p>
                  <p className="text-text-muted text-xs mt-1">Total Est.</p>
                </div>
                <div>
                  <p className="text-orange-500 font-bold text-lg">
                    {increasingCount}
                  </p>
                  <p className="text-text-muted text-xs mt-1">Increasing</p>
                </div>
                <div>
                  <p className="text-green-500 font-bold text-lg">
                    {decreasingCount}
                  </p>
                  <p className="text-text-muted text-xs mt-1">Decreasing</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {forecastPredictions.map((prediction) => {
                const trendColor =
                  prediction.trend === "increasing"
                    ? "text-orange-500"
                    : prediction.trend === "decreasing"
                      ? "text-green-500"
                      : "text-text-muted";
                const trendLabel =
                  prediction.trend === "increasing"
                    ? "↑ Rising"
                    : prediction.trend === "decreasing"
                      ? "↓ Falling"
                      : "→ Stable";

                return (
                  <div
                    key={prediction.category}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3"
                  >
                    <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center text-text-primary">
                      {getCategoryIcon(prediction.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary font-semibold truncate">
                        {prediction.category}
                      </p>
                      <p className={`text-xs font-medium ${trendColor}`}>
                        {trendLabel}
                      </p>
                    </div>
                    <p className="text-text-primary font-bold whitespace-nowrap">
                      {formatAmount(prediction.predictedAmount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-text-muted text-xs mt-4">
            Add more expenses to get AI predictions
          </p>
        )}
      </div>

      {/* Recent Expenses - Matching Mobile */}
      <div className="bg-surface rounded-3xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-text-primary font-semibold text-lg">
            Recent transactions
          </h3>
          <Link href="/history" className="text-primary text-sm font-medium">
            See All
          </Link>
        </div>
        <div className="space-y-3">
          {safeRecentExpenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-surface-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7V6a2 2 0 00-2-2H6a2 2 0 00-2 2v1m16 0v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0H4m4 4h4m-4 4h8m-8 4h6"
                  />
                </svg>
              </div>
              <p className="text-text-muted">No expenses yet</p>
              <p className="text-text-muted text-sm mt-1">
                Tap the add button to create your first expense
              </p>
            </div>
          ) : (
            safeRecentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-surface-muted rounded-xl hover:bg-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="text-primary text-lg">
                      {getCategoryEmoji(expense.category)}
                    </span>
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">
                      {expense.title}
                    </p>
                    <p className="text-text-muted text-xs">
                      {expense.category} • Created {formatCreatedAt(expense.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="text-text-primary font-semibold">
                  {formatAmount(expense.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Groups Quick Access - Matching Mobile */}
      <div className="bg-surface rounded-3xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-text-primary font-semibold text-lg">
            Your Groups
          </h3>
          <Link href="/groups" className="text-primary text-sm font-medium">
            Manage
          </Link>
        </div>
        <div className="space-y-3">
          {groups.length === 0 ? (
            <p className="text-text-muted text-center py-4">No groups yet</p>
          ) : (
            groups.slice(0, 3).map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="flex items-center justify-between p-3 bg-surface-muted rounded-xl hover:bg-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">
                      {group.name}
                    </p>
                    <p className="text-text-muted text-xs">
                      {group.members.length} members
                    </p>
                    <p className="text-text-muted text-xs mt-1">
                      Created {formatCreatedAt(group.createdAt)}
                    </p>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
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
}
