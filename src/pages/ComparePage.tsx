import { useNavigate } from 'react-router-dom';
import { GitCompareArrows, ArrowLeft, Trash2, ShoppingCart, Eye } from 'lucide-react';
import { useCompare } from '@/contexts/CompareContext';
import { MainLayout } from '@/components/layout/MainLayout';
import cartService from '@/services/api/cartService';

const getFullImageUrl = (url?: string) => {
  if (!url || url === 'undefined') return 'https://placehold.co/400x400/f3f4f6/94a3b8?text=TECHNO';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

export const ComparePage = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userId = user?.id;

  const handleAddToCart = async (productId: number, productName: string) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      navigate('/login');
      return;
    }
    try {
      await cartService.addProductToCart(userId, productId, 1);
      alert(`Đã thêm thành công "${productName}" vào giỏ hàng!`);
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      alert('Thêm vào giỏ hàng thất bại. Vui lòng thử lại!');
    }
  };

  // Collect all unique spec keys across all products
  const specKeys = Array.from(
    new Set(
      compareItems.flatMap(p => p.specifications || []).map(s => s.specKey)
    )
  );

  return (
    <MainLayout>
      <div className="bg-slate-50 min-h-screen py-10 font-sans">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-800 hover:text-indigo-600 hover:shadow-md transition-all uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
            <div className="flex items-center gap-2">
              <GitCompareArrows className="text-indigo-600 w-8 h-8" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                So sánh sản phẩm
              </h1>
            </div>
            {compareItems.length > 0 && (
              <button
                onClick={clearCompare}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-[10px] font-black text-red-600 uppercase tracking-widest transition-all"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {compareItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-md mx-auto mt-10">
              <GitCompareArrows className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                Chưa có sản phẩm so sánh
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Vui lòng quay lại cửa hàng, chọn ít nhất 2 sản phẩm để bắt đầu so sánh chi tiết.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-indigo-900/10"
              >
                Quay lại cửa hàng
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="w-[200px] p-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      Tính năng
                    </th>
                    {compareItems.map(product => (
                      <th key={product.id} className="p-6 text-center relative group min-w-[250px]">
                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCompare(product.id)}
                          className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-red-500 hover:text-white rounded-full transition-all text-slate-400 opacity-0 group-hover:opacity-100"
                          title="Xóa khỏi danh sách"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="space-y-4 flex flex-col items-center">
                          <div className="w-32 h-32 bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-center overflow-hidden">
                            <img
                              src={getFullImageUrl(product.thumbnail)}
                              alt={product.productName}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-xs text-slate-900 line-clamp-2 h-8 text-center px-2">
                              {product.productName}
                            </h4>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                              {product.brandName}
                            </p>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-base font-black text-slate-900 tracking-tighter">
                              {product.salePrice.toLocaleString('vi-VN')}₫
                            </span>
                            {product.salePrice < product.originalPrice && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {product.originalPrice.toLocaleString('vi-VN')}₫
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 w-full max-w-[200px]">
                            <button
                              onClick={() => navigate(`/product/${product.slug}`)}
                              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all uppercase"
                            >
                              <Eye size={12} /> Chi tiết
                            </button>
                            <button
                              onClick={() => handleAddToCart(product.id, product.productName)}
                              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-900/10"
                              title="Thêm vào giỏ"
                            >
                              <ShoppingCart size={14} />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                    {/* Fill empty headers */}
                    {Array.from({ length: 3 - compareItems.length }).map((_, i) => (
                      <th key={i} className="p-6 text-center text-slate-400 bg-slate-50/20 border-l border-slate-100">
                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-3xl max-w-[200px] mx-auto">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-350">Trống</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Basic Specifications */}
                  <tr className="bg-slate-50/30">
                    <td className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                      Thương hiệu
                    </td>
                    {compareItems.map(p => (
                      <td key={p.id} className="p-4 text-center font-bold text-slate-800 border-b border-slate-100 border-l border-slate-100">
                        {p.brandName}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareItems.length }).map((_, i) => (
                      <td key={i} className="p-4 border-b border-slate-100 border-l border-slate-100 bg-slate-50/10"></td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/30">
                    <td className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                      Danh mục
                    </td>
                    {compareItems.map(p => (
                      <td key={p.id} className="p-4 text-center font-bold text-slate-800 border-b border-slate-100 border-l border-slate-100">
                        {p.categoryName}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareItems.length }).map((_, i) => (
                      <td key={i} className="p-4 border-b border-slate-100 border-l border-slate-100 bg-slate-50/10"></td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/30">
                    <td className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                      Tình trạng kho
                    </td>
                    {compareItems.map(p => (
                      <td key={p.id} className="p-4 text-center font-bold border-b border-slate-100 border-l border-slate-100">
                        {p.stock && p.stock > 0 ? (
                          <span className="text-emerald-600 text-xs">Còn hàng ({p.stock})</span>
                        ) : (
                          <span className="text-red-500 text-xs">Hết hàng</span>
                        )}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareItems.length }).map((_, i) => (
                      <td key={i} className="p-4 border-b border-slate-100 border-l border-slate-100 bg-slate-50/10"></td>
                    ))}
                  </tr>

                  {/* Advanced technical specifications */}
                  <tr className="bg-slate-100/50">
                    <td colSpan={4} className="p-3 font-black text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-100 text-left">
                      ⚙️ Thông số kỹ thuật chi tiết
                    </td>
                  </tr>

                  {specKeys.map(key => (
                    <tr key={key} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                        {key}
                      </td>
                      {compareItems.map(product => {
                        // Find spec value
                        const specValue = product.specifications?.find(s => s.specKey === key)?.specValue || '—';
                        return (
                          <td key={product.id} className="p-4 text-center font-bold text-xs text-slate-700 border-b border-slate-100 border-l border-slate-100">
                            {specValue}
                          </td>
                        );
                      })}
                      {Array.from({ length: 3 - compareItems.length }).map((_, i) => (
                        <td key={i} className="p-4 border-b border-slate-100 border-l border-slate-100 bg-slate-50/10"></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
