import axiosClient from "./axiosClient";

export interface VoucherResponse {
  id: number;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue: number;
  usageLimit: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  status: number;
}

const voucherService = {
  getAllVouchers: (): Promise<VoucherResponse[]> => {
    return axiosClient.get("/vouchers");
  },
  
  createVoucher: (data: any): Promise<VoucherResponse> => {
    return axiosClient.post("/vouchers", data);
  },
  
  updateVoucher: (id: number, data: any): Promise<VoucherResponse> => {
    return axiosClient.put(`/vouchers/${id}`, data);
  },
  
  deleteVoucher: (id: number): Promise<void> => {
    return axiosClient.delete(`/vouchers/${id}`);
  }
};

export default voucherService;
