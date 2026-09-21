import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import wishlistService from '@/services/api/wishlistService';
import type { ProductResponse } from '@/services/api/productService';

interface WishlistContextType {
  wishlistItems: ProductResponse[];
  wishlistIds: Set<number>;
  wishlistCount: number;
  loading: boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistItems: [],
  wishlistIds: new Set(),
  wishlistCount: 0,
  loading: false,
  toggleWishlist: async () => {},
  isInWishlist: () => false,
  refreshWishlist: async () => {},
});

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<ProductResponse[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  const refreshWishlist = useCallback(async () => {
    const user = getCurrentUser();
    if (!user?.id) {
      setWishlistItems([]);
      setWishlistIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const items = await wishlistService.getWishlist(user.id);
      setWishlistItems(items);
      setWishlistIds(new Set(items.map((p) => p.id)));
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load wishlist on mount & when user changes
  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  useEffect(() => {
    const handleUserUpdate = () => refreshWishlist();
    window.addEventListener('userUpdate', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      window.removeEventListener('userUpdate', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, [refreshWishlist]);

  const toggleWishlist = useCallback(async (productId: number) => {
    const user = getCurrentUser();
    if (!user?.id) {
      // Redirect to login via event
      window.dispatchEvent(new CustomEvent('requireLogin'));
      return;
    }

    const isCurrentlyIn = wishlistIds.has(productId);

    // Optimistic update
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyIn) next.delete(productId);
      else next.add(productId);
      return next;
    });
    if (isCurrentlyIn) {
      setWishlistItems((prev) => prev.filter((p) => p.id !== productId));
    }

    try {
      if (isCurrentlyIn) {
        await wishlistService.removeFromWishlist(user.id, productId);
      } else {
        await wishlistService.addToWishlist(user.id, productId);
        // Re-fetch to get full product data
        await refreshWishlist();
      }
      window.dispatchEvent(new Event('wishlistUpdate'));
    } catch (err) {
      console.error('Wishlist toggle failed:', err);
      // Revert on error
      await refreshWishlist();
    }
  }, [wishlistIds, refreshWishlist]);

  const isInWishlist = useCallback((productId: number) => wishlistIds.has(productId), [wishlistIds]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistIds,
        wishlistCount: wishlistItems.length,
        loading,
        toggleWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
