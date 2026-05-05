import { create } from 'zustand';
import { ExpenseGroup, CreateGroupInput, GroupMemberSuggestion } from '@/types';
import { groupsAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

interface GroupState {
  groups: ExpenseGroup[];
  currentGroup: ExpenseGroup | null;
  isLoading: boolean;
  error: string | null;

  fetchGroups: () => Promise<void>;
  fetchGroup: (id: string) => Promise<void>;
  createGroup: (data: CreateGroupInput) => Promise<ExpenseGroup>;
  renameGroup: (id: string, name: string) => Promise<void>;
  addMember: (id: string, email: string) => Promise<void>;
  removeMember: (id: string, memberId: string) => Promise<void>;
  fetchMemberSuggestions: (query: string) => Promise<GroupMemberSuggestion[]>;
  setCurrentGroup: (group: ExpenseGroup | null) => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await groupsAPI.list();
      set({ groups: data, isLoading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchGroup: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await groupsAPI.get(id);
      set({ currentGroup: data, isLoading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  createGroup: async (data) => {
    try {
      const { data: group } = await groupsAPI.create(data);
      set((state) => ({ groups: [...state.groups, group] }));
      return group;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },

  renameGroup: async (id, name) => {
    try {
      const { data } = await groupsAPI.rename(id, name);
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? data : g)),
        currentGroup: state.currentGroup?.id === id ? data : state.currentGroup,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },

  addMember: async (id, email) => {
    try {
      await groupsAPI.addMember(id, email);
      await get().fetchGroup(id);
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },

  removeMember: async (id, memberId) => {
    try {
      await groupsAPI.removeMember(id, memberId);
      await get().fetchGroup(id);
    } catch (error: unknown) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },

  fetchMemberSuggestions: async (query) => {
    try {
      const currentGroupId = get().currentGroup?.id;
      const { data } = await groupsAPI.memberSuggestions(query, currentGroupId);
      return data;
    } catch {
      return [];
    }
  },

  setCurrentGroup: (group) => set({ currentGroup: group }),
}));
