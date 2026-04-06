export interface Supplier {
  _id: string;
  name: string;
  code: string;
  contactName?: string;
  phone?: string;
  email?: string;
  taxCode?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
}
