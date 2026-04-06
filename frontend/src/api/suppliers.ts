import axios from '@/lib/axios';
import { Supplier, SupplierListResponse } from '@/types/supplier';

export const getSuppliers = async (params?: any): Promise<SupplierListResponse> => {
  const response = await axios.get('/suppliers', { params });
  return response.data;
};

export const getSupplierById = async (id: string): Promise<{ success: boolean; data: Supplier }> => {
  const response = await axios.get(`/suppliers/${id}`);
  return response.data;
};

export const createSupplier = async (data: Partial<Supplier>): Promise<{ success: boolean; data: Supplier }> => {
  const response = await axios.post('/suppliers', data);
  return response.data;
};

export const updateSupplier = async (id: string, data: Partial<Supplier>): Promise<{ success: boolean; data: Supplier }> => {
  const response = await axios.patch(`/suppliers/${id}`, data);
  return response.data;
};

export const deleteSupplier = async (id: string): Promise<{ success: boolean }> => {
  const response = await axios.delete(`/suppliers/${id}`);
  return response.data;
};
