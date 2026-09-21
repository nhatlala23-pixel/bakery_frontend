import axiosClient from './axiosClient';

export interface BlogDTO {
  id?: number;
  title: string;
  slug: string;
  thumbnail?: string;
  excerpt?: string;
  content: string;
  authorName?: string;
  authorId?: number;
  status: 'DRAFT' | 'PUBLISHED';
  publishedDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const blogService = {
  // Public
  getPublishedBlogs: async (page = 0, size = 10): Promise<PageResponse<BlogDTO>> => {
    return axiosClient.get(`/blogs?page=${page}&size=${size}`);
  },
  getBlogBySlug: async (slug: string): Promise<BlogDTO> => {
    return axiosClient.get(`/blogs/${slug}`);
  },

  // Admin / Staff
  getAllBlogsForAdmin: async (page = 0, size = 10): Promise<PageResponse<BlogDTO>> => {
    return axiosClient.get(`/blogs/admin?page=${page}&size=${size}`);
  },
  getBlogById: async (id: number): Promise<BlogDTO> => {
    return axiosClient.get(`/blogs/admin/${id}`);
  },
  createBlog: async (data: Partial<BlogDTO>): Promise<BlogDTO> => {
    return axiosClient.post('/blogs', data);
  },
  updateBlog: async (id: number, data: Partial<BlogDTO>): Promise<BlogDTO> => {
    return axiosClient.put(`/blogs/${id}`, data);
  },
  deleteBlog: async (id: number): Promise<void> => {
    return axiosClient.delete(`/blogs/${id}`);
  },
};

export default blogService;
