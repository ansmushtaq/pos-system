import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSales } from '../../hooks/useSales';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { Search } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { SaleListItem } from '../../api/sale.api';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  VOIDED: 'bg-red-100 text-red-700',
};

const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-100 text-green-700',
  CARD: 'bg-blue-100 text-blue-700',
  CREDIT: 'bg-red-100 text-red-700',
  SEMI_CREDIT: 'bg-orange-100 text-orange-700',
};

const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

export const SalesList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useSales({ page, limit: 20, status: statusFilter || undefined, paymentMethod: paymentFilter || undefined, search: search || undefined });
  const { data: todayData } = useSales({ startDate: todayStart.toISOString() });

  const todayCompleted = todayData?.data?.filter((s) => s.status === 'COMPLETED') ?? [];
  const todayTotal = todayCompleted.reduce((sum: number, s: SaleListItem) => sum + s.totalAmount, 0);

  const columns = [
    {
      key: 'invoiceNumber', header: 'Invoice #',
      render: (s: SaleListItem) => <span className="font-mono text-xs">{s.invoiceNumber}</span>,
    },
    { key: 'customerName', header: 'Customer' },
    {
      key: 'paymentMethod', header: 'Method',
      render: (s: SaleListItem) => <span className={`text-xs px-2 py-0.5 rounded-full ${METHOD_COLORS[s.paymentMethod] || ''}`}>{s.paymentMethod}</span>,
    },
    {
      key: 'totalAmount', header: 'Total',
      render: (s: SaleListItem) => (
        <div>
          <span>{formatCurrency(s.totalAmount)}</span>
          {(s.returnedAmount ?? 0) > 0 && (
            <span className="text-amber-600 text-xs ml-1">(-{formatCurrency(s.returnedAmount)})</span>
          )}
        </div>
      ),
    },
    { key: 'createdAt', header: 'Date', render: (s: SaleListItem) => formatDate(s.createdAt, 'datetime') },
    { key: 'seller', header: 'Seller', render: (s: SaleListItem) => s.seller?.fullName || '—' },
    {
      key: 'status', header: 'Status',
      render: (s: SaleListItem) => <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || ''}`}>{s.status}</span>,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Sales" subtitle={`Today: ${formatCurrency(todayTotal)} — ${data?.pagination?.total ?? 0} total sales`} />

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-md text-sm">
          <option value="">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOIDED">Voided</option>
        </select>
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-md text-sm">
          <option value="">All Payment</option>
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="CREDIT">Credit</option>
          <option value="SEMI_CREDIT">Semi-Credit</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border">
            <DataTable columns={columns} data={data?.data ?? []} keyExtractor={(s) => s.id} onRowClick={(s) => navigate(`/sales/${s.id}`)} />
          </div>
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-gray-500">Page {data.pagination.page} of {data.pagination.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
