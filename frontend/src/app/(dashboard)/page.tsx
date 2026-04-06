'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import {
  Package, Users, AlertCircle,
  ShoppingCart, Truck, ArrowUpRight, ArrowDownRight,
  BarChart3, Activity, Clock, CheckCircle2,
  Box, RefreshCw, Star, Zap, Building2
} from 'lucide-react';
import { getProducts } from '@/api/products';
import { getPOs } from '@/api/purchaseOrders';
import { getSuppliers } from '@/api/suppliers';
import { getWarehouses } from '@/api/warehouses';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  // Real Data Fetching
  const { data: productsRes, isLoading: loadingProducts } = useQuery({ queryKey: ['products-count'], queryFn: () => getProducts({ limit: 5 }) });
  const { data: posRes, isLoading: loadingPOs } = useQuery({ queryKey: ['pos-count'], queryFn: () => getPOs({ limit: 5 }) });
  const { data: suppliersRes, isLoading: loadingSuppliers } = useQuery({ queryKey: ['suppliers-count'], queryFn: () => getSuppliers() });
  const { data: warehousesRes, isLoading: loadingWarehouses } = useQuery({ queryKey: ['warehouses-count'], queryFn: () => getWarehouses() });

  const totalProducts = productsRes?.data?.totalDocs || 0;
  const totalPOs = posRes?.data?.totalDocs || 0;
  const totalSuppliers = suppliersRes?.data?.length || 0;
  const totalWarehouses = warehousesRes?.data?.length || 0;

  const kpiCards = [
    {
      id: 'total-products',
      name: 'Tổng Sản Phẩm',
      value: totalProducts.toLocaleString(),
      change: '+5%', // Simulating trends for now
      trend: 'up',
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      desc: 'Sản phẩm trong danh mục',
      href: '/products'
    },
    {
      id: 'purchase-orders',
      name: 'Đơn Nhập Kho',
      value: totalPOs.toLocaleString(),
      change: '+2%',
      trend: 'up',
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      desc: 'Tổng số đơn nhập hàng',
      href: '/purchase-orders'
    },
    {
      id: 'suppliers',
      name: 'Nhà Cung Cấp',
      value: totalSuppliers.toLocaleString(),
      change: '+1',
      trend: 'up',
      icon: Truck,
      gradient: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      desc: 'Đối tác chiến lược',
      href: '/suppliers'
    },
    {
      id: 'warehouses',
      name: 'Kho Vận Hành',
      value: totalWarehouses.toLocaleString(),
      change: '0',
      trend: 'neutral',
      icon: Building2,
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      desc: 'Điểm lưu kho đang hoạt động',
      href: '/warehouses'
    },
  ];

  const recentProducts = productsRes?.data?.docs || [];
  const recentPOs = posRes?.data?.docs || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Header Greeting ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👋</span>
            <h1 className="text-2xl font-bold text-slate-800">
              {greeting}, <span className="text-blue-600">{user?.fullName || user?.username}</span>!
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Hệ thống đang hoạt động ổn định. Hôm nay là {format(now, 'eeee, dd MMMM yyyy', { locale: vi })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-gray-50 transition-all">
            <RefreshCw size={16} />
            Làm mới
          </button>
          <Link href="/purchase-orders/create" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
            <Zap size={16} />
            Nhập Kho Nhanh
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
            
            <div className="flex items-start justify-between">
              <div className={`rounded-xl p-3 ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                card.trend === 'up' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : card.trend === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
              }`}>
                {card.trend === 'up' 
                  ? <ArrowUpRight size={14} /> 
                  : card.trend === 'down' ? <ArrowDownRight size={14} /> : <Activity size={14} />}
                {card.change}
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{card.name}</p>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {isLoadingAny() ? '...' : card.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Middle Section: Products + Warehouse ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Recently Added Products (2/3 width) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-blue-600" />
              <h3 className="text-base font-semibold text-slate-800">Sản Phẩm Mới Thêm</h3>
            </div>
            <Link href="/products" className="text-xs font-semibold text-blue-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentProducts.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 italic text-sm">Chưa có sản phẩm nào.</div>
            ) : (
              recentProducts.map((p) => (
                <div key={p._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Package size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{p.price?.sale?.toLocaleString('vi-VN')} VNĐ</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold uppercase">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Warehouse Quick Stats (1/3 width) */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-xl">
             <div className="flex items-center gap-2 mb-6">
              <Box size={20} className="text-blue-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Tình trạng Kho</h3>
            </div>
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-2xl font-bold text-blue-400">{totalProducts}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Mã Hàng</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{totalWarehouses}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Điểm Lưu</p>
                  </div>
               </div>
               
               <div className="space-y-2">
                 <div className="flex justify-between text-xs font-bold text-slate-300">
                   <span>Hiệu suất Nhập kho</span>
                   <span>92%</span>
                 </div>
                 <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[92%] bg-blue-500 rounded-full" />
                 </div>
               </div>

               <Link href="/warehouses" className="block w-full py-3 text-center bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition-all mt-4 border border-blue-500/50 shadow-lg shadow-blue-600/20">
                  CHI TIẾT KHO BÃI
               </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Đơn nhập mới nhất</h3>
              <Clock size={16} className="text-slate-300" />
            </div>
            <div className="space-y-4">
              {recentPOs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Chưa có đơn nhập.</p>
              ) : (
                recentPOs.map(po => (
                  <Link href={`/purchase-orders/${po._id}`} key={po._id} className="flex items-center gap-3 group">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-[10px]">
                      PO
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">{po.code}</p>
                      <p className="text-[10px] text-slate-400">{format(new Date(po.createdAt), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[60px]">
                      {po.status}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function isLoadingAny() {
    return loadingProducts || loadingPOs || loadingSuppliers || loadingWarehouses;
  }
}
