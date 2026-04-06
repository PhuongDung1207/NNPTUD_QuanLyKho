import axios from '@/lib/axios';
import { Warehouse, WarehouseListResponse } from '@/types/warehouse';

export const getWarehouses = async (params?: any): Promise<WarehouseListResponse> => {
  const response = await axios.get('/warehouses', { params });
  return response.data;
};

export const getWarehouseById = async (id: string): Promise<{ success: boolean; data: Warehouse }> => {
  const response = await axios.get(`/warehouses/${id}`);
  return response.data;
};

export const createWarehouse = async (data: Partial<Warehouse>): Promise<{ success: boolean; data: Warehouse }> => {
  const response = await axios.post('/warehouses', data);
  return response.data;
};

export const updateWarehouse = async (id: string, data: Partial<Warehouse>): Promise<{ success: boolean; data: Warehouse }> => {
  const response = await axios.patch(`/warehouses/${id}`, data);
  return response.data;
};

export const deleteWarehouse = async (id: string): Promise<{ success: boolean }> => {
  const response = await axios.delete(`/warehouses/${id}`);
  return response.data;
};
