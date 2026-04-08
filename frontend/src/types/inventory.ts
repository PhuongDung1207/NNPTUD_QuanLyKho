import { Product } from './products';
import { Warehouse } from './warehouse';

export interface Inventory {
  _id: string;
  product: string | Product;
  warehouse: string | Warehouse;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  minStockLevel: number;
  maxStockLevel: number;
  lastStockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryListResponse {
  success: boolean;
  message?: string;
  data: Inventory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
