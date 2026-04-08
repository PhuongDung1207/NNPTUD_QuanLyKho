import axios from '@/lib/axios';
import { OutboundOrder, OutboundOrderListResponse } from '@/types/outboundOrder';

export const getOutboundOrders = async (params?: any): Promise<OutboundOrderListResponse> => {
  const response = await axios.get('/outbound-orders', { params });
  return response.data;
};

export const getOutboundOrderById = async (id: string): Promise<{ success: boolean; data: OutboundOrder }> => {
  const response = await axios.get(`/outbound-orders/${id}`);
  return response.data;
};

export const createOutboundOrder = async (data: any): Promise<{ success: boolean; data: OutboundOrder }> => {
  const response = await axios.post('/outbound-orders', data);
  return response.data;
};

export const submitOutboundOrder = async (id: string): Promise<{ success: boolean; data: OutboundOrder }> => {
  const response = await axios.post(`/outbound-orders/${id}/submit`);
  return response.data;
};

export const shipOutboundOrder = async (id: string): Promise<{ success: boolean; data: OutboundOrder }> => {
  const response = await axios.post(`/outbound-orders/${id}/ship`);
  return response.data;
};

export const cancelOutboundOrder = async (id: string): Promise<{ success: boolean; data: OutboundOrder }> => {
  const response = await axios.post(`/outbound-orders/${id}/cancel`);
  return response.data;
};
