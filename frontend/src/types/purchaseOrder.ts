import { User } from './auth';
import { Product } from './products';
import { BatchLot } from './batchLot';

export type POStatus = 'draft' | 'pending' | 'approved' | 'received' | 'cancelled' | 'receiving';

export interface POItem {
  _id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  receivedQuantity: number;
  remainingQuantity: number;
}

export interface PurchaseOrder {
  _id: string;
  code: string;
  supplier: string | any; // Supplier object or ID
  warehouse: string | any; // Warehouse object or ID
  expectedDate: string;
  status: POStatus;
  items: POItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  note?: string;
  orderedBy: string | User;
  approvedBy?: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface POListResponse {
  success?: boolean;
  message?: string;
  data: {
    docs: PurchaseOrder[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

export interface POResponse {
  success: boolean;
  message: string;
  data: PurchaseOrder;
}

export interface ReceiveItemPayload {
  purchaseOrderItemId: string;
  receivedQuantity: number;
  batchLots?: {
    lotCode: string;
    manufactureDate: string;
    expiryDate: string;
    quantity: number;
  }[];
}

export interface ReceivePOPayload {
  note?: string;
  items: ReceiveItemPayload[];
}
