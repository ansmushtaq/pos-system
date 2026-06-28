import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCustomer, usePayCredit, useCreditHistory } from '../../hooks/useCustomers';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { CreditTransaction } from '../../types/models';

export const CustomerCredit = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();

  const { data: customer, isLoading: loadingCustomer } = useCustomer(customerId);
  const payMutation = usePayCredit();

  const [historyPage, setHistoryPage] = useState(1);
  const { data: historyData } = useCreditHistory(customerId, historyPage);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) return;
    try {
      await payMutation.mutateAsync(
        { id: customerId, payload: { amount: payAmount, note: note || undefined } },
        {
          onSuccess: () => {
            setAmount('');
            setNote('');
          },
        },
      );
    } catch {
      // mutation error is tracked via mutation.isError state
    }
  };

  if (loadingCustomer) return <p className="text-gray-500 text-center py-8">Loading...</p>;
  if (!customer) return <p className="text-gray-500 text-center py-8">Customer not found</p>;

  const historyColumns = [
    {
      key: 'createdAt',
      header: 'Date',
      render: (t: CreditTransaction) => formatDate(t.createdAt, 'datetime'),
    },
    {
      key: 'type',
      header: 'Type',
      render: (t: CreditTransaction) => {
        const colors: Record<string, string> = {
          ISSUED: 'bg-red-100 text-red-700',
          PAID: 'bg-green-100 text-green-700',
          ADJUSTED: 'bg-yellow-100 text-yellow-700',
          VOID_REVERSAL: 'bg-gray-100 text-gray-600',
        };
        return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[t.type] || 'bg-gray-100'}`}>{t.type}</span>;
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t: CreditTransaction) => (
        <span className={t.type === 'PAID' || t.type === 'VOID_REVERSAL' ? 'text-green-600' : 'text-red-600'}>
          {t.type === 'PAID' || t.type === 'VOID_REVERSAL' ? '-' : '+'}{formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      render: (t: CreditTransaction) => formatCurrency(t.balanceAfter),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (t: CreditTransaction) => t.saleOrder?.invoiceNumber || t.note || '—',
    },
  ];

  return (
    <div className="p-6 max-w-3xl">
      <button onClick={() => navigate('/customers')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Customers
      </button>

      <PageHeader title={customer.name} subtitle={`Phone: ${customer.phone || 'N/A'} | Total Spent: ${formatCurrency(customer.totalSpent)}`} />

      <div className="bg-white rounded-lg border p-6 mb-6">
        <p className="text-sm text-gray-500">Current Credit Balance</p>
        <p className={`text-3xl font-bold ${customer.creditBalance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {formatCurrency(customer.creditBalance)}
        </p>
      </div>

      {customer.creditBalance > 0 && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h3 className="text-sm font-medium mb-4">Record Payment</h3>
          <form onSubmit={handlePay} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Amount (max {formatCurrency(customer.creditBalance)})</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={customer.creditBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Cash payment, bank transfer..."
              />
            </div>
            <button
              type="submit"
              disabled={payMutation.isPending || !amount}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {payMutation.isPending ? 'Processing...' : 'Record Payment'}
            </button>
          </form>
          {payMutation.isError && <p className="text-red-500 text-xs mt-2">{(payMutation.error as Error)?.message || 'Payment failed'}</p>}
        </div>
      )}

      <div className="bg-white rounded-lg border">
        <h3 className="text-sm font-medium px-4 py-3 border-b">Credit History</h3>
        {historyData && historyData.data && historyData.data.length > 0 ? (
          <>
            <DataTable
              columns={historyColumns}
              data={historyData.data}
              keyExtractor={(t) => t.id}
            />
            {historyData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 text-sm border-t">
                <p className="text-gray-500">Page {historyData.pagination.page} of {historyData.pagination.totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setHistoryPage((p) => Math.max(1, p - 1))} disabled={historyPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                  <button onClick={() => setHistoryPage((p) => p + 1)} disabled={historyPage >= historyData.pagination.totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">No credit transactions</p>
        )}
      </div>
    </div>
  );
};
