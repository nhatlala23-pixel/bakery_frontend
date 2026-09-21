import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Eye, Loader2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState } from 'react';
import { QuickView } from '@/components/common/QuickView';
import cartService from '@/services/api/cartService';

const getFullImageUrl = (url?: string) => {
  if (!url || url === 'undefined') return 'https://placehold.co/600x600/f3f4f6/94a3b8?text=TECHNO';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

export const WishlistPage = () => {
  const { wishlistItems, wishlistCount, loading, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleAddToCart = async (productId: number) => {
    if (!user?.id) { navigate('/login'); return; }
    setAddingToCart(productId);
    try {
      await cartService.addProductToCart(user.id, productId, 1);
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (err) {
      console.error('Add to cart failed:', err);
    } finally {
      setAddingToCart(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
          <Heart size={40} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Đăng nhập để xem danh sách yêu thích</h2>
        <p className="text-gray-500 text-center max-w-sm">Lưu những sản phẩm bạn yêu thích và mua sắm dễ dàng hơn sau!</p>
        <Link
          to="/login"
          className="px-8 py-3 bg-gray-900 text-white font-black text-sm rounded-2xl hover:bg-black transition-all"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <>
      {quickViewSlug && (
        <QuickView productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
      )}

      <div className="min-h-screen bg-gray-50/50 py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">

          {/* Header */}
          <div className="flex items-center gap-6 mb-10">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all shadow-sm"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <Heart size={28} className="text-red-500 fill-red-500" />
                Danh Sách Yêu Thích
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {wishlistCount > 0 ? `${wishlistCount} sản phẩm đang được yêu thích` : 'Chưa có sản phẩm nào'}
              </p>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
          ) : wishlistItems.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative">
                <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center">
                  <Heart size={52} className="text-red-200" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <ShoppingBag size={18} className="text-white" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black text-gray-900 mb-2">Chưa có sản phẩm yêu thích</h3>
                <p className="text-gray-500 max-w-sm leading-relaxed">
                  Nhấn vào biểu tượng <Heart size={14} className="inline text-red-400 fill-red-400" /> trên sản phẩm bạn thích để thêm vào đây nhé!
                </p>
              </div>
              <Link
                to="/"
                className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-black text-sm rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                <ShoppingBag size={16} />
                Khám phá sản phẩm
              </Link>
            </div>
          ) : (
            /* Product Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {wishlistItems.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-white rounded-[2rem] p-5 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-red-50 flex flex-col"
                >
                  {/* Remove Wishlist Button */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-4 right-4 z-10 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all"
                    title="Bỏ yêu thích"
                  >
                    <Heart size={16} className="fill-red-500 text-red-500" />
                  </button>

                  {/* Image */}
                  <div
                    onClick={() => navigate(`/product/${product.slug}`)}
                    className="relative aspect-square mb-5 bg-gray-50 rounded-[1.5rem] overflow-hidden p-4 flex items-center justify-center cursor-pointer"
                  >
                    <img
                      src={getFullImageUrl(product.thumbnail)}
                      alt={product.productName}
                      className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-110"
                    />

                    {product.originalPrice > product.salePrice && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg">
                        -{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}%
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setQuickViewSlug(product.slug); }}
                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-600 hover:text-white transition-all translate-y-4 group-hover:translate-y-0 duration-300"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product.id); }}
                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-600 hover:text-white transition-all translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
                      >
                        {addingToCart === product.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ShoppingCart size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.15em] mb-1">{product.categoryName}</span>
                    <h4
                      onClick={() => navigate(`/product/${product.slug}`)}
                      className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors mb-3 min-h-[2.5rem]"
                    >
                      {product.productName}
                    </h4>
                    <div className="mt-auto">
                      <div className="flex flex-col mb-3">
                        <span className="text-base font-black text-gray-900">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}
                        </span>
                        {product.originalPrice > product.salePrice && (
                          <span className="text-[10px] text-gray-400 line-through font-bold">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={addingToCart === product.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-900 text-white text-[10px] font-black rounded-xl hover:bg-black transition-all disabled:opacity-50"
                        >
                          {addingToCart === product.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <ShoppingCart size={12} />
                          )}
                          Thêm vào giỏ
                        </button>
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                          title="Bỏ yêu thích"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
