'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
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
  Phone,
  Mail,
  User as UserIcon,
  MapPin,
  Layout
} from 'lucide-react';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '@/api/warehouses';
import { getUsers } from '@/api/users';
import { Warehouse } from '@/types/warehouse';
import { format } from 'date-fns';

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    manager: '',
    contactPhone: '',
    contactEmail: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Fetch Warehouses
  const { data: warehousesResponse, isLoading, isFetching } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  // Fetch Users (for Manager selection)
  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  const warehouses = warehousesResponse?.data || [];
  const users = usersResponse?.data || [];

  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.code.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const mutationCreate = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      handleCloseForm();
    }
  });

  const mutationUpdate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Warehouse> }) => updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      handleCloseForm();
    }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
  });

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      description: warehouse.description || '',
      manager: typeof warehouse.manager === 'object' ? warehouse.manager?._id : (warehouse.manager || ''),
      contactPhone: warehouse.contactPhone || '',
      contactEmail: warehouse.contactEmail || '',
      status: warehouse.status
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWarehouse(null);
    setFormData({ 
      name: '', 
      code: '', 
      description: '', 
      manager: '', 
      contactPhone: '', 
      contactEmail: '', 
      status: 'active' 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWarehouse) {
      mutationUpdate.mutate({ id: editingWarehouse._id, data: formData });
    } else {
      mutationCreate.mutate(formData);
    }
  };

  return (
    <div className="flex h-full gap-6 animate-in fade-in duration-500">
      {/* ── Main List Section ── */}
      <div className={`flex-1 space-y-6 transition-all duration-300 ${isFormOpen ? 'w-2/3' : 'w-full'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="text-blue-600" />
              Quản lý Kho bãi
            </h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý các địa điểm lưu kho và sức chứa vận hành.</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            Thêm Kho mới
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã kho hoặc tên..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all"
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['warehouses'] })}
              className="p-2.5 text-slate-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Warehouses Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Kho hàng</th>
                <th className="px-6 py-4">Người quản lý</th>
                <th className="px-6 py-4">Liên lạc</th>
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
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Không tìm thấy kho hàng nào.</td>
                </tr>
              ) : (
                filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 font-bold text-xs">
                          <Layout size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{warehouse.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono tracking-wider">{warehouse.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <UserIcon size={14} />
                        </div>
                        <span className="text-slate-600 font-medium">
                          {typeof warehouse.manager === 'object' ? warehouse.manager?.fullName : 'Chưa chỉ định'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-slate-500">
                        {warehouse.contactPhone && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Phone size={12} className="text-slate-400" /> {warehouse.contactPhone}
                          </span>
                        )}
                        {warehouse.contactEmail && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Mail size={12} className="text-slate-400" /> {warehouse.contactEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                        warehouse.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {warehouse.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {warehouse.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(warehouse)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Xóa kho hàng này?')) mutationDelete.mutate(warehouse._id);
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
              {editingWarehouse ? 'Cập nhật kho hàng' : 'Thêm kho hàng mới'}
            </h2>
            <button onClick={handleCloseForm} className="p-2 text-slate-400 hover:bg-gray-50 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên kho */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                Tên kho <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Kho Tổng Miền Bắc"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* Mã kho */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                Mã kho (Code) <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="Ví dụ: WH_NORTH_01"
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium uppercase"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>

            {/* Manager Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Người quản lý</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium appearance-none"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                >
                  <option value="">Chọn người quản lý...</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.fullName || user.username}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">SĐT Liên hệ</label>
                <input
                  type="tel"
                  placeholder="09..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Email</label>
                <input
                  type="email"
                  placeholder="wh@company.com"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase text-slate-400">Mô tả chi tiết</label>
              <textarea
                rows={3}
                placeholder="Vị trí, sức chứa, ghi chú..."
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Trạng thái vận hành</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'active' })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                    formData.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-white text-slate-400 border-gray-100'
                  }`}
                >
                  <CheckCircle2 size={16} /> Hoạt động
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'inactive' })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                    formData.status === 'inactive' 
                      ? 'bg-slate-100 text-slate-600 border-slate-200' 
                      : 'bg-white text-slate-400 border-gray-100'
                  }`}
                >
                  <XCircle size={16} /> Tạm dừng
                </button>
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
                Lưu kho hàng
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
