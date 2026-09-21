import axiosClient from './axiosClient';
import { type ProductResponse } from './productService';

export interface CollectionDTO {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  active: boolean;
  productIds?: number[];
  products?: ProductResponse[];
}

const collectionService = {
  // Public
  getActiveCollections: async (): Promise<CollectionDTO[]> => {
    return axiosClient.get('/collections');
  },
  getCollectionBySlug: async (slug: string): Promise<CollectionDTO> => {
    return axiosClient.get(`/collections/${slug}`);
  },

  // Admin / Staff
  getAllCollectionsForAdmin: async (): Promise<CollectionDTO[]> => {
    return axiosClient.get('/collections/admin');
  },
  getCollectionById: async (id: number): Promise<CollectionDTO> => {
    return axiosClient.get(`/collections/admin/${id}`);
  },
  createCollection: async (data: Partial<CollectionDTO>): Promise<CollectionDTO> => {
    return axiosClient.post('/collections', data);
  },
  updateCollection: async (id: number, data: Partial<CollectionDTO>): Promise<CollectionDTO> => {
    return axiosClient.put(`/collections/${id}`, data);
  },
  deleteCollection: async (id: number): Promise<void> => {
    return axiosClient.delete(`/collections/${id}`);
  },
};

export default collectionService;
