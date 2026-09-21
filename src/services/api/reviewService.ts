import axiosClient from './axiosClient';

export interface ProductReviewDTO {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ProductReviewRequest {
  productId: number;
  userId: number;
  rating: number;
  content: string;
  imageUrl?: string;
}

const reviewService = {
  getReviews: (productId: number): Promise<ProductReviewDTO[]> => {
    return axiosClient.get(`/reviews/product/${productId}`);
  },

  addReview: (request: ProductReviewRequest): Promise<ProductReviewDTO> => {
    return axiosClient.post('/reviews/add', request);
  },

  deleteReview: (reviewId: number): Promise<{ message: string }> => {
    return axiosClient.delete(`/reviews/${reviewId}`);
  }
};

export default reviewService;
