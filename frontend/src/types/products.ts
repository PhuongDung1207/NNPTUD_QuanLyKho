export interface Category {
  _id: string;
  name: string;
  slug: string;
  code: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  code: string;
}

export interface Unit {
  _id: string;
  name: string;
  code: string;
  symbol?: string;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  barcode?: string;
  category?: Category;
  brand?: Brand;
  uom?: Unit;
  status: 'draft' | 'active' | 'inactive' | 'discontinued';
  tracking?: 'none' | 'lot';
  purchasePrice?: number;
  price?: {
    cost?: number;
    sale?: number;
    wholesale?: number;
  };
  warehouse?: string;
}

export interface ProductListResponse {
  success?: boolean;
  message?: string;
  data: {
    docs: Product[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
