'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Box, ChevronLeft, RefreshCw, Save } from 'lucide-react';
import { createBatchLot } from '@/api/batchLots';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import { BatchLotStatus, CreateBatchLotDto } from '@/types/batchLot';
import type { Product } from '@/types/products';
import type { Warehouse } from '@/types/warehouse';

export default function CreateBatchLotPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateBatchLotDto>({
    product: '',
    warehouse: '',
    lotCode: '',
    manufactureDate: '',
    expiryDate: '',
    quantity: 0,
    status: 'available'
  });

  const { data: warehousesResponse, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses()
  });

  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => getProducts({ limit: 200 })
  });

  const warehouses: Warehouse[] = warehousesResponse?.data || [];
  const products: Product[] = productsResponse?.data?.docs || [];

  const mutationCreate = useMutation({
    mutationFn: createBatchLot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchLots'] });
      router.push('/batch-lots');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutationCreate.mutate({
      ...formData,
      lotCode: formData.lotCode.toUpperCase()
    });
  };

  const isLoading = isLoadingWarehouses || isLoadingProducts;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 transition-all text-slate-400 hover:text-blue-600 shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Box className="text-blue-600" />
              Tạo Lô Hàng Mới
            </h1>
            <p className="text-sm text-slate-500">Khai báo mã lô, kho, sản phẩm và hạn sử dụng.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/batch-lots')}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutationCreate.isPending || isLoading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {mutationCreate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            Lưu Lô Hàng
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mutationCreate.isError && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-rose-500 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <h3 className="text-sm font-bold text-rose-800">Lỗi tạo lô hàng</h3>
              <p className="text-xs text-rose-600 mt-0.5">
                {(
                  mutationCreate.error as unknown as {
                    response?: { data?: { message?: string } };
                  }
                )?.response?.data?.message || 'Đã có lỗi xảy ra khi tạo lô hàng.'}
              </p>
              {(
                mutationCreate.error as unknown as {
                  response?: { data?: { errors?: Array<Record<string, string>> } };
                }
              )?.response?.data?.errors && (
                <ul className="mt-2 space-y-1">
                  {(
                    mutationCreate.error as unknown as {
                      response?: { data?: { errors?: Array<Record<string, string>> } };
                    }
                  ).response?.data?.errors?.map((err, idx: number) => (
                    <li key={idx} className="text-[10px] text-rose-500 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-rose-400" />
                      {Object.values(err)[0] as string}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">
                  Sản phẩm <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                >
                  <option value="">{isLoading ? 'Đang tải...' : 'Chọn sản phẩm'}</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">
                  Kho <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                >
                  <option value="">{isLoading ? 'Đang tải...' : 'Chọn kho'}</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">
                  Mã lô <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={formData.lotCode}
                  onChange={(e) => setFormData({ ...formData, lotCode: e.target.value })}
                  placeholder="VD: LOT-2026-0001"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Trạng thái</label>
                <select
                  value={formData.status || 'available'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as BatchLotStatus })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                >
                  <option value="available">Sẵn dùng</option>
                  <option value="blocked">Đã khóa</option>
                  <option value="damaged">Hư hỏng</option>
                  <option value="expired">Hết hạn</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Ngày sản xuất</label>
                <input
                  type="date"
                  value={formData.manufactureDate || ''}
                  onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Hạn sử dụng</label>
                <input
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">
                  Số lượng <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

