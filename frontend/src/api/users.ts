import axiosInstance from '@/lib/axios';
import { User, Role } from '@/types/auth';

export interface UserListResponse {
  success: boolean;
  message: string;
  data: User[];
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}

export const getUsers = async (params: Record<string, string | number> = {}): Promise<UserListResponse> => {
  const { data } = await axiosInstance.get<UserListResponse>('/users', { params });
  return data;
};

export const getUser = async (id: string): Promise<UserResponse> => {
  const { data } = await axiosInstance.get<UserResponse>(`/users/${id}`);
  return data;
};

export const createUser = async (payload: Partial<User>): Promise<UserResponse> => {
  const { data } = await axiosInstance.post<UserResponse>('/users', payload);
  return data;
};

export const updateUser = async (id: string, payload: Partial<User>): Promise<UserResponse> => {
  const { data } = await axiosInstance.patch<UserResponse>(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await axiosInstance.delete<{ success: boolean; message: string }>(`/users/${id}`);
  return data;
};

export const getMe = async (): Promise<UserResponse> => {
  const { data } = await axiosInstance.get<UserResponse>('/users/me');
  return data;
};
