'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  RefreshCw,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';
import { getTransferOrders, cancelTransferOrder } from '@/api/transferOrders';
import { format } from 'date-fns';
import Link from 'next/link';

export default function TransferOrdersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: ''
  });

  // Fetch Transfer Orders
  const { data: result, isLoading, isFetching } = useQuery({
    queryKey: ['transfer-orders', filters],
    queryFn: () => getTransferOrders(filters),
  });

  const orders = result?.data || [];
  const pagination = result?.pagination;

  const mutationCancel = useMutation({
    mutationFn: cancelTransferOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
      alert('Đã hủy vận đơn thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn');
    }
  });

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    draft: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: FileText },
    pending: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock },
    in_transit: { label: 'Đang giao', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Truck },
    completed: { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
    cancelled: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="text-blue-600" />
            Lệnh chuyển kho
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Điều phối và luân chuyển hàng hóa giữa các kho nội bộ.
          </p>
        </div>
        <Link 
          href="/transfer-orders/create"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 text-center justify-center"
        >
          <Plus size={18} />
          Tạo lệnh chuyển
        </Link>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusMap).map(([key, value]) => (
          <div key={key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${value.color.split(' ')[0]}`}>
                <value.icon size={16} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{value.label}</span>
            </div>
            <p className="text-xl font-black text-slate-800">
              {orders.filter(o => o.status === key).length}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã vận đơn..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50/50 focus:bg-white text-sm outline-none transition-all"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
          />
        </div>
        <div className="flex gap-2">
           <select
            className="px-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50/50 focus:bg-white text-sm outline-none"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['transfer-orders'] })}
            className="p-2.5 text-slate-400 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-indigo-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Lộ trình (Từ - Đến)</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-5 h-20 bg-gray-50/20" />
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    Chưa có lệnh chuyển kho nào.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status = statusMap[order.status] || statusMap.draft;
                  return (
                    <tr key={order._id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 tracking-tight">{order.code}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Lệnh nội bộ</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-slate-700 text-xs">{order.fromWarehouse?.name}</span>
                            <span className="text-[9px] text-slate-400 uppercase tracking-tighter">Kho xuất</span>
                          </div>
                          <div className="relative">
                            <div className="h-0.5 w-12 bg-slate-200 rounded-full" />
                            <ChevronRight className="absolute -right-1 top-1/2 -translate-y-1/2 text-slate-300" size={10} />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-bold text-slate-700 text-xs">{order.toWarehouse?.name}</span>
                            <span className="text-[9px] text-slate-400 uppercase tracking-tighter">Kho nhận</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase ${status.color}`}>
                          <status.icon size={12} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center text-slate-500 font-medium">
                        {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/transfer-orders/${order._id}`}
                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </Link>
                          {order.status === 'draft' && (
                             <button 
                               type="button"
                               onClick={(e) => { 
                                 e.stopPropagation();
                                 if(window.confirm('Bạn có chắc muốn hủy vận đơn này?')) mutationCancel.mutate(order._id); 
                               }}
                               className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors relative z-20"
                             >
                               <XCircle size={16} className="pointer-events-none" />
                             </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
