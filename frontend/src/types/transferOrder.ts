import { User } from './auth';
import { Product } from './products';
import { Warehouse } from './warehouse';

export type TransferOrderStatus = 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled';

export interface TransferOrderItem {
  _id: string;
  product: Product;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferOrder {
  _id: string;
  code: string;
  fromWarehouse: string | Warehouse;
  toWarehouse: string | Warehouse;
  requestedBy?: string | User;
  approvedBy?: string | User;
  status: TransferOrderStatus;
  shippedAt?: string;
  receivedAt?: string;
  note?: string;
  items?: TransferOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TransferOrderListResponse {
  message?: string;
  data: TransferOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransferOrderResponse {
  message: string;
  data: TransferOrder;
}

export interface TransferOrderPayloadItem {
  product: string;
  quantityRequested: number;
  note?: string;
}

export interface CreateTransferOrderPayload {
  code?: string;
  fromWarehouse: string;
  toWarehouse: string;
  note?: string;
  items: TransferOrderPayloadItem[];
}

export type UpdateTransferOrderPayload = CreateTransferOrderPayload;
