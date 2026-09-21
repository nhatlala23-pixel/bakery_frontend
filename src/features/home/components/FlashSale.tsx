import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShoppingCart, Star, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import productService, { type ProductResponse } from '../../../services/api/productService';
import { QuickView } from '@/components/common/QuickView';

// ─── Compute seconds until end of today ────────────────────────────────────
const getSecondsUntilEndOfDay = () => {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));
};

const formatTime = (secs: number) => ({
  h: String(Math.floor(secs / 3600)).padStart(2, '0'),
  m: String(Math.floor((secs % 3600) / 60)).padStart(2, '0'),
  s: String(secs % 60).padStart(2, '0'),
});

// ─── Flip digit animation helper ───────────────────────────────────────────
const TimerDigit = ({ value }: { value: string }) => (
  <div className="bg-gray-900 text-white px-3 py-2 rounded-xl text-xl font-black min-w-[50px] text-center relative overflow-hidden tabular-nums">
    {value}
  </div>
);

export const FlashSale = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedQuickView, setSelectedQuickView] = useState<string | null>(null);

  // ─── Live Countdown ──────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(getSecondsUntilEndOfDay());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return getSecondsUntilEndOfDay(); // reset at midnight
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { h, m, s } = formatTime(timeLeft);

  const navigate = useNavigate();

  const getFullImageUrl = useCallback((url?: string) => {
    if (!url || url === 'undefined') return 'https://placehold.co/600x600/f3f4f6/94a3b8?text=TECHNO';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  }, []);

  useEffect(() => {
    const fetchFlashSales = async () => {
      setLoading(true);
      try {
        const response = await productService.getAllProducts(currentPage, 12, 'id,desc');
        const discounted = response.content.filter(p => p.salePrice < p.originalPrice);
        setProducts(discounted);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error('Failed to fetch flash sales:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashSales();
  }, [currentPage]);

  if (loading && products.length === 0) return null;

  return (
    <section className="py-12 md:py-20 relative">
      {selectedQuickView && (
        <QuickView
          productSlug={selectedQuickView}
          onClose={() => setSelectedQuickView(null)}
        />
      )}

      <div className="container mx-auto px-4 md:px-8 lg:px-16 max-w-[1600px]">
        <div className="bg-[#FFD400] rounded-[4rem] p-8 md:p-12 lg:p-16 shadow-2xl shadow-yellow-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-600/30 animate-pulse">
                    <Zap size={24} fill="currentColor" />
                 </div>
                 <h3 className="text-red-700 font-black uppercase tracking-[0.3em] text-xs">Săn ngay kẻo lỡ</h3>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight uppercase">FLASH SALE</h2>
                {/* ─── LIVE countdown ─── */}
                <div className="flex items-center gap-2">
                  <TimerDigit value={h} />
                  <span className="text-gray-900 font-black text-2xl animate-pulse">:</span>
                  <TimerDigit value={m} />
                  <span className="text-gray-900 font-black text-2xl animate-pulse">:</span>
                  <TimerDigit value={s} />
                </div>
                <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Kết thúc lúc 23:59:59</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className="w-12 h-12 rounded-2xl bg-white/20 text-gray-900 hover:bg-white transition-all disabled:opacity-30 flex items-center justify-center shadow-lg"><ChevronLeft size={24} /></button>
              <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} className="w-12 h-12 rounded-2xl bg-white/20 text-gray-900 hover:bg-white transition-all disabled:opacity-30 flex items-center justify-center shadow-lg"><ChevronRight size={24} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 relative z-10">
            {products.map((product) => {
              const discount = Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100);
              const total = product.stock || 100;
              const sold = Math.floor((product.id * 37) % (total * 0.8) + 5);

              return (
                <div key={product.id} className="group relative bg-white rounded-[2.5rem] p-5 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] hover:-translate-y-3 border border-transparent hover:border-red-50 overflow-hidden flex flex-col h-full">
                  <div className="relative aspect-square mb-6 bg-gray-50 rounded-[2rem] overflow-hidden p-6 flex items-center justify-center cursor-pointer group/img" onClick={() => navigate(`/product/${product.slug}`)}>
                    <img src={getFullImageUrl(product.thumbnail)} alt={product.productName} className="max-w-full max-h-full object-contain transition-all duration-1000 group-hover:scale-110 group-hover:rotate-2" />

                    <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3">
                      <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-xl hover:bg-red-600 hover:text-white transition-all hover:scale-110 translate-y-8 group-hover:translate-y-0 duration-500" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); setSelectedQuickView(product.slug); }}>
                        <Eye size={20} />
                      </button>
                      <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-xl hover:bg-red-600 hover:text-white transition-all hover:scale-110 translate-y-8 group-hover:translate-y-0 duration-500 delay-75" title="Thêm vào giỏ hàng" onClick={(e) => { e.stopPropagation(); setSelectedQuickView(product.slug); }}>
                        <ShoppingCart size={20} />
                      </button>
                    </div>

                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                      <div className="bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest">-{discount}%</div>
                      <div className="bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest">Flash</div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.15em]">{product.categoryName}</span>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-500" fill="currentColor" />
                        <span className="text-[9px] font-black text-gray-500">4.9</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-red-600 transition-colors mb-3" onClick={() => navigate(`/product/${product.slug}`)}>{product.productName}</h4>
                    <div className="mt-auto space-y-3">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-gray-900 tracking-tighter">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}</span>
                        <span className="text-[10px] text-gray-400 line-through font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-orange-400 rounded-full" style={{ width: `${Math.min(95, (sold / total) * 100)}%`, transition: 'width 1s ease' }} />
                        </div>
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                          <span className="text-red-600">Đã bán {sold}</span>
                          <span className="text-gray-400">Còn {total - sold}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Còn hàng</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedQuickView(product.slug); }} className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:translate-x-1 transition-transform">Mua ngay →</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
