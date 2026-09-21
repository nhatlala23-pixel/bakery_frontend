import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Minus, 
  Plus, 
  Loader2,
  Heart,
  Share2,
  Settings,
  MessageSquare,
  ArrowLeft,
  Home,
  Trash2,
  Calendar,
  User,
  GitCompareArrows
} from 'lucide-react';
import productService, { type ProductDetailResponse, type ProductResponse } from '@/services/api/productService';
import cartService, { type CartItemResponse } from '@/services/api/cartService';
import contactSettingService, { type ContactSettingDTO } from '@/services/api/contactSettingService';
import { WishlistButton } from '@/components/common/WishlistButton';
import reviewService, { type ProductReviewDTO } from '@/services/api/reviewService';
import axiosClient from '@/services/api/axiosClient';
import { recordProductView } from '@/components/common/RecentlyViewed';
import { useCompare } from '@/contexts/CompareContext';

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
  
  // Try exact match
  if (colorMap[name]) return colorMap[name];
  
  // Try partial match
  for (const key in colorMap) {
    if (name.includes(key)) return colorMap[key];
  }
  
  return '#f3f4f6'; // Default fallback
};

export const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [contactSettings, setContactSettings] = useState<ContactSettingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartToast, setCartToast] = useState<'success' | 'error' | 'login' | 'select' | null>(null);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userId = user?.id;

  useEffect(() => {
    contactSettingService.getContactSetting()
      .then(res => setContactSettings(res))
      .catch(() => {});
  }, []);

  // Review states
  const [reviews, setReviews] = useState<ProductReviewDTO[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (uploadedImages.length + files.length > 3) {
      alert('Chỉ được tải lên tối đa 3 ảnh thực tế!');
      return;
    }

    setUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn (tối đa 5MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosClient.post<{ url: string }>('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.url) {
          urls.push(response.url);
        }
      }
      setUploadedImages(prev => [...prev, ...urls]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Tải ảnh lên thất bại. Vui lòng thử lại!');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveUploadedImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const getFullImageUrl = (url?: string) => {
    if (!url || url === 'undefined') return 'https://placehold.co/600x600/f3f4f6/94a3b8?text=TECHNO';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const fetchReviews = async (productId: number) => {
    try {
      setLoadingReviews(true);
      const data = await reviewService.getReviews(productId);
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert('Vui lòng đăng nhập để gửi đánh giá!');
      navigate('/login');
      return;
    }
    if (!newContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá!');
      return;
    }
    if (!product) return;

    setSubmittingReview(true);
    try {
      await reviewService.addReview({
        productId: product.id,
        userId: userId,
        rating: newRating,
        content: newContent,
        imageUrl: uploadedImages.length > 0 ? uploadedImages.join(',') : undefined
      });
      setNewContent('');
      setNewRating(5);
      setUploadedImages([]);
      setShowReviewForm(false);
      await fetchReviews(product.id);
      alert('Đã gửi đánh giá thành công!');
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Gửi đánh giá thất bại, vui lòng thử lại!');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      if (product) {
        await fetchReviews(product.id);
      }
      alert('Đã xóa đánh giá thành công!');
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Xóa đánh giá thất bại!');
    }
  };

  const { averageRating, reviewCount } = useMemo(() => {
    if (reviews.length === 0) return { averageRating: 5.0, reviewCount: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { 
      averageRating: parseFloat((sum / reviews.length).toFixed(1)), 
      reviewCount: reviews.length 
    };
  }, [reviews]);

  const { addToCompare, compareItems } = useCompare();
  const isInCompare = compareItems.some(p => p.id === product?.id);

  // Bundle states
  const [selectedBundleIds, setSelectedBundleIds] = useState<number[]>([]);
  const bundleProducts = useMemo(() => {
    return relatedProducts.filter(p => selectedBundleIds.includes(p.id));
  }, [relatedProducts, selectedBundleIds]);


  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      try {
        const data = await productService.getProductBySlug(slug);
        setProduct(data);
        setSelectedImage(getFullImageUrl(data.thumbnail));
        
        // Record this product as recently viewed
        recordProductView(data as unknown as ProductResponse);
        
        // Fetch reviews
        fetchReviews(data.id);
        
        // Sửa lỗi gọi API với categoryId undefined
        const categoryId = data.categoryId || data.category?.id;
        if (categoryId) {
          const related = await productService.getProductsByCategory(categoryId, 0, 6);
          const filteredRelated = related.content.filter(p => p.id !== data.id);
          setRelatedProducts(filteredRelated);
          setSelectedBundleIds(filteredRelated.slice(0, 2).map(p => p.id));
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const { colors, sizes } = useMemo(() => {
    if (!product?.variants) return { colors: [], sizes: [] };
    const uniqueColors = new Set<string>();
    const uniqueSizes = new Set<string>();
    
    product.variants.forEach(variant => {
      if (variant.colorCode) uniqueColors.add(variant.colorCode);
      if (variant.size) uniqueSizes.add(variant.size);
      
      if (!variant.colorCode && !variant.size && variant.attributeValues?.length > 0) {
        variant.attributeValues.forEach(attr => {
          if (attr.match(/GB|TB|MB/i)) uniqueSizes.add(attr);
          else uniqueColors.add(attr);
        });
      }
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

  const bundleTotal = useMemo(() => {
    if (!product) return 0;
    const mainPrice = selectedVariant?.variantPrice || product.salePrice;
    const bundlePrice = bundleProducts.reduce((acc, p) => acc + p.salePrice, 0);
    return mainPrice + bundlePrice;
  }, [selectedVariant, product, bundleProducts]);

  useEffect(() => {
    if (selectedVariant?.thumbnailUrl) {
      setSelectedImage(getFullImageUrl(selectedVariant.thumbnailUrl));
    }
  }, [selectedVariant]);

  const handleAttributeSelect = (type: 'color' | 'size', value: string) => {
    setSelectedAttributes(prev => ({ ...prev, [type]: value }));
  };

  const handleAddToCart = async (buyNow = false) => {
    setAddingToCart(true);
    try {
      let targetVariant = selectedVariant;
      if (product?.variants?.length && !targetVariant) {
        const selectedColor = selectedAttributes['color'];
        targetVariant = selectedColor ? product.variants.find(v => v.colorCode === selectedColor) ?? null : product.variants[0];
        if (!targetVariant) targetVariant = product.variants[0];
      }

      if (!userId) {
        const guestItem: CartItemResponse = {
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
        
        setCartToast('success');
        setTimeout(() => setCartToast(null), 3500);
        if (buyNow) navigate('/cart');
        return;
      }

      if (!product?.variants?.length) {
        await cartService.addProductToCart(userId, product!.id, quantity);
      } else {
        await cartService.addToCart(userId, targetVariant!.id, quantity);
      }
      window.dispatchEvent(new Event('cartUpdate'));
      setCartToast('success');
      setTimeout(() => setCartToast(null), 3500);
      if (buyNow) navigate('/cart');
    } catch (err) {
      setCartToast('error');
      setTimeout(() => setCartToast(null), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyBundle = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      if (!userId) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        
        // Add main product
        let targetVariant = selectedVariant || product.variants?.[0];
        const mainItem: CartItemResponse = {
          cartItemId: Date.now(),
          variantId: targetVariant ? targetVariant.id : 0,
          variantSku: targetVariant ? targetVariant.sku : (product.sku || ''),
          productId: product.id,
          productName: product.productName,
          productSlug: product.slug,
          productThumbnail: product.thumbnail || '',
          variantAttributes: targetVariant ? [targetVariant.colorCode, targetVariant.size].filter(Boolean).join(', ') : '',
          quantity: 1,
          unitPrice: targetVariant ? targetVariant.variantPrice : product.salePrice,
          subtotal: targetVariant ? targetVariant.variantPrice : product.salePrice
        };
        guestCart.push(mainItem);

        // Add bundle items
        bundleProducts.forEach((p, idx) => {
          guestCart.push({
            cartItemId: Date.now() + 10 + idx,
            variantId: 0,
            variantSku: p.sku || '',
            productId: p.id,
            productName: p.productName,
            productSlug: p.slug,
            productThumbnail: p.thumbnail || '',
            variantAttributes: '',
            quantity: 1,
            unitPrice: p.salePrice,
            subtotal: p.salePrice
          });
        });

        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        window.dispatchEvent(new Event('cartUpdate'));
      } else {
        // Add main product
        if (!product.variants?.length) {
          await cartService.addProductToCart(userId, product.id, 1);
        } else {
          const targetVariant = selectedVariant || product.variants[0];
          await cartService.addToCart(userId, targetVariant.id, 1);
        }

        // Add bundle items
        for (const p of bundleProducts) {
          await cartService.addProductToCart(userId, p.id, 1);
        }
        window.dispatchEvent(new Event('cartUpdate'));
      }

      setCartToast('success');
      setTimeout(() => setCartToast(null), 3500);
      navigate('/cart');
    } catch (err) {
      alert('Mua combo thất bại, vui lòng thử lại!');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (type: 'plus' | 'minus') => {
    if (type === 'plus') setQuantity(q => q + 1);
    else if (type === 'minus' && quantity > 1) setQuantity(q => q - 1);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-red-500">Sản phẩm không tồn tại.</div>;

  const currentPrice = selectedVariant?.variantPrice || product.salePrice;
  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : product.stock === 0;

  return (
    <div className="bg-white min-h-screen pb-20">
      {cartToast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl font-bold text-xs transition-all animate-in slide-in-from-right-4 duration-300 ${
          cartToast === 'success' ? 'bg-green-500 text-white' : cartToast === 'login' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'
        }`}>
          {cartToast === 'success' && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <ShoppingCart size={16} />
                <span>Đã thêm vào giỏ hàng!</span>
              </div>
              <span className="text-[10px] text-white/95 font-medium">
                💡 Mua thêm tới 2.000.000₫ để nhận ưu đãi <strong>MIỄN PHÍ VẬN CHUYỂN</strong>!
              </span>
              <button onClick={() => navigate('/cart')} className="underline mt-1 w-fit text-left">Xem giỏ hàng →</button>
            </div>
          )}
          {cartToast === 'login' && <><ShoppingCart size={16} /> Vui lòng <button onClick={() => navigate('/login')} className="underline mx-1">đăng nhập</button> để mua hàng!</>}
          {cartToast === 'error' && <>❌ Thêm vào giỏ thất bại!</>}
        </div>
      )}

      {/* Navigation Header */}
      <div className="bg-gray-50/50 border-b border-gray-100 sticky top-0 z-30 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-900 hover:text-blue-600 hover:shadow-md transition-all uppercase tracking-widest"
              >
                <Home size={14} /> Trang chủ
              </button>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                <button onClick={() => navigate(`/category/${product.category.slug}`)} className="hover:text-blue-600">{product.category.categoryName}</button>
                <ChevronRight size={10} className="mx-2" />
                <span className="text-gray-900 truncate max-w-[150px] lg:max-w-none">{product.productName}</span>
              </div>
           </div>
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black hover:bg-black transition-all uppercase tracking-widest">
              <ArrowLeft size={14} /> Quay lại
           </button>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-[1400px]:max-w-screen-xl mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          <div className="lg:col-span-5 xl:col-span-6 space-y-4">
            <div className="bg-gray-50 rounded-[2rem] overflow-hidden aspect-square flex items-center justify-center p-6 border border-gray-100 relative group">
              <img src={selectedImage} alt={product.productName} className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-105" />
              <div className="absolute top-4 left-4">
                 <div className="bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">-{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}%</div>
              </div>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              <button 
                onClick={() => setSelectedImage(getFullImageUrl(product.thumbnail))}
                className={`w-16 h-16 shrink-0 rounded-xl border-2 transition-all p-1.5 bg-gray-50 ${selectedImage === getFullImageUrl(product.thumbnail) ? 'border-blue-600 shadow-md ring-4 ring-blue-50' : 'border-transparent hover:border-gray-200'}`}
              >
                <img src={getFullImageUrl(product.thumbnail)} alt="thumb" className="w-full h-full object-contain" />
              </button>
              {product.images.map((img) => (
                <button 
                  key={img.id}
                  onClick={() => setSelectedImage(getFullImageUrl(img.imageUrl))}
                  className={`w-16 h-16 shrink-0 rounded-xl border-2 transition-all p-1.5 bg-gray-50 ${selectedImage === getFullImageUrl(img.imageUrl) ? 'border-blue-600 shadow-md ring-4 ring-blue-50' : 'border-transparent hover:border-gray-200'}`}
                >
                  <img src={getFullImageUrl(img.imageUrl)} alt="thumb" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 xl:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">{product.brand.brandName}</span>
                <div className="flex gap-1.5">
                  <WishlistButton 
                    productId={product.id} 
                    className="p-2 hover:bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center bg-white shadow-sm" 
                    size={16} 
                  />
                  <button
                    onClick={() => addToCompare(product as unknown as ProductResponse)}
                    title={isInCompare ? 'Đã thêm vào so sánh' : 'So sánh sản phẩm'}
                    className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-[10px] font-black ${
                      isInCompare
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-200'
                    }`}
                  >
                    <GitCompareArrows size={16} />
                    {isInCompare ? 'Đang so sánh' : 'So sánh'}
                  </button>
                  <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-300 hover:text-blue-500 transition-all border border-gray-100"><Share2 size={16} /></button>
                </div>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight tracking-tight uppercase">
                {product.productName}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg">
                  <Star size={12} className="text-yellow-500" fill="currentColor" />
                  <span className="text-[11px] font-black text-yellow-700">{averageRating}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{reviewCount} Đánh giá</span>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">•</span>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">542 Đã bán</span>
              </div>
            </div>

            <div className="p-6 bg-brand-light rounded-[2rem] border border-brand-secondary space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-serif font-black text-brand-dark tracking-tighter">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(currentPrice))}
                </span>
                {product.originalPrice > product.salePrice && (
                  <span className="text-sm text-brand-muted line-through font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(product.originalPrice))}
                  </span>
                )}
              </div>
              <div className="pt-4 border-t border-brand-secondary">
                 <div className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                   <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" /> Cam kết từ Gấu Bakery
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="text-sm font-medium text-brand-dark flex items-center gap-2">✨ Nguyên liệu cao cấp 100%</div>
                    <div className="text-sm font-medium text-brand-dark flex items-center gap-2">🎂 Bánh làm tươi trong ngày</div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              {colors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Loại trang trí: <span className="text-brand-dark font-black">{selectedAttributes['color']}</span></h4>
                  <div className="flex flex-wrap gap-4">
                    {colors.map((color) => {
                      const colorCode = getColorCode(color);
                      return (
                        <button
                          key={color}
                          onClick={() => handleAttributeSelect('color', color)}
                          className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center p-1 ${selectedAttributes['color'] === color ? 'border-brand-accent ring-4 ring-brand-accent/20' : 'border-gray-200 hover:border-gray-400'}`}
                        >
                           <div className="w-full h-full rounded-full border border-black/5 shadow-inner" style={{ backgroundColor: colorCode }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {sizes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Kích thước (Size): <span className="text-brand-dark font-black">{selectedAttributes['size']}</span></h4>
                  <div className="grid grid-cols-3 gap-3">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleAttributeSelect('size', size)}
                        className={`py-3 rounded-xl text-xs font-black transition-all border ${selectedAttributes['size'] === size ? 'bg-brand-dark border-brand-dark text-white shadow-lg' : 'bg-white border-brand-secondary text-brand-muted hover:border-brand-accent hover:text-brand-accent'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <a 
                href={contactSettings?.zaloUrl || `https://zalo.me/0987654321`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg uppercase tracking-widest"
              >
                <MessageSquare size={18} /> Chat Zalo để đặt bánh
              </a>
              <a 
                href={contactSettings?.facebookUrl || `https://facebook.com/gaubakery`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-4 bg-brand-dark text-white text-sm font-black rounded-2xl hover:bg-black transition-all shadow-lg uppercase tracking-widest"
              >
                Nhắn tin qua Fanpage
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-brand-secondary">
              {[ { i: <Truck size={18}/>, t: 'Giao hàng cẩn thận' }, { i: <ShieldCheck size={18}/>, t: 'Thực phẩm sạch' }, { i: <Heart size={18}/>, t: 'Bánh tươi mỗi ngày' } ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 text-center">
                  <div className="text-brand-accent">{item.i}</div>
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">{item.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>



        <div className="mt-16">
          <div className="flex border-b border-gray-100 sticky top-[72px] bg-white/90 backdrop-blur-sm z-20">
            {['desc', 'specs', 'reviews'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === t ? 'text-brand-accent border-brand-accent' : 'text-gray-400 border-transparent hover:text-brand-dark'}`}
              >
                {t === 'desc' ? 'Mô tả' : t === 'specs' ? 'Thành phần' : 'Đánh giá'}
              </button>
            ))}
          </div>
          
          <div className="py-10">
            {activeTab === 'desc' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 prose prose-sm max-w-none">
                   <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">Chi tiết sản phẩm</h3>
                   <div dangerouslySetInnerHTML={{ __html: product.description }} className="text-gray-600 text-sm leading-relaxed" />
                </div>
                <div className="lg:col-span-4">
                   <div className="bg-brand-dark text-white rounded-[1.5rem] p-6 sticky top-32">
                      <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-widest text-brand-secondary"><Settings size={16}/> Tóm tắt thành phần</h3>
                      <div className="space-y-4">
                         {product.specifications.slice(0, 6).map(spec => (
                           <div key={spec.id} className="flex justify-between items-center text-[11px] group border-b border-white/5 pb-3 last:border-0">
                              <span className="font-bold text-gray-500 uppercase tracking-wider">{spec.specKey}</span>
                              <span className="font-bold">{spec.specValue}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-3xl mx-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                    {product.specifications.map((spec) => (
                      <div key={spec.id} className="bg-white p-5 flex items-center gap-4 hover:bg-gray-50 transition-all">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Settings size={18}/></div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{spec.specKey}</p>
                          <p className="text-xs font-bold text-gray-900">{spec.specValue}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Stats and Add Review Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-gray-50 rounded-3xl border border-gray-100 items-center">
                  <div className="text-center md:border-r md:border-gray-200/60 md:pr-8">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">Đánh giá trung bình</p>
                    <h2 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">{averageRating}</h2>
                    <div className="flex justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={16} 
                          className={star <= Math.round(averageRating) ? 'text-yellow-500' : 'text-gray-200'} 
                          fill={star <= Math.round(averageRating) ? 'currentColor' : 'none'} 
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{reviewCount} lượt đánh giá</p>
                  </div>

                  <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:pl-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-gray-900 text-sm">Chia sẻ trải nghiệm của bạn</h4>
                      <p className="text-xs text-gray-500 font-medium">Đánh giá sản phẩm để giúp những người mua khác lựa chọn tốt nhất nhé!</p>
                    </div>
                    {!showReviewForm && (
                      <button 
                        onClick={() => {
                          if (!userId) {
                            alert('Vui lòng đăng nhập để đánh giá!');
                            navigate('/login');
                          } else {
                            setShowReviewForm(true);
                          }
                        }}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md cursor-pointer shrink-0"
                      >
                        Viết đánh giá
                      </button>
                    )}
                  </div>
                </div>


                {/* Review List */}
                {loadingReviews ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider animate-pulse">Đang tải đánh giá...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/40 rounded-3xl border border-dashed border-gray-200">
                    <MessageSquare size={36} className="text-gray-350 mx-auto mb-3" />
                    <h3 className="text-sm font-black text-gray-900 mb-1 uppercase tracking-widest">Chưa có đánh giá nào</h3>
                    <p className="text-xs text-gray-400 font-medium">Hãy là người đầu tiên sở hữu sản phẩm và viết đánh giá!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-6 bg-white border border-gray-100 rounded-3xl space-y-4 hover:shadow-md transition-shadow relative group">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 border border-blue-100">
                              <User size={16} />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-gray-900 leading-none mb-1">{rev.userName}</h4>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={10} />
                                {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-lg">
                            <Star size={12} className="text-yellow-500" fill="currentColor" />
                            <span className="text-[11px] font-black text-yellow-700">{rev.rating}.0</span>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm leading-relaxed pl-1 font-medium">{rev.content}</p>

                        {rev.imageUrl && (
                          <div className="flex flex-wrap gap-2 mt-3 pl-1">
                            {rev.imageUrl.split(',').map((url, idx) => (
                              <a 
                                key={idx} 
                                href={getFullImageUrl(url)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-16 h-16 rounded-xl border border-gray-150 overflow-hidden bg-gray-50 flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
                              >
                                <img 
                                  src={getFullImageUrl(url)} 
                                  alt={`review-img-${idx}`} 
                                  className="w-full h-full object-cover" 
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Delete Review button for Owner or Admin */}
                        {(userId === rev.userId || user?.roleName === 'ADMIN') && (
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="absolute bottom-6 right-6 p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm border border-red-100"
                            title="Xóa đánh giá"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-gray-100 mb-10">
            <div className="flex items-end justify-between mb-8">
               <div>
                 <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Gợi ý cho bạn</h4>
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Sản Phẩm Tương Tự</h2>
               </div>
               <button onClick={() => navigate(`/category/${product.category.slug}`)} className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-all">Xem tất cả →</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {relatedProducts.map(p => (
                <div key={p.id} onClick={() => navigate(`/product/${p.slug}`)} className="group bg-white rounded-[1.5rem] p-4 border border-gray-100 hover:border-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer flex flex-col h-full">
                  <div className="relative aspect-square mb-4 bg-gray-50 rounded-2xl overflow-hidden p-6 flex items-center justify-center">
                    <img src={getFullImageUrl(p.thumbnail)} alt={p.productName} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors h-8">
                    {p.productName}
                  </h3>
                  <div className="mt-auto flex flex-col">
                    <span className="text-sm font-black text-gray-900 tracking-tighter">
                       {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.salePrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Review Modal */}
      {showReviewForm && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Plus size={20} className="rotate-45" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-extrabold text-gray-950">Đánh giá sản phẩm</h3>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Product Info */}
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 p-2 flex items-center justify-center overflow-hidden">
                  <img 
                    src={selectedImage || getFullImageUrl(product.thumbnail)} 
                    alt={product.productName} 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 max-w-xs leading-snug">
                  {product.productName}
                </h4>
              </div>

              {/* Star Rating Selection */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const labels = ['Rất tệ', 'Tệ', 'Tạm ổn', 'Tốt', 'Rất tốt'];
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <Star 
                          size={32} 
                          className={`transition-all duration-150 ${
                            star <= newRating 
                              ? 'text-amber-500 scale-110' 
                              : 'text-gray-200 group-hover:text-amber-300'
                          }`} 
                          fill={star <= newRating ? 'currentColor' : 'none'} 
                        />
                        <span className={`text-[10px] font-bold transition-colors ${
                          star === newRating ? 'text-amber-600 font-extrabold' : 'text-gray-400'
                        }`}>
                          {labels[star - 1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <textarea
                  placeholder="Mời bạn chia sẻ thêm cảm nhận..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-medium resize-none"
                  required
                />
              </div>

              {/* Extras Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    defaultChecked
                  />
                  <span className="text-xs text-gray-750 font-medium">Tôi sẽ giới thiệu sản phẩm cho bạn bè, người thân</span>
                </label>

                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-b border-gray-100 py-3 my-2">
                  <span className="font-medium">Chào <strong className="text-gray-900 font-extrabold">{user?.fullName || user?.email || 'bạn'}</strong>, đánh giá của bạn rất quan trọng!</span>
                  <input 
                    type="file" 
                    id="review-image-upload" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageUpload} 
                    disabled={uploading}
                  />
                  <button 
                    type="button" 
                    onClick={() => document.getElementById('review-image-upload')?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold disabled:text-gray-400 cursor-pointer"
                  >
                    <span className="text-sm">📷</span> Gửi ảnh thực tế <span className="text-[10px] text-gray-400 font-medium">(tối đa 3 ảnh)</span>
                  </button>
                </div>

                {/* Previews of uploaded images */}
                {(uploadedImages.length > 0 || uploading) && (
                  <div className="flex flex-wrap gap-3 py-2">
                    {uploadedImages.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                        <img src={getFullImageUrl(url)} alt={`upload-preview-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveUploadedImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Plus size={12} className="rotate-45" />
                        </button>
                      </div>
                    ))}
                    {uploading && (
                      <div className="w-20 h-20 rounded-2xl border border-gray-200 border-dashed flex flex-col items-center justify-center gap-1 bg-gray-50 text-gray-400 shrink-0">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-[8px] font-bold uppercase tracking-wider">Tải lên...</span>
                      </div>
                    )}
                  </div>
                )}

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    defaultChecked
                    required
                  />
                  <span className="text-xs text-gray-600 font-medium leading-tight">
                    Tôi đồng ý với <a href="#" className="text-blue-600 hover:underline">Chính sách xử lý dữ liệu cá nhân</a> của TECHNO
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 disabled:bg-blue-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                Gửi đánh giá
              </button>

              {/* Footer links */}
              <div className="text-center pt-2">
                <p className="text-[10px] text-gray-400 font-semibold space-x-2">
                  <a href="#" className="hover:underline">Quy định đánh giá</a>
                  <span>|</span>
                  <a href="#" className="hover:underline">Chính sách bảo mật thông tin</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
