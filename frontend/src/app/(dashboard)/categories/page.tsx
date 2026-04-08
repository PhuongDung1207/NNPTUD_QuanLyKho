'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers, Plus, Edit2, Trash2, CheckCircle2, XCircle, RefreshCw, X, Save, Hash, Search
} from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories';
import { Category } from '@/types/category';

const EMPTY_FORM = { name: '', code: '', description: '', parent: '', status: 'active' as 'active' | 'inactive' };

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // Fetch
  const { data: categoriesResponse, isLoading, isFetching } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  const categories: Category[] = categoriesResponse?.data || [];

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: categories.length,
    active: categories.filter(c => c.status === 'active').length,
    inactive: categories.filter(c => c.status === 'inactive').length,
  };

  // Mutations
  const mutationCreate = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); handleClose(); }
  });

  const mutationUpdate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => updateCategory(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); handleClose(); }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  const handleOpen = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        code: category.code,
        description: category.description || '',
        parent: typeof category.parent === 'object' ? (category.parent as Category)._id : (category.parent || ''),
        status: category.status,
      });
    } else {
      setEditingCategory(null);
      setFormData({ ...EMPTY_FORM });
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ ...EMPTY_FORM });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      status: formData.status,
      ...(formData.parent ? { parent: formData.parent } : {}),
    };
    if (editingCategory) {
      mutationUpdate.mutate({ id: editingCategory._id, data: payload });
    } else {
      mutationCreate.mutate(payload);
    }
  };

  const getParentName = (category: Category): string => {
    if (!category.parent) return '—';
    if (typeof category.parent === 'object') return (category.parent as Category).name;
    const found = categories.find(c => c._id === category.parent);
    return found ? found.name : '—';
  };

  const isPending = mutationCreate.isPending || mutationUpdate.isPending;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-blue-600" />
            Danh mục Sản phẩm
          </h1>
          <p className="text-sm text-slate-500 mt-1">Tổ chức sản phẩm theo nhóm phân cấp để theo dõi hiệu quả hơn.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm tên, mã danh mục..."
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-white text-sm outline-none focus:ring-4 focus:ring-blue-500/10 w-56 shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
            className="p-2 border border-gray-100 bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => handleOpen()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} />
            Thêm Danh mục
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tổng danh mục</p>
          <p className="text-3xl font-black text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Đang hoạt động</p>
          <p className="text-3xl font-black text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tạm dừng / Lưu trữ</p>
          <p className="text-3xl font-black text-slate-500">{stats.inactive}</p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Tên danh mục</th>
                <th className="px-6 py-4">Mã (Code)</th>
                <th className="px-6 py-4">Danh mục cha</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-5"><div className="h-5 bg-slate-50 rounded w-3/4" /></td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 italic">
                    Không tìm thấy danh mục nào.
                  </td>
                </tr>
              ) : filteredCategories.map(category => (
                <tr key={category._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm border border-blue-100">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{category.name}</div>
                        {category.description && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{category.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600 font-mono text-xs font-bold">
                      {category.code}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    {getParentName(category) === '—' ? (
                      <span className="text-slate-400 text-xs italic">Cấp gốc</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">
                        <Layers size={10} />
                        {getParentName(category)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                      category.status === 'active'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {category.status === 'active' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {category.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpen(category)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Xóa danh mục "${category.name}"?`)) mutationDelete.mutate(category._id); }}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingCategory ? 'Chỉnh sửa Danh mục' : 'Tạo Danh mục Mới'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {editingCategory ? `Đang sửa: ${editingCategory.name}` : 'Điền thông tin bên dưới để tạo nhóm mới.'}
                </p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* Name + Code */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tên danh mục <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Điện tử"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mã (Code) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="VD: CAT-MOB"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-mono uppercase transition-all"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              </div>

              {/* Parent Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Danh mục cha <span className="text-slate-400 font-normal">(Tuỳ chọn)</span></label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-sm cursor-pointer transition-all appearance-none"
                  value={formData.parent}
                  onChange={e => setFormData({ ...formData, parent: e.target.value })}
                >
                  <option value="">Không có (Cấp gốc)</option>
                  {categories
                    .filter(c => c._id !== editingCategory?._id)
                    .map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))
                  }
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mô tả <span className="text-slate-400 font-normal">(Tuỳ chọn)</span></label>
                <textarea
                  rows={3}
                  placeholder="Mô tả ngắn về danh mục này..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-sm resize-none transition-all"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Status toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Trạng thái</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      formData.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-gray-100'
                    }`}
                  >
                    <CheckCircle2 size={16} /> Hoạt động
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'inactive' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      formData.status === 'inactive' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white text-slate-400 border-gray-100'
                    }`}
                  >
                    <XCircle size={16} /> Tạm dừng
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-[2] py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingCategory ? 'Lưu thay đổi' : 'Tạo Danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
