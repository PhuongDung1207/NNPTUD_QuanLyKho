'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  Archive,
  X,
  PlusCircle,
  Save
} from 'lucide-react';
import { getProducts, deleteProduct, createProduct, updateProduct } from '@/api/products';
import { getCategories } from '@/api/categories';
import { getBrands } from '@/api/brands';
import { getSuppliers } from '@/api/suppliers';
import { getUnits } from '@/api/units';
import { getWarehouses } from '@/api/warehouses';
import { getVariantsByProduct, createVariant, deleteVariant } from '@/api/product-variants';
import { Product, ProductFilterParams } from '@/types/products';

const EMPTY_PRODUCT_FORM = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  brand: '',
  uom: '',
  supplier: '',
  status: 'active' as const,
  price: { cost: 0, sale: 0, wholesale: 0 },
  warehouse: '',
  initialQuantity: 0
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProductFilterParams>({ page: 1, limit: 10, search: '', category: '', brand: '', status: '' });
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalVariantsOpen, setIsModalVariantsOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<any>(null);
  const [quickVariantAttr, setQuickVariantAttr] = useState('');

  // Fetching
  const { data: productsResult, isLoading, isFetching } = useQuery({ queryKey: ['products', filters], queryFn: () => getProducts(filters) });
  const { data: categoriesResult } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories() });
  const { data: brandsResult } = useQuery({ queryKey: ['brands'], queryFn: () => getBrands() });
  const { data: suppliersResult } = useQuery({ queryKey: ['suppliers'], queryFn: () => getSuppliers() });
  const { data: unitsResult } = useQuery({ queryKey: ['units'], queryFn: () => getUnits() });
  const { data: warehousesResult } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses() });
  const { data: variantsResult, isLoading: isLoadingVariants } = useQuery({
    queryKey: ['product-variants', selectedProductForVariants?._id],
    queryFn: () => getVariantsByProduct(selectedProductForVariants!._id),
    enabled: !!selectedProductForVariants?._id
  });

  const products: any[] =
    Array.isArray((productsResult as any)?.data)
      ? ((productsResult as any).data as any[])
      : (productsResult as any)?.data?.docs || [];

  const totalPages =
    (productsResult as any)?.pagination?.totalPages ||
    (productsResult as any)?.data?.totalPages ||
    1;
  const categories = categoriesResult?.data || [];
  const brands = brandsResult?.data || [];
  const suppliers = suppliersResult?.data || [];
  const units = unitsResult?.data || [];
  const warehouses = warehousesResult?.data || [];
  const variants = variantsResult?.data || [];

  // Mutations
  const mutationDelete = useMutation({ mutationFn: deleteProduct, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }) });
  const mutationCreate = useMutation({ mutationFn: createProduct, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setIsModalCreateOpen(false); } });
  const mutationUpdate = useMutation({ mutationFn: ({ id, data }: { id: string, data: any }) => updateProduct(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setEditingProduct(null); } });
  const mutationAddVariant = useMutation({ 
    mutationFn: (payload: any) => createVariant(selectedProductForVariants!._id, payload), 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['product-variants', selectedProductForVariants?._id] }); setQuickVariantAttr(''); } 
  });
  const mutationDeleteVariant = useMutation({ mutationFn: deleteVariant, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product-variants', selectedProductForVariants?._id] }) });

  const handleOpenEdit = (product: Product) => { setEditingProduct(product); };
  const handleCloseModals = () => { setIsModalCreateOpen(false); setEditingProduct(null); };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const g = (key: string) => (formData.get(key) as string) || undefined;
    const payload: any = {
      name: g('name'), sku: g('sku'), barcode: g('barcode'),
      category: g('category'), brand: g('brand'), uom: g('uom'),
      supplier: g('supplier'), status: g('status'),
      price: { cost: Number(g('price.cost')) || 0, sale: Number(g('price.sale')) || 0, wholesale: Number(g('price.wholesale')) || 0 },
      warehouse: g('warehouse'), initialQuantity: Number(g('initialQuantity')) || 0
    };
    if (editingProduct) mutationUpdate.mutate({ id: editingProduct._id, data: payload });
    else mutationCreate.mutate(payload);
  };

  const statusColors: Record<string, string> = { active: 'bg-emerald-50 text-emerald-600 border-emerald-100', draft: 'bg-amber-50 text-amber-600 border-amber-100', inactive: 'bg-slate-50 text-slate-500 border-slate-100', discontinued: 'bg-rose-50 text-rose-600 border-rose-100' };
  const statusIcons: Record<string, any> = { active: CheckCircle2, draft: Clock, inactive: XCircle, discontinued: Archive };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Package className="text-blue-600" /> Quản lý Sản phẩm</h1>
          <p className="text-sm text-slate-500 mt-1">Danh mục quản lý các mặt hàng và thông số kỹ thuật.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Tìm tên, SKU..." className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-white text-sm outline-none shadow-sm" value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} /></div>
          <button onClick={() => setIsModalCreateOpen(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"><Plus size={18} /> Thêm Sản phẩm</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"><p className="text-xs font-bold text-slate-500 uppercase mb-1">Tổng SKUs</p><p className="text-3xl font-black text-slate-800">{productsResult?.pagination?.total || 0}</p></div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"><p className="text-xs font-bold text-emerald-500 uppercase mb-1">Đang hoạt động</p><p className="text-3xl font-black text-emerald-600">{products.filter(p => p.status === 'active').length}</p></div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-amber-400 border-l-4"><p className="text-xs font-bold text-amber-500 uppercase mb-1">Sắp hết hàng</p><p className="text-3xl font-black text-amber-600">0</p></div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"><p className="text-xs font-bold text-indigo-500 uppercase mb-1">Bản nháp</p><p className="text-3xl font-black text-indigo-600">{products.filter(p => p.status === 'draft').length}</p></div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">SKU / Barcode</th>
                <th className="px-6 py-4 text-center">Biến thể</th>
                <th className="px-6 py-4">Loại / Hãng</th>
                <th className="px-6 py-4 text-right">Giá bán</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={7} className="px-6 py-10 text-center animate-pulse">Đang tải...</td></tr>) : products.length === 0 ? (<tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400 italic">Chưa có sản phẩm nào.</td></tr>) : products.map((p: any) => {
                  const StatusIcon = statusIcons[p.status] || CheckCircle2;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 flex items-center gap-4"><div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-gray-100"><Package size={20} /></div><div className="font-bold text-slate-800">{p.name}</div></td>
                      <td className="px-6 py-5"><div className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit mb-1">{p.sku}</div><div className="text-[10px] text-slate-400 font-medium">{p.barcode || '-'}</div></td>
                      <td className="px-6 py-5 text-center"><button onClick={() => { setSelectedProductForVariants(p); setIsModalVariantsOpen(true); }} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold text-[11px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Layers size={13} className="inline mr-1" /> Biến thể</button></td>
                      <td className="px-6 py-5"><div className="flex flex-col"><span className="text-xs font-bold text-slate-700">{typeof p.category === 'object' ? p.category?.name : '-'}</span><span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium"><Tag size={10} /> {typeof p.brand === 'object' ? p.brand?.name : '-'}</span></div></td>
                      <td className="px-6 py-5 text-right font-black text-slate-800">{p.price?.sale?.toLocaleString('vi-VN')} đ</td>
                      <td className="px-6 py-5 text-center"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${statusColors[p.status]}`}><StatusIcon size={12} /> {p.status?.toUpperCase()}</span></td>
                      <td className="px-6 py-5 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => handleOpenEdit(p)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button><button onClick={() => { if(window.confirm('Xóa?')) mutationDelete.mutate(p._id); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button></div></td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-slate-50/30">
          <div className="text-xs text-slate-500">Trang <span className="font-bold text-slate-800">{filters.page}</span> / {totalPages}</div>
          <div className="flex gap-2">
            <button disabled={filters.page === 1} onClick={() => setFilters(p => ({ ...p, page: (p.page || 1) - 1 }))} className="p-2 rounded-xl border border-gray-100 bg-white text-slate-600 hover:border-blue-200 transition-all disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button disabled={filters.page === totalPages} onClick={() => setFilters(p => ({ ...p, page: (p.page || 1) + 1 }))} className="p-2 rounded-xl border border-gray-100 bg-white text-slate-600 hover:border-blue-200 transition-all disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {(isModalCreateOpen || editingProduct) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModals} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">{editingProduct ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}</h3>
              <button onClick={handleCloseModals} className="p-2 hover:bg-white rounded-xl text-slate-400 shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Tên sản phẩm *</label><input name="name" required defaultValue={editingProduct?.name} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm focus:bg-white outline-none" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Mã SKU *</label><input name="sku" required defaultValue={editingProduct?.sku} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm font-mono focus:bg-white outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Barcode</label><input name="barcode" defaultValue={editingProduct?.barcode} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm focus:bg-white outline-none" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Trạng thái</label><select name="status" defaultValue={editingProduct?.status || 'active'} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm outline-none"><option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option><option value="discontinued">Discontinued</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Danh mục</label><select name="category" defaultValue={typeof editingProduct?.category === 'object' ? editingProduct?.category?._id : (editingProduct?.category || '')} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm outline-none"><option value="">Chọn...</option>{categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Thương hiệu</label><select name="brand" defaultValue={typeof editingProduct?.brand === 'object' ? editingProduct?.brand?._id : (editingProduct?.brand || '')} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm outline-none"><option value="">Chọn...</option>{brands.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Giá vốn</label><input type="number" name="price.cost" defaultValue={editingProduct?.price?.cost} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm focus:bg-white outline-none" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Giá bán</label><input type="number" name="price.sale" defaultValue={editingProduct?.price?.sale} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm font-bold text-blue-600 focus:bg-white outline-none" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">SL đầu kỳ</label><input type="number" name="initialQuantity" defaultValue={editingProduct?.warehouse ? 0 : 0} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm focus:bg-white outline-none" /></div>
              </div>
              {!editingProduct && (
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Kho hàng *</label><select name="warehouse" required className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50 text-sm outline-none"><option value="">Chọn kho...</option>{warehouses.map((w: any) => <option key={w._id} value={w._id}>{w.name}</option>)}</select></div>
              )}
              <div className="flex gap-4 pt-4"><button type="submit" disabled={mutationCreate.isPending || mutationUpdate.isPending} className="flex-1 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold transition-all hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2">{(mutationCreate.isPending || mutationUpdate.isPending) ? (<RefreshCw size={18} className="animate-spin" />) : (<Save size={18} />)} {editingProduct ? 'Cập nhật Sản phẩm' : 'Lưu Sản phẩm'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Variants Modal */}
      {isModalVariantsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalVariantsOpen(false)} />
          <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="text-xl font-bold text-slate-800 tracking-tight">Biến thể: {selectedProductForVariants?.name}</h3>
               <button onClick={() => setIsModalVariantsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
               <table className="w-full text-sm text-left border rounded-2xl overflow-hidden shadow-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                    <tr><th className="px-5 py-3">Thuộc tính & SKU</th><th className="px-5 py-3 text-right">Thao tác</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingVariants ? (<tr><td colSpan={2} className="px-5 py-5 text-center text-slate-400">Đang tải...</td></tr>) : variants.length === 0 ? (<tr><td colSpan={2} className="px-5 py-12 text-center text-slate-400 italic">Chưa có biến thể nào.</td></tr>) : variants.map((v: any) => {
                       const attrEntries = v.attributes ? Object.entries(v.attributes) : [];
                       const attrDisplay = attrEntries.length > 0 ? attrEntries.map(([k, val]) => `${k}: ${val}`).join(', ') : v.sku;
                       return (
                         <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4"><div className="font-bold text-slate-800">{attrDisplay}</div><div className="font-mono text-[10px] text-slate-400">{v.sku}</div></td>
                            <td className="px-5 py-4 text-right"><button onClick={() => { if(window.confirm('Xóa?')) mutationDeleteVariant.mutate(v._id); }} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={15} /></button></td>
                         </tr>
                       );
                    })}
                  </tbody>
               </table>
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4"><PlusCircle size={18} className="text-blue-600" /> Thêm biến thể nhanh</h4>
                  <form onSubmit={(e) => { e.preventDefault(); if(!quickVariantAttr.trim()) return; mutationAddVariant.mutate({ attributes: { 'Chi tiết': quickVariantAttr }, status: 'active' }); }} className="flex gap-3">
                     <input value={quickVariantAttr} onChange={(e) => setQuickVariantAttr(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border border-white bg-white text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="VD: Màu Đỏ, Size XL..." />
                     <button type="submit" disabled={mutationAddVariant.isPending || !quickVariantAttr.trim()} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/10 hover:bg-blue-700 active:scale-95 disabled:opacity-50">Tạo</button>
                  </form>
               </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }`}</style>
    </div>
  );
}
