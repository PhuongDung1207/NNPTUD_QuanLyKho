'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRightLeft, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Package,
  Calendar,
  User,
  MoreVertical,
  ClipboardCheck,
  PackageCheck,
  AlertCircle,
  RefreshCw,
  Warehouse
} from 'lucide-react';
import { 
  getTransferOrderById, 
  submitTransferOrder,
  shipTransferOrder, 
  receiveTransferOrder, 
  cancelTransferOrder 
} from '@/api/transferOrders';
import { format } from 'date-fns';

export default function TransferOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch Order Details
  const { data: result, isLoading } = useQuery({
    queryKey: ['transfer-order', id],
    queryFn: () => getTransferOrderById(id),
  });

  const order = result?.data;

  // Mutations
  const mutationSubmit = useMutation({
    mutationFn: () => submitTransferOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi duyệt');
    }
  });
  const mutationShip = useMutation({
    mutationFn: () => shipTransferOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận xuất kho');
    }
  });
  const mutationReceive = useMutation({
    mutationFn: () => receiveTransferOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi nhận hàng');
    }
  });
  const mutationCancel = useMutation({
    mutationFn: () => cancelTransferOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['transfer-orders'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi hủy lệnh');
    }
  });

  if (isLoading) return <div className="p-10 text-center animate-pulse">Đang tải dữ liệu vận đơn...</div>;
  if (!order) return <div className="p-10 text-center text-rose-500">Không tìm thấy vận đơn!</div>;

  const statusMap: Record<string, { label: string, color: string, icon: any, step: number }> = {
    draft: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-600', icon: FileText, step: 0 },
    pending: { label: 'Chờ giao hàng', color: 'bg-amber-100 text-amber-600', icon: Clock, step: 1 },
    in_transit: { label: 'Đang vận chuyển', color: 'bg-blue-100 text-blue-600', icon: Truck, step: 2 },
    completed: { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2, step: 3 },
    cancelled: { label: 'Đã hủy', color: 'bg-rose-100 text-rose-600', icon: XCircle, step: -1 }
  };

  const status = statusMap[order.status] || statusMap.draft;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white border border-gray-100 text-slate-400 hover:text-slate-800 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">{order.code}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Lệnh luân chuyển hàng hóa nội bộ hệ thống</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.status === 'draft' && (
            <button 
              type="button"
              onClick={() => { if(window.confirm('Gửi duyệt hồ sơ vận chuyển này?')) mutationSubmit.mutate(); }}
              disabled={mutationSubmit.isPending}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              {mutationSubmit.isPending ? <RefreshCw className="animate-spin" size={18} /> : <ClipboardCheck size={18} className="pointer-events-none" />}
              Gửi duyệt
            </button>
          )}

          {order.status === 'pending' && (
            <button 
              type="button"
              onClick={() => { if(window.confirm('Xác nhận xuất kho và bắt đầu giao hàng?')) mutationShip.mutate(); }}
              disabled={mutationShip.isPending}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              {mutationShip.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Truck size={18} className="pointer-events-none" />}
              Xác nhận xuất kho
            </button>
          )}

          {order.status === 'in_transit' && (
            <button 
              type="button"
              onClick={() => { if(window.confirm('Xác nhận đã nhận đầy đủ hàng tại kho đích?')) mutationReceive.mutate(); }}
              disabled={mutationReceive.isPending}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              {mutationReceive.isPending ? <RefreshCw className="animate-spin" size={18} /> : <PackageCheck size={18} className="pointer-events-none" />}
              Xác nhận nhập kho
            </button>
          )}

          {(order.status === 'draft' || order.status === 'pending') && (
            <button 
              type="button"
              onClick={() => { if(window.confirm('Bạn có chắc muốn hủy lệnh chuyển kho này?')) mutationCancel.mutate(); }}
              className="px-6 py-2.5 rounded-xl border border-rose-200 text-rose-500 text-sm font-bold hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              <XCircle size={18} className="pointer-events-none" />
              Hủy lệnh
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline / Progress */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between px-4">
                {[
                  { id: 'draft', label: 'Khởi tạo', icon: FileText, step: 0 },
                  { id: 'pending', label: 'Chờ duyệt', icon: Clock, step: 1 },
                  { id: 'in_transit', label: 'Đang vận chuyển', icon: Truck, step: 2 },
                  { id: 'completed', label: 'Hoàn thành', icon: CheckCircle2, step: 3 }
                ].map((s, idx) => {
                  const isPast = status.step > s.step;
                  const isCurrent = order.status === s.id;
                  const isCancelled = order.status === 'cancelled';
                  
                  return (
                    <div key={s.id} className="flex flex-col items-center relative flex-1">
                      {idx !== 0 && (
                        <div className={`absolute right-1/2 translate-x-[-20px] top-4 h-0.5 w-[calc(100%-40px)] ${isPast || isCurrent ? 'bg-blue-600' : 'bg-slate-100'}`} />
                      )}
                      <div className={`z-10 h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-500/20' :
                        isPast ? 'bg-blue-50 border-blue-600 text-blue-600' :
                        'bg-white border-slate-100 text-slate-300'
                      }`}>
                        <s.icon size={16} />
                      </div>
                      <span className={`mt-2 text-[10px] font-bold uppercase tracking-tight ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
            <div className="px-8 py-5 border-b border-gray-50 bg-slate-50/30 flex items-center gap-2">
              <Package size={18} className="text-blue-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Danh mục hàng hóa luân chuyển</h2>
            </div>
            <div className="p-0">
               <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-gray-50">
                      <th className="px-8 py-4">Sản phẩm</th>
                      <th className="px-6 py-4 text-center">SL Yêu cầu</th>
                      <th className="px-6 py-4 text-center">SL Đã giao</th>
                      <th className="px-6 py-4 text-center">SL Thực nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.items.map((item: any) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                               <Package size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{item.product?.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono tracking-wider">{item.product?.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-black text-slate-700">
                          {item.quantityRequested}
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-blue-600">
                          {item.quantityShipped || 0}
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-emerald-600">
                          {item.quantityReceived || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Info */}
        <div className="space-y-6">
          {/* Warehouses Info */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-600">
                <ArrowRightLeft size={160} />
             </div>

             <div className="relative space-y-6">
                <div className="flex items-start gap-4">
                   <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <Warehouse size={20} />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kho xuất hàng</span>
                      <span className="font-bold text-slate-800">{order.fromWarehouse?.name}</span>
                      <span className="text-[11px] text-slate-400 mt-1">{order.fromWarehouse?.contactPhone}</span>
                   </div>
                </div>

                <div className="flex justify-center py-2">
                   <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <ArrowRightLeft size={16} className="rotate-90" />
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400 shrink-0">
                      <Warehouse size={20} />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kho nhận hàng</span>
                      <span className="font-bold text-slate-800">{order.toWarehouse?.name}</span>
                      <span className="text-[11px] text-slate-400 mt-1">{order.toWarehouse?.contactPhone}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Metadata */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Thời gian & Phê duyệt</h3>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={14} /> <span>Ngày tạo:</span>
                   </div>
                   <span className="font-bold text-slate-700">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2 text-slate-400">
                      <User size={14} /> <span>Yêu cầu:</span>
                   </div>
                   <span className="font-bold text-slate-700">{order.requestedBy?.fullName}</span>
                </div>
                {order.approvedBy && (
                   <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                         <User size={14} className="text-emerald-500" /> <span>Phê duyệt:</span>
                      </div>
                      <span className="font-bold text-emerald-600">{order.approvedBy?.fullName}</span>
                   </div>
                )}
                {order.shippedAt && (
                   <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Clock size={14} /> <span>Đã xuất:</span>
                      </div>
                      <span className="font-bold text-slate-700">{format(new Date(order.shippedAt), 'dd/MM/yyyy HH:mm')}</span>
                   </div>
                )}
                {order.receivedAt && (
                   <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Clock size={14} /> <span>Đã nhận:</span>
                      </div>
                      <span className="font-bold text-slate-700">{format(new Date(order.receivedAt), 'dd/MM/yyyy HH:mm')}</span>
                   </div>
                )}
             </div>

             {order.note && (
                <div className="pt-4 mt-4 border-t border-gray-50">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ghi chú</p>
                   <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl italic leading-relaxed">
                      "{order.note}"
                   </p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
