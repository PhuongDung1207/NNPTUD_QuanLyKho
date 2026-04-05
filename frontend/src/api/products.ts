import axiosInstance from '@/lib/axios';
import { ProductListResponse, Product, ProductFilterParams } from '@/types/products';

export const getProducts = async (params: ProductFilterParams = {}): Promise<ProductListResponse> => {
  const { data } = await axiosInstance.get<ProductListResponse>('/products', { params });
  return data;
};

export const getProduct = async (id: string): Promise<{ success: boolean; data: Product }> => {
  const { data } = await axiosInstance.get<{ success: boolean; data: Product }>(`/products/${id}`);
  return data;
};

export const createProduct = async (payload: Partial<Product>): Promise<{ success: boolean; data: Product }> => {
  const { data } = await axiosInstance.post<{ success: boolean; data: Product }>('/products', payload);
  return data;
};

export const updateProduct = async (id: string, payload: Partial<Product>): Promise<{ success: boolean; data: Product }> => {
  const { data } = await axiosInstance.patch<{ success: boolean; data: Product }>(`/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id: string): Promise<{ success: boolean }> => {
  const { data } = await axiosInstance.delete<{ success: boolean }>(`/products/${id}`);
  return data;
};
