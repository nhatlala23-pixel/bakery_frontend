import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ProductResponse } from '@/services/api/productService';

const MAX_COMPARE = 3;

interface CompareContextType {
  compareItems: ProductResponse[];
  addToCompare: (product: ProductResponse) => void;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isBarVisible: boolean;
}

const CompareContext = createContext<CompareContextType>({
  compareItems: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  isBarVisible: false,
});

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareItems, setCompareItems] = useState<ProductResponse[]>([]);

  const addToCompare = useCallback((product: ProductResponse) => {
    setCompareItems(prev => {
      if (prev.some(p => p.id === product.id)) {
        // toggle off if already added
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= MAX_COMPARE) {
        alert(`Chỉ được so sánh tối đa ${MAX_COMPARE} sản phẩm!`);
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((id: number) => {
    setCompareItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearCompare = useCallback(() => setCompareItems([]), []);

  return (
    <CompareContext.Provider value={{
      compareItems,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isBarVisible: compareItems.length > 0,
    }}>
      {children}
    </CompareContext.Provider>
  );
};
