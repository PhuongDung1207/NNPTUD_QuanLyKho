import axios from '@/lib/axios';
import { TransferOrder, TransferOrderListResponse } from '@/types/transferOrder';

export const getTransferOrders = async (params?: any): Promise<TransferOrderListResponse> => {
  const response = await axios.get('/transfer-orders', { params });
  return response.data;
};

export const getTransferOrderById = async (id: string): Promise<{ success: boolean; data: TransferOrder }> => {
  const response = await axios.get(`/transfer-orders/${id}`);
  return response.data;
};

export const createTransferOrder = async (data: any): Promise<{ success: boolean; data: TransferOrder }> => {
  const response = await axios.post('/transfer-orders', data);
  return response.data;
};

export const submitTransferOrder = async (id: string): Promise<{ success: boolean; data: TransferOrder }> => {
  const response = await axios.post(`/transfer-orders/${id}/submit`);
  return response.data;
};

export const shipTransferOrder = async (id: string): Promise<{ success: boolean; data: TransferOrder }> => {
  const response = await axios.post(`/transfer-orders/${id}/ship`);
  return response.data;
};

export const receiveTransferOrder = async (id: string): Promise<{ success: boolean; data: TransferOrder }> => {
  const response = await axios.post(`/transfer-orders/${id}/receive`);
  return response.data;
};

export const cancelTransferOrder = async (id: string): Promise<{ success: boolean; data: TransferOrder }> => {
  const response = await axios.post(`/transfer-orders/${id}/cancel`);
  return response.data;
};

export const deleteTransferOrder = async (id: string): Promise<{ success: boolean }> => {
  const response = await axios.delete(`/transfer-orders/${id}`);
  return response.data;
};
