'use client';

import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  RefreshCw,
  Truck,
  User as UserIcon,
  Warehouse,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  cancelTransferOrder,
  getTransferOrderById,
  receiveTransferOrder,
  shipTransferOrder,
  submitTransferOrder
} from '@/api/transferOrders';
import { TransferOrderItem, TransferOrderStatus } from '@/types/transferOrder';

const statusLabelMap: Record<TransferOrderStatus, string> = {
  draft: 'Nháp',
  pending: 'Chờ xuất',
  in_transit: 'Đang vận chuyển',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy'
};

function getStatusStyle(status: TransferOrderStatus) {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'pending':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'in_transit':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'completed':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'cancelled':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function getStatusIcon(status: TransferOrderStatus) {
  switch (status) {
    case 'draft':
      return <FileText size={14} />;
    case 'pending':
      return <Clock size={14} />;
    case 'in_transit':
      return <Truck size={14} />;
    case 'completed':
      return <CheckCircle2 size={14} />;
    case 'cancelled':
      return <XCircle size={14} />;
    default:
      return null;
  }
}

function getWarehouseName(warehouse: unknown) {
  if (warehouse && typeof warehouse === 'object') {
    const value = warehouse as { name?: string; code?: string };
    return value.name || value.code || 'Kho';
  }

  return 'Kho';
}

function getWarehouseContact(warehouse: unknown) {
  if (warehouse && typeof warehouse === 'object') {
    const value = warehouse as { contactPhone?: string; contactEmail?: string };
    return value.contactPhone || value.contactEmail || 'Chưa có thông tin liên hệ';
  }

  return 'Chưa có thông tin liên hệ';
}

function getUserName(user: unknown) {
  if (user && typeof user === 'object') {
    const value = user as { fullName?: string; username?: string; email?: string };
    return value.fullName || value.username || value.email || 'Hệ thống';
  }

  return 'Hệ thống';
}

function getItemProgress(item: TransferOrderItem) {
  if (item.quantityReceived >= item.quantityRequested) {
    return 'Đã nhận đủ';
  }

  if (item.quantityShipped >= item.quantityRequested) {
    return 'Đang chờ nhập';
  }

  if (item.quantityShipped > 0) {
    return 'Đang xuất một phần';
  }

  return 'Chờ xử lý';
}

interface ApiErrorResponse {
  message?: string;
}

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.message || axiosError.message || fallbackMessage;
}

export default function TransferOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: transferResponse, isLoading } = useQuery({
    queryKey: ['transferOrder', id],
    queryFn: () => getTransferOrderById(id)
  });

  const transferOrder = transferResponse?.data;

  const invalidateTransferQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['transferOrder', id] });
    queryClient.invalidateQueries({ queryKey: ['transferOrders'] });
  };

  const mutationSubmit = useMutation({
    mutationFn: () => submitTransferOrder(id),
    onSuccess: invalidateTransferQueries,
    onError: (error: unknown) => {
      setActionError(getApiErrorMessage(error, 'Không thể gửi phiếu chuyển.'));
    }
  });

  const mutationShip = useMutation({
    mutationFn: () => shipTransferOrder(id),
    onSuccess: invalidateTransferQueries,
    onError: (error: unknown) => {
      setActionError(getApiErrorMessage(error, 'Không thể xuất kho cho phiếu chuyển.'));
    }
  });

  const mutationReceive = useMutation({
    mutationFn: () => receiveTransferOrder(id),
    onSuccess: invalidateTransferQueries,
    onError: (error: unknown) => {
      setActionError(getApiErrorMessage(error, 'Không thể xác nhận nhập kho.'));
    }
  });

  const mutationCancel = useMutation({
    mutationFn: () => cancelTransferOrder(id),
    onSuccess: invalidateTransferQueries,
    onError: (error: unknown) => {
      setActionError(getApiErrorMessage(error, 'Không thể hủy phiếu chuyển.'));
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RefreshCw className="mr-2 inline-block animate-spin" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!transferOrder) {
    return <div className="p-8 text-center text-rose-500">Không tìm thấy phiếu chuyển kho.</div>;
  }

  const items = transferOrder.items || [];
  const totalRequested = items.reduce((total, item) => total + Number(item.quantityRequested || 0), 0);
  const totalShipped = items.reduce((total, item) => total + Number(item.quantityShipped || 0), 0);
  const totalReceived = items.reduce((total, item) => total + Number(item.quantityReceived || 0), 0);
  const isMutating =
    mutationSubmit.isPending || mutationShip.isPending || mutationReceive.isPending || mutationCancel.isPending;

  const runAction = (callback: () => void, confirmMessage?: string) => {
    setActionError(null);

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    callback();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/transfer-orders"
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-mono font-bold uppercase text-blue-600">
                {transferOrder.code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                  transferOrder.status
                )}`}
              >
                {getStatusIcon(transferOrder.status)}
                {statusLabelMap[transferOrder.status]}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-800">Chi tiết Phiếu Chuyển Kho</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {transferOrder.status === 'draft' && (
            <button
              onClick={() =>
                runAction(() => mutationSubmit.mutate(), 'Gửi phiếu chuyển sang trạng thái chờ xuất kho?')
              }
              disabled={isMutating}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {mutationSubmit.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Truck size={18} />}
              Gửi xuất kho
            </button>
          )}

          {transferOrder.status === 'pending' && (
            <button
              onClick={() =>
                runAction(() => mutationShip.mutate(), 'Xác nhận xuất toàn bộ số lượng từ kho nguồn?')
              }
              disabled={isMutating}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {mutationShip.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Truck size={18} />}
              Xác nhận xuất kho
            </button>
          )}

          {transferOrder.status === 'in_transit' && (
            <button
              onClick={() =>
                runAction(() => mutationReceive.mutate(), 'Xác nhận hàng đã nhập vào kho đích?')
              }
              disabled={isMutating}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {mutationReceive.isPending ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Xác nhận nhập kho
            </button>
          )}

          {['draft', 'pending'].includes(transferOrder.status) && (
            <button
              onClick={() =>
                runAction(
                  () => mutationCancel.mutate(),
                  'Hủy phiếu chuyển này? Hệ thống sẽ hoàn tác phần giữ chỗ tồn kho nếu có.'
                )
              }
              disabled={isMutating}
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-600 transition-all hover:bg-rose-100 disabled:opacity-50"
            >
              {mutationCancel.isPending ? <RefreshCw className="animate-spin" size={18} /> : <XCircle size={18} />}
              Hủy phiếu
            </button>
          )}

          <button
            onClick={() => router.refresh()}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-gray-50"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{actionError}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Warehouse size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kho Nguồn</p>
                <p className="truncate text-lg font-bold text-slate-800">{getWarehouseName(transferOrder.fromWarehouse)}</p>
                <p className="mt-0.5 text-xs text-slate-500">{getWarehouseContact(transferOrder.fromWarehouse)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Truck size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kho Đích</p>
                <p className="truncate text-lg font-bold text-slate-800">{getWarehouseName(transferOrder.toWarehouse)}</p>
                <p className="mt-0.5 text-xs text-slate-500">{getWarehouseContact(transferOrder.toWarehouse)}</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <Package size={18} className="text-blue-500" />
                Danh Sách Sản Phẩm
              </h3>
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                <span>{items.length} SKU</span>
                <span className="text-slate-300">•</span>
                <span>{totalRequested} đơn vị</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-6 py-4 text-center">Yêu cầu</th>
                    <th className="px-6 py-4 text-center">Đã xuất</th>
                    <th className="px-6 py-4 text-center">Đã nhập</th>
                    <th className="px-6 py-4">Tiến độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => {
                    const progressPercent = Math.min(
                      100,
                      Math.round((Number(item.quantityReceived || 0) / Number(item.quantityRequested || 1)) * 100)
                    );

                    return (
                      <tr key={item._id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                              <Package size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{item.product?.name || 'Sản phẩm'}</p>
                              <p className="text-[10px] font-mono text-slate-400">SKU: {item.product?.sku || 'N/A'}</p>
                              {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">{item.quantityRequested}</td>
                        <td className="px-6 py-4 text-center font-bold text-blue-600">{item.quantityShipped}</td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-600">{item.quantityReceived}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{getItemProgress(item)}</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 border-b border-gray-50 pb-2 font-bold text-slate-800">
              <FileText size={18} className="text-blue-500" />
              Tóm Tắt Thực Hiện
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">SKU điều chuyển:</span>
                <span className="font-medium text-slate-800">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Số lượng yêu cầu:</span>
                <span className="font-medium text-slate-800">{totalRequested}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Đã xuất kho:</span>
                <span className="font-medium text-blue-600">{totalShipped}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Đã nhập kho:</span>
                <span className="font-medium text-emerald-600">{totalReceived}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-gray-100 pt-3">
                <span className="font-bold text-slate-800">Tuyến vận hành:</span>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  {getWarehouseName(transferOrder.fromWarehouse)}
                  <ArrowRight size={14} className="text-slate-400" />
                  {getWarehouseName(transferOrder.toWarehouse)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative space-y-4 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
            <h3 className="flex items-center gap-2 font-bold text-blue-400">
              <UserIcon size={18} />
              Ghi Chú & Người Phụ Trách
            </h3>
            <p className="text-sm italic text-slate-300">{transferOrder.note || 'Không có ghi chú điều chuyển.'}</p>
            <div className="space-y-2 border-t border-slate-800 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Yêu cầu bởi:</span>
                <span className="font-medium text-white">{getUserName(transferOrder.requestedBy)}</span>
              </div>
              {transferOrder.approvedBy && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={12} />
                  <span className="text-slate-500">Xử lý bởi:</span>
                  <span className="font-medium text-white">{getUserName(transferOrder.approvedBy)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Tạo lúc:</span>
                <span>{format(new Date(transferOrder.createdAt), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              {transferOrder.shippedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Xuất kho:</span>
                  <span>{format(new Date(transferOrder.shippedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
              {transferOrder.receivedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Nhập kho:</span>
                  <span>{format(new Date(transferOrder.receivedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
              <AlertTriangle size={16} />
              Hướng dẫn thao tác
            </div>
            <ul className="ml-4 mt-3 list-disc space-y-2 text-xs leading-relaxed text-amber-600/80">
              <li>Nháp: chỉ giữ kế hoạch điều chuyển, chưa giữ chỗ tồn kho.</li>
              <li>Chờ xuất: tồn kho nguồn đã được reserve, sẵn sàng xác nhận xuất.</li>
              <li>Đang vận chuyển: hàng đã rời kho nguồn và chờ nhập vào kho đích.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
