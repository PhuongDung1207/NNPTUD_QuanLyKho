'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Filter,
  Save,
  X,
  Shield,
  Mail,
  User as UserIcon,
  Key,
  Lock
} from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '@/api/users';
import { getRoles } from '@/api/roles';
import { User, Role } from '@/types/auth';
import { format } from 'date-fns';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: '',
    status: 'active' as 'active' | 'inactive' | 'locked'
  });

  // Fetch Users
  const { data: usersResponse, isLoading, isFetching } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  // Fetch Roles for selection
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles(),
  });

  const users = usersResponse?.data || [];
  const roles = rolesResponse?.data || [];

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const mutationCreate = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseForm();
    }
  });

  const mutationUpdate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseForm();
    }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      password: '', // Don't populate password
      role: typeof user.role === 'object' ? user.role?._id : (user.role || ''),
      status: user.status as any
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setFormData({ 
      username: '', 
      email: '', 
      fullName: '', 
      password: '', 
      role: '', 
      status: 'active' 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // Remove password if empty during update
      const payload = { ...formData };
      if (!payload.password) delete (payload as any).password;
      mutationUpdate.mutate({ id: editingUser._id || editingUser.id, data: payload as any });
    } else {
      mutationCreate.mutate(formData as any);
    }
  };

  return (
    <div className="flex h-full gap-6 animate-in fade-in duration-500">
      {/* ── Main List Section ── */}
      <div className={`flex-1 space-y-6 transition-all duration-300 ${isFormOpen ? 'w-2/3' : 'w-full'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" />
              Quản lý Nhân sự
            </h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý đội ngũ vận hành và phân quyền truy cập hệ thống.</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            Mời nhân viên
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc tài khoản..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Filter size={16} />
              Bộ lọc
            </button>
             <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
              className="p-2.5 text-slate-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Tài khoản & Email</th>
                <th className="px-6 py-4 text-center">Vai trò</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4 h-16 bg-gray-50/20" />
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Không tìm thấy nhân viên nào.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id || u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                          {u.fullName?.charAt(0).toUpperCase() || u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{u.fullName || 'Chưa cập nhật tên'}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Tham gia: {format(new Date(), 'dd/MM/yyyy')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-700 font-bold flex items-center gap-1.5">
                          <UserIcon size={12} className="text-slate-400" />
                          {u.username}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Mail size={12} />
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
                        <Shield size={12} />
                        {typeof u.role === 'object' ? u.role?.name : u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                        u.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : u.status === 'locked' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {u.status === 'active' ? <CheckCircle2 size={12} /> : u.status === 'locked' ? <Lock size={12} /> : <XCircle size={12} />}
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(u)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Xóa nhân viên này khỏi hệ thống?')) mutationDelete.mutate(u._id || u.id);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Side Form Section ── */}
      {isFormOpen && (
        <div className="w-1/3 bg-white rounded-3xl border border-gray-100 shadow-xl p-8 sticky top-0 h-fit space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {editingUser ? 'Sửa thông tin nhân sự' : 'Mời nhân sự mới'}
            </h2>
            <button onClick={handleCloseForm} className="p-2 text-slate-400 hover:bg-gray-50 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Họ tên */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Họ và tên</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* Tài khoản */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Username <span className="text-rose-500">*</span></label>
                <input
                  required
                  disabled={!!editingUser}
                  type="text"
                  placeholder="van_a"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium disabled:opacity-50"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              {/* Vai trò */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Vai trò <span className="text-rose-500">*</span></label>
                <select
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium appearance-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="">Chọn vai trò...</option>
                  {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Email liên hệ <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  required
                  type="email"
                  placeholder="a.nguyen@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                {editingUser ? 'Đổi mật khẩu (Bỏ trống nếu không đổi)' : 'Mật khẩu khởi tạo'}
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  required={!editingUser}
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Trạng thái */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Trạng thái tài khoản</label>
              <div className="grid grid-cols-3 gap-2">
                {['active', 'inactive', 'locked'].map((status) => (
                   <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: status as any })}
                    className={`text-[10px] font-bold py-2.5 rounded-xl border transition-all ${
                      formData.status === status 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                        : 'bg-white text-slate-400 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button"
                onClick={handleCloseForm}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={mutationCreate.isPending || mutationUpdate.isPending}
                className="flex-[2] py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {mutationCreate.isPending || mutationUpdate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                {editingUser ? 'Cập nhật' : 'Xác nhận tạo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
