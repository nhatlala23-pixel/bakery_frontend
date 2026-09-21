import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, X, ChevronRight } from 'lucide-react';
import type { ProductResponse } from '@/services/api/productService';

const STORAGE_KEY = 'techno_recently_viewed';
const MAX_ITEMS = 10;

export const recordProductView = (product: ProductResponse) => {
  try {
    const stored: ProductResponse[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = stored.filter(p => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('recentlyViewed'));
  } catch {
    // silently fail
  }
};

export const getRecentlyViewed = (): ProductResponse[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const getFullImageUrl = (url?: string) => {
  if (!url || url === 'undefined') return 'https://placehold.co/400x400/f3f4f6/94a3b8?text=TECHNO';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

export const RecentlyViewedSection = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const navigate = useNavigate();

  const refresh = () => setProducts(getRecentlyViewed());

  useEffect(() => {
    refresh();
    window.addEventListener('recentlyViewed', refresh);
    return () => window.removeEventListener('recentlyViewed', refresh);
  }, []);

  const removeItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = getRecentlyViewed().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProducts(updated);
  };

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProducts([]);
  };

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 max-w-[1600px]">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History size={16} className="text-indigo-500" />
              <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Của bạn</h4>
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Đã xem gần đây</h2>
          </div>
          <button
            onClick={clearAll}
            className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-all flex items-center gap-1"
          >
            <X size={12} /> Xóa tất cả
          </button>
        </div>

        {/* Horizontal Scroll List */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 no-scrollbar">
          {products.map(product => {
            const hasDiscount = product.salePrice < product.originalPrice;
            const discountPct = hasDiscount
              ? Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)
              : 0;
            return (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.slug}`)}
                className="group relative flex-shrink-0 w-[160px] bg-white border border-gray-100 hover:border-blue-200 rounded-2xl p-3 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
              >
                {/* Remove button */}
                <button
                  onClick={(e) => removeItem(product.id, e)}
                  className="absolute top-2 right-2 w-5 h-5 bg-gray-100 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                  <X size={10} />
                </button>

                {hasDiscount && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                    -{discountPct}%
                  </div>
                )}

                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-3 mb-3">
                  <img
                    src={getFullImageUrl(product.thumbnail)}
                    alt={product.productName}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 mb-1.5 group-hover:text-blue-600 transition-colors">
                  {product.productName}
                </h4>

                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-black text-gray-900 tracking-tighter">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[9px] text-gray-400 line-through font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* View all shortcut */}
          <div
            onClick={() => navigate('/search?q=')}
            className="flex-shrink-0 w-[120px] bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
          >
            <ChevronRight size={24} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-[10px] font-black text-gray-400 group-hover:text-blue-500 uppercase tracking-widest text-center transition-colors">Khám phá thêm</span>
          </div>
        </div>
      </div>
    </section>
  );
};
