import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { useAdjustStock } from '../../hooks/useInventory';
import type { InventoryWithProduct } from '../../types/models';

interface StockAdjustmentModalProps {
  open: boolean;
  inventory: InventoryWithProduct;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  movementType: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
  quantity: number;
  notes: string;
}

export const StockAdjustmentModal = ({
  open,
  inventory,
  onClose,
  onSuccess,
}: StockAdjustmentModalProps) => {
  const adjustMutation = useAdjustStock();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      movementType: 'ADJUSTMENT_IN',
      quantity: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        movementType: 'ADJUSTMENT_IN',
        quantity: undefined,
        notes: '',
      });
    }
  }, [open, reset]);

  const movementType = watch('movementType');
  const quantity = watch('quantity');

  const previewNewStock =
    quantity && quantity > 0
      ? movementType === 'ADJUSTMENT_IN'
        ? inventory.quantityOnHand + quantity
        : inventory.quantityOnHand - quantity
      : inventory.quantityOnHand;

  const isNegativePreview = previewNewStock < 0;

  const onSubmit = (values: FormValues) => {
    adjustMutation.mutate(
      {
        productId: inventory.productId,
        movementType: values.movementType,
        quantity: values.quantity,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  if (!open) return null;

  const product = inventory.product;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-[420px] shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Adjust Stock</h2>

        <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm">
          <p className="font-medium">{product?.name ?? `Product #${inventory.productId}`}</p>
          <p className="text-gray-500 mt-1">
            Current Stock: <span className="font-semibold">{inventory.quantityOnHand}</span>
          </p>
          {inventory.reorderLevel > 0 && (
            <p className="text-gray-500">
              Reorder Level: <span className="font-semibold">{inventory.reorderLevel}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Movement Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  value="ADJUSTMENT_IN"
                  {...register('movementType')}
                  className="accent-blue-600"
                />
                <span className="text-green-700 font-medium">Adjustment In</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  value="ADJUSTMENT_OUT"
                  {...register('movementType')}
                  className="accent-blue-600"
                />
                <span className="text-red-700 font-medium">Adjustment Out</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              step="any"
              min="0.001"
              {...register('quantity', {
                required: 'Quantity is required',
                min: { value: 0.001, message: 'Quantity must be greater than 0' },
                valueAsNumber: true,
              })}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
            )}
          </div>

          <div
            className={`p-3 rounded-md text-sm ${
              isNegativePreview
                ? 'bg-red-50 text-red-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            <p>
              New stock will be:{' '}
              <span className="font-semibold">{previewNewStock}</span>
            </p>
            {isNegativePreview && (
              <p className="text-xs mt-1">
                Warning: Adjustment would result in negative stock
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              {...register('notes')}
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={2}
              placeholder="Optional reason for adjustment"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={adjustMutation.isPending}
              className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                adjustMutation.isPending || isNegativePreview
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {adjustMutation.isPending ? 'Adjusting...' : 'Adjust Stock'}
            </button>
          </div>
        </form>

        {adjustMutation.isError && (
          <p className="text-red-500 text-sm mt-3">
            {adjustMutation.error instanceof AxiosError
              ? (adjustMutation.error.response?.data as any)?.message ?? 'Failed to adjust stock'
              : 'Failed to adjust stock'}
          </p>
        )}
      </div>
    </div>
  );
};
