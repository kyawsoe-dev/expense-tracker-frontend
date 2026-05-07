import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthResponse } from '@/types';
import { encryptedStorage, removeCookie, setEncryptedCookie } from '@/lib/secure-storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  rehydrateFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      setAuth: (data: AuthResponse) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      updateUser: (userData: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      rehydrateFromStorage: () => {
        if (typeof window === 'undefined') return;

        try {
          const raw = encryptedStorage.getItem('auth-storage');
          if (!raw) {
            set({ hasHydrated: true });
            return;
          }

          const parsed = JSON.parse(raw) as {
            state?: {
              user?: User | null;
              accessToken?: string | null;
              refreshToken?: string | null;
              isAuthenticated?: boolean;
            };
          };

          const state = parsed.state;
          if (!state?.accessToken || !state.refreshToken || !state.user) {
            set({ hasHydrated: true });
            return;
          }

          set({
            user: state.user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            isAuthenticated: Boolean(state.isAuthenticated),
            hasHydrated: true,
          });
        } catch {
          // Ignore storage parse errors and fall back to logout state.
          set({ hasHydrated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  useAuthStore.getState().rehydrateFromStorage();
}

useAuthStore.subscribe((state) => {
  if (typeof window === 'undefined') return;

  if (state.isAuthenticated && state.accessToken && state.refreshToken && state.user) {
    setEncryptedCookie('session-auth', JSON.stringify({ userId: state.user.id, issuedAt: Date.now() }));
    return;
  }

  removeCookie('session-auth');
});
