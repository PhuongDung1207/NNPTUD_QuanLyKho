'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, RefreshCw, MoreVertical, ChevronRight, Filter, Save, X, Hash } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories';
import { Category } from '@/types/category';
import { format } from 'date-fns';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Fetch Categories
  const { data: categoriesResponse, isLoading, isFetching } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  const categories = categoriesResponse?.data || [];
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const mutationCreate = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseForm();
    }
  });

  const mutationUpdate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseForm();
    }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
      status: category.status
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '', status: 'active' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      mutationUpdate.mutate({ id: editingCategory._id, data: formData });
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
              <Layers className="text-blue-600" />
              Quản lý Danh mục
            </h1>
            <p className="text-sm text-slate-500 mt-1">Phân loại sản phẩm để quản lý tồn kho hiệu quả hơn.</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            Thêm Danh mục
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
              className="p-2.5 text-slate-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Tên danh mục</th>
                <th className="px-6 py-4 text-center">Mã (Code)</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center">Ngày tạo</th>
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
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Không tìm thấy danh mục nào.</td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {category.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500">
                      <code className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs">{category.code}</code>
                    </td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">
                      {category.description || '---'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                        category.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {category.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {category.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500">
                      {format(new Date(category.createdAt), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Xóa danh mục này?')) mutationDelete.mutate(category._id);
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
              {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </h2>
            <button onClick={handleCloseForm} className="p-2 text-slate-400 hover:bg-gray-50 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                Tên danh mục <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="Ví dụ: Thiết bị điện tử"
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                Mã danh mục <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: ELEC, FASH..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Mô tả</label>
              <textarea
                rows={4}
                placeholder="Nhập mô tả cho danh mục..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Trạng thái</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'active' })}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all border ${
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
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all border ${
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
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                disabled={mutationCreate.isPending || mutationUpdate.isPending}
                className="flex-[2] py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {mutationCreate.isPending || mutationUpdate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Lưu danh mục
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
