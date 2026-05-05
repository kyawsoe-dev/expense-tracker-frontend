"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { generateAdminSecret, verifyAdminToken } from "@/lib/admin-2fa";
import { adminAPI } from "@/lib/admin-api";
import { encryptedStorage, removeCookie, setEncryptedCookie } from "@/lib/secure-storage";
import type { AdminOverviewResponse } from "@/types";
import { toast } from "react-hot-toast";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [setup2FA, setSetup2FA] = useState(false);
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const handleSetup2FA = () => {
    const adminEmail = localStorage.getItem("adminEmail") || "admin@example.com";
    const data = generateAdminSecret(adminEmail);
    setSecret(data.secret);
    setOtpauthUrl(data.otpauthUrl);
    setSetup2FA(true);
  };

  const loadOverview = async () => {
    try {
      setError("");
      const { data } = await adminAPI.overview();
      setOverview(data);
    } catch {
      setError("Unable to load admin overview right now.");
    }
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      setIsLoading(true);
      await loadOverview();
      if (active) {
        setIsLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

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
      await loadOverview();
      toast.success("Admin data refreshed");
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
    () => overview?.totals ?? { users: 0, expenses: 0, groups: 0, members: 0 },
    [overview],
  );

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-red-500 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div>
              <h1 className="text-xl font-bold">Dashboard</h1>
              <p className="text-sm text-white/80">Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
            >
              Back
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-text-muted">Total Users</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">{stats.users}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-text-muted">Total Expenses</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">{stats.expenses}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-text-muted">Total Groups</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">{stats.groups}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-text-muted">Group Members</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">{stats.members}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Recent Users</h2>
                <p className="text-sm text-text-muted">Latest registered accounts and activity.</p>
              </div>
              <button
                onClick={handleRefresh}
                className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-primary"
              >
                Reload
              </button>
            </div>

            {isLoading ? (
              <p className="py-10 text-center text-text-muted">Loading users...</p>
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

          <div className="rounded-3xl border border-border bg-surface p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-text-primary">Recent Groups</h2>
              <p className="text-sm text-text-muted">Newest shared expense groups.</p>
            </div>

            {isLoading ? (
              <p className="py-10 text-center text-text-muted">Loading groups...</p>
            ) : (
              <div className="space-y-3">
                {overview?.recentGroups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-border bg-surface-muted px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-text-primary">{group.name}</p>
                        <p className="text-xs text-text-muted">
                          {group.owner?.name || group.owner?.email || "Unknown owner"}
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

        <div className="rounded-3xl border border-border bg-surface p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-text-primary">Recent Expenses</h2>
            <p className="text-sm text-text-muted">Latest expense activity across the app.</p>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-text-muted">Loading expenses...</p>
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
                    <p className="font-semibold text-text-primary">{expense.title}</p>
                    <p className="text-xs text-text-muted">{expense.category}</p>
                    <p className="mt-1 text-xs text-text-muted">{formatDate(expense.createdAt)}</p>
                  </div>
                  <div className="font-semibold text-text-primary">
                    MMK{expense.amount.toLocaleString()}
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

        <div className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xl font-bold text-text-primary">Security Settings</h2>

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
                <h3 className="mb-2 font-semibold text-text-primary">1. Scan QR Code</h3>
                <p className="mb-4 text-sm text-text-secondary">
                  Use Google Authenticator, Authy, or another authenticator app to scan this QR code.
                </p>
                {otpauthUrl && (
                  <div className="mx-auto inline-flex rounded-2xl bg-white p-4 shadow-sm">
                    <QRCodeSVG value={otpauthUrl} size={192} />
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-text-primary">2. Manual Entry</h3>
                <p className="mb-2 text-sm text-text-secondary">
                  Or enter this secret manually:
                </p>
                <div className="break-all rounded-xl bg-surface-muted p-4 font-mono text-sm">
                  {secret}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-text-primary">3. Verify</h3>
                <p className="mb-4 text-sm text-text-secondary">
                  Enter the 6-digit code from the app to finish setup.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={verificationToken}
                    onChange={(e) =>
                      setVerificationToken(e.target.value.replace(/\D/g, "").slice(0, 6))
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
          <h2 className="mb-4 text-xl font-bold text-text-primary">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border">
              View Users
            </button>
            <button className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border">
              View Expenses
            </button>
            <button className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border">
              System Logs
            </button>
            <button className="rounded-xl bg-surface-muted p-4 font-medium text-text-primary transition-colors hover:bg-border">
              API Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
