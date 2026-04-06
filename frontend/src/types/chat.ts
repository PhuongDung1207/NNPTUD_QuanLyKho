import { User } from './auth';

export interface Message {
  _id: string;
  sender: string | User;
  receiver: string | User;
  content: string;
  createdAt: string;
  isRead: boolean;
  isTemp?: boolean;
}

export interface ChatHistoryResponse {
  success: boolean;
  data: Message[] | {
    docs: Message[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

export interface SocketMessagePayload {
  receiverId: string;
  content: string;
}
