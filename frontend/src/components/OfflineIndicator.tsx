import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSync';

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingCount } = useSyncStatus();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismiss when connection state changes
  useEffect(() => {
    setDismissed(false);
  }, [isOnline, isSyncing, pendingCount]);

  if ((isOnline && !isSyncing && pendingCount === 0) || dismissed) return null;

  return (
    <div
      className={`flex items-center justify-between gap-2 px-4 py-1.5 text-xs font-medium text-white ${
        !isOnline ? 'bg-amber-600' : 'bg-blue-600'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff size={14} />
            <span>You are offline. Sales will be saved locally and synced when connection is restored.</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            <span>Syncing {pendingCount} pending sale{pendingCount !== 1 ? 's' : ''}...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Wifi size={14} />
            <span>{pendingCount} sale{pendingCount !== 1 ? 's' : ''} pending sync</span>
          </>
        ) : null}
      </div>
      <button onClick={() => setDismissed(true)} className="p-0.5 hover:bg-white/20 rounded" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
};
