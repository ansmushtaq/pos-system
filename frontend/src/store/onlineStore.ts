import { create } from 'zustand';

interface OnlineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingCount: (count: number) => void;
}

export const useOnlineStore = create<OnlineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setPendingCount: (count) => set({ pendingCount: count }),
}));

// Initialize event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useOnlineStore.getState().setOnline(true));
  window.addEventListener('offline', () => useOnlineStore.getState().setOnline(false));
}
