import axiosClient from "./axiosClient";
import { type PageResponse } from "./productService";

export interface CategoryDTO {
  id: number;
  categoryName: string;
  slug: string;
  parentId?: number;
  description?: string;
  image?: string;
  status: number;
}

export interface CategoryRequest {
  categoryName: string;
  slug: string;
  parentId?: number;
  description?: string;
  image?: string;
  status: number;
}

const categoryService = {
  getAllCategories: (page = 0, size = 10): Promise<PageResponse<CategoryDTO>> => {
    return axiosClient.get("/categories", {
      params: { page, size },
    });
  },

  getAllCategoriesList: (): Promise<CategoryDTO[]> => {
    return axiosClient.get("/categories/all");
  },

  getCategoryBySlug: (slug: string): Promise<CategoryDTO> => {
    return axiosClient.get(`/categories/${slug}`);
  },

  getChildCategories: (parentId: number): Promise<CategoryDTO[]> => {
    return axiosClient.get(`/categories/parent/${parentId}`);
  },

  createCategory: (data: CategoryRequest): Promise<CategoryDTO> => {
    return axiosClient.post("/categories", data);
  },

  updateCategory: (id: number, data: Partial<CategoryRequest>): Promise<CategoryDTO> => {
    return axiosClient.put(`/categories/${id}`, data);
  },

  deleteCategory: (id: number): Promise<void> => {
    return axiosClient.delete(`/categories/${id}`);
  },
};

export default categoryService;
