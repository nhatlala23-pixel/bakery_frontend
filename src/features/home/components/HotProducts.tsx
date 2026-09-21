import { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Star, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import productService, { type ProductResponse } from '@/services/api/productService';
import categoryService, { type CategoryDTO } from '@/services/api/categoryService';
import { QuickView } from '@/components/common/QuickView';
import { WishlistButton } from '@/components/common/WishlistButton';

export const HotProducts = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedQuickView, setSelectedQuickView] = useState<string | null>(null);
  const navigate = useNavigate();

  const getFullImageUrl = (url?: string) => {
    if (!url || url === 'undefined') return 'https://placehold.co/600x600/f3f4f6/94a3b8?text=TECHNO';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const catData = await categoryService.getAllCategoriesList();
        setCategories(Array.isArray(catData) ? catData.filter(c => c.status === 1) : []);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (currentPage === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const prodData = await productService.getAllProducts(currentPage, 12);
        if (currentPage === 0) setProducts(prodData.content);
        else setProducts(prev => [...prev, ...prodData.content]);
        setHasMore(!prodData.last);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchProducts();
  }, [currentPage]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const filteredProducts = activeTab === 'all' 
    ? products 
    : products.filter(p => p.categoryId === Number(activeTab));

  return (
    <section className="py-24 bg-gray-50/50 relative">
      {/* Quick View Modal */}
      {selectedQuickView && (
        <QuickView 
          productSlug={selectedQuickView} 
          onClose={() => setSelectedQuickView(null)} 
        />
      )}

      <div className="container mx-auto px-4 lg:px-8 max-w-[1600px]">
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-blue-600 rounded-full" />
             <h3 className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px]">Thế Giới Công Nghệ</h3>
             <div className="w-10 h-1 bg-blue-600 rounded-full" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">Sản Phẩm Bán Chạy</h2>
          
          <div className="flex flex-col items-center gap-6 mt-8">
             <div className="flex bg-white p-1.5 rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-x-auto no-scrollbar max-w-full">
                <button
                  onClick={() => handleTabChange('all')}
                  className={`px-8 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  Tất cả
                </button>
                {categories.slice(0, 8).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleTabChange(cat.id.toString())}
                    className={`px-8 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${activeTab === cat.id.toString() ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                    {cat.categoryName}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group relative bg-white rounded-[2.5rem] p-5 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-3 border border-transparent hover:border-blue-50 overflow-hidden flex flex-col h-full">
                  <div className="relative aspect-square mb-6 bg-gray-50 rounded-[2rem] overflow-hidden p-6 flex items-center justify-center cursor-pointer group/img" onClick={() => navigate(`/product/${product.slug}`)}>
                    <img src={getFullImageUrl(product.thumbnail)} alt={product.productName} className="max-w-full max-h-full object-contain transition-all duration-1000 group-hover:scale-110 group-hover:rotate-2" />
                    
                    <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3">
                      <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-xl hover:bg-blue-600 hover:text-white transition-all hover:scale-110 translate-y-8 group-hover:translate-y-0 duration-500" onClick={(e) => { e.stopPropagation(); setSelectedQuickView(product.slug); }}>
                        <Eye size={20} />
                      </button>
                      <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-xl hover:bg-blue-600 hover:text-white transition-all hover:scale-110 translate-y-8 group-hover:translate-y-0 duration-500 delay-75" onClick={(e) => { e.stopPropagation(); setSelectedQuickView(product.slug); }}>
                        <ShoppingCart size={20} />
                      </button>
                    </div>

                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                      {product.originalPrice > product.salePrice && (
                        <div className="bg-red-500 text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest">
                          -{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}%
                        </div>
                      )}
                      <div className="bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest">New</div>
                    </div>

                    {/* Wishlist Button */}
                    <div className="absolute top-3 right-3">
                      <WishlistButton
                        productId={product.id}
                        className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md hover:bg-white border border-gray-100"
                        size={16}
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.15em]">{product.categoryName}</span>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-500" fill="currentColor" />
                        <span className="text-[9px] font-black text-gray-500">4.9</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-blue-600 transition-colors mb-4" onClick={() => navigate(`/product/${product.slug}`)}>
                      {product.productName}
                    </h4>
                    <div className="mt-auto space-y-3">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-gray-900 tracking-tighter">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}
                        </span>
                        {product.originalPrice > product.salePrice && (
                          <span className="text-[10px] text-gray-400 line-through font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                           <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Còn hàng</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedQuickView(product.slug); }} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:translate-x-1 transition-transform">Mua ngay →</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-8">
                <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={loadingMore} className="group relative flex items-center gap-4 px-12 py-5 bg-white border-2 border-gray-100 rounded-[2rem] hover:border-blue-600 transition-all shadow-xl shadow-gray-200/50 hover:shadow-blue-500/10 active:scale-95 disabled:opacity-50">
                  {loadingMore ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Plus size={18} /></div>}
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{loadingMore ? 'Đang tải...' : 'Xem thêm sản phẩm'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
