import axios from '@/lib/axios';
import { 
  POListResponse, 
  POResponse, 
  ReceivePOPayload 
} from '@/types/purchaseOrder';

export const getPOs = async (params: any): Promise<POListResponse> => {
  const response = await axios.get('/purchase-orders', { params });
  return response.data;
};

export const getPOById = async (id: string): Promise<POResponse> => {
  const response = await axios.get(`/purchase-orders/${id}`);
  return response.data;
};

export const createPO = async (data: any): Promise<POResponse> => {
  const response = await axios.post('/purchase-orders', data);
  return response.data;
};

export const updatePO = async (id: string, data: any): Promise<POResponse> => {
  const response = await axios.patch(`/purchase-orders/${id}`, data);
  return response.data;
};

export const submitPO = async (id: string): Promise<POResponse> => {
  const response = await axios.post(`/purchase-orders/${id}/submit`);
  return response.data;
};

export const approvePO = async (id: string): Promise<POResponse> => {
  const response = await axios.post(`/purchase-orders/${id}/approve`);
  return response.data;
};

export const receivePartial = async (id: string, payload: ReceivePOPayload): Promise<POResponse> => {
  const response = await axios.post(`/purchase-orders/${id}/receive-partial`, payload);
  return response.data;
};

export const receiveFull = async (id: string, payload: { note?: string }): Promise<POResponse> => {
  const response = await axios.post(`/purchase-orders/${id}/receive`, payload);
  return response.data;
};

export const cancelPO = async (id: string): Promise<POResponse> => {
  const response = await axios.post(`/purchase-orders/${id}/cancel`);
  return response.data;
};
