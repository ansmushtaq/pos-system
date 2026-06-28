import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { useCreatePO } from '../../hooks/usePurchaseOrders';
import { useVendors } from '../../hooks/useVendors';
import { useProducts } from '../../hooks/useProducts';
import { PageHeader } from '../../components/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';

interface LineItem {
  productId: number;
  productName: string;
  orderedQty: number;
  unitCost: number;
}

interface POFormData {
  vendorId: number;
  notes: string;
  items: LineItem[];
}

export const POForm = () => {
  const navigate = useNavigate();
  const createMutation = useCreatePO();
  const [vendorSearch, setVendorSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const { data: vendorsData } = useVendors({ search: vendorSearch || undefined, limit: 10 });
  const { data: productsData } = useProducts({ search: productSearch || undefined, limit: 10 });

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<POFormData>({
    defaultValues: { vendorId: 0, notes: '', items: [] },
  });
  const { fields, append, remove, update } = useFieldArray({ control, name: 'items' });
  const selectedVendorId = watch('vendorId');

  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const addItem = (product: { id: number; name: string; purchasePrice: number }) => {
    const existingIdx = fields.findIndex((f) => f.productId === product.id);
    if (existingIdx >= 0) {
      update(existingIdx, { ...fields[existingIdx], orderedQty: (fields[existingIdx].orderedQty || 0) + 1 });
    } else {
      append({ productId: product.id, productName: product.name, orderedQty: 1, unitCost: product.purchasePrice });
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const totalAmount = (watch('items') || []).reduce((sum, i) => sum + (i.orderedQty || 0) * (i.unitCost || 0), 0);

  const onSubmit = async (data: POFormData) => {
    const submittedItems = (data.items || []).filter((i) => i.productId && (i.orderedQty || 0) > 0);
    if (submittedItems.length === 0) return;
    try {
      await createMutation.mutateAsync({
        vendorId: Number(data.vendorId),
        items: submittedItems.map((i) => ({ productId: i.productId, orderedQty: Math.max(1, i.orderedQty || 1), unitCost: Math.max(0, i.unitCost || 0) })),
        notes: data.notes || undefined,
      }, { onSuccess: () => navigate('/purchase-orders') });
    } catch (err) { console.error('POForm submit error:', err); }
  };

  const selectedVendor = vendorsData?.data?.find((v) => v.id === Number(selectedVendorId));

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="New Purchase Order" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-lg border p-6">
        <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setShowVendorDropdown(false); }}>
          <label className="block text-sm font-medium mb-1">Vendor *</label>
          <input type="hidden" {...register('vendorId', { required: 'Vendor is required' })} />
          <input
            type="text" placeholder="Search vendor..." value={vendorSearch}
            onChange={(e) => { setVendorSearch(e.target.value); setShowVendorDropdown(true); }}
            onFocus={() => setShowVendorDropdown(true)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          {selectedVendor && <p className="text-sm text-green-600 mt-1">{selectedVendor.name}</p>}
          {showVendorDropdown && vendorsData?.data && vendorsData.data.length > 0 && (
            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
              {vendorsData.data.map((v) => (
                <button key={v.id} type="button" onClick={() => { setValue('vendorId', v.id); setVendorSearch(v.name); setShowVendorDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{v.name}</button>
              ))}
            </div>
          )}
          {errors.vendorId && <p className="text-red-500 text-xs mt-1">{errors.vendorId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input {...register('notes')} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Items</h3>
            <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setShowProductDropdown(false); }}>
              <button type="button" onClick={() => setShowProductDropdown(!showProductDropdown)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100">
                <Plus size={14} /> Add Item
              </button>
              {showProductDropdown && (
                <div className="absolute right-0 z-10 w-72 bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  <input type="text" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full px-3 py-2 border-b text-sm sticky top-0 bg-white" autoFocus />
                  {productsData?.data?.map((p) => (
                    <button key={p.id} type="button" onClick={() => addItem(p)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between">
                      <span>{p.name}</span>
                      <span className="text-gray-400">{formatCurrency(p.purchasePrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {fields.length > 0 ? (
            <div className="space-y-2">
              {fields.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                  </div>
                  <input type="number" min="1" {...register(`items.${idx}.orderedQty`, { valueAsNumber: true, min: 1 })}
                    className="w-16 px-2 py-1 border rounded text-sm text-center" />
                  <input type="number" step="0.01" min="0" {...register(`items.${idx}.unitCost`, { valueAsNumber: true, min: 0 })}
                    className="w-24 px-2 py-1 border rounded text-sm text-right" />
                  <p className="w-20 text-right text-sm">{formatCurrency((watch('items')?.[idx]?.orderedQty || 0) * (watch('items')?.[idx]?.unitCost || 0))}</p>
                  <button type="button" onClick={() => remove(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                </div>
              ))}
              <div className="flex justify-between font-medium text-sm pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No items added yet</p>
          )}
        </div>

        {createMutation.isError && (
          <p className="text-red-500 text-sm">{((createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message) || 'Failed to create PO'}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting || fields.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
          </button>
          <button type="button" onClick={() => navigate('/purchase-orders')} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
};
