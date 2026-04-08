'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Save, 
  Package as PackageIcon,
  Search,
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react';
import { createPO, submitPO } from '@/api/purchaseOrders';
import { getSuppliers } from '@/api/suppliers';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import { format } from 'date-fns';

interface POFormItem {
  product: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function POCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    supplier: '',
    warehouse: '',
    expectedDate: format(new Date(), 'yyyy-MM-dd'),
    note: '',
    items: [] as POFormItem[],
  });

  // Data fetching for selectors
  const { data: suppliersData } = useQuery({ queryKey: ['suppliers'], queryFn: () => getSuppliers() });
  const { data: warehousesData } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses() });
  const { data: productsData } = useQuery({ 
    queryKey: ['products-list'], 
    queryFn: () => getProducts({ limit: 100 }) 
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutationCreate = useMutation({
    mutationFn: async (data: any) => {
      // Map data properly to match backend constraints
      const payload = {
        supplier: data.supplier,
        warehouse: data.warehouse,
        note: data.note || undefined,
        expectedDate: data.expectedDate ? new Date(data.expectedDate).toISOString() : undefined,
        items: data.items.map((item: POFormItem) => ({
          product: item.product,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate)
        }))
      };

      // Clean undefined fields
      Object.keys(payload).forEach(k => {
        if ((payload as any)[k] === undefined) delete (payload as any)[k];
      });
      
      const res = await createPO(payload);
      
      // If user wants to submit (Tạo và Chờ Phê Duyệt), submit the PO after creation
      if (data._submitType === 'submit' && res.data?._id) {
        await submitPO(res.data._id);
      }
      return res;
    },
    onSuccess: () => {
      router.push('/purchase-orders');
      router.refresh();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Đã xảy ra lỗi không xác định';
      const details = err?.response?.data?.errors;
      setErrorMsg(details ? JSON.stringify(details, null, 2) : msg);
    }
  });

  const addItem = (product: any) => {
    if (formData.items.find(item => item.product === product._id)) return;
    
    setFormData({
      ...formData,
      items: [...formData.items, {
        product: product._id,
        productName: product.name,
        sku: product.sku || '',
        quantity: 1,
        unitPrice: product.purchasePrice || 0,
        taxRate: 10,
      }]
    });
  };

  const removeItem = (idx: number) => {
    const newItems = [...formData.items];
    newItems.splice(idx, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (idx: number, field: keyof POFormItem, value: any) => {
    const newItems = [...formData.items];
    (newItems[idx] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    
    formData.items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = itemSubtotal * (item.taxRate / 100);
      subtotal += itemSubtotal;
      taxAmount += itemTax;
    });

    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const handleSubmit = (e: React.FormEvent, type: 'draft' | 'submit' = 'draft') => {
    e.preventDefault();
    if (!formData.supplier || !formData.warehouse || formData.items.length === 0) {
      alert('Vui lòng điền đầy đủ thông tin và thêm ít nhất 1 sản phẩm.');
      return;
    }
    setErrorMsg(null);
    mutationCreate.mutate({ ...formData, _submitType: type });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Plus className="text-blue-600" />
            Tạo Đơn Nhập Kho Mới
          </h1>
          <p className="text-sm text-slate-500">Lập kế hoạch nhập hàng và phê duyệt báo giá từ nhà cung cấp.</p>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Config */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-gray-50 pb-3 mb-4">Thông Tin Chung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nhà Cung Cấp <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                >
                  <option value="">Chọn nhà cung cấp...</option>
                  {suppliersData?.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Kho Nhận Hàng <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                >
                  <option value="">Chọn kho...</option>
                  {warehousesData?.data?.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Ngày Dự Kiến Nhận</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Ghi Chú</label>
                <input 
                  type="text"
                  placeholder="Vd: Nhập hàng đợt 1 tháng 4"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Items Management */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Danh Sách Mặt Hàng</h3>
              <div className="relative w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={16} />
                <select 
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                  onChange={(e) => {
                    const products = Array.isArray(productsData?.data) ? productsData.data : [];
                    const p = products.find((x: any) => x._id === e.target.value);
                    if (p) addItem(p);
                    e.target.value = "";
                  }}
                >
                  <option value="">+ Thêm sản phẩm...</option>
                  {Array.isArray(productsData?.data) && productsData.data.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-6 py-4 text-center">Số lượng</th>
                    <th className="px-6 py-4 text-center">Đơn giá</th>
                    <th className="px-6 py-4 text-center">Thuế(%)</th>
                    <th className="px-6 py-4 text-right">Tổng</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {formData.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Chưa có sản phẩm nào được chọn.</td>
                    </tr>
                  ) : (
                    formData.items.map((item, idx) => (
                      <tr key={item.product} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number"
                            className="w-20 px-2 py-1.5 rounded-lg border border-gray-100 focus:ring-2 focus:ring-blue-500/20 text-center font-bold"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number"
                            className="w-32 px-2 py-1.5 rounded-lg border border-gray-100 focus:ring-2 focus:ring-blue-500/20 text-center font-medium"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number"
                            className="w-16 px-2 py-1.5 rounded-lg border border-gray-100 focus:ring-2 focus:ring-blue-500/20 text-center text-xs"
                            value={item.taxRate}
                            onChange={(e) => updateItem(idx, 'taxRate', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                          {new Intl.NumberFormat('vi-VN').format(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1.5 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
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

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <ShoppingCart size={18} className="text-blue-500" />
              Tổng Ước Tính
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tạm tính:</span>
                <span className="font-medium text-slate-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tiền thuế:</span>
                <span className="font-medium text-slate-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(taxAmount)}</span>
              </div>
              <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
                <span className="font-bold text-slate-800 text-lg">Tổng cộng:</span>
                <span className="font-black text-blue-600 text-xl">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-mono whitespace-pre-wrap break-all">
                  <b>Lỗi:</b> {errorMsg}
                </div>
              )}
              <button 
                type="button"
                onClick={(e) => handleSubmit(e as any, 'draft')}
                disabled={mutationCreate.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-3.5 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50"
              >
                {mutationCreate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Lưu Thành Bản Nháp
              </button>
              
              <button 
                type="button"
                onClick={(e) => handleSubmit(e as any, 'submit')}
                disabled={mutationCreate.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {mutationCreate.isPending ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                Tạo và Chờ Phê Duyệt
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-3">Bản nháp có thể chỉnh sửa thêm. Nếu chọn gửi duyệt, đơn hàng sẽ chuyển sang trạng thái <b>PENDING</b>.</p>
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <AlertTriangle size={16} /> Lưu Ý Nghiệp Vụ
            </div>
            <ul className="text-xs text-amber-600/80 space-y-2 list-disc ml-4 leading-relaxed">
              <li>Mã đơn hàng (PO) sẽ được hệ thống <b>tự động sinh</b> sau khi lưu.</li>
              <li>Sản phẩm đã chọn sẽ được gán giá nhập từ cấu hình hệ thống (nếu có).</li>
              <li>Tổng tiền cuối cùng có thể thay đổi trong quá trình phê duyệt hoặc nhận thực tế.</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}
