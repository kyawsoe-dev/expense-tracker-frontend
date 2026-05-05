'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'react-hot-toast';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3l18 18"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.477 10.48A3 3 0 0012 15m3-2.999a3 3 0 00-3-3"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6.223 6.223C4.326 7.53 3.015 9.56 2.458 12c1.274 4.057 5.064 7 9.542 7 1.276 0 2.49-.214 3.614-.603"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.88 4.104A10.47 10.47 0 0112 4c4.478 0 8.268 2.943 9.542 7a11.05 11.05 0 01-4.253 5.54"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { data } = await authAPI.login(email, password);
        setAuth(data);
        toast.success('Logged in successfully!');
        router.push('/');
      } else {
        await authAPI.register(email, password, name);
        toast.success('Registered! Please log in.');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 hero-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <span className="text-white font-bold text-2xl">ET</span>
          </div>
          <h1 className="text-text-primary text-2xl font-bold">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-text-secondary mt-2">
            {isLogin
              ? 'Sign in to track your expenses'
              : 'Get started with Expense Tracker'}
          </p>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-lg border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-text-secondary text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-text-secondary text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="text-text-secondary text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((state) => !state)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-text-muted hover:text-text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="text-text-secondary text-sm font-medium">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((state) => !state)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-text-muted hover:text-text-primary"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 hero-gradient text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg shadow-primary/30"
            >
              {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-text-secondary text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin((state) => !state);
                setPassword('');
                setConfirmPassword('');
              }}
              className="ml-1 text-primary font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
