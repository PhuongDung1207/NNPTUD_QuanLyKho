import axiosInstance from '@/lib/axios';
import { ChatHistoryResponse } from '@/types/chat';

export const getChatHistory = async (contactId: string): Promise<ChatHistoryResponse> => {
  const { data } = await axiosInstance.get<ChatHistoryResponse>(`/messages/history/${contactId}`);
  return data;
};

// Messaging is primarily via Socket.io now, but we keep the API for fetching history.
