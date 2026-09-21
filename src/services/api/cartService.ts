import axiosClient from './axiosClient';

export interface CartItemResponse {
  cartItemId: number;
  variantId: number;
  variantSku: string;
  productId: number;
  productName: string;
  productSlug: string;
  productThumbnail: string;
  variantAttributes: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

const cartService = {
  addToCart: (userId: number, variantId: number, quantity: number = 1): Promise<CartItemResponse> => {
    return axiosClient.post('/cart/add', null, {
      params: { userId, variantId, quantity }
    });
  },

  getCart: (userId: number): Promise<CartItemResponse[]> => {
    return axiosClient.get(`/cart/${userId}`);
  },

  updateQuantity: (cartItemId: number, quantity: number): Promise<CartItemResponse> => {
    return axiosClient.put(`/cart/item/${cartItemId}`, null, {
      params: { quantity }
    });
  },

  removeFromCart: (cartItemId: number): Promise<void> => {
    return axiosClient.delete(`/cart/item/${cartItemId}`);
  },

  clearCart: (userId: number): Promise<void> => {
    return axiosClient.delete(`/cart/clear/${userId}`);
  },

  addProductToCart: (userId: number, productId: number, quantity: number = 1): Promise<CartItemResponse> => {
    return axiosClient.post('/cart/add-by-product', null, {
      params: { userId, productId, quantity }
    });
  }
};

export default cartService;
