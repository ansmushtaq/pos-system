import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, PackageOpen } from 'lucide-react';
import { useInventories } from '../../hooks/useInventory';
import { getCategories } from '../../api/category.api';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { formatDate } from '../../utils/formatDate';
import type { InventoryWithProduct } from '../../types/models';

export const InventoryList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [lowStock, setLowStock] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<InventoryWithProduct | null>(null);

  const { data, isLoading } = useInventories({
    page,
    limit: 20,
    search: search || undefined,
    categoryId,
    lowStock: lowStock || undefined,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const columns = [
    {
      key: 'productName',
      header: 'Product',
      render: (inv: InventoryWithProduct) => {
        const product = inv.product;
        return (
          <div>
            <p className="font-medium">{product?.name ?? '—'}</p>
            <p className="text-xs text-gray-400">{product?.sku ?? ''}</p>
          </div>
        );
      },
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (inv: InventoryWithProduct) => {
        const product = inv.product;
        return <span className="font-mono text-xs">{product?.sku ?? '—'}</span>;
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (inv: InventoryWithProduct) => {
        const product = inv.product;
        return <span>{product?.category?.name ?? '—'}</span>;
      },
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (inv: InventoryWithProduct) => {
        const product = inv.product;
        return <span className="text-xs">{product?.unit ?? '—'}</span>;
      },
    },
    {
      key: 'quantityOnHand',
      header: 'Stock Qty',
      render: (inv: InventoryWithProduct) => (
        <span
          className={
            inv.quantityOnHand <= inv.reorderLevel
              ? 'text-red-600 font-medium'
              : ''
          }
        >
          {inv.quantityOnHand}
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      render: (inv: InventoryWithProduct) => <span>{inv.reorderLevel}</span>,
    },
    {
      key: 'lastMovementAt',
      header: 'Last Movement',
      render: (inv: InventoryWithProduct) => (
        <span className="text-xs text-gray-500">
          {inv.lastMovementAt ? formatDate(inv.lastMovementAt, 'short') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (inv: InventoryWithProduct) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAdjustTarget(inv);
            }}
            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"
            title="Adjust Stock"
          >
            <PackageOpen size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Inventory"
        subtitle={
          data ? `${data.pagination.total} items in stock` : ''
        }
      />

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
          />
        </div>

        <select
          value={categoryId ?? ''}
          onChange={(e) => {
            setCategoryId(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {(categoriesData ?? []).map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => {
              setLowStock(e.target.checked);
              setPage(1);
            }}
            className="rounded"
          />
          <span className="text-amber-700">Low Stock Only</span>
        </label>
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
              keyExtractor={(inv) => inv.id}
              onRowClick={(inv) => {
                const product = (inv as InventoryWithProduct).product;
                if (product?.id) navigate(`/inventory/${product.id}/movements`);
              }}
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

      {adjustTarget && (
        <StockAdjustmentModal
          open={!!adjustTarget}
          inventory={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={() => setAdjustTarget(null)}
        />
      )}
    </div>
  );
};
