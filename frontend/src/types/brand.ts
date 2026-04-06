export interface Brand {
  _id: string;
  name: string;
  code: string;
  slug: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface BrandListResponse {
  success: boolean;
  data: Brand[];
}
