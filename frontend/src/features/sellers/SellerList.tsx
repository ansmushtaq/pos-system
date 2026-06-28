import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Clock, LogOut } from 'lucide-react';
import { useUsers, useDeleteUser, useClockIn, useClockOut } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { ConfirmModal } from '../../components/ConfirmModal';
import { RoleGuard } from '../../components/RoleGuard';
import type { User } from '../../types/models';

export const SellerList = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data, isLoading } = useUsers({ page, limit: 20, search: search || undefined, role: roleFilter || undefined });
  const deleteMutation = useDeleteUser();
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const columns = [
    { key: 'fullName', header: 'Full Name' },
    { key: 'username', header: 'Username' },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => {
        const colors: Record<string, string> = { ADMIN: 'bg-red-100 text-red-700', MANAGER: 'bg-blue-100 text-blue-700', CASHIER: 'bg-green-100 text-green-700', VIEWER: 'bg-gray-100 text-gray-600' };
        return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[u.role] || 'bg-gray-100'}`}>{u.role}</span>;
      },
    },
    { key: 'phone', header: 'Phone', render: (u: User) => u.phone || '—' },
    {
      key: 'isActive',
      header: 'Status',
      render: (u: User) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      render: (u: User) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${u.currentShiftStart ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
          {u.currentShiftStart ? 'On Shift' : 'Off'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-36',
      render: (u: User) => (
        <div className="flex gap-1">
          {(currentUser?.id === u.id || currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
            u.currentShiftStart ? (
              <button
                onClick={(e) => { e.stopPropagation(); clockOutMutation.mutate(u.id); }}
                className="p-1.5 hover:bg-orange-50 text-orange-600 rounded"
                title="Clock Out"
                disabled={clockOutMutation.isPending}
              >
                <LogOut size={14} />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); clockInMutation.mutate(u.id); }}
                className="p-1.5 hover:bg-green-50 text-green-600 rounded"
                title="Clock In"
                disabled={clockInMutation.isPending}
              >
                <Clock size={14} />
              </button>
            )
          )}
          <RoleGuard roles={['ADMIN']}>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/users/${u.id}/edit`); }} className="p-1.5 hover:bg-gray-100 rounded" title="Edit">
              <Pencil size={14} />
            </button>
          </RoleGuard>
          <RoleGuard roles={['ADMIN']}>
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(u); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="Delete">
              <Trash2 size={14} />
            </button>
          </RoleGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Users"
        subtitle={data ? `${data.pagination.total} users` : ''}
        actions={
          <RoleGuard roles={['ADMIN']}>
            <button onClick={() => navigate('/users/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              <Plus size={16} /> Add User
            </button>
          </RoleGuard>
        }
      />

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="CASHIER">Cashier</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border">
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              keyExtractor={(u) => u.id}
              onRowClick={(u) => navigate(`/users/${u.id}/shifts`)}
            />
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-gray-500">Page {data.pagination.page} of {data.pagination.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${deleteTarget.fullName}"?`}
          confirmLabel="Delete"
          loading={deleteMutation.isPending}
          onConfirm={() => { deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
