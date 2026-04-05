import axiosInstance from '@/lib/axios';
import { AuthResponse, User } from '@/types/auth';

export const login = async (credentials: Record<string, string>): Promise<AuthResponse> => {
  const { data } = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
  return data;
};

export const getProfile = async (): Promise<{ success: boolean; data: User }> => {
  const { data } = await axiosInstance.get<{ success: boolean; data: User }>('/auth/me');
  return data;
};

export const logout = async (): Promise<{ success: boolean }> => {
  const { data } = await axiosInstance.post<{ success: boolean }>('/auth/logout');
  return data;
};
