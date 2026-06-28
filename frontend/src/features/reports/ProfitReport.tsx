import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TrendingUp, DollarSign, ShoppingCart, Percent } from 'lucide-react';
import { useSalesSummary, useTopProducts, useProfitBySeller } from '../../hooks/useReports';
import { PasscodeModal } from '../../components/PasscodeModal';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { formatCurrency } from '../../utils/formatCurrency';
import type { TopProduct, SellerProfit } from '../../api/report.api';

interface DateForm {
  startDate: string;
  endDate: string;
}

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const EMPTY_PARAMS = {};

export const ProfitReport = () => {
  const [passcodeVerified, setPasscodeVerified] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [params, setParams] = useState<{ startDate: string; endDate: string } | null>(null);

  const { register, handleSubmit } = useForm<DateForm>({
    defaultValues: { startDate: thirtyDaysAgo, endDate: today },
  });

  const { data: summary, isLoading: loadingSummary, isError: summaryError } = useSalesSummary(
    params ? { startDate: params.startDate, endDate: params.endDate } : EMPTY_PARAMS
  );
  const { data: topProducts, isLoading: loadingTopProducts, isError: topProductsError } = useTopProducts(
    params ? { startDate: params.startDate, endDate: params.endDate, sortBy: 'revenue', limit: 10 } : EMPTY_PARAMS
  );
  const { data: sellerProfit, isLoading: loadingSellerProfit, isError: sellerProfitError } = useProfitBySeller(
    params ? { startDate: params.startDate, endDate: params.endDate } : EMPTY_PARAMS
  );

  const isLoading = loadingSummary || loadingTopProducts || loadingSellerProfit;

  const onSubmit = (data: DateForm) => setParams(data);

  if (!passcodeVerified) {
    return (
      <div className="p-6 max-w-2xl">
        <PageHeader title="Profit Report" subtitle="Passcode required to view financial data" />
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500 mb-4">This report contains sensitive profit information.</p>
          {showPasscode ? (
            <PasscodeModal module="PROFIT_VIEW" onSuccess={() => { setPasscodeVerified(true); setShowPasscode(false); }} onCancel={() => setShowPasscode(false)} />
          ) : (
            <button onClick={() => setShowPasscode(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Verify Passcode</button>
          )}
        </div>
      </div>
    );
  }

  const paymentMethods = summary?.byPaymentMethod
    ? Object.entries(summary.byPaymentMethod).map(([method, { total, count }]) => ({ method, total, count }))
    : [];

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader title="Profit Report" subtitle={params ? `${params.startDate} to ${params.endDate}` : 'Select a date range'} />

      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 items-end mb-6 bg-white rounded-lg border p-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input type="date" {...register('startDate')} className="px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Date</label>
          <input type="date" {...register('endDate')} className="px-3 py-2 border rounded-md text-sm" />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Generate Report</button>
      </form>

      {!params ? (
        <p className="text-gray-500 text-center py-8">Select a date range and click Generate Report to view profit data.</p>
      ) : isLoading ? (
        <p className="text-gray-500 text-center py-8">Loading report...</p>
      ) : summaryError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
          Failed to load report data. Please try again.
        </div>
      ) : summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2"><ShoppingCart size={16} className="text-blue-500" /><span className="text-sm text-gray-500">Orders</span></div>
              <p className="text-2xl font-bold">{summary.orders.total}</p>
              <p className="text-xs text-gray-400">{summary.orders.completed} completed, {summary.orders.voided} voided</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-green-500" /><span className="text-sm text-gray-500">Revenue</span></div>
              <p className="text-2xl font-bold">{formatCurrency(summary.revenue.total)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-purple-500" /><span className="text-sm text-gray-500">Profit</span></div>
              <p className="text-2xl font-bold">{formatCurrency(summary.revenue.profit)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2"><Percent size={16} className="text-orange-500" /><span className="text-sm text-gray-500">Margin</span></div>
              <p className="text-2xl font-bold">{summary.revenue.margin.toFixed(1)}%</p>
            </div>
          </div>

          {paymentMethods.length > 0 && (
            <div className="bg-white rounded-lg border">
              <h3 className="text-sm font-medium px-4 py-3 border-b">Revenue by Payment Method</h3>
              <DataTable
                columns={[
                  { key: 'method', header: 'Method' },
                  { key: 'count', header: 'Orders' },
                  { key: 'total', header: 'Total', render: (r: { method: string; total: number; count: number }) => formatCurrency(r.total) },
                ]}
                data={paymentMethods}
                keyExtractor={(r) => r.method}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {topProductsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm text-center">
                Failed to load top products.
              </div>
            ) : topProducts && topProducts.length > 0 ? (
              <div className="bg-white rounded-lg border">
                <h3 className="text-sm font-medium px-4 py-3 border-b">Top Products by Revenue</h3>
                <DataTable
                  columns={[
                    { key: 'name', header: 'Product' },
                    { key: 'revenue', header: 'Revenue', render: (p: TopProduct) => formatCurrency(p.revenue) },
                    { key: 'profit', header: 'Profit', render: (p: TopProduct) => <span className={p.profit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(p.profit)}</span> },
                  ]}
                  data={topProducts}
                  keyExtractor={(p) => p.productId}
                />
              </div>
            ) : null}

            {sellerProfitError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm text-center">
                Failed to load seller profit data.
              </div>
            ) : sellerProfit && sellerProfit.length > 0 ? (
              <div className="bg-white rounded-lg border">
                <h3 className="text-sm font-medium px-4 py-3 border-b">Profit by Seller</h3>
                <DataTable
                  columns={[
                    { key: 'name', header: 'Seller' },
                    { key: 'orders', header: 'Orders' },
                    { key: 'profit', header: 'Profit', render: (s: SellerProfit) => formatCurrency(s.profit) },
                    { key: 'margin', header: 'Margin', render: (s: SellerProfit) => `${s.margin.toFixed(1)}%` },
                  ]}
                  data={sellerProfit}
                  keyExtractor={(s) => s.sellerId}
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Cost</span>
                <span className="font-medium">{formatCurrency(summary.revenue.cost)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No data available for this period.</p>
      )}
    </div>
  );
};
