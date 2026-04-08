'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Search, 
  Plus, 
  FileText, 
  Truck, 
  X, 
  Save, 
  Loader2,
  Package,
  MapPin,
  ChevronRight,
  User,
  ShoppingBag
} from 'lucide-react';
import { 
  getOutboundOrders, 
  createOutboundOrder, 
  submitOutboundOrder, 
  shipOutboundOrder, 
  cancelOutboundOrder 
} from '@/api/outboundOrders';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import { OutboundOrder } from '@/types/outboundOrder';

export default function OutboundOrdersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    warehouse: '',
    note: '',
    items: [{ product: '', quantityRequested: 1, price: 0 }]
  });

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['outbound-orders', searchTerm],
    queryFn: () => getOutboundOrders({ code: searchTerm })
  });

  const { data: warehousesResponse } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses({ status: 'active' })
  });

  const { data: productsResponse } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({ status: 'active' })
  });

  const orders = ordersResponse?.data || [];
  const warehouses = warehousesResponse?.data || [];
  const products = productsResponse?.data || [];

  const mutationCreate = useMutation({
    mutationFn: createOutboundOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-orders'] });
      handleCloseForm();
    }
  });

  const mutationSubmit = useMutation({
    mutationFn: (id: string) => submitOutboundOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  });

  const mutationShip = useMutation({
    mutationFn: (id: string) => shipOutboundOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  });

  const mutationCancel = useMutation({
    mutationFn: (id: string) => cancelOutboundOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  });

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({
      customerName: '',
      warehouse: '',
      note: '',
      items: [{ product: '', quantityRequested: 1, price: 0 }]
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    mutationCreate.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      draft: <span className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full uppercase tracking-wider">Nháp</span>,
      pending: <span className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-600 rounded-full uppercase tracking-wider">Chờ Xuất</span>,
      shipped: <span className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-600 rounded-full uppercase tracking-wider">Đã Xuất</span>,
      cancelled: <span className="px-2 py-1 text-[10px] font-bold bg-rose-100 text-rose-600 rounded-full uppercase tracking-wider">Đã Hủy</span>
    };
    return badges[status] || <span>{status}</span>;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Truck className="text-blue-600" size={32} />
            Quản lý Xuất Kho
          </h1>
          <p className="text-slate-500 mt-1">Lập lệnh xuất, giữ hàng và theo dõi hành trình hàng rời kho.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <Plus size={20} />
          Tạo Đơn Xuất Mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo mã đơn (OUT)..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">MÃ ĐƠN</th>
                <th className="px-6 py-4">KHÁCH HÀNG / KHO HÀNG</th>
                <th className="px-6 py-4 text-center">TRẠNG THÁI</th>
                <th className="px-6 py-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto animate-spin mb-2" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Chưa có lệnh xuất kho nào
                  </td>
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <User size={12} className="text-blue-500" />
                          {order.customerName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin size={12} />
                          {order.warehouse?.name}
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
                            className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            Xuất Kho
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tạo Lệnh Xuất Kho</h2>
                <p className="text-xs text-slate-500 mt-1">Cung cấp thông tin khách hàng và sản phẩm cần xuất.</p>
              </div>
              <button 
                onClick={handleCloseForm}
                className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Tên khách hàng</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      required
                      type="text" 
                      placeholder="Nguyễn Văn A..." 
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Kho xuất</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                      required
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm appearance-none bg-white focus:ring-2 focus:ring-blue-500/20"
                      value={formData.warehouse}
                      onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    >
                      <option value="">Chọn kho...</option>
                      {warehouses.map((w: any) => (
                        <option key={w._id} value={w._id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">Sản phẩm xuất</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, items: [...formData.items, { product: '', quantityRequested: 1, price: 0 }] })}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    + Thêm sản phẩm
                  </button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Sản phẩm</label>
                      <select 
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                        value={item.product}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].product = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                      >
                        <option value="">Chọn sản phẩm...</option>
                        {products.map((p: any) => (
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
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                        value={item.quantityRequested}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].quantityRequested = Number(e.target.value);
                          setFormData({ ...formData, items: newItems });
                        }}
                      />
                    </div>
                    {formData.items.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mb-0.5"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Ghi chú</label>
                <textarea 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm h-20"
                  placeholder="Thông tin thêm..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 py-3 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={mutationCreate.isPending}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {mutationCreate.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Lưu Đơn Nháp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
