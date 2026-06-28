import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { OfflineIndicator } from './OfflineIndicator';
import { useInitSync } from '../hooks/useSync';

export const Layout = () => {
  useInitSync();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <OfflineIndicator />
        <main className="flex-1 min-h-0 bg-gray-50 flex flex-col overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
