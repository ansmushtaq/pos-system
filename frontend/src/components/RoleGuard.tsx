import { useAuthStore } from '../store/authStore';

const roleHierarchy = ['VIEWER', 'CASHIER', 'MANAGER', 'ADMIN'];

export const RoleGuard = ({
  roles,
  children,
  fallback = <p className="text-gray-500 text-sm">You do not have permission to view this content.</p>,
}: {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const userLevel = roleHierarchy.indexOf(user.role);
  const minLevel = Math.min(...roles.map((r) => roleHierarchy.indexOf(r)));

  if (userLevel < minLevel) return <>{fallback}</>;
  return <>{children}</>;
};
