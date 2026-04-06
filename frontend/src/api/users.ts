import axiosInstance from '@/lib/axios';
import { User, Role } from '@/types/auth';

export interface UserListResponse {
  success: boolean;
  message: string;
  data: User[];
  stats?: { total: number; active: number; locked: number; inactive: number };
  pagination?: { total: number; page: number; totalPages: number; limit: number };
}

export interface ImportResultSummary {
  sheetName?: string;
  totalRows: number;
  createdCount: number;
  failedCount: number;
}

export interface ImportFailure {
  row: number;
  username?: string;
  email?: string;
  reason: string;
}

export interface ImportResponse {
  success: boolean;
  message: string;
  data: {
    summary: ImportResultSummary;
    warnings: string[];
    failures: ImportFailure[];
  };
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

export const updateMe = async (payload: Partial<User>): Promise<UserResponse> => {
  const { data } = await axiosInstance.patch<UserResponse>('/users/me', payload);
  return data;
};

export const lockUser = async (id: string): Promise<UserResponse> => {
  const { data } = await axiosInstance.patch<UserResponse>(`/users/${id}/lock`);
  return data;
};

export const unlockUser = async (id: string): Promise<UserResponse> => {
  const { data } = await axiosInstance.patch<UserResponse>(`/users/${id}/unlock`);
  return data;
};

export const resendInvite = async (id: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await axiosInstance.post<{ success: boolean; message: string }>(`/users/${id}/resend-invite`);
  return data;
};

export const importUsers = async (file: File): Promise<ImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosInstance.post<ImportResponse>('/users/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
