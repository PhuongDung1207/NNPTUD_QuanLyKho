export interface Warehouse {
  _id: string;
  code: string;
  name: string;
  description?: string;
  manager?: any; // User object or ID
  contactPhone?: string;
  contactEmail?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseListResponse {
  success: boolean;
  data: Warehouse[];
}
