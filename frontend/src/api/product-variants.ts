import axiosInstance from '@/lib/axios';

export interface ProductVariant {
  _id: string;
  productId: string;
  sku: string;
  barcode?: string;
  attributes: {
    name: string;
    value: string;
  }[];
  price?: {
    cost?: number;
    sale?: number;
    wholesale?: number;
  };
  status: 'active' | 'inactive';
}

export const getVariantsByProduct = async (productId: string): Promise<{ success: boolean; data: ProductVariant[] }> => {
  const { data } = await axiosInstance.get<{ success: boolean; data: ProductVariant[] }>(`/product-variants/product/${productId}`);
  return data;
};

export const createVariant = async (productId: string, payload: any): Promise<{ success: boolean; data: ProductVariant }> => {
  const { data } = await axiosInstance.post<{ success: boolean; data: ProductVariant }>(`/product-variants/${productId}`, payload);
  return data;
};

export const deleteVariant = async (variantId: string): Promise<{ success: boolean }> => {
  const { data } = await axiosInstance.delete<{ success: boolean }>(`/product-variants/${variantId}`);
  return data;
};
