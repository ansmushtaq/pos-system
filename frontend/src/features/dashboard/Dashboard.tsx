import { useNavigate } from 'react-router-dom';
import { Package, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomers';
import { useSales } from '../../hooks/useSales';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

export const Dashboard = () => {
  const navigate = useNavigate();

  const { data: productsData } = useProducts({ limit: 1 });
  const { data: customersData } = useCustomers({ limit: 1 });
  const { data: salesData } = useSales({ limit: 5 });
  const { data: todayData } = useSales({ startDate: todayStart.toISOString() });

  const productCount = productsData?.pagination?.total ?? 0;
  const customerCount = customersData?.pagination?.total ?? 0;

  const recentSales = salesData?.data ?? [];
  const todaySales = todayData?.data?.filter((s) => s.status === 'COMPLETED') ?? [];
  const todayTotal = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  const cards = [
    { label: 'Products', value: productCount, icon: Package, color: 'text-blue-600 bg-blue-50', href: '/products' },
    { label: 'Customers', value: customerCount, icon: Users, color: 'text-green-600 bg-green-50', href: '/customers' },
    { label: 'Today Sales', value: todayTotal > 0 ? formatCurrency(todayTotal) : 'No sales', icon: DollarSign, color: 'text-purple-600 bg-purple-50', href: '/sales' },
    { label: 'New Sale', value: 'POS', icon: ShoppingCart, color: 'text-orange-600 bg-orange-50', href: '/pos' },
  ];

  const STATUS_COLORS: Record<string, string> = { COMPLETED: 'text-green-600', VOIDED: 'text-red-600' };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <button key={label} onClick={() => navigate(href)} className="bg-white rounded-lg border p-4 hover:border-blue-300 text-left transition-colors" aria-label={`${label}: ${value}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`p-2 rounded-lg ${color}`}><Icon size={18} /></div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Recent Sales</h3>
          <button onClick={() => navigate('/sales')} className="text-xs text-blue-600 hover:underline">View all</button>
        </div>
        {recentSales.length > 0 ? (
          <div className="divide-y">
            {recentSales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/sales')}>
                <div>
                  <p className="text-sm font-medium">{sale.invoiceNumber}</p>
                  <p className="text-xs text-gray-400">{formatDate(sale.createdAt, 'datetime')} — {sale.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(sale.totalAmount)}</p>
                  <p className={`text-xs ${STATUS_COLORS[sale.status] || ''}`}>{sale.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">No sales yet</p>
        )}
      </div>
    </div>
  );
};
