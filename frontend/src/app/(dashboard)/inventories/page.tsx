'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  RefreshCw,
  Filter,
  Save,
  X,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layout
} from 'lucide-react';
import { getInventories, updateInventoryStatus } from '@/api/inventories';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import { Inventory } from '@/types/inventory';
import { format } from 'date-fns';

export default function InventoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [filters, setFilters] = useState({
    lowStock: false,
    belowMinStock: false
  });

  // Fetch Inventories
  const { data: inventoriesResponse, isLoading, isFetching } = useQuery({
    queryKey: ['inventories', search, selectedWarehouse, filters],
    queryFn: () => getInventories({ 
      search, 
      warehouse: selectedWarehouse,
      lowStock: filters.lowStock,
      belowMinStock: filters.belowMinStock
    }),
  });

  // Fetch Warehouses & Products for filters/creation
  const { data: warehousesResponse } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const inventories = inventoriesResponse?.data || [];
  const warehouses = warehousesResponse?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-blue-600" />
            Tồn kho theo Kho
          </h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi số lượng tồn kho công việc, hàng giữ và khả năng đáp ứng.</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-white"
          >
            <option value="">Tất cả kho</option>
            {warehouses.map(w => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>

          <button 
            onClick={() => setFilters(prev => ({ ...prev, lowStock: !prev.lowStock }))}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all border ${
              filters.lowStock 
                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                : 'text-slate-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle size={16} />
            Dưới điểm đặt hàng
          </button>

          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['inventories'] })}
            className="p-2.5 text-slate-400 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Kho hàng</th>
                <th className="px-6 py-4 text-center">Tồn thực tế</th>
                <th className="px-6 py-4 text-center">Đang giữ</th>
                <th className="px-6 py-4 text-center">Tồn khả dụng</th>
                <th className="px-6 py-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/20" />
                  </tr>
                ))
              ) : inventories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Không có dữ liệu tồn kho.</td>
                </tr>
              ) : (
                inventories.map((item: Inventory) => {
                  const product = item.product as any;
                  const warehouse = item.warehouse as any;
                  const isLowStock = item.availableQuantity <= item.reorderPoint;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Package size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{product?.name || 'Unknown Product'}</span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider">{product?.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <WarehouseIcon size={14} className="text-slate-400" />
                          <span className="text-slate-600 font-medium">{warehouse?.name || 'Unknown Warehouse'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">
                        {item.quantityOnHand}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-amber-600 font-bold bg-amber-50/30">
                        {item.reservedQuantity}
                      </td>
                      <td className={`px-6 py-4 text-center font-mono font-black text-base ${isLowStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {item.availableQuantity}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            <TrendingDown size={12} /> CẦN NHẬP HÀNG
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <CheckCircle2 size={12} /> ĐỦ TỒN KHO
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
    </div>
  );
}
