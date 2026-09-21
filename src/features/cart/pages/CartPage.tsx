import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight,
  ChevronLeft, Package, CheckCircle2, XCircle,
  ShieldCheck, Truck, Gift, Sparkles
} from 'lucide-react';
import cartService, { type CartItemResponse } from '@/services/api/cartService';
import voucherService, { type VoucherResponse } from '@/services/api/voucherService';
import productService, { type ProductResponse } from '@/services/api/productService';

const getFullImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(amount));

export const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherResponse | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([]);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userId = user?.id;

  const fetchCart = useCallback(async () => {
    if (!userId) {
      // Load guest cart from localStorage
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      setCartItems(guestCart);
      setIsGuest(true);
      setLoading(false);
      return;
    }
    setIsGuest(false);
    try {
      const data = await cartService.getCart(userId);
      setCartItems(data);
      const products = await productService.getAllProducts(0, 4);
      setRelatedProducts(products.content);
    } catch {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Re-sync when guestCart changes (e.g. from other pages)
  useEffect(() => {
    fetchCart();
    const onCartUpdate = () => fetchCart();
    window.addEventListener('cartUpdate', onCartUpdate);
    return () => window.removeEventListener('cartUpdate', onCartUpdate);
  }, [fetchCart]);

  const handleUpdateQuantity = async (cartItemId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(cartItemId);
    try {
      if (isGuest) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const updated = guestCart.map((item: CartItemResponse) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: newQty, subtotal: item.unitPrice * newQty }
            : item
        );
        localStorage.setItem('guestCart', JSON.stringify(updated));
        setCartItems(updated);
      } else {
        const updated = await cartService.updateQuantity(cartItemId, newQty);
        setCartItems(prev => prev.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity: updated.quantity, subtotal: updated.subtotal } : item
        ));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    setUpdatingId(cartItemId);
    try {
      if (isGuest) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
          .filter((item: CartItemResponse) => item.cartItemId !== cartItemId);
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        setCartItems(guestCart);
        window.dispatchEvent(new Event('cartUpdate'));
      } else {
        await cartService.removeFromCart(cartItemId);
        setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Bạn chắc chắn muốn xóa toàn bộ giỏ hàng?')) return;
    if (isGuest) {
      localStorage.removeItem('guestCart');
      setCartItems([]);
      window.dispatchEvent(new Event('cartUpdate'));
    } else {
      await cartService.clearCart(userId);
      setCartItems([]);
    }
    setAppliedVoucher(null);
    localStorage.removeItem('appliedVoucher');
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    setAppliedVoucher(null);
    try {
      const vouchers = await voucherService.getAllVouchers();
      const found = vouchers.find(v => v.code.toLowerCase() === voucherCode.trim().toLowerCase());
      if (!found) {
        setVoucherError('Mã voucher không tồn tại hoặc đã hết hạn.');
      } else if (found.status !== 1) {
        setVoucherError('Mã voucher này đã hết hiệu lực.');
      } else if (found.minOrderValue && subtotal < found.minOrderValue) {
        setVoucherError(`Đơn hàng tối thiểu ${formatCurrency(found.minOrderValue)} để dùng mã này.`);
      } else {
        setAppliedVoucher(found);
        setVoucherCode('');
      }
    } catch {
      setVoucherError('Không thể kiểm tra voucher, vui lòng thử lại.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = subtotal > 0 ? (subtotal >= 2000000 ? 0 : 30000) : 0;
  let discount = 0;
  if (appliedVoucher) {
    discount = appliedVoucher.discountType === 'PERCENTAGE'
      ? Math.min((subtotal * appliedVoucher.discountValue) / 100, appliedVoucher.maxDiscountValue || Infinity)
      : appliedVoucher.discountValue;
  }
  const total = subtotal + shippingFee - discount;



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 p-4">
        <div className="relative">
          <div className="w-40 h-40 bg-blue-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-20 h-20 text-blue-300" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-yellow-800" />
          </div>
        </div>
        <div className="text-center max-w-xs">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Giỏ hàng trống</h2>
          <p className="text-gray-500 leading-relaxed">Hãy thêm vài sản phẩm tuyệt vời vào giỏ hàng của bạn nhé!</p>
        </div>
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-2xl shadow-gray-900/30 active:scale-95">
          Khám phá sản phẩm <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Top Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1 as any)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-black text-gray-900">Giỏ hàng</h1>
            <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
              {cartItems.length}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Cart Items */}
          <div className="lg:col-span-7 space-y-5">

            {/* Items Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{cartItems.length} sản phẩm đã chọn</p>
              <button onClick={handleClearCart}
                className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 transition-all px-3 py-1.5 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
              </button>
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map((item, i) => (
                <div key={item.cartItemId}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={`bg-white rounded-3xl border border-gray-100 p-5 flex gap-5 shadow-sm hover:shadow-md transition-all duration-300 ${updatingId === item.cartItemId ? 'opacity-50 pointer-events-none scale-[0.99]' : ''}`}>

                  {/* Product Image */}
                  <div onClick={() => navigate(`/product/${item.productSlug}`)}
                    className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 cursor-pointer group">
                    {item.productThumbnail ? (
                      <img src={getFullImageUrl(item.productThumbnail)} alt={item.productName}
                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 onClick={() => navigate(`/product/${item.productSlug}`)}
                          className="font-bold text-gray-900 leading-tight hover:text-blue-600 cursor-pointer transition-colors line-clamp-1 text-base">
                          {item.productName}
                        </h3>
                        <button onClick={() => handleRemove(item.cartItemId)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.variantAttributes && (
                        <div className="flex items-center gap-1.5">
                          {item.variantAttributes.split(',').map((attr, idx) => (
                            <span key={idx} className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${idx === 0 ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                              {attr.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Control */}
                      <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100 scale-90 -ml-2">
                        <button onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-black text-sm text-gray-900">{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="font-black text-gray-900 text-lg leading-none">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Tag className="w-4 h-4 text-orange-500" />
                </div>
                <h3 className="font-black text-gray-900">Mã giảm giá</h3>
              </div>

              <div className="p-6">
                {appliedVoucher ? (
                  <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-black text-green-800 text-sm">{appliedVoucher.code}</div>
                        <div className="text-xs text-green-600">{appliedVoucher.name}</div>
                      </div>
                    </div>
                    <button onClick={() => { setAppliedVoucher(null); setVoucherError(''); }}
                      className="p-1.5 text-green-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
                          placeholder="NHẬP MÃ VOUCHER..."
                          className="w-full px-5 py-3.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl outline-none focus:border-orange-400 focus:bg-white text-sm font-bold uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-400 transition-all"
                        />
                      </div>
                      <button onClick={handleApplyVoucher} disabled={voucherLoading || !voucherCode.trim()}
                        className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-black rounded-2xl disabled:opacity-50 transition-all shadow-lg shadow-orange-200 whitespace-nowrap active:scale-95">
                        {voucherLoading ? 'Kiểm tra...' : 'Áp dụng'}
                      </button>
                    </div>
                    {voucherError && (
                      <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                        <XCircle className="w-4 h-4 shrink-0" /> {voucherError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, label: 'Chính hãng 100%', sub: 'Cam kết bảo hành', color: 'blue' },
                { icon: Truck, label: 'Giao nhanh 2h', sub: 'Nội thành HCM, HN', color: 'green' },
                { icon: Gift, label: 'Đổi trả 30 ngày', sub: 'Miễn phí hoàn trả', color: 'purple' },
              ].map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 text-center shadow-sm">
                  <div className={`w-10 h-10 bg-${color}-50 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}-500`} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">{label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">

              {/* Summary Card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
                  <h3 className="font-black text-white text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" /> Tóm tắt đơn hàng
                  </h3>
                </div>

                <div className="p-6 space-y-4">
                  {/* Line items */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Tạm tính <span className="text-gray-400">({cartItems.length} sp)</span></span>
                      <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> Phí vận chuyển
                      </span>
                      {shippingFee === 0
                        ? <span className="font-bold text-emerald-500 text-sm">Miễn phí 🎉</span>
                        : <span className="font-bold text-gray-900">{formatCurrency(shippingFee)}</span>
                      }
                    </div>

                    {shippingFee > 0 && (
                      <div className="bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium flex items-center gap-2">
                        <span>🚀</span>
                        Mua thêm <span className="font-black">{formatCurrency(2000000 - subtotal)}</span> để miễn phí ship
                      </div>
                    )}

                    {appliedVoucher && discount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-600 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> {appliedVoucher.code}
                        </span>
                        <span className="font-bold text-emerald-600">− {formatCurrency(discount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-gray-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-gray-900">Tổng thanh toán</span>
                      <div className="text-right">
                        <div className="font-black text-blue-600 text-2xl">{formatCurrency(total)}</div>
                        <div className="text-[10px] text-gray-400">Đã bao gồm VAT</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  {isGuest ? (
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700 font-medium text-center">
                        🔐 Vui lòng đăng nhập để tiến hành thanh toán. Giỏ hàng của bạn sẽ được giữ nguyên!
                      </div>
                      <button
                        onClick={() => navigate('/login', { state: { from: '/cart' } })}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black text-base rounded-2xl transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98] group"
                      >
                        Đăng nhập để thanh toán
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => {
                      if (appliedVoucher) localStorage.setItem('appliedVoucher', JSON.stringify(appliedVoucher));
                      else localStorage.removeItem('appliedVoucher');
                      navigate('/checkout');
                    }}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black text-base rounded-2xl transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98] group">
                      Tiến hành thanh toán
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  <button onClick={() => navigate('/')}
                    className="w-full py-3 text-gray-400 hover:text-blue-600 font-medium text-sm transition-all flex items-center justify-center gap-1.5">
                    <ChevronLeft className="w-4 h-4" /> Tiếp tục mua sắm
                  </button>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                Thanh toán bảo mật SSL 256-bit
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-20 border-t border-gray-100">
            <div className="flex items-end justify-between mb-12">
               <div>
                 <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Có thể bạn quan tâm</h4>
                 <h2 className="text-4xl font-black text-gray-900 tracking-tight">Sản Phẩm Gợi Ý</h2>
               </div>
               <button onClick={() => navigate('/')} className="text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-all">
                 Xem thêm →
               </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => navigate(`/product/${p.slug}`)}
                  className="group bg-white rounded-[2.5rem] p-6 border border-gray-100 hover:border-blue-500/20 transition-all hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-square mb-6 bg-gray-50 rounded-3xl overflow-hidden p-8 flex items-center justify-center">
                    <img 
                      src={getFullImageUrl(p.thumbnail)} 
                      alt={p.productName}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors text-sm">
                    {p.productName}
                  </h3>
                  <div className="mt-auto flex items-center justify-between">
                    <p className="text-lg font-black text-gray-900">
                       {formatCurrency(p.salePrice)}
                    </p>
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                       <Plus size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
