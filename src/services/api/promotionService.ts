import axiosClient from "./axiosClient";

export interface PromotionResponse {
  id: number;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  status: number;
  products?: any[];
}

const promotionService = {
  getAllPromotions: (): Promise<PromotionResponse[]> => {
    return axiosClient.get("/promotions");
  },
  
  createPromotion: (data: any): Promise<PromotionResponse> => {
    return axiosClient.post("/promotions", data);
  },
  
  updatePromotion: (id: number, data: any): Promise<PromotionResponse> => {
    return axiosClient.put(`/promotions/${id}`, data);
  },
  
  deletePromotion: (id: number): Promise<void> => {
    return axiosClient.delete(`/promotions/${id}`);
  }
};

export default promotionService;
