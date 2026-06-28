import { calculateChange } from '../../utils/calculateChange';
import { formatCurrency } from '../../utils/formatCurrency';

interface CashCalculatorProps {
  total: number;
  tendered: number;
  onTenderedChange: (amount: number) => void;
}

const QUICK_BUTTONS = [500, 1000, 2000, 5000];

export const CashCalculator = ({ total, tendered, onTenderedChange }: CashCalculatorProps) => {
  const { change, isInsufficient } = calculateChange(tendered, total);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {QUICK_BUTTONS.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => onTenderedChange(tendered + amt)}
            className="flex-1 px-2 py-2 border rounded-md text-sm hover:bg-blue-50 hover:border-blue-300"
          >
            {formatCurrency(amt)}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onTenderedChange(total)}
          className="flex-1 px-2 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 hover:bg-green-100"
        >
          Exact ({formatCurrency(total)})
        </button>
        <button
          type="button"
          onClick={() => onTenderedChange(0)}
          className="flex-1 px-2 py-2 bg-gray-50 border rounded-md text-sm text-gray-500 hover:bg-gray-100"
        >
          Clear
        </button>
      </div>
      {tendered > 0 && (
        <div className={`p-3 rounded-md text-center ${isInsufficient ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <p className="text-sm">{isInsufficient ? 'Insufficient' : 'Change'}</p>
          <p className="text-xl font-bold">{isInsufficient ? formatCurrency(-change) : formatCurrency(change)}</p>
        </div>
      )}
    </div>
  );
};
