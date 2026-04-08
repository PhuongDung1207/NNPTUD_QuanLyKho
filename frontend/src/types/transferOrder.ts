import { Warehouse } from './warehouse';
import { Product } from './products';

export interface TransferOrderItem {
  _id?: string;
  product: Product | string;
  requestedQuantity: number;
  shippedQuantity?: number;
  receivedQuantity?: number;
}

export interface TransferOrder {
  _id: string;
  code: string;
  fromWarehouse: Warehouse | string;
  toWarehouse: Warehouse | string;
  requestedBy?: any;
  approvedBy?: any;
  status: 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled';
  shippedAt?: string;
  receivedAt?: string;
  note?: string;
  items?: TransferOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TransferOrderListResponse {
  success: boolean;
  data: TransferOrder[];
}
