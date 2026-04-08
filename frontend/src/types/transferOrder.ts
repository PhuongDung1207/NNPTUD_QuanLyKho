import { Warehouse } from './warehouse';
import { Product } from './products';
import { User } from './auth';

export type TransferOrderStatus = 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled';

export interface TransferOrderItem {
  _id: string;
  transferOrder: string;
  product: Product;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
  note?: string;
}

export interface TransferOrder {
  _id: string;
  code: string;
  fromWarehouse: Warehouse;
  toWarehouse: Warehouse;
  requestedBy: User;
  approvedBy?: User;
  status: TransferOrderStatus;
  shippedAt?: string;
  receivedAt?: string;
  note?: string;
  items: TransferOrderItem[]; // Usually populated in the response
  createdAt: string;
  updatedAt: string;
}

export interface TransferOrderListResponse {
  success: boolean;
  message?: string;
  data: TransferOrder[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransferOrderDetailResponse {
  success: boolean;
  message?: string;
  data: TransferOrder;
}
