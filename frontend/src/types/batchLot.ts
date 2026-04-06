import { User } from './auth';
import { Product, Unit } from './products';

export type BatchLotStatus = 'available' | 'blocked' | 'expired' | 'damaged';

export interface BatchLot {
  _id: string;
  product: string | Product;
  warehouse: string;
  lotCode: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  status: BatchLotStatus;
  remainingDays?: number;
  isExpiredByDate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BatchLotResponse {
  success: boolean;
  message: string;
  data: BatchLot;
}

export interface BatchLotListResponse {
  success: boolean;
  data: {
    docs: BatchLot[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

export interface CreateBatchLotDto {
  product: string;
  warehouse: string;
  lotCode: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  status?: BatchLotStatus;
}
