'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Search, 
  RefreshCw,
  Filter,
  Warehouse,
  AlertTriangle,
  ArrowRightLeft,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { getInventories } from '@/api/inventories';
import { getWarehouses } from '@/api/warehouses';
import { format } from 'date-fns';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    warehouse: '',
    lowStock: false
  });

  // Fetch Inventories
  const { data: inventoryResult, isLoading, isFetching } = useQuery({
    queryKey: ['inventories', filters],
    queryFn: () => getInventories(filters),
  });

  // Fetch Warehouses for filter
  const { data: warehousesResult } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const inventories = inventoryResult?.data || [];
  const warehouses = warehousesResult?.data || [];
  const pagination = inventoryResult?.pagination;

  const stats = {
    totalItems: pagination?.total || 0,
    lowStockItems: inventories.filter(item => item.availableQuantity <= item.reorderPoint).length,
    outOfStock: inventories.filter(item => item.availableQuantity <= 0).length,
    totalStockValue: 0 // Could implement if we had price data here
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Box className="text-blue-600" />
            Theo dõi Tồn kho
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý số lượng hàng hóa thực tế và khả dụng trên tất cả các kho.
          </p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['inventories'] })}
            className="p-2.5 text-slate-400 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng mặt hàng</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalItems}</p>
          </div>
        </div>
        <div className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 ${stats.lowStockItems > 0 ? 'border-l-amber-400' : 'border-l-emerald-400'}`}>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stats.lowStockItems > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sắp hết hàng</p>
            <p className={`text-2xl font-black tracking-tight ${stats.lowStockItems > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {stats.lowStockItems}
            </p>
          </div>
        </div>
        <div className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 ${stats.outOfStock > 0 ? 'border-l-rose-400' : 'border-l-slate-100'}`}>
          <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hết hàng (Hết sạch)</p>
            <p className="text-2xl font-black text-rose-600 tracking-tight">{stats.outOfStock}</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo sản phẩm hoặc SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-sm outline-none"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-slate-50/50 focus:bg-white text-sm outline-none appearance-none"
              value={filters.warehouse}
              onChange={(e) => setFilters({...filters, warehouse: e.target.value, page: 1})}
            >
              <option value="">Tất cả các kho</option>
              {warehouses.map(w => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setFilters({...filters, lowStock: !filters.lowStock, page: 1})}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all border ${
              filters.lowStock 
                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                : 'bg-white text-slate-600 border-gray-100 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle size={16} />
            Sắp hết
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-blue-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Sản phẩm & Thông tin</th>
                <th className="px-6 py-4">Kho lưu trữ</th>
                <th className="px-6 py-4 text-center">Tồn thực tế (On-Hand)</th>
                <th className="px-6 py-4 text-center">Đang giữ chỗ (Reserved)</th>
                <th className="px-6 py-4 text-center">Khả dụng (Available)</th>
                <th className="px-6 py-4 text-center">Tình trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-5 h-20 bg-gray-50/20" />
                  </tr>
                ))
              ) : inventories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                    Không tìm thấy dữ liệu tồn kho nào.
                  </td>
                </tr>
              ) : (
                inventories.map((item: any) => {
                  const isLow = item.availableQuantity <= item.reorderPoint;
                  const isOut = item.availableQuantity <= 0;

                  return (
                    <tr key={item._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-gray-100">
                            <Box size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{item.product?.name || 'Sản phẩm không rõ'}</span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider">{item.product?.sku || 'NO-SKU'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <div className="p-1 rounded bg-slate-100">
                            <Warehouse size={14} className="text-slate-400" />
                          </div>
                          {item.warehouse?.name || 'Kho không rõ'}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-lg font-black text-slate-800">{item.quantityOnHand}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-bold text-[11px]">
                          {item.reservedQuantity > 0 ? `-${item.reservedQuantity}` : '0'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className={`inline-flex flex-col items-center px-4 py-1.5 rounded-2xl ${
                          isOut ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          isLow ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          <span className="text-lg font-black">{item.availableQuantity}</span>
                          <span className="text-[9px] font-bold uppercase tracking-tighter opacity-70">Khả dụng</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-black text-[10px] uppercase">
                            <XCircle size={12} /> Hết hàng
                          </span>
                        ) : isLow ? (
                          <div className="flex flex-col items-center gap-0.5 text-amber-600">
                             <span className="inline-flex items-center gap-1 font-black text-[10px] uppercase">
                               <AlertTriangle size={12} /> Sắp hết
                             </span>
                             <span className="text-[9px] text-slate-400">Định mức: {item.reorderPoint}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase">
                            <CheckCircle2 size={12} /> Ổn định
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Informational Footer */}
      <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
        <Info size={18} className="text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed font-medium">
          <strong>Công thức tính tồn kho:</strong> Tồn khả dụng = Tồn thực tế - Hàng đã giữ chỗ (đang chờ xuất). 
          Khi tồn khả dụng thấp hơn <strong>Định mức tái nhập (Reorder Point)</strong>, hệ thống sẽ cảnh báo trạng thái "Sắp hết".
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Mock Missing Components Reference
const CheckCircle2 = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XCircle = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
