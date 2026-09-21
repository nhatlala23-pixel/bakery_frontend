import axiosClient from "./axiosClient";
import { type CategoryDTO } from "./categoryService";
import { type BrandDTO } from "./brandService";

export interface ProductResponse {
  id: number;
  sku: string;
  productName: string;
  slug: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  thumbnail: string;
  shortDescription: string;
  categoryName: string;
  categoryId: number;
  brandName: string;
  brandId: number;
  status: number;
  createdAt: string;
}

export interface ProductDetailResponse extends ProductResponse {
  description: string;
  category: CategoryDTO;
  brand: BrandDTO;
  images: ProductImageDTO[];
  specifications: ProductSpecificationDTO[];
  variants: ProductVariantResponse[];
}

export interface ProductImageDTO {
  id: number;
  imageUrl: string;
  isMain: boolean;
  sortOrder: number;
}

export interface ProductSpecificationDTO {
  id: number;
  specKey: string;
  specValue: string;
  sortOrder: number;
}

export interface ProductVariantResponse {
  id: number;
  sku: string;
  variantPrice: number;
  stock: number;
  thumbnailUrl: string;
  attributeValues: string[];
  colorCode?: string;
  size?: string;
}

export interface ProductRequest {
  sku: string;
  productName: string;
  slug: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  thumbnail: string;
  shortDescription: string;
  description: string;
  categoryId: number;
  brandId?: number;
  status: number;
  variants?: ProductVariantRequest[];
  images?: ProductImageRequest[];
}

export interface ProductVariantRequest {
  sku: string;
  price: number;
  stockQuantity: number;
  colorCode?: string;
  size?: string;
  thumbnailUrl?: string;
  status?: number;
}

export interface ProductImageRequest {
  imageUrl: string;
  isMain: boolean;
  sortOrder: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

const productService = {
  getAllProducts: (page = 0, size = 10, sort = "id,desc"): Promise<PageResponse<ProductResponse>> => {
    return axiosClient.get("/products", {
      params: { page, size, sort },
    });
  },

  searchProducts: (keyword: string, page = 0, size = 10): Promise<PageResponse<ProductResponse>> => {
    return axiosClient.get("/products/search", {
      params: { keyword, page, size },
    });
  },

  searchProductsFiltered: (
    keyword: string,
    filters: {
      brandId?: number;
      categoryId?: number;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
    },
    page = 0,
    size = 12
  ): Promise<PageResponse<ProductResponse>> => {
    return axiosClient.get("/products/search/filter", {
      params: {
        keyword,
        brandId: filters.brandId,
        categoryId: filters.categoryId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort: filters.sort || "default",
        page,
        size,
      },
    });
  },

  getProductBySlug: (slug: string): Promise<ProductDetailResponse> => {
    return axiosClient.get(`/products/${slug}`);
  },

  getProductsByCategory: (categoryId: number, page = 0, size = 10): Promise<PageResponse<ProductResponse>> => {
    return axiosClient.get(`/products/category/${categoryId}`, {
      params: { page, size },
    });
  },

  getProductsByCategorySlug: (slug: string, page = 0, size = 10): Promise<PageResponse<ProductResponse>> => {
    return axiosClient.get(`/products/category/slug/${slug}`, {
      params: { page, size },
    });
  },

  getProductsByBrandSlug: (slug: string, page = 0, size = 10): Promise<PageResponse<ProductResponse>> => {
    return axiosClient.get(`/products/brand/slug/${slug}`, {
      params: { page, size },
    });
  },

  createProduct: (data: ProductRequest): Promise<ProductResponse> => {
    return axiosClient.post("/products", data);
  },

  updateProduct: (id: number, data: Partial<ProductRequest>): Promise<ProductResponse> => {
    return axiosClient.put(`/products/${id}`, data);
  },

  updateProductStock: (id: number, stock: number): Promise<ProductResponse> => {
    return axiosClient.put(`/products/${id}/stock`, null, {
      params: { stock }
    });
  },

  deleteProduct: (id: number): Promise<void> => {
    return axiosClient.delete(`/products/${id}`);
  },
};

export default productService;
