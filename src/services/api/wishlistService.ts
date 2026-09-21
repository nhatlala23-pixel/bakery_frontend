import axiosClient from './axiosClient';
import type { ProductResponse } from './productService';

const wishlistService = {
  getWishlist: (userId: number): Promise<ProductResponse[]> => {
    return axiosClient.get(`/wishlist/${userId}`);
  },

  addToWishlist: (userId: number, productId: number): Promise<{ message: string }> => {
    return axiosClient.post('/wishlist/add', null, {
      params: { userId, productId },
    });
  },

  removeFromWishlist: (userId: number, productId: number): Promise<{ message: string }> => {
    return axiosClient.delete('/wishlist/remove', {
      params: { userId, productId },
    });
  },

  checkWishlist: (userId: number, productId: number): Promise<{ inWishlist: boolean }> => {
    return axiosClient.get('/wishlist/check', {
      params: { userId, productId },
    });
  },
};

export default wishlistService;
