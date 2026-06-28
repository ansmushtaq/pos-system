import { useEffect } from 'react';
import { useOnlineStore } from '../store/onlineStore';
import { initSyncOnReconnect } from '../services/syncService';

export const useInitSync = () => {
  useEffect(() => {
    initSyncOnReconnect();
  }, []);
};

export const useSyncStatus = () => {
  return useOnlineStore((state) => ({
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
    pendingCount: state.pendingCount,
  }));
};
