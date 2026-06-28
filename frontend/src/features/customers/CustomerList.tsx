import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, CreditCard } from 'lucide-react';
import { useCustomers, useDeleteCustomer } from '../../hooks/useCustomers';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { ConfirmModal } from '../../components/ConfirmModal';
import { RoleGuard } from '../../components/RoleGuard';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Customer } from '../../types/models';

export const CustomerList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const { data, isLoading } = useCustomers({ page, limit: 20, search: search || undefined });
  const deleteMutation = useDeleteCustomer();

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone', render: (c: Customer) => c.phone || '—' },
    { key: 'email', header: 'Email', render: (c: Customer) => c.email || '—' },
    {
      key: 'creditBalance',
      header: 'Credit Balance',
      render: (c: Customer) => (
        <span className={c.creditBalance > 0 ? 'text-red-600 font-medium' : ''}>
          {formatCurrency(c.creditBalance)}
        </span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      render: (c: Customer) => formatCurrency(c.totalSpent),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (c: Customer) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {c.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (c: Customer) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}/credit`); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title={c.creditBalance > 0 ? 'Credit & Payment' : 'Credit History'}>
            <CreditCard size={14} />
          </button>
          <RoleGuard roles={['MANAGER', 'ADMIN']}>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}/edit`); }} className="p-1.5 hover:bg-gray-100 rounded" title="Edit">
              <Pencil size={14} />
            </button>
          </RoleGuard>
          <RoleGuard roles={['ADMIN']}>
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="Delete">
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
        title="Customers"
        subtitle={data ? `${data.pagination.total} customers` : ''}
        actions={
          <RoleGuard roles={['MANAGER', 'ADMIN']}>
            <button onClick={() => navigate('/customers/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              <Plus size={16} /> Add Customer
            </button>
          </RoleGuard>
        }
      />

      <div className="mb-4 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border">
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              keyExtractor={(c) => c.id}
              onRowClick={(c) => navigate(`/customers/${c.id}/credit`)}
            />
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
        <ConfirmModal
          title="Delete Customer"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          confirmLabel="Delete"
          loading={deleteMutation.isPending}
          onConfirm={() => { deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
