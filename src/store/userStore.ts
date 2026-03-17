import { create } from 'zustand';
import { User } from '../types';

interface UserState {
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  blockedUserIds: string[];
  unreadNotificationCount: number;
  unreadChatCount: number;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthError: (message: string | null) => void;
  setBlockedUserIds: (ids: string[]) => void;
  setUnreadNotificationCount: (count: number) => void;
  setUnreadChatCount: (count: number) => void;
  clearAuthState: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  authError: null,
  blockedUserIds: [],
  unreadNotificationCount: 0,
  unreadChatCount: 0,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthError: (authError) => set({ authError }),
  setBlockedUserIds: (blockedUserIds) => set({ blockedUserIds }),
  setUnreadNotificationCount: (unreadNotificationCount) => set({ unreadNotificationCount }),
  setUnreadChatCount: (unreadChatCount) => set({ unreadChatCount }),
  clearAuthState: () => set({ user: null, authError: null, blockedUserIds: [], unreadNotificationCount: 0, unreadChatCount: 0 }),
}));
