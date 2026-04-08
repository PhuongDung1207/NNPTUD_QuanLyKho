import axios from '@/lib/axios';
import { InventoryListResponse } from '@/types/inventory';

export const getInventories = async (params: any = {}): Promise<InventoryListResponse> => {
  const response = await axios.get('/inventories', { params });
  return response.data;
};

export const getInventoryById = async (id: string) => {
  const response = await axios.get(`/inventories/${id}`);
  return response.data;
};

export const createInventory = async (data: any) => {
  const response = await axios.post('/inventories', data);
  return response.data;
};

export const updateInventory = async (id: string, data: any) => {
  const response = await axios.patch(`/inventories/${id}`, data);
  return response.data;
};
