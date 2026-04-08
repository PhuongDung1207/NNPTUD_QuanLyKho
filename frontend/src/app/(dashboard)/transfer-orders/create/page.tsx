'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowRightLeft, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Package, 
  Warehouse, 
  ClipboardList,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import { getInventories } from '@/api/inventories';
import { createTransferOrder } from '@/api/transferOrders';

export default function CreateTransferOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fromWarehouse: '',
    toWarehouse: '',
    note: '',
    items: [] as any[]
  });

  // Fetch Data
  const { data: warehousesResult } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses() });
  const { data: productsResult } = useQuery({ queryKey: ['products'], queryFn: () => getProducts({ limit: 100 }) });
  
  // Fetch source warehouse inventory when fromWarehouse changes
  const { data: inventoryResult } = useQuery({
    queryKey: ['source-inventory', formData.fromWarehouse],
    queryFn: () => getInventories({ warehouse: formData.fromWarehouse, limit: 200 }),
    enabled: !!formData.fromWarehouse
  });

  const warehouses = warehousesResult?.data || [];
  const productsResultData: any = productsResult?.data;
  const products = Array.isArray(productsResultData) 
    ? productsResultData 
    : productsResultData?.docs || [];
  const sourceInventory = inventoryResult?.data || [];

  const mutationCreate = useMutation({
    mutationFn: createTransferOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
      router.push('/transfer-orders');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo lệnh chuyển');
    }
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantityRequested: 1 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fromWarehouse === formData.toWarehouse) {
      alert('Kho xuất và kho nhận không được trùng nhau.');
      return;
    }
    if (formData.items.length === 0) {
      alert('Vui lòng thêm ít nhất một mặt hàng.');
      return;
    }
    mutationCreate.mutate(formData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Breadcrumbs / Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            <ArrowRightLeft className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tạo Lệnh Chuyển Kho</h1>
            <p className="text-sm text-slate-500">Thiết lập lộ trình luân chuyển hàng hóa nội bộ.</p>
          </div>
        </div>
        <button 
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Route Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-600">
                <Warehouse size={120} />
            </div>
            
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" />
              Thông tin lộ trình
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kho xuất hàng (From)</label>
                <select 
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold appearance-none"
                  value={formData.fromWarehouse}
                  onChange={(e) => setFormData({...formData, fromWarehouse: e.target.value})}
                >
                  <option value="">Chọn kho xuất...</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                    <ArrowRight size={16} />
                </div>
              </div>

              <div className="space-y-1.5 focus-within:text-indigo-600 transition-colors">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kho nhận hàng (To)</label>
                <select 
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold appearance-none"
                  value={formData.toWarehouse}
                  onChange={(e) => setFormData({...formData, toWarehouse: e.target.value})}
                >
                  <option value="">Chọn kho nhận...</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ghi chú (Note)</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white outline-none transition-all text-sm resize-none"
                  placeholder="Lý do chuyển kho, yêu cầu đặc biệt..."
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                />
              </div>
            </div>
          </div>

          {formData.fromWarehouse && formData.fromWarehouse === formData.toWarehouse && (
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-start gap-3 text-rose-600">
               <AlertCircle size={20} className="shrink-0" />
               <p className="text-xs font-bold font-medium leading-relaxed">
                  Lỗi: Kho xuất và Kho nhận không được giống nhau. Vui lòng kiểm tra lại lộ trình.
               </p>
            </div>
          )}
        </div>

        {/* Right Column: Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-8 py-5 bg-slate-50/50 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                Danh sách mặt hàng
              </h2>
              <button 
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus size={14} /> Thêm SP
              </button>
            </div>

            <div className="p-8 flex-1">
              {formData.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12">
                   <div className="p-6 bg-slate-50 rounded-full">
                      <Package size={48} className="opacity-20" />
                   </div>
                   <p className="text-sm italic font-medium">Chưa có sản phẩm nào trong danh sách luân chuyển.</p>
                   <button 
                    type="button"
                    onClick={addItem}
                    className="text-blue-600 text-sm font-bold hover:underline"
                   >
                     + Thêm sản phẩm đầu tiên
                   </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => {
                    // Find inventory info for the selected product
                    const inv = sourceInventory.find(i => String((i.product as any)._id || i.product) === item.product);
                    const isOver = inv ? item.quantityRequested > inv.availableQuantity : false;

                    return (
                      <div key={index} className="group flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-gray-50 bg-slate-50/30 hover:bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all animate-in slide-in-from-left-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Sản phẩm</label>
                          <select
                            required
                            className="w-full px-3 py-2 rounded-xl border border-white bg-white shadow-sm text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                            value={item.product}
                            onChange={(e) => updateItem(index, 'product', e.target.value)}
                          >
                            <option value="">Chọn sản phẩm...</option>
                            {products.map((p: any) => (
                              <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                          {inv && (
                            <div className="flex items-center justify-between px-1">
                               <span className="text-[10px] text-slate-400">
                                 Sẵn có tại kho xuất: <span className="font-bold text-slate-600">{inv.availableQuantity}</span>
                               </span>
                               {isOver && <span className="text-[10px] text-rose-500 font-bold animate-pulse">Vượt quá tồn kho!</span>}
                            </div>
                          )}
                        </div>
                        
                        <div className="w-full sm:w-32 space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Số lượng</label>
                          <input 
                            required
                            type="number"
                            min="1"
                            placeholder="0"
                            className={`w-full px-3 py-2 rounded-xl border bg-white shadow-sm text-sm font-black text-center outline-none transition-all ${isOver ? 'border-rose-300 text-rose-600 ring-4 ring-rose-500/10' : 'border-white focus:ring-2 focus:ring-blue-500/20'}`}
                            value={item.quantityRequested}
                            onChange={(e) => updateItem(index, 'quantityRequested', Number(e.target.value))}
                          />
                        </div>

                        <div className="flex items-end pb-1.5 justify-end">
                          <button 
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
               <div className="text-xs font-bold text-slate-500">
                 Tổng cộng: <span className="text-lg text-slate-800 font-black ml-1">{formData.items.length}</span> <span className="text-[10px] uppercase font-bold tracking-tighter">mặt hàng</span>
               </div>
               <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-slate-600 hover:bg-white transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={mutationCreate.isPending || formData.items.length === 0}
                    className="px-10 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 flex items-center gap-2"
                  >
                    {mutationCreate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Lưu Lệnh Chuyển
                  </button>
               </div>
            </div>
          </div>
        </div>
      </form>

      <style jsx global>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .slide-in-from-left-4 {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
