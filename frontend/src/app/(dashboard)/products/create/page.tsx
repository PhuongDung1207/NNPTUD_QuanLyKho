'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Save, 
  X, 
  Package, 
  DollarSign, 
  Layers, 
  Tag, 
  Building2, 
  Info,
  ChevronLeft,
  Truck,
  Box,
  Layout,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { createProduct } from '@/api/products';
import { getCategories } from '@/api/categories';
import { getBrands } from '@/api/brands';
import { getUnits } from '@/api/units';
import { Product } from '@/types/products';

export default function CreateProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category: undefined,
    brand: undefined,
    uom: undefined,
    status: 'draft',
    tracking: 'none',
    price: {
      cost: 0,
      sale: 0,
      wholesale: 0
    },
    // Dimensions not in base Type but in Schema, adding for robustness
    // @ts-ignore
    dimensions: {
      weight: 0,
      length: 0,
      width: 0,
      height: 0
    }
  });

  // Fetch Auxiliary Data
  const { data: categoriesResponse } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories() });
  const { data: brandsResponse } = useQuery({ queryKey: ['brands'], queryFn: () => getBrands() });
  const { data: unitsResponse } = useQuery({ queryKey: ['units'], queryFn: () => getUnits() });

  const categories = categoriesResponse?.data || [];
  const brands = brandsResponse?.data || [];
  const units = unitsResponse?.data || [];

  // Mutation
  const mutationCreate = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/products');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutationCreate.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 transition-all text-slate-400 hover:text-blue-600 shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Thêm Sản phẩm Mới</h1>
            <p className="text-sm text-slate-500">Thiết lập thông tin sản phẩm và cấu hình tồn kho cơ bản.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => router.push('/products')}
             className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
           >
             Hủy bỏ
           </button>
           <button 
             onClick={handleSubmit}
             disabled={mutationCreate.isPending}
             className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
           >
             {mutationCreate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
             Lưu Sản phẩm
           </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ── Section 1: Thông tin cơ bản ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
            <Info size={16} className="text-blue-500" />
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thông tin chung</h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Tên sản phẩm <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: iPhone 16 Pro Max 256GB"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Mã sản phẩm (SKU) <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="IP16PM-BLK-256"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium uppercase"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Mã vạch (Barcode)</label>
                <input
                  type="text"
                  placeholder="893000000001"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Trạng thái định dạng</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all border ${
                      formData.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-white text-slate-400 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2 size={14} /> Hoạt động
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all border ${
                      formData.status === 'draft' 
                        ? 'bg-amber-50 text-amber-600 border-amber-200' 
                        : 'bg-white text-slate-400 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <RefreshCw size={14} /> Bản nháp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Phân loại & Đặc tính ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
            <Layers size={16} className="text-violet-500" />
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phân loại & Thuộc tính</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase ml-1">Danh mục</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium appearance-none"
                value={formData.category as any}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="">Chọn danh mục...</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase ml-1">Thương hiệu</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium appearance-none"
                value={formData.brand as any}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value as any })}
              >
                <option value="">Chọn thương hiệu...</option>
                {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase ml-1">Đơn vị tính (UOM)</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium appearance-none"
                value={formData.uom as any}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value as any })}
              >
                <option value="">Chọn đơn vị...</option>
                {units.map(u => <option key={u._id} value={u._id}>{u.name} ({u.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 3: Giá cả ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-500" />
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cấu hình giá (VNĐ)</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase ml-1">Giá nhập (Cost)</label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold text-emerald-600 text-right"
                value={formData.price?.cost}
                onChange={(e) => setFormData({ ...formData, price: { ...formData.price!, cost: Number(e.target.value) } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase ml-1">Giá bán lẻ (Sale)</label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold text-blue-600 text-right"
                value={formData.price?.sale}
                onChange={(e) => setFormData({ ...formData, price: { ...formData.price!, sale: Number(e.target.value) } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase ml-1">Giá bán buôn</label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold text-violet-600 text-right"
                value={formData.price?.wholesale}
                onChange={(e) => setFormData({ ...formData, price: { ...formData.price!, wholesale: Number(e.target.value) } })}
              />
            </div>
          </div>
        </div>

        {/* ── Section 4: Theo dõi tồn kho & Kích thước ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="bg-slate-50/50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
               <Box size={16} className="text-rose-500" />
               <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hình thức theo dõi</h2>
             </div>
             <div className="p-8 space-y-4">
                <p className="text-xs text-slate-400">Chọn cách thức hệ thống quản lý các đơn vị hàng hóa này.</p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tracking: 'none' })}
                    className={`flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all border ${
                      formData.tracking === 'none' 
                        ? 'bg-blue-50 text-blue-600 border-blue-200' 
                        : 'bg-white text-slate-400 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <span>Không theo dõi chi tiết</span>
                    {formData.tracking === 'none' && <CheckCircle2 size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tracking: 'lot' })}
                    className={`flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all border ${
                      formData.tracking === 'lot' 
                        ? 'bg-blue-50 text-blue-600 border-blue-200' 
                        : 'bg-white text-slate-400 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <span>Theo dõi theo Lô (Batch/Lot)</span>
                    {formData.tracking === 'lot' && <CheckCircle2 size={16} />}
                  </button>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-amber-700 leading-normal">
                    Lô (Batch/Lot) áp dụng cho hàng có ngày hết hạn hoặc sản xuất theo đợt.
                  </p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="bg-slate-50/50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
               <Truck size={16} className="text-slate-500" />
               <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kích thước vận chuyển</h2>
             </div>
             <div className="p-8 grid grid-cols-2 gap-4">
               {/* @ts-ignore */}
               {[ { l: 'Cân nặng (g)', k: 'weight' }, { l: 'Chiều dài (cm)', k: 'length' }, { l: 'Chiều rộng (cm)', k: 'width' }, { l: 'Chiều cao (cm)', k: 'height' } ].map(dim => (
                 <div key={dim.k} className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">{dim.l}</label>
                   <input
                     type="number"
                     className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold text-slate-700"
                     // @ts-ignore
                     value={formData.dimensions?.[dim.k]}
                     // @ts-ignore
                     onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions!, [dim.k]: Number(e.target.value) } })}
                   />
                 </div>
               ))}
             </div>
          </div>
        </div>

      </form>
    </div>
  );
}
