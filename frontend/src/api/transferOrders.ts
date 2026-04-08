import axios from '@/lib/axios';
import { TransferOrderListResponse, TransferOrderDetailResponse } from '@/types/transferOrder';

export const getTransferOrders = async (params: any = {}): Promise<TransferOrderListResponse> => {
  const response = await axios.get('/transfer-orders', { params });
  return response.data;
};

export const getTransferOrderById = async (id: string): Promise<TransferOrderDetailResponse> => {
  const response = await axios.get(`/transfer-orders/${id}`);
  return response.data;
};

export const createTransferOrder = async (data: any): Promise<TransferOrderDetailResponse> => {
  const response = await axios.post('/transfer-orders', data);
  return response.data;
};

export const updateTransferOrder = async (id: string, data: any): Promise<TransferOrderDetailResponse> => {
  const response = await axios.patch(`/transfer-orders/${id}`, data);
  return response.data;
};

export const submitTransferOrder = async (id: string): Promise<TransferOrderDetailResponse> => {
  const response = await axios.post(`/transfer-orders/${id}/submit`);
  return response.data;
};

export const shipTransferOrder = async (id: string): Promise<TransferOrderDetailResponse> => {
  const response = await axios.post(`/transfer-orders/${id}/ship`);
  return response.data;
};

export const receiveTransferOrder = async (id: string): Promise<TransferOrderDetailResponse> => {
  const response = await axios.post(`/transfer-orders/${id}/receive`);
  return response.data;
};

export const cancelTransferOrder = async (id: string): Promise<TransferOrderDetailResponse> => {
  const response = await axios.post(`/transfer-orders/${id}/cancel`);
  return response.data;
};
