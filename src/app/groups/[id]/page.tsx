'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useGroupStore } from '@/store/groupStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;
  const { currentGroup, isLoading, fetchGroup, addMember, removeMember, renameGroup, fetchMemberSuggestions } = useGroupStore();
  const userId = useAuthStore((state) => state.user?.id);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberSuggestions, setMemberSuggestions] = useState<Array<{ id: string; name?: string; email: string }>>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    void fetchGroup(groupId);
  }, [fetchGroup, groupId]);

  useEffect(() => {
    if (!showAddMember) return;

    const query = memberEmail.trim();
    if (query.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const suggestions = await fetchMemberSuggestions(query);
      setMemberSuggestions(suggestions);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [fetchMemberSuggestions, memberEmail, showAddMember]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = memberEmail.trim();
    if (!email) return;

    try {
      await addMember(groupId, email);
      setMemberEmail('');
      setShowAddMember(false);
      setMemberSuggestions([]);
      toast.success('Member added!');
    } catch {
      // Error handled by store
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await renameGroup(groupId, newName);
      setIsEditingName(false);
      toast.success('Group renamed!');
    } catch {
      // Error handled by store
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Remove this member from the group?')) {
      return;
    }

    try {
      await removeMember(groupId, memberId);
      toast.success('Member removed!');
    } catch {
      // Error handled by store
    }
  };

  if (isLoading || !currentGroup) {
    return (
      <AppShell>
        <div className="text-center py-8 text-text-muted">Loading...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-surface-muted rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            {isEditingName ? (
              <form onSubmit={handleRename} className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-1 bg-surface-muted rounded-lg text-text-primary"
                  autoFocus
                />
                <button type="submit" className="text-primary text-sm font-medium">Save</button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="text-text-muted text-sm"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-text-primary text-2xl font-bold">{currentGroup.name}</h1>
                <button
                  onClick={() => { setNewName(currentGroup.name); setIsEditingName(true); }}
                  className="text-text-muted hover:text-primary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-text-secondary text-sm">{currentGroup.members.length} members</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface rounded-3xl p-5 border border-border">
            <p className="text-text-muted text-sm">Total expense amount</p>
            <p className="text-text-primary text-3xl font-bold mt-2">
              MMK{(currentGroup.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-surface rounded-3xl p-5 border border-border">
            <p className="text-text-muted text-sm">Group members</p>
            <p className="text-text-primary text-3xl font-bold mt-2">{currentGroup.members.length}</p>
          </div>
        </div>

        {/* Members */}
        <div className="bg-surface rounded-3xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-primary font-semibold">Members</h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="text-primary text-sm font-medium"
            >
              + Add Member
            </button>
          </div>
          <div className="space-y-3">
            {currentGroup.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-surface-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium text-sm">
                      {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium">{member.name || 'Unknown'}</p>
                    <p className="text-text-muted text-xs">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === 'owner' && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Owner</span>
                  )}
                  {currentGroup.owner?.id === userId && member.id !== userId && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveMember(member.id)}
                      className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balances */}
        {currentGroup.balances && currentGroup.balances.length > 0 && (
          <div className="bg-surface rounded-3xl p-6 border border-border">
            <h3 className="text-text-primary font-semibold mb-4">Balances</h3>
            <div className="space-y-3">
              {currentGroup.balances.map((balance) => (
                <div key={balance.userId} className="rounded-2xl border border-border bg-surface-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-text-primary text-sm font-semibold">{balance.name}</p>
                      <p className="text-text-muted text-xs">{balance.email}</p>
                    </div>
                    <p className={`font-semibold ${balance.balance >= 0 ? 'text-success' : 'text-red-500'}`}>
                      MMK{Math.abs(balance.balance).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-surface p-3 border border-border">
                      <p className="text-text-muted">Paid</p>
                      <p className="text-text-primary mt-1 font-semibold">MMK{Number(balance.paid || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-surface p-3 border border-border">
                      <p className="text-text-muted">Share</p>
                      <p className="text-text-primary mt-1 font-semibold">MMK{Number(balance.owes || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-surface p-3 border border-border">
                      <p className="text-text-muted">Net</p>
                      <p className={`mt-1 font-semibold ${balance.balance >= 0 ? 'text-success' : 'text-red-500'}`}>
                        {balance.balance >= 0 ? 'OWED' : 'OWES'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm">
              <h3 className="text-text-primary font-semibold text-lg mb-4">Add Member</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter email address"
                  autoFocus
                  required
                />
                {memberSuggestions.length > 0 && (
                  <div className="max-h-44 overflow-auto rounded-2xl border border-border bg-surface">
                    {memberSuggestions.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setMemberEmail(member.email)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-muted"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {member.name || member.email}
                          </p>
                          <p className="text-xs text-text-muted">{member.email}</p>
                        </div>
                        <span className="text-xs text-primary">Use</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMember(false);
                      setMemberEmail('');
                      setMemberSuggestions([]);
                    }}
                    className="flex-1 py-3 bg-surface-muted rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 hero-gradient text-white rounded-xl font-medium"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
