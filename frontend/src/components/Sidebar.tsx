import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Truck, Box, Users, UserCircle, CalendarCheck, FileText, Receipt, BarChart3, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const roleHierarchy = ['VIEWER', 'CASHIER', 'MANAGER', 'ADMIN'];

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', minRole: 'VIEWER', end: true },
  { to: '/products', icon: Package, label: 'Products', minRole: 'CASHIER', end: true },
  { to: '/pos', icon: ShoppingCart, label: 'Point of Sale', minRole: 'CASHIER', end: true },
  { to: '/inventory', icon: Box, label: 'Inventory', minRole: 'CASHIER', end: true },
  { to: '/inventory/audit-log', icon: ClipboardList, label: 'Audit Log', minRole: 'MANAGER', end: true },
  { to: '/users', icon: Users, label: 'Users', minRole: 'MANAGER', end: true },
  { to: '/customers', icon: UserCircle, label: 'Customers', minRole: 'CASHIER', end: true },
  { to: '/sales', icon: Receipt, label: 'Sales', minRole: 'CASHIER', end: false },
  { to: '/purchase-orders', icon: FileText, label: 'Purchase Orders', minRole: 'MANAGER', end: true },
  { to: '/vendors', icon: Truck, label: 'Vendors', minRole: 'MANAGER', end: true },
  { to: '/reports/profit', icon: BarChart3, label: 'Reports', minRole: 'MANAGER', end: true },
  { to: '/reports/stock-valuation', icon: Package, label: 'Stock Value', minRole: 'MANAGER', end: true },
  { to: '/end-of-day', icon: CalendarCheck, label: 'End of Day', minRole: 'MANAGER', end: false },
];

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const userLevel = user ? roleHierarchy.indexOf(user.role) : -1;

  const visibleItems = navItems.filter((item) => {
    const minLevel = roleHierarchy.indexOf(item.minRole);
    return userLevel >= minLevel;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <Link to="/" className="text-lg font-bold hover:text-gray-300 transition-colors">POS System</Link>
        {user && <p className="text-sm text-gray-400 mt-1">{user.fullName} ({user.role})</p>}
      </div>
      <nav className="flex-1 min-h-0 overflow-y-auto p-2">
        <ul className="space-y-1">
          {visibleItems.map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors text-left"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};
