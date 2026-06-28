import { Package, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useStockValuation } from '../../hooks/useReports';
import { PasscodeModal } from '../../components/PasscodeModal';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { formatCurrency } from '../../utils/formatCurrency';
import type { StockItem } from '../../api/report.api';

export const StockValuation = () => {
  const [passcodeVerified, setPasscodeVerified] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  const { data, isLoading, isError, error } = useStockValuation();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const toggleCategory = (catId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  if (!passcodeVerified) {
    return (
      <div className="p-6 max-w-6xl">
        <PageHeader title="Stock Valuation" subtitle="Passcode required to view inventory value" />
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500 mb-4">This report contains cost prices and inventory valuation.</p>
          {showPasscode ? (
            <PasscodeModal module="PROFIT_VIEW" onSuccess={() => { setPasscodeVerified(true); setShowPasscode(false); }} onCancel={() => setShowPasscode(false)} />
          ) : (
            <button onClick={() => setShowPasscode(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Verify Passcode</button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl">
        <PageHeader title="Stock Valuation" subtitle="Product inventory value at cost price" />
        <p className="text-gray-500 text-center py-8">Loading stock valuation...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-6xl">
        <PageHeader title="Stock Valuation" subtitle="Product inventory value at cost price" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
          {(error as Error)?.message || 'Failed to load stock valuation. Please try again.'}
        </div>
      </div>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <div className="p-6 max-w-6xl">
        <PageHeader title="Stock Valuation" subtitle="Product inventory value at cost price" />
        <p className="text-gray-500 text-center py-8">No products found in inventory.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader title="Stock Valuation" subtitle="Product inventory value at cost price" />

      {/* Grand total card */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Package size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Inventory Value</p>
            <p className="text-3xl font-bold">{formatCurrency(data.grandTotal)}</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {data.categories.map((category) => {
          const isExpanded = expandedCategories.has(category.categoryId);
          return (
            <div key={category.categoryId} className="bg-white rounded-lg border overflow-hidden">
              {/* Category header — clickable */}
              <button
                onClick={() => toggleCategory(category.categoryId)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                  <h3 className="text-sm font-medium">{category.categoryName}</h3>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-500">{category.productCount} product{category.productCount !== 1 ? 's' : ''}</span>
                  <span className="font-medium">{formatCurrency(category.totalValue)}</span>
                </div>
              </button>

              {/* Items table — collapsible */}
              {isExpanded && (
                <div className="border-t">
                  <DataTable
                    columns={[
                      { key: 'name', header: 'Product' },
                      { key: 'sku', header: 'SKU' },
                      { key: 'quantityOnHand', header: 'Qty on Hand' },
                      { key: 'unitCost', header: 'Unit Cost', render: (item: StockItem) => formatCurrency(item.unitCost) },
                      { key: 'totalValue', header: 'Total Value', render: (item: StockItem) => formatCurrency(item.totalValue) },
                    ]}
                    data={category.items}
                    keyExtractor={(item) => item.productId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
