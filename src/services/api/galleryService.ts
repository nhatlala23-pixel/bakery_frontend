import axiosClient from './axiosClient';

export interface GalleryDTO {
  id?: number;
  title: string;
  imageUrl: string;
  category?: 'PRODUCT' | 'STORE' | 'KITCHEN' | 'EVENT' | 'CUSTOMER';
  displayOrder?: number;
  active: boolean;
}

const galleryService = {
  // Public
  getActiveGalleries: async (category?: string): Promise<GalleryDTO[]> => {
    return axiosClient.get('/galleries', { params: { category } });
  },

  // Admin / Staff
  getAllGalleriesForAdmin: async (): Promise<GalleryDTO[]> => {
    return axiosClient.get('/galleries/admin');
  },
  createGallery: async (data: Partial<GalleryDTO>): Promise<GalleryDTO> => {
    return axiosClient.post('/galleries', data);
  },
  updateGallery: async (id: number, data: Partial<GalleryDTO>): Promise<GalleryDTO> => {
    return axiosClient.put(`/galleries/${id}`, data);
  },
  deleteGallery: async (id: number): Promise<void> => {
    return axiosClient.delete(`/galleries/${id}`);
  },
};

export default galleryService;
