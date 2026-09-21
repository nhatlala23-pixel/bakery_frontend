import axiosClient from "./axiosClient";
import { type PageResponse } from "./productService";

export interface BrandDTO {
  id: number;
  brandName: string;
  slug: string;
  country: string;
  logoUrl: string;
  description: string;
  status: number;
}

export interface BrandRequest {
  brandName: string;
  slug: string;
  country?: string;
  logoUrl?: string;
  description?: string;
  status: number;
}

const brandService = {
  getAllBrands: (page = 0, size = 10): Promise<PageResponse<BrandDTO>> => {
    return axiosClient.get("/brands", {
      params: { page, size },
    });
  },

  getAllBrandsList: (): Promise<BrandDTO[]> => {
    return axiosClient.get("/brands/all");
  },

  getBrandBySlug: (slug: string): Promise<BrandDTO> => {
    return axiosClient.get(`/brands/${slug}`);
  },

  createBrand: (data: BrandRequest): Promise<BrandDTO> => {
    return axiosClient.post("/brands", data);
  },

  updateBrand: (id: number, data: Partial<BrandRequest>): Promise<BrandDTO> => {
    return axiosClient.put(`/brands/${id}`, data);
  },

  deleteBrand: (id: number): Promise<void> => {
    return axiosClient.delete(`/brands/${id}`);
  },
};

export default brandService;
