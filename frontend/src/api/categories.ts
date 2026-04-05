import axios from '@/lib/axios';
import { Category, CategoryListResponse } from '@/types/category';

export const getCategories = async (params?: any): Promise<CategoryListResponse> => {
  const response = await axios.get('/categories', { params });
  return response.data;
};

export const createCategory = async (data: Partial<Category>): Promise<{ success: boolean; data: Category }> => {
  const response = await axios.post('/categories', data);
  return response.data;
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<{ success: boolean; data: Category }> => {
  const response = await axios.patch(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
  const response = await axios.delete(`/categories/${id}`);
  return response.data;
};
