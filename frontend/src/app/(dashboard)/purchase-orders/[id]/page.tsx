'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Calendar, 
  Truck, 
  User as UserIcon, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Send,
  AlertTriangle,
  History,
  Box,
  ChevronRight,
  Package as PackageIcon,
  Warehouse as WarehouseIcon,
  RefreshCw
} from 'lucide-react';
import { 
  getPOById, 
  submitPO, 
  approvePO, 
  cancelPO, 
  receivePartial 
} from '@/api/purchaseOrders';
import { POStatus, ReceivePOPayload } from '@/types/purchaseOrder';
import { format } from 'date-fns';
import Link from 'next/link';

export default function PODetailPage() {
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveData, setReceiveData] = useState<ReceivePOPayload>({
    note: '',
    items: [],
  });

  // Fetch PO Detail
  const { data: poResponse, isLoading } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: () => getPOById(id),
  });

  const po = poResponse?.data;

  // Mutations
  const mutationSubmit = useMutation({
    mutationFn: () => submitPO(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  const mutationApprove = useMutation({
    mutationFn: () => approvePO(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  const mutationCancel = useMutation({
    mutationFn: () => cancelPO(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  const mutationReceive = useMutation({
    mutationFn: (payload: ReceivePOPayload) => receivePartial(id, payload),
    onSuccess: () => {
      setIsReceiveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500"><RefreshCw className="animate-spin inline-block mr-2" /> Đang tải dữ liệu...</div>;
  if (!po) return <div className="p-8 text-center text-rose-500">Không tìm thấy đơn hàng.</div>;

  const getStatusBadge = (status: POStatus) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-600 border-slate-200',
      pending: 'bg-amber-50 text-amber-600 border-amber-100',
      approved: 'bg-blue-50 text-blue-600 border-blue-100',
      receiving: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      received: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const handleOpenReceive = () => {
    const initialItems = po.items
      .filter(item => item.remainingQuantity > 0)
      .map(item => ({
        purchaseOrderItemId: item._id,
        receivedQuantity: item.remainingQuantity,
        productName: item.product.name,
        tracking: item.product.tracking || 'none',
        batchLots: item.product.tracking === 'lot' ? [{
          lotCode: `LOT-${po.code}-${Date.now().toString().slice(-4)}`,
          manufactureDate: format(new Date(), 'yyyy-MM-dd'),
          expiryDate: format(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          quantity: item.remainingQuantity
        }] : undefined
      }));
    
    setReceiveData({ note: '', items: initialItems as any });
    setIsReceiveModalOpen(true);
  };

  const handleUpdateReceiveQty = (idx: number, qty: number) => {
    const newItems = [...receiveData.items];
    if (!newItems[idx]) return;
    newItems[idx].receivedQuantity = qty;
    if (newItems[idx].batchLots && newItems[idx].batchLots!.length === 1) {
      newItems[idx].batchLots![0].quantity = qty;
    }
    setReceiveData({ ...receiveData, items: newItems });
  };

  const handleAddLot = (itemIdx: number) => {
    const newItems = [...receiveData.items];
    if (!newItems[itemIdx]) return;
    if (!newItems[itemIdx].batchLots) newItems[itemIdx].batchLots = [];
    newItems[itemIdx].batchLots!.push({
      lotCode: '',
      manufactureDate: format(new Date(), 'yyyy-MM-dd'),
      expiryDate: format(new Date(), 'yyyy-MM-dd'),
      quantity: 0
    });
    setReceiveData({ ...receiveData, items: newItems });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders" className="p-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-gray-50 transition-all shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{po.code}</span>
              {getStatusBadge(po.status)}
            </div>
            <h1 className="text-xl font-bold text-slate-800 mt-1">Chi tiết Đơn Nhập Kho</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {po.status === 'draft' && (
            <button onClick={() => mutationSubmit.mutate()} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all">
              <Send size={18} /> Gửi duyệt
            </button>
          )}
          {po.status === 'pending' && (
            <button onClick={() => mutationApprove.mutate()} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-all">
              <CheckCircle2 size={18} /> Phê duyệt
            </button>
          )}
          {(po.status === 'approved' || po.status === 'receiving') && (
            <button onClick={handleOpenReceive} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all">
              <Box size={18} /> Nhận hàng
            </button>
          )}
          {['draft', 'pending', 'approved'].includes(po.status) && (
            <button onClick={() => mutationCancel.mutate()} className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-all">
              <XCircle size={18} /> Hủy đơn
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0"><Truck size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nhà Cung Cấp</p>
                <p className="font-bold text-slate-800 text-lg truncate">{typeof po.supplier === 'object' ? po.supplier.name : 'N/A'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{po.supplier?.address || 'Chưa cập nhật địa chỉ'}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0"><WarehouseIcon size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kho Nhận Hang</p>
                <p className="font-bold text-slate-800 text-lg truncate">{typeof po.warehouse === 'object' ? po.warehouse.name : 'Kho Chính'}</p>
                <p className="text-xs text-slate-500 mt-0.5">Thời gian dự kiến: {format(new Date(po.expectedDate), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><PackageIcon size={18} className="text-blue-500" /> Danh Sách Sản Phẩm</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-6 py-4 text-center">Đơn giá</th>
                    <th className="px-6 py-4 text-center">Số lượng</th>
                    <th className="px-6 py-4 text-center">Đã nhận</th>
                    <th className="px-6 py-4 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {po.items.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><PackageIcon size={18} /></div>
                          <div>
                            <p className="font-bold text-slate-800">{item.product.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">SKU: {item.product.sku || 'N/A'}</p>
                            {item.product.tracking === 'lot' && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded mt-0.5"><Box size={8} /> TRACKED BY LOT</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600">{new Intl.NumberFormat('vi-VN').format(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold ${item.receivedQuantity === item.quantity ? 'text-emerald-600' : 'text-blue-600'}`}>{item.receivedQuantity}</span>
                          {item.remainingQuantity > 0 && <span className="text-[10px] text-rose-400 font-medium">Thiếu {item.remainingQuantity}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-gray-50 pb-2 flex items-center gap-2"><FileText size={18} className="text-blue-500" /> Tổng Kết Chi Phí</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Tạm tính:</span><span className="font-medium">{new Intl.NumberFormat('vi-VN').format(po.subtotal)}đ</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Thuế GTGT:</span><span className="font-medium">{new Intl.NumberFormat('vi-VN').format(po.taxAmount)}đ</span></div>
              <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">Tổng cộng:</span>
                <span className="font-black text-blue-600 text-xl">{new Intl.NumberFormat('vi-VN').format(po.totalAmount)}đ</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
            <h3 className="font-bold flex items-center gap-2 text-blue-400"><History size={18} /> Ghi Chú</h3>
            <p className="text-sm text-slate-400 italic">{po.note || "Không có ghi chú."}</p>
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <UserIcon size={12} className="text-slate-500" />
                <span className="text-slate-400">Tạo bởi:</span>
                <span className="font-medium">{po.orderedBy && typeof po.orderedBy === 'object' ? (po.orderedBy as any).fullName || (po.orderedBy as any).username : 'Hệ thống'}</span>
              </div>
              {po.approvedBy && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 size={12} />
                  <span className="text-slate-400">Duyệt bởi:</span>
                  <span className="font-medium">{typeof po.approvedBy === 'object' ? (po.approvedBy as any).fullName || (po.approvedBy as any).username : 'Admin'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Truck className="text-blue-600" /> Nhận Hàng Vào Kho</h2>
                <p className="text-xs text-slate-500 mt-0.5">Nhập số lượng thực nhận và thông tin lô hàng.</p>
              </div>
              <button onClick={() => setIsReceiveModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 shadow-none hover:shadow-sm"><XCircle size={24} /></button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {receiveData.items.map((item: any, idx: number) => (
                <div key={item.purchaseOrderItemId} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 font-bold">{idx + 1}</div>
                      <h4 className="font-bold text-slate-800">{item.productName}</h4>
                      {item.tracking === 'lot' && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">Lot Tracked</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-xs font-bold text-slate-400 uppercase">Số lượng nhận:</label>
                      <input
                        type="number"
                        className="w-24 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 text-center font-bold text-blue-600"
                        value={item.receivedQuantity}
                        onChange={(e) => handleUpdateReceiveQty(idx, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {item.tracking === 'lot' && (
                    <div className="mt-4 space-y-3 bg-white p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><AlertTriangle size={14} className="text-amber-500" /> CHI TIẾT LÔ HÀNG</p>
                        <button onClick={() => handleAddLot(idx)} className="text-[10px] font-bold text-blue-600">+ Thêm lô</button>
                      </div>
                      <div className="space-y-4">
                        {item.batchLots && item.batchLots.map((lot: any, lotIdx: number) => (
                          <div key={lotIdx} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-1">
                              <label className="text-[10px] text-slate-400 font-bold">Mã Lô</label>
                              <input type="text" className="w-full text-xs px-3 py-2 rounded-lg border border-gray-100 bg-slate-50" value={lot.lotCode} onChange={(e) => {
                                const newItems = [...receiveData.items];
                                if (newItems[idx] && newItems[idx].batchLots) {
                                  newItems[idx].batchLots![lotIdx].lotCode = e.target.value;
                                  setReceiveData({ ...receiveData, items: newItems });
                                }
                              }} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold">NSX</label>
                                <input type="date" className="w-full text-xs px-3 py-2 rounded-lg border border-gray-100 bg-slate-50" value={lot.manufactureDate} onChange={(e) => {
                                  const newItems = [...receiveData.items];
                                  if (newItems[idx] && newItems[idx].batchLots) {
                                    newItems[idx].batchLots![lotIdx].manufactureDate = e.target.value;
                                    setReceiveData({ ...receiveData, items: newItems });
                                  }
                                }} />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold">HSD</label>
                                <input type="date" className="w-full text-xs px-3 py-2 rounded-lg border border-gray-100 bg-slate-50" value={lot.expiryDate} onChange={(e) => {
                                  const newItems = [...receiveData.items];
                                  if (newItems[idx] && newItems[idx].batchLots) {
                                    newItems[idx].batchLots![lotIdx].expiryDate = e.target.value;
                                    setReceiveData({ ...receiveData, items: newItems });
                                  }
                                }} />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold">Qty Lô</label>
                                <div className="flex items-center gap-2">
                                  <input type="number" className="w-full text-xs px-3 py-2 rounded-lg border border-gray-100 bg-slate-50 font-bold" value={lot.quantity} onChange={(e) => {
                                      const newItems = [...receiveData.items];
                                      if (newItems[idx] && newItems[idx].batchLots) {
                                        newItems[idx].batchLots![lotIdx].quantity = parseInt(e.target.value) || 0;
                                        setReceiveData({ ...receiveData, items: newItems });
                                      }
                                    }} />
                                  {item.batchLots.length > 1 && (
                                    <button onClick={() => {
                                        const newItems = [...receiveData.items];
                                        if (newItems[idx] && newItems[idx].batchLots) {
                                          newItems[idx].batchLots!.splice(lotIdx, 1);
                                          setReceiveData({ ...receiveData, items: newItems });
                                        }
                                      }} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                                  )}
                                </div>
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2"><FileText size={14} /> Ghi chú nhận hàng</label>
                <textarea rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" placeholder="Nhập ghi chú..." value={receiveData.note} onChange={(e) => setReceiveData({ ...receiveData, note: e.target.value })} />
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => setIsReceiveModalOpen(false)} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Hủy bỏ</button>
              <button disabled={mutationReceive.isPending} onClick={() => mutationReceive.mutate(receiveData)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50">
                {mutationReceive.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Xác Nhận Nhập Kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
