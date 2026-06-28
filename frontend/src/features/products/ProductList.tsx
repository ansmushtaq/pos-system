import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, History } from 'lucide-react';
import { useProducts, useDeleteProduct } from '../../hooks/useProducts';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { ConfirmModal } from '../../components/ConfirmModal';
import { RoleGuard } from '../../components/RoleGuard';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Product } from '../../types/models';

const roleHierarchy = ['VIEWER', 'CASHIER', 'MANAGER', 'ADMIN'];

export const ProductList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data, isLoading } = useProducts({ page, limit: 20, search: search || undefined });
  const deleteMutation = useDeleteProduct();

  const user = useAuthStore((s) => s.user);
  const userRole = user?.role ?? 'CASHIER';
  const canViewCost = roleHierarchy.indexOf(userRole) >= roleHierarchy.indexOf('MANAGER');

  const columns: { key: string; header: string; render?: (p: Product) => React.ReactNode; className?: string }[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'sku',
      header: 'SKU',
      render: (p: Product) => <span className="font-mono text-xs">{p.sku}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (p: Product) => p.category?.name ?? '—',
    },
    {
      key: 'salePrice',
      header: 'Price',
      render: (p: Product) => formatCurrency(p.salePrice),
    },
    ...(canViewCost
      ? [{
          key: 'costPrice',
          header: 'Cost',
          render: (p: Product) => formatCurrency(p.costPrice),
        }]
      : []),
    {
      key: 'inventory',
      header: 'Stock',
      render: (p: Product) => {
        const qty = p.inventory?.quantityOnHand ?? 0;
        const reorder = p.inventory?.reorderLevel ?? 0;
        return (
          <span className={qty <= reorder ? 'text-red-600 font-medium' : ''}>
            {qty}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (p: Product) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {p.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (p: Product) => (
        <div className="flex gap-1">
          <RoleGuard roles={['MANAGER', 'ADMIN']}>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}/price-history`); }} className="p-1.5 hover:bg-gray-100 rounded" title="Price History">
              <History size={14} />
            </button>
          </RoleGuard>
          <RoleGuard roles={['MANAGER', 'ADMIN']}>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}/edit`); }} className="p-1.5 hover:bg-gray-100 rounded" title="Edit">
              <Pencil size={14} />
            </button>
          </RoleGuard>
          <RoleGuard roles={['ADMIN']}>
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="Delete">
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
        title="Products"
        subtitle={data ? `${data.pagination.total} products` : ''}
        actions={
          <RoleGuard roles={['MANAGER', 'ADMIN']}>
            <button onClick={() => navigate('/products/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              <Plus size={16} /> Add Product
            </button>
          </RoleGuard>
        }
      />

      <div className="mb-4 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, SKU, or barcode..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
        />
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
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              keyExtractor={(p) => p.id}
              onRowClick={(p) => navigate(`/products/${p.id}`)}
            />
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-gray-500">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          confirmLabel="Delete"
          loading={deleteMutation.isPending}
          onConfirm={() => {
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            });
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
