'use client';

import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Truck,
  Warehouse
} from 'lucide-react';
import { createTransferOrder, submitTransferOrder } from '@/api/transferOrders';
import { getProducts } from '@/api/products';
import { getWarehouses } from '@/api/warehouses';
import { Product } from '@/types/products';
import { useAuthStore } from '@/store/useAuthStore';
import { canCreateOrderDocuments } from '@/lib/auth';

interface TransferFormItem {
  product: string;
  productName: string;
  sku: string;
  tracking?: 'none' | 'lot';
  quantityRequested: number;
  note: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: unknown;
}

function getApiErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  const message = axiosError.response?.data?.message || axiosError.message || 'Đã xảy ra lỗi không xác định';
  const details = axiosError.response?.data?.errors;

  return details ? JSON.stringify(details, null, 2) : message;
}

export default function TransferOrderCreatePage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const canCreateOrders = canCreateOrderDocuments(currentUser);
  const [formData, setFormData] = useState({
    fromWarehouse: '',
    toWarehouse: '',
    note: '',
    items: [] as TransferFormItem[]
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses()
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => getProducts({ limit: 100 })
  });

  const mutationCreate = useMutation({
    mutationFn: async (data: typeof formData & { _submitType: 'draft' | 'submit' }) => {
      const payload = {
        fromWarehouse: data.fromWarehouse,
        toWarehouse: data.toWarehouse,
        note: data.note || undefined,
        items: data.items.map((item) => ({
          product: item.product,
          quantityRequested: Number(item.quantityRequested),
          note: item.note || undefined
        }))
      };

      const response = await createTransferOrder(payload);

      if (data._submitType === 'submit' && response.data?._id) {
        await submitTransferOrder(response.data._id);
      }

      return response;
    },
    onSuccess: () => {
      router.push('/transfer-orders');
      router.refresh();
    },
    onError: (error: unknown) => {
      setErrorMsg(getApiErrorMessage(error));
    }
  });

  const addItem = (product: Product) => {
    if (formData.items.find((item) => item.product === product._id)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: product._id,
          productName: product.name,
          sku: product.sku || '',
          tracking: product.tracking || 'none',
          quantityRequested: 1,
          note: ''
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const updateItem = (index: number, field: keyof TransferFormItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    }));
  };

  const totalSku = formData.items.length;
  const totalQuantity = formData.items.reduce((total, item) => total + Number(item.quantityRequested || 0), 0);
  const selectedFromWarehouse = warehousesData?.data?.find((warehouse) => warehouse._id === formData.fromWarehouse);
  const selectedToWarehouse = warehousesData?.data?.find((warehouse) => warehouse._id === formData.toWarehouse);

  const handleSubmit = (type: 'draft' | 'submit') => {
    if (!formData.fromWarehouse || !formData.toWarehouse) {
      setErrorMsg('Vui lòng chọn đầy đủ kho nguồn và kho đích.');
      return;
    }

    if (formData.fromWarehouse === formData.toWarehouse) {
      setErrorMsg('Kho nguồn và kho đích phải khác nhau.');
      return;
    }

    if (formData.items.length === 0) {
      setErrorMsg('Vui lòng thêm ít nhất 1 sản phẩm cần điều chuyển.');
      return;
    }

    setErrorMsg(null);
    mutationCreate.mutate({ ...formData, _submitType: type });
  };

  if (currentUser && !canCreateOrders) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle size={24} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-800">Không có quyền tạo phiếu chuyển kho</h1>
          <p className="mt-2 text-sm text-slate-500">
            Chỉ tài khoản `user` hoặc `admin` mới được tạo phiếu chuyển kho.
          </p>
          <button
            type="button"
            onClick={() => router.push('/transfer-orders')}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-gray-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Plus className="text-blue-600" />
            Tạo Phiếu Chuyển Kho Mới
          </h1>
          <p className="text-sm text-slate-500">
            Khởi tạo điều chuyển nội bộ giữa các kho và chuẩn bị luồng xuất, nhập hàng.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="border-b border-gray-50 pb-3 font-bold text-slate-800">Thông Tin Chung</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Kho Nguồn <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={formData.fromWarehouse}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fromWarehouse: e.target.value }))}
                >
                  <option value="">Chọn kho nguồn...</option>
                  {warehousesData?.data?.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Kho Đích <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={formData.toWarehouse}
                  onChange={(e) => setFormData((prev) => ({ ...prev, toWarehouse: e.target.value }))}
                >
                  <option value="">Chọn kho đích...</option>
                  {warehousesData?.data?.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500">Ghi Chú Điều Chuyển</label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Điều chuyển hàng sang kho chi nhánh để bổ sung tồn bán hàng."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={formData.note}
                  onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
              <h3 className="font-bold text-slate-800">Danh Sách Sản Phẩm Điều Chuyển</h3>
              <div className="group relative w-72">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-blue-500"
                  size={16}
                />
                <select
                  className="w-full cursor-pointer appearance-none rounded-xl border border-gray-100 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20"
                  onChange={(e) => {
                    const product = productsData?.data?.find((item) => item._id === e.target.value);
                    if (product) {
                      addItem(product);
                    }
                    e.target.value = '';
                  }}
                >
                  <option value="">+ Thêm sản phẩm...</option>
                  {productsData?.data?.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-6 py-4 text-center">Tracking</th>
                    <th className="px-6 py-4 text-center">Số lượng</th>
                    <th className="px-6 py-4">Ghi chú</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {formData.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center italic text-slate-400">
                        Chưa có sản phẩm nào được chọn.
                      </td>
                    </tr>
                  ) : (
                    formData.items.map((item, index) => (
                      <tr key={item.product} className="transition-colors hover:bg-gray-50/30">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.productName}</p>
                          <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                              item.tracking === 'lot'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.tracking === 'lot' ? 'LOT' : 'NONE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            min={1}
                            className="w-24 rounded-lg border border-gray-100 px-2 py-1.5 text-center font-bold focus:ring-2 focus:ring-blue-500/20"
                            value={item.quantityRequested}
                            onChange={(e) => updateItem(index, 'quantityRequested', parseInt(e.target.value, 10) || 0)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Ghi chú theo dòng hàng"
                            className="w-full rounded-lg border border-gray-100 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20"
                            value={item.note}
                            onChange={(e) => updateItem(index, 'note', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="rounded-lg p-1.5 text-rose-300 transition-all hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-800">
              <Truck size={18} className="text-blue-500" />
              Tóm Tắt Điều Chuyển
            </h3>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center justify-between text-xs uppercase text-slate-500">
                <span>Luồng điều chuyển</span>
                <span>{selectedFromWarehouse && selectedToWarehouse ? 'Sẵn sàng' : 'Chưa đủ dữ liệu'}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm font-semibold text-slate-800">
                <div className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 shadow-sm">
                  {selectedFromWarehouse?.name || 'Kho nguồn'}
                </div>
                <ArrowRight size={16} className="shrink-0 text-blue-500" />
                <div className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 shadow-sm">
                  {selectedToWarehouse?.name || 'Kho đích'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Số SKU:</span>
                <span className="font-medium text-slate-800">{totalSku}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tổng số lượng:</span>
                <span className="font-medium text-slate-800">{totalQuantity}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-gray-100 pt-3 text-sm">
                <span className="font-bold text-slate-800">Tình trạng:</span>
                <span className="font-bold text-blue-600">Khởi tạo phiếu TO</span>
              </div>
            </div>

            {errorMsg && (
              <div className="break-all whitespace-pre-wrap rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-mono text-rose-700">
                <b>Lỗi:</b> {errorMsg}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={mutationCreate.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-3.5 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-50"
              >
                {mutationCreate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Lưu Thành Bản Nháp
              </button>

              <button
                type="button"
                onClick={() => handleSubmit('submit')}
                disabled={mutationCreate.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                {mutationCreate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Truck size={18} />}
                Tạo và Gửi Xuất Kho
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-400">
              Khi gửi xuất kho, hệ thống sẽ kiểm tra tồn khả dụng tại kho nguồn trước khi chuyển trạng thái sang
              <b> PENDING</b>.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
              <AlertTriangle size={16} />
              Lưu Ý Nghiệp Vụ
            </div>
            <ul className="ml-4 list-disc space-y-2 text-xs leading-relaxed text-amber-600/80">
              <li>Mã phiếu chuyển sẽ được hệ thống tự động sinh sau khi lưu.</li>
              <li>Kho nguồn và kho đích bắt buộc phải khác nhau.</li>
              <li>Hàng theo dõi theo lô vẫn được chuyển bình thường, nhưng việc nhập tồn sẽ diễn ra khi xác nhận nhận kho.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-slate-900 p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
              <Warehouse size={16} />
              Gợi ý vận hành
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Hãy tạo phiếu theo từng tuyến kho cố định để đội vận hành dễ kiểm tra tồn, xuất kho và xác nhận nhập ở
              kho đích.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
