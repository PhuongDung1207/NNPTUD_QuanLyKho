import axiosInstance from '@/lib/axios';
import { Role } from '@/types/auth';

export interface RoleListResponse {
  success: boolean;
  data: Role[];
}

export const getRoles = async (): Promise<RoleListResponse> => {
  const { data } = await axiosInstance.get<RoleListResponse>('/roles');
  return data;
};
