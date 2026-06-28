import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useSettings } from '../../hooks/useSettings';
import { getCategories } from '../../api/category.api';
import { getVendors } from '../../api/vendor.api';
import { PageHeader } from '../../components/PageHeader';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatCurrency';

interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  unit: string;
  purchasePrice: number;
  purchaseTaxPercent: number;
  salePrice: number;
  description: string;
  categoryId: number;
  vendorId: number | null;
  reorderLevel: number;
  isService: boolean;
  expiryTracking: boolean;
  requiresPrescription: boolean;
}

const UNITS = ['PCS', 'KG', 'G', 'LITER', 'ML', 'BOX', 'PACK', 'SET', 'BOTTLE', 'STRIP', 'TABLET', 'SERVICE'];

export const ProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const userRole = user?.role ?? 'CASHIER';
  const roleHierarchy = ['VIEWER', 'CASHIER', 'MANAGER', 'ADMIN'];
  const canEditProduct = roleHierarchy.indexOf(userRole) >= roleHierarchy.indexOf('MANAGER');

  const { data: product } = useProduct(isEdit ? Number(id) : 0);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: vendorsData } = useQuery({ queryKey: ['vendors'], queryFn: () => getVendors({ limit: 100 }) });
  const vendors = vendorsData?.data ?? [];
  const { data: settings } = useSettings();

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    defaultValues: {
      name: '', sku: '', barcode: '', unit: 'PCS',
      purchasePrice: 0, purchaseTaxPercent: 0, salePrice: 0,
      description: '', categoryId: 0, vendorId: null, reorderLevel: 0,
      isService: false, expiryTracking: false, requiresPrescription: false,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? '',
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        purchaseTaxPercent: product.purchaseTaxPercent,
        salePrice: product.salePrice,
        description: product.description ?? '',
        categoryId: product.categoryId,
        vendorId: product.vendorId ?? null,
        reorderLevel: product.inventory?.reorderLevel ?? 0,
        isService: product.isService,
        expiryTracking: product.expiryTracking,
        requiresPrescription: product.requiresPrescription,
      });
    }
  }, [product, reset]);

  const purchasePrice = watch('purchasePrice');
  const purchaseTaxPercent = watch('purchaseTaxPercent');
  const salePrice = watch('salePrice');
  const costPrice = purchasePrice * (1 + purchaseTaxPercent / 100);
  const profitMargin = salePrice > 0 ? ((salePrice - costPrice) / salePrice) * 100 : 0;
  const showServiceItems = settings?.enableServiceItems ?? false;
  const showExpiryTracking = settings?.enableExpiryTracking ?? false;
  const showPrescriptionField = settings?.enablePrescriptionField ?? false;

  const onSubmit = async (formData: ProductFormData) => {
    const payload = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode || undefined,
      unit: formData.unit,
      purchasePrice: Number(formData.purchasePrice),
      purchaseTaxPercent: Number(formData.purchaseTaxPercent),
      salePrice: Number(formData.salePrice),
      description: formData.description || undefined,
      categoryId: Number(formData.categoryId),
      vendorId: formData.vendorId || undefined,
      reorderLevel: Number(formData.reorderLevel),
      isService: formData.isService,
      expiryTracking: formData.expiryTracking,
      requiresPrescription: formData.requiresPrescription,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: Number(id), payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate('/products');
  };

  if (!canEditProduct) {
    return (
      <div className="p-6">
        <PageHeader title="Access Denied" />
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500 mb-4">Only managers and admins can create or edit products.</p>
          <button onClick={() => navigate('/products')} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Back to Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        actions={
          <button onClick={() => navigate('/products')} className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-gray-50">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl bg-white rounded-lg border p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input {...register('name', { required: 'Name is required' })} className="w-full border rounded-md px-3 py-2 text-sm" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SKU *</label>
            <input {...register('sku', { required: 'SKU is required' })} className="w-full border rounded-md px-3 py-2 text-sm font-mono" />
            {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Barcode</label>
            <input {...register('barcode')} className="w-full border rounded-md px-3 py-2 text-sm font-mono" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select {...register('categoryId', { required: 'Category is required', valueAsNumber: true })} className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">Select category...</option>
              {(categories ?? []).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vendor</label>
            <select {...register('vendorId', { valueAsNumber: true })} className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">No vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select {...register('unit')} className="w-full border rounded-md px-3 py-2 text-sm">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Purchase Price *</label>
            <input {...register('purchasePrice', { required: 'Required', valueAsNumber: true, min: 0 })} type="number" step="0.01" className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Purchase Tax %</label>
            <input {...register('purchaseTaxPercent', { valueAsNumber: true, min: 0 })} type="number" step="0.01" className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Selling Price *</label>
            <input {...register('salePrice', { required: 'Required', valueAsNumber: true, min: 0 })} type="number" step="0.01" className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reorder Level</label>
            <input {...register('reorderLevel', { valueAsNumber: true, min: 0 })} type="number" step="0.01" className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-md p-4 mb-6 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Cost Price</span>
            <p className="font-semibold">{formatCurrency(costPrice)}</p>
          </div>
          <div>
            <span className="text-gray-500">Profit / Unit</span>
            <p className={`font-semibold ${salePrice - costPrice >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(salePrice - costPrice)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Margin %</span>
            <p className={`font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea {...register('description')} rows={3} className="w-full border rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-6 mb-6">
          {showServiceItems && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('isService')} className="rounded" />
              Service item (no stock deduction)
            </label>
          )}
          {showExpiryTracking && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('expiryTracking')} className="rounded" />
              Enable expiry tracking
            </label>
          )}
          {showPrescriptionField && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('requiresPrescription')} className="rounded" />
              Requires prescription
            </label>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
            <Save size={16} />
            {isSubmitting || createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Product'}
          </button>
          <button type="button" onClick={() => navigate('/products')} className="px-6 py-2 border rounded-md text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
