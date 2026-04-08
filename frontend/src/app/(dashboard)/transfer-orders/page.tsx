'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Package,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Warehouse,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { getTransferOrders } from '@/api/transferOrders';
import { getWarehouses } from '@/api/warehouses';
import { TransferOrderStatus } from '@/types/transferOrder';

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

function getUserName(user: unknown) {
  if (user && typeof user === 'object') {
    const value = user as { fullName?: string; username?: string; email?: string };
    return value.fullName || value.username || value.email || 'Hệ thống';
  }

  return 'Hệ thống';
}

function getWarehouseName(warehouse: unknown) {
  if (warehouse && typeof warehouse === 'object') {
    const value = warehouse as { name?: string; code?: string };
    return value.name || value.code || 'Kho';
  }

  return 'Kho';
}

export default function TransferOrdersPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    code: '',
    status: '' as TransferOrderStatus | '',
    fromWarehouse: '',
    toWarehouse: ''
  });

  const { data: transferData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['transferOrders', filters],
    queryFn: () => getTransferOrders(filters)
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses()
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Truck className="text-blue-600" />
            Quản lý Phiếu Chuyển Kho
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi điều chuyển nội bộ giữa các kho, xuất kho nguồn và xác nhận nhập kho đích.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-gray-50"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/transfer-orders/create"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
          >
            <Plus size={18} />
            Tạo Phiếu Chuyển
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu (TO)..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filters.code}
            onChange={(e) => setFilters((prev) => ({ ...prev, code: e.target.value, page: 1 }))}
          />
        </div>

        <select
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value as TransferOrderStatus | '', page: 1 }))
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="pending">Chờ xuất</option>
          <option value="in_transit">Đang vận chuyển</option>
          <option value="completed">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        <select
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          value={filters.fromWarehouse}
          onChange={(e) => setFilters((prev) => ({ ...prev, fromWarehouse: e.target.value, page: 1 }))}
        >
          <option value="">Tất cả kho nguồn</option>
          {warehousesData?.data?.map((warehouse) => (
            <option key={warehouse._id} value={warehouse._id}>
              {warehouse.name}
            </option>
          ))}
        </select>

        <select
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          value={filters.toWarehouse}
          onChange={(e) => setFilters((prev) => ({ ...prev, toWarehouse: e.target.value, page: 1 }))}
        >
          <option value="">Tất cả kho đích</option>
          {warehousesData?.data?.map((warehouse) => (
            <option key={warehouse._id} value={warehouse._id}>
              {warehouse.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Mã Phiếu</th>
                <th className="px-6 py-4">Luồng Chuyển</th>
                <th className="px-6 py-4">Người Tạo</th>
                <th className="px-6 py-4 text-center">Trạng Thái</th>
                <th className="px-6 py-4">Thời Gian</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="mr-2 inline-block animate-spin" size={18} />
                    Đang tải dữ liệu phiếu chuyển...
                  </td>
                </tr>
              ) : transferData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy phiếu chuyển kho nào.
                  </td>
                </tr>
              ) : (
                transferData?.data?.map((order) => (
                  <tr key={order._id} className="group transition-colors hover:bg-blue-50/30">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-blue-600">{order.code}</span>
                        <span className="text-[10px] text-slate-400">
                          Tạo lúc {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Warehouse size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="truncate font-medium">{getWarehouseName(order.fromWarehouse)}</span>
                            <ArrowRight size={14} className="shrink-0 text-slate-400" />
                            <span className="truncate font-medium">{getWarehouseName(order.toWarehouse)}</span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-slate-400">{order.note || 'Không có ghi chú điều chuyển.'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">{getUserName(order.requestedBy)}</td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${getStatusStyle(order.status)}`}
                      >
                        {getStatusIcon(order.status)}
                        {statusLabelMap[order.status]}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs text-slate-500">
                        <p>Cập nhật: {format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm')}</p>
                        {order.shippedAt && <p>Xuất kho: {format(new Date(order.shippedAt), 'dd/MM/yyyy HH:mm')}</p>}
                        {order.receivedAt && <p>Nhập kho: {format(new Date(order.receivedAt), 'dd/MM/yyyy HH:mm')}</p>}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/transfer-orders/${order._id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
                      >
                        Chi tiết
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {transferData?.pagination && (
          <div className="flex items-center justify-between border-t border-gray-50 bg-white px-6 py-4">
            <p className="text-xs text-slate-500">
              Hiển thị <span className="font-bold text-slate-700">{transferData.data?.length || 0}</span> trên{' '}
              <span className="font-bold text-slate-700">{transferData.pagination.total}</span> kết quả
            </p>
            <div className="flex gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                disabled={filters.page >= transferData.pagination.totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
            <Package size={16} />
            Nháp linh hoạt
          </div>
          <p className="mt-2 text-xs leading-relaxed text-blue-600/90">
            Phiếu ở trạng thái nháp chỉ giữ kế hoạch điều chuyển, chưa trừ tồn kho nguồn.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
            <Clock size={16} />
            Kiểm tra tồn khả dụng
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-600/90">
            Khi gửi xuất, hệ thống sẽ kiểm tra `availableQuantity` tại kho nguồn trước khi chuyển sang chờ xuất.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={16} />
            Hoàn tất 2 bước
          </div>
          <p className="mt-2 text-xs leading-relaxed text-emerald-600/90">
            Phiếu hoàn tất sau khi đã xuất khỏi kho nguồn và được xác nhận nhập vào kho đích.
          </p>
        </div>
      </div>
    </div>
  );
}
