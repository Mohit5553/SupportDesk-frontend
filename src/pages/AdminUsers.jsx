import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    Users as UsersIcon, Search, Filter, Mail, Phone,
    ShieldAlert, UserCheck, Shield, ChevronLeft, ChevronRight, UserX
} from 'lucide-react';
import API from '../lib/axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Avatar from '../components/ui/Avatar';
import { formatDate } from '../lib/utils';
import { RoleBadge } from '../components/ui/Badge';

const AdminUsers = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', page, search, role],
        queryFn: async () => {
            const res = await API.get('/admin/users', {
                params: { page, limit: 15, search, role }
            });
            return res.data;
        },
        keepPreviousData: true,
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, updates }) => {
            const res = await API.put(`/admin/users/${id}`, updates);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success('User updated successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update user');
        },
    });

    const handleRoleChange = (id, newRole) => {
        updateUserMutation.mutate({ id, updates: { role: newRole } });
    };

    const handleStatusChange = (id, isActive) => {
        updateUserMutation.mutate({ id, updates: { isActive } });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-primary-400" />
                        User Management
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage platform users, roles, and permissions</p>
                </div>
                <div className="bg-primary-500/10 border border-primary-500/20 text-primary-400 px-4 py-2 rounded-xl text-sm font-medium">
                    Total Users: {data?.total || 0}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="form-input pl-10 h-10 py-2 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={role}
                        onChange={(e) => { setRole(e.target.value); setPage(1); }}
                        className="form-input h-10 py-2 text-sm w-48"
                    >
                        <option value="">All Roles</option>
                        <option value="customer">Customers</option>
                        <option value="agent">Agents</option>
                        <option value="manager">Managers</option>
                        <option value="admin">Administrators</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <LoadingSpinner text="Loading users..." />
                ) : data?.users?.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No users found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-white/10 text-sm text-slate-400 bg-black/20">
                                    <th className="p-4 font-medium">User Details</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Joined</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.users.map((u) => (
                                    <tr key={u._id} className="table-row-hover">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={u.name} size="md" />
                                                <div>
                                                    <p className="text-slate-200 font-medium">{u.name}</p>
                                                    <p className="text-slate-500 text-sm flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <RoleBadge role={u.role} />
                                        </td>
                                        <td className="p-4">
                                            {u.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                    <UserCheck className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                                                    <UserX className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">
                                            {formatDate(u.createdAt)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <select
                                                    className="form-input bg-dark-900 border-white/5 py-1.5 px-3 text-sm min-w-[120px]"
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                >
                                                    <option value="customer">Customer</option>
                                                    <option value="agent">Agent</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="admin">Admin</option>
                                                </select>

                                                <button
                                                    onClick={() => handleStatusChange(u._id, !u.isActive)}
                                                    className={`btn-secondary px-3 py-1.5 text-xs whitespace-nowrap ${u.isActive ? 'hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30' : 'hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30'
                                                        }`}
                                                >
                                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
