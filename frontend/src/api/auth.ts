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

export const getActivationPreview = async (token: string): Promise<{ data: any; message?: string }> => {
  const { data } = await axiosInstance.get<{ data: any; message?: string }>(`/auth/activate-account?token=${encodeURIComponent(token)}`);
  return data;
};

export const activateAccount = async (payload: { token: string; password: string }): Promise<{ success: boolean; message: string }> => {
  const { data } = await axiosInstance.post<{ success: boolean; message: string }>('/auth/activate-account', payload);
  return data;
};
