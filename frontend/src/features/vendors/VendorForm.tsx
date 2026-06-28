import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useVendor, useCreateVendor, useUpdateVendor } from '../../hooks/useVendors';
import { PageHeader } from '../../components/PageHeader';

interface VendorFormData {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export const VendorForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: vendor, isLoading: loadingVendor } = useVendor(Number(id));
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<VendorFormData>();

  useEffect(() => {
    if (vendor && isEdit) {
      reset({
        name: vendor.name || '',
        contactName: vendor.contactName || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        address: vendor.address || '',
      });
    }
  }, [vendor, isEdit, reset]);

  const onSubmit = async (data: VendorFormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(
          { id: Number(id), payload: { name: data.name, contactName: data.contactName || undefined, phone: data.phone || undefined, email: data.email || undefined, address: data.address || undefined } },
          { onSuccess: () => navigate('/vendors') },
        );
      } else {
        await createMutation.mutateAsync(
          { name: data.name, contactName: data.contactName || undefined, phone: data.phone || undefined, email: data.email || undefined, address: data.address || undefined },
          { onSuccess: () => navigate('/vendors') },
        );
      }
    } catch (err) {
      console.error('VendorForm submit error:', err);
    }
  };

  if (isEdit && loadingVendor) return <p className="text-gray-500 text-center py-8">Loading...</p>;

  return (
    <div className="p-6 max-w-lg">
      <PageHeader title={isEdit ? 'Edit Vendor' : 'New Vendor'} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-lg border p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input {...register('name', { required: 'Name is required' })} className="w-full px-3 py-2 border rounded-md text-sm" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact Name</label>
          <input {...register('contactName')} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input {...register('phone')} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register('email', { pattern: { value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} className="w-full px-3 py-2 border rounded-md text-sm" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input {...register('address')} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-red-500 text-sm">{((createMutation.error || updateMutation.error) as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save'}</p>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Vendor' : 'Create Vendor'}
          </button>
          <button type="button" onClick={() => navigate('/vendors')} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
};
