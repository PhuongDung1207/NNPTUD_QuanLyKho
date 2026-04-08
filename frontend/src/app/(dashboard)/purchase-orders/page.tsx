'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  MoreVertical,
  ArrowRight,
  RefreshCw,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { getPOs } from '@/api/purchaseOrders';
import { getSuppliers } from '@/api/suppliers';
import { getWarehouses } from '@/api/warehouses';
import { POStatus } from '@/types/purchaseOrder';
import { format } from 'date-fns';
import Link from 'next/link';

export default function PurchaseOrdersPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '' as POStatus | '',
    supplier: '',
    warehouse: '',
  });

  // Fetch POs
  const { data: poData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['purchaseOrders', filters],
    queryFn: () => getPOs(filters),
  });

  // Fetch filters data
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers(),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const getStatusStyle = (status: POStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'approved':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'receiving':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'received':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusIcon = (status: POStatus) => {
    switch (status) {
      case 'draft': return <FileText size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'approved': return <CheckCircle2 size={14} />;
      case 'receiving': return <Truck size={14} />;
      case 'received': return <CheckCircle2 size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" />
            Quản lý Đơn Nhập Kho
          </h1>
          <p className="text-sm text-slate-500">
            Quản lý quy trình mua hàng, duyệt phiếu và nhận kho sản phẩm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <Link 
            href="/purchase-orders/create"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            Tạo Đơn Nhập Mới
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn (PO)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>

        <select
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white transition-all shadow-sm"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Nháp (Draft)</option>
          <option value="pending">Chờ duyệt (Pending)</option>
          <option value="approved">Đã duyệt (Approved)</option>
          <option value="receiving">Đang nhận (Receiving)</option>
          <option value="received">Đã nhận đủ (Received)</option>
          <option value="cancelled">Đã hủy (Cancelled)</option>
        </select>

        <select
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white transition-all shadow-sm"
          value={filters.supplier}
          onChange={(e) => setFilters({ ...filters, supplier: e.target.value, page: 1 })}
        >
          <option value="">Tất cả nhà cung cấp</option>
          {suppliersData?.data?.map((s: any) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <select
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white transition-all shadow-sm"
          value={filters.warehouse}
          onChange={(e) => setFilters({ ...filters, warehouse: e.target.value, page: 1 })}
        >
          <option value="">Tất cả kho</option>
          {warehousesData?.data?.map((w) => (
            <option key={w._id} value={w._id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/60 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                <th className="px-6 py-4">Mã Đơn</th>
                <th className="px-6 py-4">Nhà Cung Cấp</th>
                <th className="px-6 py-4">Kho Nhận</th>
                <th className="px-6 py-4 text-center">Tổng Tiền</th>
                <th className="px-6 py-4 text-center">Trạng Thái</th>
                <th className="px-6 py-4">Ngày Dự Kiến</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                    Đang tải dữ liệu đơn hàng...
                  </td>
                </tr>
              ) : poData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy đơn mua hàng nào.
                  </td>
                </tr>
              ) : (
                poData?.data?.map((po) => (
                  <tr key={po._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-blue-600">{po.code}</span>
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(po.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Truck size={14} />
                        </div>
                        <span className="font-medium text-slate-700">
                          {typeof po.supplier === 'object' ? po.supplier.name : 'Nhà cung cấp'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {typeof po.warehouse === 'object' ? po.warehouse.name : 'Kho chính'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(po.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(po.status)}`}>
                        {getStatusIcon(po.status)}
                        {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{format(new Date(po.expectedDate), 'dd/MM/yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/purchase-orders/${po._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
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

        {/* Pagination Section */}
        {poData?.pagination && (
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white">
            <p className="text-xs text-slate-500">
              Hiển thị <span className="font-bold text-slate-700">{poData.data?.length || 0}</span> trên <span className="font-bold text-slate-700">{poData.pagination.total}</span> kết quả
            </p>
            <div className="flex gap-2">
              <button 
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
              >
                Trước
              </button>
              <button 
                disabled={filters.page >= poData.pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
