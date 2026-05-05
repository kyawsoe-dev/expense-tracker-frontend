"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

const navItems = [
  {
    path: "/",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    path: "/groups",
    label: "Groups",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    path: "/expenses/add",
    label: "Add",
    icon: "M12 4v16m8-8H4",
    isCenter: true,
  },
  {
    path: "/history",
    label: "History",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    path: "/profile",
    label: "Profile",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const userInitial = (user?.name || user?.email || "U").charAt(0).toUpperCase();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ET</span>
            </div>
            <div>
              <h1 className="text-text-primary font-semibold text-sm">
                Expense Tracker
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-surface-muted transition-colors"
            >
              {theme === "dark" ? (
                <svg
                  className="w-5 h-5 text-text-secondary"
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
                  className="w-5 h-5 text-text-secondary"
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
            </button>
            {user && (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-text-secondary"
                aria-label="Sign out"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1920px] px-4 py-6 pb-36 sm:px-6 lg:px-10">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 lg:w-[calc(100%-3rem)] lg:max-w-4xl xl:max-w-5xl">
        <div className="rounded-[28px] border border-border bg-surface px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="grid grid-cols-5 items-end gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const isCenter = item.isCenter;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex flex-col items-center justify-center rounded-2xl transition-all ${
                    isCenter
                      ? "relative -mt-6 h-14 w-14 justify-self-center rounded-full bg-primary text-white shadow-lg shadow-primary/30"
                      : isActive
                        ? "text-primary"
                        : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {item.path === "/profile" ? (
                    <div
                      className={`flex flex-col items-center gap-1 ${
                        isActive ? "text-primary" : "text-text-muted"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                          isActive
                            ? "border-transparent bg-primary text-white shadow-lg shadow-primary/25"
                            : "border-border bg-surface-muted text-text-primary"
                        }`}
                      >
                        {userInitial}
                      </div>
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col items-center gap-1 ${
                        isCenter ? "pt-0" : ""
                      }`}
                    >
                      <svg
                        className={`h-6 w-6 ${isCenter ? "h-7 w-7" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={isCenter ? 2.5 : 2}
                          d={item.icon}
                        />
                      </svg>
                      {!isCenter && (
                        <span className="text-xs font-medium">{item.label}</span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl border border-border">
            <h3 className="mb-2 text-lg font-semibold text-text-primary">
              Sign Out?
            </h3>
            <p className="mb-5 text-sm text-text-secondary">
              You&apos;ll need to sign in again to access your data.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl bg-surface-muted py-3 font-semibold text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="flex-1 rounded-xl bg-red-500 py-3 font-semibold text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
