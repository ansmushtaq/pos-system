import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePriceHistory } from '../../hooks/useProducts';
import { useAuthStore } from '../../store/authStore';
import { PageHeader } from '../../components/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const roleHierarchy = ['VIEWER', 'CASHIER', 'MANAGER', 'ADMIN'];

export const PriceHistoryDrawer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: history, isLoading } = usePriceHistory(Number(id));

  const user = useAuthStore((s) => s.user);
  const userRole = user?.role ?? 'CASHIER';
  const canView = roleHierarchy.indexOf(userRole) >= roleHierarchy.indexOf('MANAGER');

  if (!canView) {
    return (
      <div className="p-6">
        <PageHeader title="Access Denied" />
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500 mb-4">Only managers and admins can view price history.</p>
          <button onClick={() => navigate('/products')} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Back to Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/products')} className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-gray-50">
          <ArrowLeft size={16} /> Back to Products
        </button>
        <h1 className="text-2xl font-bold">Price History</h1>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Loading...</p>
      ) : !history?.length ? (
        <p className="text-gray-500 text-center py-8">No price changes recorded.</p>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">
                  Changed by <span className="font-medium text-gray-700">{entry.changedBy?.fullName}</span>
                  {' '}on {formatDate(entry.createdAt, 'datetime')}
                </p>
                {entry.changeReason && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {entry.changeReason}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Purchase Price</p>
                  <p className="text-gray-500 line-through">{formatCurrency(entry.oldPurchasePrice)}</p>
                  <p className="font-medium">{formatCurrency(entry.newPurchasePrice)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Tax %</p>
                  <p className="text-gray-500 line-through">{entry.oldPurchaseTaxPercent}%</p>
                  <p className="font-medium">{entry.newPurchaseTaxPercent}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Cost Price</p>
                  <p className="text-gray-500 line-through">{formatCurrency(entry.oldCostPrice)}</p>
                  <p className="font-medium">{formatCurrency(entry.newCostPrice)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Sale Price</p>
                  <p className="text-gray-500 line-through">{formatCurrency(entry.oldSalePrice)}</p>
                  <p className="font-medium text-green-600">{formatCurrency(entry.newSalePrice)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
