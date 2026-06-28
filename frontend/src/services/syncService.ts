import { getPendingSales, markSaleSynced, purgeOldSyncedSales, getPendingCount } from '../utils/offlineDB';
import { createSale, type CreateSalePayload } from '../api/sale.api';
import { useOnlineStore } from '../store/onlineStore';

interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

export const processSyncQueue = async (): Promise<SyncResult> => {
  const store = useOnlineStore.getState();
  if (store.isSyncing) return { synced: 0, failed: 0, remaining: store.pendingCount };

  store.setSyncing(true);
  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingSales();

    for (const sale of pending) {
      try {
        const payload = JSON.parse(sale.payload) as CreateSalePayload & { offlineId?: string };
        await createSale(payload);
        if (sale.id !== undefined) await markSaleSynced(sale.id);
        synced++;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        // Only discard on unrecoverable client errors (422 validation, 404 not found, 409 conflict)
        // 401/403 can be resolved by re-authentication — keep for retry
        // 429 rate-limit can succeed on next attempt — keep for retry
        // Network errors (no status) should also be kept for retry
        if (axiosErr.response?.status && axiosErr.response.status >= 400 && axiosErr.response.status < 500 && axiosErr.response.status !== 401 && axiosErr.response.status !== 403 && axiosErr.response.status !== 429) {
          if (sale.id !== undefined) await markSaleSynced(sale.id);
          synced++;
        } else {
          // Network error or server error — stop processing, keep remaining for later
          failed++;
          break;
        }
      }
    }

    await purgeOldSyncedSales(30);
    const remaining = await getPendingCount();
    store.setPendingCount(remaining);
    return { synced, failed, remaining };
  } finally {
    store.setSyncing(false);
  }
};

let syncInitialized = false;

export const initSyncOnReconnect = () => {
  if (syncInitialized) return;
  syncInitialized = true;
  window.addEventListener('online', async () => {
    useOnlineStore.getState().setOnline(true);
    const count = await getPendingCount();
    useOnlineStore.getState().setPendingCount(count);
    if (count > 0) {
      await processSyncQueue();
    }
  });

  // Check for pending on load
  getPendingCount().then((count) => {
    useOnlineStore.getState().setPendingCount(count);
    if (count > 0 && navigator.onLine) {
      processSyncQueue();
    }
  });
};
