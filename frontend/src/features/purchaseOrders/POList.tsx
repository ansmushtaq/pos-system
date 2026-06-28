import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Truck } from 'lucide-react';
import { usePOs, useDeletePO } from '../../hooks/usePurchaseOrders';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { ConfirmModal } from '../../components/ConfirmModal';
import { RoleGuard } from '../../components/RoleGuard';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { PurchaseOrder } from '../../types/models';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  PARTIALLY_RECEIVED: 'bg-amber-100 text-amber-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const POList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

  const { data, isLoading } = usePOs({ page, limit: 20, status: statusFilter || undefined });
  const deleteMutation = useDeletePO();

  const columns = [
    { key: 'poNumber', header: 'PO #', render: (po: PurchaseOrder) => <span className="font-mono text-xs">{po.poNumber}</span> },
    { key: 'vendor', header: 'Vendor', render: (po: PurchaseOrder) => po.vendor?.name || '—' },
    {
      key: 'status', header: 'Status',
      render: (po: PurchaseOrder) => <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[po.status] || ''}`}>{po.status}</span>,
    },
    { key: 'totalAmount', header: 'Total', render: (po: PurchaseOrder) => formatCurrency(po.totalAmount) },
    { key: 'createdAt', header: 'Date', render: (po: PurchaseOrder) => formatDate(po.createdAt) },
    {
      key: 'actions', header: '', className: 'w-24',
      render: (po: PurchaseOrder) => (
        <div className="flex gap-1">
          {(po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/purchase-orders/${po.id}/receive`); }} className="p-1.5 hover:bg-green-50 text-green-600 rounded" title="Receive">
              <Truck size={14} />
            </button>
          )}
          <RoleGuard roles={['ADMIN']}>
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(po); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="Delete">
              <Trash2 size={14} />
            </button>
          </RoleGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Purchase Orders"
        subtitle={data ? `${data.pagination.total} orders` : ''}
        actions={
          <RoleGuard roles={['MANAGER', 'ADMIN']}>
            <button onClick={() => navigate('/purchase-orders/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              <Plus size={16} /> New PO
            </button>
          </RoleGuard>
        }
      />

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by PO number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 border rounded-md text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-md text-sm">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border">
            <DataTable columns={columns} data={data?.data ?? []} keyExtractor={(po) => po.id} />
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

      {deleteTarget && (
        <ConfirmModal title="Delete PO" message={`Delete "${deleteTarget.poNumber}"?`} confirmLabel="Delete" loading={deleteMutation.isPending}
          onConfirm={() => { deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }); }} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
};
