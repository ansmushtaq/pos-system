import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStockMovements } from '../../hooks/useInventory';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { formatDate } from '../../utils/formatDate';
import type { StockMovementWithRelations } from '../../types/models';

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  SALE: 'Sale',
  SALE_VOID: 'Sale Void',
  PURCHASE: 'Purchase',
  ADJUSTMENT_IN: 'Adjustment In',
  ADJUSTMENT_OUT: 'Adjustment Out',
  RETURN_TO_VENDOR: 'Return to Vendor',
  RETURN_FROM_CUSTOMER: 'Return from Customer',
  OPENING_STOCK: 'Opening Stock',
};

const MOVEMENT_TYPE_STYLES: Record<string, string> = {
  ADJUSTMENT_IN: 'bg-green-100 text-green-700',
  PURCHASE: 'bg-green-100 text-green-700',
  RETURN_FROM_CUSTOMER: 'bg-green-100 text-green-700',
  OPENING_STOCK: 'bg-green-100 text-green-700',
  ADJUSTMENT_OUT: 'bg-red-100 text-red-700',
  SALE: 'bg-red-100 text-red-700',
  RETURN_TO_VENDOR: 'bg-red-100 text-red-700',
  SALE_VOID: 'bg-amber-100 text-amber-700',
};

const MovementTypeBadge = ({ type }: { type: string }) => (
  <span
    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      MOVEMENT_TYPE_STYLES[type] ?? 'bg-gray-100 text-gray-600'
    }`}
  >
    {MOVEMENT_TYPE_LABELS[type] ?? type}
  </span>
);

export const MovementLedger = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const pid = Number(productId);

  const [page, setPage] = useState(1);
  const [movementType, setMovementType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useStockMovements(
    pid,
    {
      page,
      limit: 20,
      movementType: movementType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }
  );

  const columns = [
    {
      key: 'createdAt',
      header: 'Date',
      render: (m: StockMovementWithRelations) => (
        <span className="text-xs">{formatDate(m.createdAt, 'datetime')}</span>
      ),
    },
    {
      key: 'movementType',
      header: 'Type',
      render: (m: StockMovementWithRelations) => <MovementTypeBadge type={m.movementType} />,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (m: StockMovementWithRelations) => (
        <span className="font-mono text-sm">{m.quantity}</span>
      ),
    },
    {
      key: 'change',
      header: 'Before -> After',
      render: (m: StockMovementWithRelations) => (
        <span className="font-mono text-xs text-gray-600">
          {m.quantityBefore} &rarr; {m.quantityAfter}
        </span>
      ),
    },
    {
      key: 'performedBy',
      header: 'Performed By',
      render: (m: StockMovementWithRelations) => {
        const user = m.performedBy;
        return <span className="text-sm">{user?.fullName ?? '—'}</span>;
      },
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (m: StockMovementWithRelations) => {
        if (!m.referenceModel || !m.referenceId) return <span className="text-gray-400">—</span>;
        let label = '';
        if (m.referenceModel === 'SaleOrder') label = `Sale #${m.referenceId}`;
        else if (m.referenceModel === 'PurchaseOrder') label = `PO #${m.referenceId}`;
        else label = `${m.referenceModel} #${m.referenceId}`;
        return <span className="text-xs text-blue-600">{label}</span>;
      },
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (m: StockMovementWithRelations) => (
        <span className="text-xs text-gray-500 max-w-[160px] truncate block">
          {m.notes ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Stock Movements"
        subtitle={
          data ? `${data.pagination.total} movements` : ''
        }
        actions={
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back to Inventory
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <select
          value={movementType}
          onChange={(e) => {
            setMovementType(e.target.value);
            setPage(1);
          }}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm"
          />
        </div>

        {(movementType || startDate || endDate) && (
          <button
            onClick={() => {
              setMovementType('');
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border">
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              keyExtractor={(m) => m.id}
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
    </div>
  );
};
