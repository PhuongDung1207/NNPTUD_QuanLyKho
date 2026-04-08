import axios from '@/lib/axios';
import {
  CreateTransferOrderPayload,
  TransferOrderListResponse,
  TransferOrderResponse,
  UpdateTransferOrderPayload
} from '@/types/transferOrder';

export const getTransferOrders = async (params?: Record<string, unknown>): Promise<TransferOrderListResponse> => {
  const response = await axios.get('/transfer-orders', { params });
  return response.data;
};

export const getTransferOrderById = async (id: string): Promise<TransferOrderResponse> => {
  const response = await axios.get(`/transfer-orders/${id}`);
  return response.data;
};

export const createTransferOrder = async (payload: CreateTransferOrderPayload): Promise<TransferOrderResponse> => {
  const response = await axios.post('/transfer-orders', payload);
  return response.data;
};

export const updateTransferOrder = async (
  id: string,
  payload: UpdateTransferOrderPayload
): Promise<TransferOrderResponse> => {
  const response = await axios.patch(`/transfer-orders/${id}`, payload);
  return response.data;
};

export const submitTransferOrder = async (id: string): Promise<TransferOrderResponse> => {
  const response = await axios.post(`/transfer-orders/${id}/submit`);
  return response.data;
};

export const shipTransferOrder = async (id: string): Promise<TransferOrderResponse> => {
  const response = await axios.post(`/transfer-orders/${id}/ship`);
  return response.data;
};

export const receiveTransferOrder = async (id: string): Promise<TransferOrderResponse> => {
  const response = await axios.post(`/transfer-orders/${id}/receive`);
  return response.data;
};

export const cancelTransferOrder = async (id: string): Promise<TransferOrderResponse> => {
  const response = await axios.post(`/transfer-orders/${id}/cancel`);
  return response.data;
};
