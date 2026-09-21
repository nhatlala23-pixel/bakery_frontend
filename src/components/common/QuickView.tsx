import { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShoppingCart, 
  Star, 
  CheckCircle2, 
  Loader2, 
  Minus, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import productService, { type ProductDetailResponse } from '@/services/api/productService';
import cartService from '@/services/api/cartService';
import { getFullImageUrl } from '@/utils/image';

interface QuickViewProps {
  productSlug: string | null;
  onClose: () => void;
}

// Color mapping for Vietnamese color names
const colorMap: Record<string, string> = {
  'đen': '#1a1a1a',
  'trắng': '#ffffff',
  'đỏ': '#ef4444',
  'xanh dương': '#3b82f6',
  'xanh lá': '#22c55e',
  'vàng': '#eab308',
  'tím': '#a855f7',
  'hồng': '#ec4899',
  'xám': '#6b7280',
  'bạc': '#e5e7eb',
  'titan': '#8e8e8e',
  'xanh đen': '#0f172a',
  'xanh sky': '#7dd3fc',
  'vàng đồng': '#d4af37',
  'starlight': '#f5f5f0',
  'midnight': '#191970',
  'space gray': '#535150'
};

const getColorCode = (colorName: string) => {
  if (colorName.startsWith('#')) return colorName;
  const name = colorName.toLowerCase().trim();
  if (colorMap[name]) return colorMap[name];
  for (const key in colorMap) {
    if (name.includes(key)) return colorMap[key];
  }
  return '#f3f4f6';
};

export const QuickView = ({ productSlug, onClose }: QuickViewProps) => {
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userId = user?.id;

  useEffect(() => {
    if (!productSlug) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productService.getProductBySlug(productSlug);
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product for quick view:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productSlug]);

  const { colors, sizes } = useMemo(() => {
    if (!product?.variants) return { colors: [], sizes: [] };
    const uniqueColors = new Set<string>();
    const uniqueSizes = new Set<string>();
    product.variants.forEach(variant => {
      if (variant.colorCode) uniqueColors.add(variant.colorCode);
      if (variant.size) uniqueSizes.add(variant.size);
    });
    return { colors: Array.from(uniqueColors), sizes: Array.from(uniqueSizes) };
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants) return null;
    return product.variants.find(variant => {
      const matchColor = colors.length === 0 || (variant.colorCode === selectedAttributes['color']);
      const matchSize = sizes.length === 0 || (variant.size === selectedAttributes['size']);
      return matchColor && matchSize;
    });
  }, [product, selectedAttributes, colors, sizes]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const targetVariant = product?.variants?.length ? (selectedVariant || product.variants[0]) : null;
      
      if (!userId) {
        const guestItem = {
          cartItemId: Date.now() + Math.floor(Math.random() * 1000),
          variantId: targetVariant ? targetVariant.id : 0,
          variantSku: targetVariant ? targetVariant.sku : (product?.sku || ''),
          productId: product!.id,
          productName: product!.productName,
          productSlug: product!.slug,
          productThumbnail: product!.thumbnail || '',
          variantAttributes: targetVariant ? [targetVariant.colorCode, targetVariant.size].filter(Boolean).join(', ') : '',
          quantity: quantity,
          unitPrice: targetVariant ? targetVariant.variantPrice : product!.salePrice,
          subtotal: (targetVariant ? targetVariant.variantPrice : product!.salePrice) * quantity
        };

        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const existingIndex = guestCart.findIndex((item: any) => 
          (targetVariant && item.variantId === targetVariant.id) || (!targetVariant && item.productId === product!.id)
        );
        if (existingIndex > -1) {
          guestCart[existingIndex].quantity += quantity;
          guestCart[existingIndex].subtotal = guestCart[existingIndex].quantity * guestItem.unitPrice;
        } else {
          guestCart.push(guestItem);
        }
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        window.dispatchEvent(new Event('cartUpdate'));
        
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
        return;
      }

      if (!product?.variants?.length) {
        await cartService.addProductToCart(userId, product!.id, quantity);
      } else {
        await cartService.addToCart(userId, targetVariant!.id, quantity);
      }
      window.dispatchEvent(new Event('cartUpdate'));
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Add to cart failed:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (!productSlug) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] flex flex-col md:flex-row">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-400 hover:text-gray-900 transition-all hover:rotate-90"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : product ? (
          <>
            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-8 lg:p-12">
              <div className="relative group">
                <img 
                  src={getFullImageUrl(selectedVariant?.thumbnailUrl || product.thumbnail)} 
                  alt={product.productName} 
                  className="max-w-full max-h-[300px] object-contain transition-all duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 p-8 lg:p-12 overflow-y-auto no-scrollbar">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-lg uppercase tracking-widest">{product.brand.brandName}</span>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-500" fill="currentColor" />
                      <span className="text-[10px] font-black text-gray-900">4.9</span>
                    </div>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-black text-gray-900 uppercase tracking-tight leading-tight">
                    {product.productName}
                  </h2>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-600 tracking-tighter">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedVariant?.variantPrice || product.salePrice)}
                  </span>
                  {product.originalPrice > product.salePrice && (
                    <span className="text-xs text-gray-400 line-through font-bold opacity-60">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                    </span>
                  )}
                </div>

                <div className="space-y-6 border-t border-gray-100 pt-6">
                  {colors.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Màu sắc: <span className="text-gray-900">{selectedAttributes['color']}</span></h4>
                      <div className="flex flex-wrap gap-3">
                        {colors.map((color) => {
                          const colorCode = getColorCode(color);
                          return (
                            <button
                              key={color}
                              onClick={() => setSelectedAttributes(prev => ({ ...prev, color }))}
                              className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center p-0.5 ${selectedAttributes['color'] === color ? 'border-blue-600 ring-4 ring-blue-50' : 'border-gray-100 hover:border-gray-300'}`}
                            >
                               <div className="w-full h-full rounded-full border border-black/5" style={{ backgroundColor: colorCode }} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {sizes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dung lượng: <span className="text-gray-900">{selectedAttributes['size']}</span></h4>
                      <div className="grid grid-cols-3 gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, size }))}
                            className={`py-2 rounded-xl text-[10px] font-black transition-all border ${selectedAttributes['size'] === size ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1.5 hover:bg-white rounded-lg transition-all"><Minus size={14} /></button>
                    <span className="w-8 text-center font-black text-xs">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="p-1.5 hover:bg-white rounded-lg transition-all"><Plus size={14} /></button>
                  </div>
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                    {selectedVariant?.stock || product.stock} máy có sẵn
                  </span>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    disabled={addingToCart || (product.variants?.length > 0 && !selectedVariant)}
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white text-[11px] font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 uppercase tracking-widest disabled:opacity-50"
                  >
                    {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle2 size={16} className="text-green-400" /> : <ShoppingCart size={16} />}
                    {success ? 'Đã thêm thành công' : addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                  </button>
                  
                  <button 
                    onClick={() => navigate(`/product/${product.slug}`)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 text-gray-500 text-[11px] font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest group"
                  >
                    Xem chi tiết đầy đủ <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Micro Shipping Info */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                   <div className="flex items-center gap-2">
                      <Truck size={14} className="text-blue-600" />
                      <span className="text-[9px] font-bold text-gray-500">Giao hàng miễn phí</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-blue-600" />
                      <span className="text-[9px] font-bold text-gray-500">Bảo hành 12 tháng</span>
                   </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
