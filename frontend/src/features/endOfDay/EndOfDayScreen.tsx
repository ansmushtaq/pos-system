import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, ArrowDown, Wallet, Coins, Calculator } from 'lucide-react';
import { useTodayEOD, useGenerateEOD } from '../../hooks/useEndOfDay';
import { PasscodeModal } from '../../components/PasscodeModal';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { formatCurrency } from '../../utils/formatCurrency';
import type { EndOfDaySummary } from '../../types/models';

interface FormData {
  openingCash: number;
  actualClosingCash: number;
  date: string;
}

const CashReconciliation = ({ summary }: { summary: EndOfDaySummary }) => {
  const expected = summary.expectedClosingCash;
  const actual = summary.actualClosingCash ?? 0;
  const discrepancy = summary.cashDiscrepancy ?? 0;
  const isExtra = discrepancy > 0;
  const isShort = discrepancy < 0;

  return (
    <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
          <Calculator size={16} /> Cash Reconciliation
        </h3>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex-1 text-center">
            <p className="text-gray-500 mb-1">Opening Cash</p>
            <p className="text-xl font-bold">{formatCurrency(summary.openingCash)}</p>
            <p className="text-xs text-gray-400 mt-0.5">start of day</p>
          </div>
          <div className="text-green-600 font-bold text-lg">+</div>
          <div className="flex-1 text-center">
            <p className="text-gray-500 mb-1">Cash Sales</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.cashSales)}</p>
            <p className="text-xs text-gray-400 mt-0.5">cash & semi-credit tendered</p>
          </div>
          <div className="text-red-500 font-bold text-lg">-</div>
          <div className="flex-1 text-center">
            <p className="text-gray-500 mb-1">Change Given</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(summary.changeGiven)}</p>
            <p className="text-xs text-gray-400 mt-0.5">returned to customers</p>
          </div>
          <ArrowRight size={20} className="text-gray-400" />
          <div className="flex-1 text-center bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 mb-1">Expected Closing</p>
            <p className="text-2xl font-bold">{formatCurrency(expected)}</p>
            <p className="text-xs text-gray-400 mt-0.5">opening + sales - change</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">You should have</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(expected)}</p>
          </div>
          <ArrowDown size={20} className="text-gray-400" />
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">You counted</p>
            <p className="text-xl font-bold">{formatCurrency(actual)}</p>
          </div>
          <ArrowDown size={20} className="text-gray-400" />
          <div className={`text-center rounded-lg p-3 ${isExtra ? 'bg-green-50' : isShort ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className="text-sm text-gray-500 mb-1">Difference</p>
            <p className={`text-2xl font-bold ${isExtra ? 'text-green-600' : isShort ? 'text-red-600' : 'text-gray-600'}`}>
              {discrepancy === 0 ? formatCurrency(0) : `${isShort ? '-' : '+'}${formatCurrency(Math.abs(discrepancy))}`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isExtra ? 'extra cash in drawer' : isShort ? 'cash shortfall' : 'perfect match'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryDisplay = ({ summary }: { summary: EndOfDaySummary }) => {
  const topQty = (summary.topProductsByQty as unknown as { productId: number; name: string; qty: number }[]) || [];
  const topRev = (summary.topProductsByRevenue as unknown as { productId: number; name: string; revenue: number }[]) || [];

  const revenueData = [
    { method: 'Cash', amount: summary.cashRevenue },
    { method: 'Credit', amount: summary.creditRevenue },
    { method: 'Semi-Credit', amount: summary.semiCreditRevenue },
    { method: 'Card', amount: summary.cardRevenue },
  ].filter((r) => r.amount > 0);

  return (
    <div className="space-y-6">
      <CashReconciliation summary={summary} />

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-2xl font-bold">{summary.totalTransactions}</p>
          <p className="text-xs text-gray-400">{summary.voidedTransactions} voided</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Profit</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalProfit)}</p>
          <p className="text-xs text-gray-400">{summary.profitMarginPercent.toFixed(1)}% margin</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">New Credit Issued</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.newCreditIssued)}</p>
        </div>
      </div>

      {revenueData.length > 0 && (
        <div className="bg-white rounded-lg border">
          <h3 className="text-sm font-medium px-4 py-3 border-b">Revenue by Payment Method</h3>
          <DataTable
            columns={[
              { key: 'method', header: 'Payment Method' },
              { key: 'amount', header: 'Revenue', render: (r: { method: string; amount: number }) => formatCurrency(r.amount) },
            ]}
            data={revenueData}
            keyExtractor={(r) => r.method}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {topQty.length > 0 && (
          <div className="bg-white rounded-lg border">
            <h3 className="text-sm font-medium px-4 py-3 border-b">Top Products by Quantity</h3>
            <DataTable
              columns={[{ key: 'name', header: 'Product' }, { key: 'qty', header: 'Qty Sold' }]}
              data={topQty}
              keyExtractor={(p) => p.productId}
            />
          </div>
        )}
        {topRev.length > 0 && (
          <div className="bg-white rounded-lg border">
            <h3 className="text-sm font-medium px-4 py-3 border-b">Top Products by Revenue</h3>
            <DataTable
              columns={[
                { key: 'name', header: 'Product' },
                { key: 'revenue', header: 'Revenue', render: (p: { name: string; revenue: number }) => formatCurrency(p.revenue) },
              ]}
              data={topRev}
              keyExtractor={(p) => p.productId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const EndOfDayScreen = () => {
  const navigate = useNavigate();
  const { data: todayStatus, isLoading } = useTodayEOD();
  const generateMutation = useGenerateEOD();

  const [passcodeVerified, setPasscodeVerified] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<EndOfDaySummary | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const eodAlreadyDone = todayStatus?.exists;
  const existingSummary = todayStatus?.summary;
  const isRegenerating = eodAlreadyDone && !!existingSummary;

  useEffect(() => {
    if (existingSummary && passcodeVerified) {
      reset({
        openingCash: existingSummary.openingCash,
        actualClosingCash: existingSummary.actualClosingCash ?? 0,
      });
    }
  }, [existingSummary, passcodeVerified, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const summary = await generateMutation.mutateAsync({
        openingCash: Number(data.openingCash),
        actualClosingCash: Number(data.actualClosingCash),
        date: data.date || undefined,
      });
      setGeneratedSummary(summary);
    } catch {
      // error tracked via mutation state
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (eodAlreadyDone && existingSummary && !passcodeVerified && !generatedSummary) {
    return (
      <div className="p-6 max-w-5xl">
        <PageHeader title="End of Day" subtitle={`Last run: ${new Date(existingSummary.createdAt).toLocaleTimeString()}`} />
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700 mb-6">
          <p className="font-medium">End of Day was already completed for today.</p>
          <p className="mt-1">If new sales were made after the last EOD, regenerate to include them in the summary.</p>
        </div>
        <SummaryDisplay summary={existingSummary} />
        <div className="mt-6 text-center">
          {showPasscode ? (
            <PasscodeModal
              module="END_OF_DAY"
              onSuccess={() => { setPasscodeVerified(true); setShowPasscode(false); }}
              onCancel={() => setShowPasscode(false)}
            />
          ) : (
            <button onClick={() => setShowPasscode(true)} className="px-6 py-2.5 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 font-medium">
              Regenerate End of Day (include recent sales)
            </button>
          )}
        </div>
      </div>
    );
  }

  if (generatedSummary) {
    return (
      <div className="p-6 max-w-5xl">
        <PageHeader title="End of Day" subtitle="Summary generated successfully" />
        <SummaryDisplay summary={generatedSummary} />
        <button onClick={() => navigate('/end-of-day/history')} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          View History
        </button>
      </div>
    );
  }

  if (!passcodeVerified) {
    return (
      <div className="p-6 max-w-5xl">
        <PageHeader title="End of Day" subtitle="Generate today's summary" />
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500 mb-4">Passcode verification is required to run End of Day.</p>
          {showPasscode ? (
            <PasscodeModal
              module="END_OF_DAY"
              onSuccess={() => { setPasscodeVerified(true); setShowPasscode(false); }}
              onCancel={() => setShowPasscode(false)}
            />
          ) : (
            <button onClick={() => setShowPasscode(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              Verify Passcode
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg">
      <PageHeader title="End of Day" subtitle={isRegenerating ? 'Regenerating — updating with recent sales' : 'Enter cash amounts to reconcile today\'s sales'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-lg border p-6">
        {isRegenerating ? (
          <div className="bg-amber-50 rounded-lg p-4 mb-2">
            <p className="text-sm text-amber-700">
              Regenerating today's EOD. All sales up to now will be included in the new summary. Previous EOD will be replaced.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-4 mb-2">
            <p className="text-sm text-blue-700">
              The system will calculate your expected closing cash from today's sales
              and compare it against what you physically counted.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Business Date</label>
          <p className="text-xs text-gray-400 mb-1.5">Select the date to generate summary for (defaults to today).</p>
          <input
            type="date"
            {...register('date')}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            <span className="flex items-center gap-1.5"><Wallet size={14} /> Opening Cash (start of day) *</span>
          </label>
          <p className="text-xs text-gray-400 mb-1.5">How much cash was in the drawer at the start of the day.</p>
          <input
            type="number" step="0.01" min="0"
            {...register('openingCash', { required: 'Opening cash is required', min: { value: 0, message: 'Must be 0 or more' } })}
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="e.g. 5000"
          />
          {errors.openingCash && <p className="text-red-500 text-xs mt-1">{errors.openingCash.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            <span className="flex items-center gap-1.5"><Coins size={14} /> Cash Counted (end of day) *</span>
          </label>
          <p className="text-xs text-gray-400 mb-1.5">Physically count all cash currently in the drawer.</p>
          <input
            type="number" step="0.01" min="0"
            {...register('actualClosingCash', { required: 'Closing cash count is required', min: { value: 0, message: 'Must be 0 or more' } })}
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="e.g. 16500"
          />
          {errors.actualClosingCash && <p className="text-red-500 text-xs mt-1">{errors.actualClosingCash.message}</p>}
        </div>

        {generateMutation.isError && (
          <p className="text-red-500 text-sm">{((generateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message) || (generateMutation.error as Error)?.message || 'Failed to generate EOD'}</p>
        )}

        <button type="submit" disabled={isSubmitting || generateMutation.isPending} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 font-medium">
          {generateMutation.isPending ? 'Calculating...' : isRegenerating ? 'Update End of Day' : 'Calculate & Generate End of Day'}
        </button>
      </form>
    </div>
  );
};
