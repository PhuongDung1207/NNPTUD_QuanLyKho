'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, RefreshCw, Filter, Save, X, Globe, ExternalLink, Image as ImageIcon, Hash } from 'lucide-react';
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/api/brands';
import { Brand } from '@/types/brand';
import { format } from 'date-fns';

export default function BrandsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    website: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Fetch Brands
  const { data: brandsResponse, isLoading, isFetching } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getBrands(),
  });

  const brands = brandsResponse?.data || [];
  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  const activeBrands = filteredBrands.filter(b => b.status === 'active');
  const inactiveBrands = filteredBrands.filter(b => b.status !== 'active');

  // Mutations
  const mutationCreate = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      handleCloseForm();
    }
  });

  const mutationUpdate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Brand> }) => updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      handleCloseForm();
    }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    }
  });

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      code: brand.code,
      description: brand.description || '',
      website: brand.website || '',
      status: brand.status
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBrand(null);
    setFormData({ name: '', code: '', description: '', website: '', status: 'active' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrand) {
      mutationUpdate.mutate({ id: editingBrand._id, data: formData });
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
              <Tag className="text-blue-600" />
              Quản lý Thương hiệu
            </h1>
            <p className="text-sm text-slate-500 mt-1">Danh sách các hãng sản xuất và thương hiệu đối tác.</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            Thêm Thương hiệu
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm thương hiệu..."
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['brands'] })}
              className="p-2.5 text-slate-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Brands Tables */}
        <div className="space-y-8 pb-20">
          {/* Active Brands */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Đang hoạt động ({activeBrands.length})
              </h3>
            </div>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Thương hiệu</th>
                  <th className="px-6 py-4 text-center">Mã Hiệu</th>
                  <th className="px-6 py-4">Mô tả / Website</th>
                  <th className="px-6 py-4 text-center text-slate-500">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 h-16 bg-gray-50/20" />
                    </tr>
                  ))
                ) : activeBrands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Không có thương hiệu nào đang hoạt động.</td>
                  </tr>
                ) : (
                  activeBrands.map((brand) => (
                    <tr key={brand._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{brand.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <code className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs">{brand.code}</code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-slate-500 truncate max-w-[200px] leading-none">{brand.description || '---'}</p>
                          {brand.website && (
                            <a href={brand.website} target="_blank" className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline">
                              <Globe size={10} /> {new URL(brand.website).hostname}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500">
                        {format(new Date(brand.createdAt), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            type="button"
                            onClick={() => handleEdit(brand)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} className="pointer-events-none" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Inactive Brands (Archive) */}
          {inactiveBrands.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="h-[1px] flex-1 bg-gray-200"></div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <XCircle size={14} />
                  Danh sách lưu trữ (Inactive)
                </h3>
                <div className="h-[1px] flex-1 bg-gray-200"></div>
              </div>

              <div className="bg-white/50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden backdrop-blur-sm">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-gray-50">
                    {inactiveBrands.map((brand) => (
                      <tr key={brand._id} className="opacity-60 grayscale-[0.5] hover:grayscale-0 transition-all group">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-500 line-through decoration-slate-400 decoration-2">{brand.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <code className="px-2 py-1 bg-slate-50 rounded text-slate-400 font-mono text-[10px] line-through">{brand.code}</code>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-400 text-xs line-through italic">{brand.description || '---'}</p>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-400 text-[10px]">
                          {format(new Date(brand.createdAt), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              type="button"
                              onClick={() => handleEdit(brand)}
                              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Search size={16} className="pointer-events-none" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Side Form Section ── */}
      {isFormOpen && (
        <div className="w-1/3 bg-white rounded-3xl border border-gray-100 shadow-xl p-8 sticky top-0 h-fit space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {editingBrand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
            </h2>
            <button onClick={handleCloseForm} className="p-2 text-slate-400 hover:bg-gray-50 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                Tên thương hiệu <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="Ví dụ: Apple, Samsung, Sony..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                Mã hiệu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: APPL, SMSG..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="url"
                  placeholder="https://example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Mô tả</label>
              <textarea
                rows={3}
                placeholder="Nhập mô tả ngắn về thương hiệu..."
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
                Lưu thương hiệu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
