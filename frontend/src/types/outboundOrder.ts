export type OutboundOrderStatus = 'draft' | 'pending' | 'shipped' | 'cancelled';

export interface OutboundOrderItem {
  _id: string;
  outboundOrder: string;
  product: any;
  quantityRequested: number;
  quantityShipped: number;
  price: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundOrder {
  _id: string;
  code: string;
  customerName: string;
  warehouse: any;
  issuedBy: any;
  status: OutboundOrderStatus;
  orderDate: string;
  shippedAt?: string;
  note?: string;
  totalAmount: number;
  items?: OutboundOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OutboundOrderListResponse {
  message: string;
  data: OutboundOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
