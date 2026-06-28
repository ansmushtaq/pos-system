import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUser, useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { PageHeader } from '../../components/PageHeader';

interface UserFormData {
  fullName: string;
  username: string;
  password: string;
  role: string;
  phone: string;
}

export const UserForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: user, isLoading: loadingUser } = useUser(Number(id));
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserFormData>();

  useEffect(() => {
    if (user && isEdit) {
      reset({
        fullName: user.fullName || '',
        username: user.username || '',
        password: '',
        role: user.role || 'CASHIER',
        phone: user.phone || '',
      });
    }
  }, [user, isEdit, reset]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(
          {
            id: Number(id),
            payload: {
              fullName: data.fullName,
              username: data.username,
              password: data.password || undefined,
              role: data.role,
              phone: data.phone || undefined,
            },
          },
          { onSuccess: () => navigate('/users') },
        );
      } else {
        await createMutation.mutateAsync(
          {
            fullName: data.fullName,
            username: data.username,
            password: data.password,
            role: data.role,
            phone: data.phone || undefined,
          },
          { onSuccess: () => navigate('/users') },
        );
      }
    } catch {
      // mutation error is tracked via mutation.isError state
    }
  };

  if (isEdit && loadingUser) {
    return <p className="text-gray-500 text-center py-8">Loading...</p>;
  }

  return (
    <div className="p-6 max-w-lg">
      <PageHeader title={isEdit ? 'Edit User' : 'New User'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-lg border p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <input {...register('fullName', { required: 'Full name is required' })} className="w-full px-3 py-2 border rounded-md text-sm" />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Username *</label>
          <input {...register('username', { required: 'Username is required', minLength: { value: 3, message: 'At least 3 characters' } })} className="w-full px-3 py-2 border rounded-md text-sm" />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
          <input type="password" {...register('password', isEdit ? {} : { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })} className="w-full px-3 py-2 border rounded-md text-sm" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role *</label>
          <select {...register('role', { required: 'Role is required' })} className="w-full px-3 py-2 border rounded-md text-sm">
            <option value="CASHIER">Cashier</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
            <option value="VIEWER">Viewer</option>
          </select>
          {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input {...register('phone')} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>

        {createMutation.isError && (
          <p className="text-red-500 text-sm">{((createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message) || (createMutation.error as Error)?.message || 'Failed to create user'}</p>
        )}
        {updateMutation.isError && (
          <p className="text-red-500 text-sm">{((updateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message) || (updateMutation.error as Error)?.message || 'Failed to update user'}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
          </button>
          <button type="button" onClick={() => navigate('/users')} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
