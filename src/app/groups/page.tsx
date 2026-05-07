'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useGroupStore } from '@/store/groupStore';
import { ExpenseGroup, GroupMemberSuggestion } from '@/types';
import { toast } from 'react-hot-toast';

export default function GroupsPage() {
  const { groups, isLoading, fetchGroups, createGroup, fetchMemberSuggestions } = useGroupStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberSuggestions, setMemberSuggestions] = useState<GroupMemberSuggestion[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<GroupMemberSuggestion[]>([]);

  useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (!showCreateModal) return;

    const query = memberEmail.trim();
    if (query.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const suggestions = await fetchMemberSuggestions(query);
      const selectedEmails = new Set(selectedMembers.map((member) => member.email.toLowerCase()));
      setMemberSuggestions(
        suggestions.filter((member) => !selectedEmails.has(member.email.toLowerCase())),
      );
    }, 250);

    return () => window.clearTimeout(timer);
  }, [fetchMemberSuggestions, memberEmail, selectedMembers, showCreateModal]);

  const addSuggestedMember = (member: GroupMemberSuggestion) => {
    if (selectedMembers.some((item) => item.email.toLowerCase() === member.email.toLowerCase())) {
      return;
    }
    setSelectedMembers((members) => [...members, member]);
    setMemberEmail('');
    setMemberSuggestions([]);
  };

  const removeSelectedMember = (email: string) => {
    setSelectedMembers((members) => members.filter((member) => member.email.toLowerCase() !== email.toLowerCase()));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      await createGroup({
        name: groupName,
        memberEmails: selectedMembers.map((member) => member.email),
      });
      setGroupName('');
      setMemberEmail('');
      setSelectedMembers([]);
      setShowCreateModal(false);
      toast.success('Group created!');
    } catch {
      // Error handled by store
    }
  };

  const getGroupType = (memberCount: number) => {
    if (memberCount <= 1) return { label: 'Private', color: 'bg-purple-100 text-purple-700' };
    if (memberCount === 2) return { label: 'Couple', color: 'bg-pink-100 text-pink-700' };
    if (memberCount <= 5) return { label: 'Friends', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Team', color: 'bg-green-100 text-green-700' };
  };

  const formatCreatedAt = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-text-primary text-2xl font-bold">Groups</h1>
            <p className="text-text-secondary">Manage shared expenses</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 hero-gradient text-white rounded-xl font-medium shadow-lg shadow-primary/30"
          >
            + New
          </button>
        </div>

        {/* Groups List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-text-muted">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-3xl border border-border">
              <p className="text-text-muted text-lg mb-2">No groups yet</p>
              <p className="text-text-muted text-sm">Create a group to track shared expenses</p>
            </div>
          ) : (
            groups.map((group: ExpenseGroup) => {
              const type = getGroupType(group.members.length);
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block p-4 bg-surface rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 accent-gradient rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-text-primary font-medium">{group.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${type.color}`}>
                            {type.label}
                          </span>
                          <span className="text-text-muted text-xs">
                            {group.members.length} members
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          Created {formatCreatedAt(group.createdAt)}
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="text-text-primary font-semibold text-lg">Create New Group</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setMemberEmail('');
                    setMemberSuggestions([]);
                    setSelectedMembers([]);
                  }}
                  className="rounded-xl p-2 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                  aria-label="Close dialog"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Group name"
                  autoFocus
                  required
                />
                <div className="space-y-3">
                  <label className="text-text-secondary text-sm font-medium">Invite members</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-muted rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Search by email"
                  />
                  {memberSuggestions.length > 0 && (
                    <div className="max-h-44 overflow-auto rounded-2xl border border-border bg-surface">
                      {memberSuggestions.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => addSuggestedMember(member)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-muted"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">{member.name || member.email}</p>
                            <p className="text-xs text-text-muted">{member.email}</p>
                          </div>
                          <span className="text-xs text-primary">Add</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((member) => (
                        <button
                          key={member.email}
                          type="button"
                          onClick={() => removeSelectedMember(member.email)}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {member.email} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setMemberEmail('');
                      setMemberSuggestions([]);
                      setSelectedMembers([]);
                    }}
                    className="flex-1 py-3 bg-surface-muted rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 hero-gradient text-white rounded-xl font-medium"
                  >
                    Create
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
