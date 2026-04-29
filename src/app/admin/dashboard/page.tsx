'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { generateAdminSecret, verifyAdminToken } from '@/lib/admin-2fa';
import { toast } from 'react-hot-toast';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [setup2FA, setSetup2FA] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    totalGroups: 0,
  });

  useEffect(() => {
    const auth = localStorage.getItem('adminAuthenticated');
    if (auth !== 'true') {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      loadStats();
    }
  }, [router]);

  const loadStats = async () => {
    // In production, these would come from your backend API
    setStats({
      totalUsers: 150,
      totalExpenses: 5432,
      totalGroups: 89,
    });
  };

  const handleSetup2FA = () => {
    const adminEmail = localStorage.getItem('adminEmail') || 'admin@example.com';
    const data = generateAdminSecret(adminEmail);
    setSecret(data.secret);
    setOtpauthUrl(data.otpauthUrl);
    setSetup2FA(true);
  };

  const handleVerify2FA = () => {
    const adminSecret = process.env.ADMIN_2FA_SECRET || secret;
    const isValid = verifyAdminToken(verificationToken, adminSecret);

    if (isValid) {
      toast.success('2FA setup complete!');
      setSetup2FA(false);
    } else {
      toast.error('Invalid verification code');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminEmail');
    toast.success('Logged out from admin');
    router.push('/admin/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-white/80 text-sm">System Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
            >
              Back to App
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl p-6 border border-border">
            <p className="text-text-muted text-sm">Total Users</p>
            <p className="text-text-primary text-3xl font-bold mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-surface rounded-2xl p-6 border border-border">
            <p className="text-text-muted text-sm">Total Expenses</p>
            <p className="text-text-primary text-3xl font-bold mt-2">{stats.totalExpenses}</p>
          </div>
          <div className="bg-surface rounded-2xl p-6 border border-border">
            <p className="text-text-muted text-sm">Total Groups</p>
            <p className="text-text-primary text-3xl font-bold mt-2">{stats.totalGroups}</p>
          </div>
        </div>

        {/* 2FA Management */}
        <div className="bg-surface rounded-3xl p-6 border border-border">
          <h2 className="text-text-primary text-xl font-bold mb-4">Security Settings</h2>

          {!setup2FA ? (
            <div>
              <p className="text-text-secondary mb-4">
                Set up Two-Factor Authentication to secure admin access
              </p>
              <button
                onClick={handleSetup2FA}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
              >
                Setup 2FA
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-text-primary font-semibold mb-2">1. Scan QR Code</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Use Google Authenticator, Authy, or similar app to scan this QR code
                </p>
                {otpauthUrl && (
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <QRCodeSVG value={otpauthUrl} size={192} />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-text-primary font-semibold mb-2">2. Manual Entry</h3>
                <p className="text-text-secondary text-sm mb-2">
                  Or enter this secret key manually in your app:
                </p>
                <div className="bg-surface-muted rounded-xl p-4 font-mono text-sm break-all">
                  {secret}
                </div>
              </div>

              <div>
                <h3 className="text-text-primary font-semibold mb-2">3. Verify</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Enter the 6-digit code from your authenticator app
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 px-4 py-3 bg-surface-muted rounded-xl text-text-primary text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerify2FA}
                    disabled={verificationToken.length !== 6}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-surface rounded-3xl p-6 border border-border">
          <h2 className="text-text-primary text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="p-4 bg-surface-muted rounded-xl text-text-primary font-medium hover:bg-border transition-colors">
              View Users
            </button>
            <button className="p-4 bg-surface-muted rounded-xl text-text-primary font-medium hover:bg-border transition-colors">
              View Expenses
            </button>
            <button className="p-4 bg-surface-muted rounded-xl text-text-primary font-medium hover:bg-border transition-colors">
              System Logs
            </button>
            <button className="p-4 bg-surface-muted rounded-xl text-text-primary font-medium hover:bg-border transition-colors">
              API Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

