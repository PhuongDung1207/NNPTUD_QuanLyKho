import axios from '@/lib/axios';
import { Unit, UnitListResponse } from '@/types/unit';

export const getUnits = async (params?: any): Promise<UnitListResponse> => {
  const response = await axios.get('/units', { params });
  return response.data;
};

export const createUnit = async (data: Partial<Unit>): Promise<{ success: boolean; data: Unit }> => {
  const response = await axios.post('/units', data);
  return response.data;
};

export const updateUnit = async (id: string, data: Partial<Unit>): Promise<{ success: boolean; data: Unit }> => {
  const response = await axios.patch(`/units/${id}`, data);
  return response.data;
};

export const deleteUnit = async (id: string): Promise<{ success: boolean }> => {
  const response = await axios.delete(`/units/${id}`);
  return response.data;
};
