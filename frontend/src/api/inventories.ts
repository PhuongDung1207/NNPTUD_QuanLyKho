import axios from '@/lib/axios';
import { InventoryListResponse } from '@/types/inventory';

export const getInventories = async (params?: any): Promise<InventoryListResponse> => {
  const response = await axios.get('/inventories', { params });
  return response.data;
};

export const getInventoryByWarehouse = async (warehouseId: string): Promise<InventoryListResponse> => {
  const response = await axios.get(`/inventories/warehouse/${warehouseId}`);
  return response.data;
};

export const updateInventoryStatus = async (id: string, data: any): Promise<any> => {
  const response = await axios.patch(`/inventories/${id}`, data);
  return response.data;
};
