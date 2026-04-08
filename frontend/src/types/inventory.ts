import { Product } from './products';
import { Warehouse } from './warehouse';

export interface Inventory {
  _id: string;
  product: Product | string;
  warehouse: Warehouse | string;
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
  message?: string;
  data: Inventory[];
  pagination: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}
