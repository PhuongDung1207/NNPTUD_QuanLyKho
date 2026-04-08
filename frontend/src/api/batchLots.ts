import axios from '@/lib/axios';
import { 
  BatchLotListResponse, 
  BatchLotResponse, 
  CreateBatchLotDto, 
  BatchLotStatus 
} from '@/types/batchLot';

export type BatchLotQueryParams = {
  page?: number;
  limit?: number;
  lotCode?: string;
  // UI param (mapped to lotCode)
  search?: string;
  status?: BatchLotStatus | '';
  warehouse?: string;
  product?: string;
  expiryDate?: string;
};

export const getBatchLots = async (params: BatchLotQueryParams): Promise<BatchLotListResponse> => {
  const nextParams: Record<string, any> = { ...(params || {}) };

  // UI uses `search` but backend expects `lotCode`
  if (typeof nextParams.search === 'string' && !nextParams.lotCode) {
    nextParams.lotCode = nextParams.search;
  }
  delete nextParams.search;

  // Remove empty string values to avoid validator 422
  Object.keys(nextParams).forEach((key) => {
    if (nextParams[key] === '') {
      delete nextParams[key];
    }
  });

  const response = await axios.get('/batch-lots', { params: nextParams });
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

export const deleteBatchLot = async (id: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/batch-lots/${id}`);
  return response.data;
};

