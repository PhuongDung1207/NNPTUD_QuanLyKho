'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  RefreshCw,
  Filter,
  Save,
  X,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Package,
  MapPin
} from 'lucide-react';
import { 
  getTransferOrders, 
  createTransferOrder, 
  submitTransferOrder, 
  shipTransferOrder, 
  receiveTransferOrder, 
  cancelTransferOrder 
} from '@/api/transferOrders';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import { TransferOrder } from '@/types/transferOrder';
import { format } from 'date-fns';

export default function TransferOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    fromWarehouse: '',
    toWarehouse: '',
    note: '',
    items: [{ product: '', quantityRequested: 1 }]
  });

  // Fetch Transfer Orders
  const { data: ordersResponse, isLoading, isFetching } = useQuery({
    queryKey: ['transfer-orders'],
    queryFn: () => getTransferOrders(),
  });

  // Fetch Warehouses & Products for form
  const { data: warehousesResponse } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses({ status: 'active' }),
  });

  const { data: productsResponse } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({ limit: 100 }),
  });

  const orders = ordersResponse?.data || [];
  const warehouses = warehousesResponse?.data || [];
  const products = productsResponse?.data || [];

  // Mutations
  const mutationCreate = useMutation({
    mutationFn: createTransferOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
      handleCloseForm();
    }
  });
  
  const mutationSubmit = useMutation({
    mutationFn: (id: string) => submitTransferOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  });

  const mutationShip = useMutation({
    mutationFn: (id: string) => shipTransferOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  });

  const mutationReceive = useMutation({
    mutationFn: (id: string) => receiveTransferOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  });

  const mutationCancel = useMutation({
    mutationFn: (id: string) => cancelTransferOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  });

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({ 
      fromWarehouse: '', 
      toWarehouse: '', 
      note: '', 
      items: [{ product: '', quantityRequested: 1 }] 
    });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantityRequested: 1 }]
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutationCreate.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">DRAFT</span>;
      case 'pending': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase">Awaiting Approval</span>;
      case 'in_transit': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase flex items-center gap-1"><Truck size={12} /> In Transit</span>;
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Completed</span>;
      case 'cancelled': return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase">Cancelled</span>;
      default: return null;
    }
  };

  return (
    <div className="flex h-full gap-6 animate-in fade-in duration-500">
      {/* ── Main List Section ── */}
      <div className={`flex-1 space-y-6 transition-all duration-300 ${isFormOpen ? 'w-1/2' : 'w-full'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ArrowRightLeft className="text-blue-600" />
              Chuyển kho nội bộ
            </h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý và theo dõi quá trình điều chuyển hàng hóa giữa các kho.</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            Tạo lệnh chuyển kho
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo mã lệnh..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['transfer-orders'] })}
            className="p-2.5 text-slate-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Mã lệnh / Ngày tạo</th>
                <th className="px-6 py-4">Lộ trình (Từ { "->" } Đến)</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4 h-16 bg-gray-50/20" />
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Chưa có lệnh chuyển kho nào.</td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{order.code}</span>
                        <span className="text-[10px] text-slate-400">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{order.fromWarehouse?.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{order.fromWarehouse?.code}</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-300" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{order.toWarehouse?.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{order.toWarehouse?.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {order.status === 'draft' && (
                          <button 
                            onClick={() => mutationSubmit.mutate(order._id)}
                            disabled={mutationSubmit.isPending}
                            className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Gửi Duyệt
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => mutationShip.mutate(order._id)}
                            disabled={mutationShip.isPending}
                            className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            Giao Hàng
                          </button>
                        )}
                        {order.status === 'in_transit' && (
                          <button 
                            onClick={() => mutationReceive.mutate(order._id)}
                            disabled={mutationReceive.isPending}
                            className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            Nhận Hàng
                          </button>
                        )}
                        {(order.status === 'draft' || order.status === 'pending') && (
                          <button 
                            onClick={() => mutationCancel.mutate(order._id)}
                            disabled={mutationCancel.isPending}
                            className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors"
                          >
                            Hủy
                          </button>
                        )}
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
        <div className="w-1/2 bg-white rounded-3xl border border-gray-100 shadow-xl p-8 sticky top-0 h-fit space-y-6 animate-in slide-in-from-right-4 duration-300 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-slate-800">Tạo lệnh chuyển kho mới</h2>
            <button onClick={handleCloseForm} className="p-2 text-slate-400 hover:bg-gray-50 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Kho xuất đi</label>
                <select 
                  required
                  value={formData.fromWarehouse}
                  onChange={(e) => setFormData({ ...formData, fromWarehouse: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                >
                  <option value="">Chọn kho xuất...</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Kho nhập đến</label>
                <select 
                  required
                  value={formData.toWarehouse}
                  onChange={(e) => setFormData({ ...formData, toWarehouse: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                >
                  <option value="">Chọn kho nhập...</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id} disabled={w._id === formData.fromWarehouse}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Danh sách sản phẩm</label>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Thêm SP
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Sản phẩm</label>
                      <select 
                        required
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none"
                      >
                        <option value="">Chọn SP...</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Số lượng</label>
                      <input 
                        required
                        type="number"
                        min="1"
                        value={item.quantityRequested}
                        onChange={(e) => handleItemChange(index, 'quantityRequested', parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Ghi chú</label>
              <textarea 
                rows={3}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Lý do điều chuyển, ghi chú kèm theo..."
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={handleCloseForm}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={mutationCreate.isPending}
                className="flex-[2] py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                {mutationCreate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Tạo lệnh chuyển
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
