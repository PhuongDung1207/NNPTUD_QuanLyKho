import axios from '@/lib/axios';
import { Brand, BrandListResponse } from '@/types/brand';

export const getBrands = async (params?: any): Promise<BrandListResponse> => {
  const response = await axios.get('/brands', { params });
  return response.data;
};

export const getBrandById = async (id: string): Promise<{ success: boolean; data: Brand }> => {
  const response = await axios.get(`/brands/${id}`);
  return response.data;
};

export const createBrand = async (data: Partial<Brand>): Promise<{ success: boolean; data: Brand }> => {
  const response = await axios.post('/brands', data);
  return response.data;
};

export const updateBrand = async (id: string, data: Partial<Brand>): Promise<{ success: boolean; data: Brand }> => {
  const response = await axios.patch(`/brands/${id}`, data);
  return response.data;
};

export const deleteBrand = async (id: string): Promise<{ success: boolean }> => {
  const response = await axios.delete(`/brands/${id}`);
  return response.data;
};
