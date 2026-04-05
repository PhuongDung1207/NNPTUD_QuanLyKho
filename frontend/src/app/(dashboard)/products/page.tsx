'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  RefreshCw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Tag,
  Layers,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Archive
} from 'lucide-react';
import { getProducts, deleteProduct } from '@/api/products';
import { getCategories } from '@/api/categories';
import { getBrands } from '@/api/brands';
import { Product, ProductFilterParams } from '@/types/products';
import Link from 'next/link';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProductFilterParams>({
    page: 1,
    limit: 10,
    search: '',
    category: '',
    brand: '',
    status: ''
  });

  // Fetch Products
  const { data: productsResponse, isLoading, isFetching } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
  });

  // Fetch Categories & Brands for filters
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  const { data: brandsResponse } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getBrands(),
  });

  const { docs: products = [], totalPages = 1 } = productsResponse?.data || {};
  const categories = categoriesResponse?.data || [];
  const brands = brandsResponse?.data || [];

  // Mutations
  const mutationDelete = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    draft: 'bg-amber-50 text-amber-600 border-amber-100',
    inactive: 'bg-slate-50 text-slate-500 border-slate-100',
    discontinued: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const statusIcons: Record<string, any> = {
    active: CheckCircle2,
    draft: Clock,
    inactive: XCircle,
    discontinued: Archive,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-blue-600" />
            Quản lý Sản phẩm
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng cộng <span className="font-bold text-slate-700">{productsResponse?.data?.totalDocs || 0}</span> sản phẩm trong hệ thống.
          </p>
        </div>
        <Link 
          href="/products/create"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 text-center justify-center"
        >
          <Plus size={18} />
          Thêm Sản phẩm
        </Link>
      </div>

      {/* ── Filters & Search ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="md:col-span-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
        
        <select
          className="py-2 px-4 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm appearance-none"
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          className="py-2 px-4 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm appearance-none"
          value={filters.brand}
          onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value, page: 1 }))}
        >
          <option value="">Tất cả thương hiệu</option>
          {brands.map(b => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            className="flex-1 py-2 px-4 rounded-xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm appearance-none"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="draft">Bản nháp</option>
            <option value="inactive">Tạm ngưng</option>
            <option value="discontinued">Ngừng sản xuất</option>
          </select>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
            className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 text-slate-400 transition-colors"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Products Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">SKU / Phân loại</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Đơn giá (VNĐ)</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-12" >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gray-100 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-1/3" />
                          <div className="h-3 bg-gray-100 rounded w-1/4" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Không tìm thấy sản phẩm nào.</td>
                </tr>
              ) : (
                products.map((product) => {
                  const StatusIcon = statusIcons[product.status] || CheckCircle2;
                  return (
                    <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-gray-100">
                            <Package size={20} />
                          </div>
                          <div className="flex flex-col">
                            <Link href={`/products/${product._id}`} className="font-bold text-slate-800 hover:text-blue-600 transition-colors">
                              {product.name}
                            </Link>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Layers size={10} /> {typeof product.category === 'object' ? product.category?.name : 'Chưa phân loại'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit tracking-wider">
                            {product.sku}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Tag size={10} /> {typeof product.brand === 'object' ? product.brand?.name : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${statusColors[product.status]}`}>
                          <StatusIcon size={12} />
                          {product.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">
                         {product.price?.sale?.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/products/${product._id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button 
                            onClick={() => {
                              if(window.confirm('Xóa sản phẩm này?')) mutationDelete.mutate(product._id);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
          <p className="text-xs text-slate-500">
            Hiển thị trang <span className="font-bold text-slate-700">{filters.page}</span> / <span className="font-bold text-slate-700">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button 
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page! - 1)}
              className="p-2 rounded-lg border border-gray-200 text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              disabled={filters.page === totalPages}
              onClick={() => handlePageChange(filters.page! + 1)}
              className="p-2 rounded-lg border border-gray-200 text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
