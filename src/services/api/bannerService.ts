import axiosClient from "./axiosClient";

export interface BannerResponse {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  status: number;
}

const bannerService = {
  getAllBanners: (): Promise<BannerResponse[]> => {
    return axiosClient.get("/banners");
  },
  
  createBanner: (data: any): Promise<BannerResponse> => {
    return axiosClient.post("/banners", data);
  },
  
  updateBanner: (id: number, data: any): Promise<BannerResponse> => {
    return axiosClient.put(`/banners/${id}`, data);
  },
  
  deleteBanner: (id: number): Promise<void> => {
    return axiosClient.delete(`/banners/${id}`);
  }
};

export default bannerService;
