import axiosClient from "./axiosClient";
import { type PageResponse } from "./productService";

export interface OrderItemRequest {
  variantId: number;
  quantity: number;
}

export interface OrderRequest {
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note?: string;
  voucherCode?: string;
  paymentMethod: string;
  items: OrderItemRequest[];
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note: string;
  discountAmount: number;
  totalAmount: number;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    productName: string;
    productImage: string;
    variantSku: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  paymentUrl?: string;
}

const orderService = {
  placeOrder: (userId: number, data: OrderRequest): Promise<OrderResponse> => {
    return axiosClient.post('/orders/place', data, {
      params: { userId }
    });
  },

  getOrder: (orderId: number): Promise<OrderResponse> => {
    return axiosClient.get(`/orders/${orderId}`);
  },

  getAllOrders: (page = 0, size = 10): Promise<PageResponse<OrderResponse>> => {
    return axiosClient.get("/orders", {
      params: { page, size },
    });
  },

  getUserOrders: (userId: number): Promise<OrderResponse[]> => {
    return axiosClient.get(`/orders/user/${userId}`);
  },

  updateOrderStatus: (orderId: number, status: string): Promise<OrderResponse> => {
    return axiosClient.put(`/orders/${orderId}/status`, null, {
      params: { status },
    });
  },

  cancelOrder: (orderId: number, reason: string): Promise<OrderResponse> => {
    return axiosClient.post(`/orders/${orderId}/cancel`, null, {
      params: { reason }
    });
  },
};

export default orderService;
