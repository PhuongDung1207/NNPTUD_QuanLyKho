export interface Category {
  _id: string;
  name: string;
  code: string;
  slug: string;
  description?: string;
  parent?: string | Category;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
}
