import axiosClient from "./axiosClient";
import { type PageResponse } from "./productService";

export interface PaymentResponse {
  id: number;
  orderId: number;
  orderCode: string;
  customerName: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  transactionNo: string;
  gatewayTransactionId: string;
  paidAt: string;
  createdAt: string;
}

const paymentService = {
  getAllPayments: (page = 0, size = 10): Promise<PageResponse<PaymentResponse>> => {
    return axiosClient.get("/payments", {
      params: { page, size }
    });
  },
};

export default paymentService;
