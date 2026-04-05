import axios from '@/lib/axios';
import { 
  BatchLotListResponse, 
  BatchLotResponse, 
  CreateBatchLotDto, 
  BatchLotStatus 
} from '@/types/batchLot';

export const getBatchLots = async (params: any): Promise<BatchLotListResponse> => {
  const response = await axios.get('/batch-lots', { params });
  return response.data;
};

export const getBatchLotById = async (id: string): Promise<BatchLotResponse> => {
  const response = await axios.get(`/batch-lots/${id}`);
  return response.data;
};

export const createBatchLot = async (data: CreateBatchLotDto): Promise<BatchLotResponse> => {
  const response = await axios.post('/batch-lots', data);
  return response.data;
};

export const updateBatchLot = async (id: string, data: Partial<CreateBatchLotDto>): Promise<BatchLotResponse> => {
  const response = await axios.patch(`/batch-lots/${id}`, data);
  return response.data;
};

export const updateBatchLotStatus = async (id: string, status: BatchLotStatus): Promise<BatchLotResponse> => {
  const response = await axios.patch(`/batch-lots/${id}/status`, { status });
  return response.data;
};
