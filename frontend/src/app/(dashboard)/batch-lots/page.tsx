'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  MoreVertical,
  ArrowUpDown,
  Warehouse as WarehouseIcon,
  Package as PackageIcon,
  RefreshCw
} from 'lucide-react';
import { getBatchLots, updateBatchLotStatus } from '@/api/batchLots';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import { BatchLotStatus } from '@/types/batchLot';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function BatchLotsPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '' as BatchLotStatus | '',
    warehouse: '',
    product: '',
  });

  // Fetch Batch Lots
  const { data: batchData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['batchLots', filters],
    queryFn: () => getBatchLots(filters),
  });

  // Fetch filters data
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => getProducts({ limit: 100 }),
  });

  const handleStatusChange = async (id: string, newStatus: BatchLotStatus) => {
    try {
      await updateBatchLotStatus(id, newStatus);
      refetch();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const getStatusStyle = (status: BatchLotStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'blocked':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'expired':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'damaged':
        return 'bg-slate-50 text-slate-600 border-slate-100';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusIcon = (status: BatchLotStatus) => {
    switch (status) {
      case 'available': return <CheckCircle2 size={14} />;
      case 'blocked': return <XCircle size={14} />;
      case 'expired': return <AlertTriangle size={14} />;
      case 'damaged': return <XCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Box className="text-blue-600" />
            Quản lý Lô / Hạn Sử Dụng
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi tồn kho theo mã lô, ngày sản xuất và hạn dùng.
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
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all active:scale-95">
            <Plus size={18} />
            Tạo Lô Hàng Mới
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã lô..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>

        <select
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white transition-all"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">Sẵn dùng (Available)</option>
          <option value="blocked">Đã khóa (Blocked)</option>
          <option value="expired">Hết hạn (Expired)</option>
          <option value="damaged">Hư hỏng (Damaged)</option>
        </select>

        <select
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white transition-all"
          value={filters.warehouse}
          onChange={(e) => setFilters({ ...filters, warehouse: e.target.value, page: 1 })}
        >
          <option value="">Tất cả kho</option>
          {warehousesData?.data?.map((w) => (
            <option key={w._id} value={w._id}>{w.name}</option>
          ))}
        </select>

        <select
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white transition-all shadow-sm"
          value={filters.product}
          onChange={(e) => setFilters({ ...filters, product: e.target.value, page: 1 })}
        >
          <option value="">Tất cả sản phẩm</option>
          {productsData?.data && 'docs' in productsData.data && (productsData.data.docs as any[]).map((p: any) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/60 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                <th className="px-6 py-4">Mã Lô</th>
                <th className="px-6 py-4">Sản Phẩm</th>
                <th className="px-6 py-4">Kho</th>
                <th className="px-6 py-4 text-center">Số Lượng</th>
                <th className="px-6 py-4">Hạn Sử Dụng</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : batchData?.data?.docs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy lô hàng nào.
                  </td>
                </tr>
              ) : (
                batchData?.data?.docs.map((lot) => (
                  <tr key={lot._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">
                      {lot.lotCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <PackageIcon size={14} />
                        </div>
                        <span className="font-medium text-slate-700">
                          {typeof lot.product === 'object' ? lot.product.name : 'Sản phẩm'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <WarehouseIcon size={14} className="text-slate-400" />
                        <span>Kho chính</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700">
                      {lot.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-medium">
                          {format(new Date(lot.expiryDate), 'dd/MM/yyyy')}
                        </span>
                        {lot.remainingDays !== undefined && (
                          <span className={`text-[10px] ${lot.remainingDays < 30 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                            {lot.remainingDays > 0 ? `Còn ${lot.remainingDays} ngày` : 'Đã hết hạn'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(lot.status)}`}>
                        {getStatusIcon(lot.status)}
                        {lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Eye size={18} />
                        </button>
                        <div className="relative group/menu">
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-all">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        {batchData?.data && (
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white">
            <p className="text-xs text-slate-500">
              Hiển thị <span className="font-bold text-slate-700">{batchData.data.docs.length}</span> trên <span className="font-bold text-slate-700">{batchData.data.totalDocs}</span> kết quả
            </p>
            <div className="flex gap-2">
              <button 
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Trước
              </button>
              <button 
                disabled={filters.page >= batchData.data.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all"
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
