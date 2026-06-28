import { useParams } from 'react-router-dom';
import { useUser, useShiftSummary } from '../../hooks/useUsers';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export const ShiftSummary = () => {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const { data: user } = useUser(userId);
  const { data: summary, isLoading } = useShiftSummary(userId);

  if (!user) return <p className="text-gray-500 text-center py-8">User not found</p>;

  const paymentColumns = [
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      render: (r: { paymentMethod: string; count: number; total: number }) => {
        const colors: Record<string, string> = { CASH: 'bg-green-100 text-green-700', CARD: 'bg-blue-100 text-blue-700', CREDIT: 'bg-red-100 text-red-700', SEMI_CREDIT: 'bg-orange-100 text-orange-700' };
        return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[r.paymentMethod] || 'bg-gray-100'}`}>{r.paymentMethod}</span>;
      },
    },
    { key: 'count', header: 'Transactions' },
    { key: 'total', header: 'Total', render: (r: { paymentMethod: string; count: number; total: number }) => formatCurrency(r.total) },
  ];

  return (
    <div className="p-6">
      <PageHeader title={user.fullName} subtitle={`${user.role} — Shift Summary`} />

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Loading...</p>
      ) : summary ? (
        <>
          <div className={`p-4 rounded-lg mb-6 ${summary.isOnShift ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg font-semibold ${summary.isOnShift ? 'text-green-700' : 'text-gray-600'}`}>
              {summary.isOnShift ? 'Currently On Shift' : 'Not On Shift'}
            </p>
            {summary.startedAt && <p className="text-sm text-gray-500 mt-1">Started: {formatDate(summary.startedAt, 'datetime')}</p>}
            {summary.endedAt && <p className="text-sm text-gray-500 mt-1">Ended: {formatDate(summary.endedAt, 'datetime')}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold">{summary.totalTransactions}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Avg per Transaction</p>
              <p className="text-2xl font-bold">
                {summary.totalTransactions > 0 ? formatCurrency(summary.totalSales / summary.totalTransactions) : formatCurrency(0)}
              </p>
            </div>
          </div>

          {summary.paymentBreakdown.length > 0 && (
            <div className="bg-white rounded-lg border">
              <h3 className="text-sm font-medium px-4 py-3 border-b">Payment Breakdown</h3>
              <DataTable
                columns={paymentColumns}
                data={summary.paymentBreakdown}
                keyExtractor={(r) => r.paymentMethod}
              />
            </div>
          )}

          {summary.paymentBreakdown.length === 0 && summary.totalTransactions === 0 && (
            <p className="text-gray-500 text-center py-8">No sales recorded during this shift.</p>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">No shift data available</p>
      )}
    </div>
  );
};
