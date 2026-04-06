export interface Unit {
  _id: string;
  name: string; // e.g., 'Cái', 'Thùng', 'Kg'
  code: string; // e.g., 'PCS', 'BOX', 'KG'
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface UnitListResponse {
  success: boolean;
  data: Unit[];
}
