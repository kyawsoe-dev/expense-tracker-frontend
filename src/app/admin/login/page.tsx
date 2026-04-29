"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyAdminToken } from "@/lib/admin-2fa";
import { toast } from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // In production, these should be stored securely in database
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL!;
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD!;
  const ADMIN_2FA_SECRET = process.env.ADMIN_2FA_SECRET!;

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setStep("2fa");
      toast.success("Please enter your 2FA code");
    } else {
      toast.error("Invalid credentials");
    }
  };

  const handle2FAVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const isValid = verifyAdminToken(totpToken, ADMIN_2FA_SECRET);

      if (isValid) {
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminEmail", email);
        toast.success("Welcome, Admin!");
        router.push("/admin/dashboard");
      } else {
        toast.error("Invalid 2FA code");
      }
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
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
          <h1 className="text-text-primary text-2xl font-bold">Admin Access</h1>
          <p className="text-text-secondary mt-2">
            {step === "credentials"
              ? "Enter admin credentials"
              : "Enter 2FA code from your authenticator app"}
          </p>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-lg border border-border">
          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-text-secondary text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30"
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm font-medium">
                  2FA Code
                </label>
                <input
                  type="text"
                  value={totpToken}
                  onChange={(e) =>
                    setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                />
                <p className="text-text-muted text-xs mt-2 text-center">
                  Open your authenticator app and enter the 6-digit code
                </p>
              </div>
              <button
                type="submit"
                disabled={isLoading || totpToken.length !== 6}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg shadow-red-500/30"
              >
                {isLoading ? "Verifying..." : "Verify & Login"}
              </button>
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full py-3 bg-surface-muted rounded-xl font-medium text-text-secondary"
              >
                Back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          This page is for administrators only
        </p>
      </div>
    </div>
  );
}
