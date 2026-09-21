import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Loader2, 
  ChevronRight, 
  Filter, 
  LayoutGrid,
  List as ListIcon,
  ArrowLeft,
  X,
  ChevronLeft
} from 'lucide-react';
import productService, { type ProductResponse } from '@/services/api/productService';
import categoryService from '@/services/api/categoryService';
import brandService from '@/services/api/brandService';
import { WishlistButton } from '@/components/common/WishlistButton';

export const ProductListingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isCategory = location.pathname.includes('/category/');
  const isBrand = location.pathname.includes('/brand/');

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [currentCategoryId, setCurrentCategoryId] = useState<number | undefined>(undefined);
  const [currentBrandId, setCurrentBrandId] = useState<number | undefined>(undefined);

  // Active filter states (applied to query)
  const [activeMinPrice, setActiveMinPrice] = useState<number | ''>('');
  const [activeMaxPrice, setActiveMaxPrice] = useState<number | ''>('');
  const [activeSortOrder, setActiveSortOrder] = useState<string>('default');

  // Temporary filter states (in modal/sidebar)
  const [tempMinPrice, setTempMinPrice] = useState<number | ''>('');
  const [tempMaxPrice, setTempMaxPrice] = useState<number | ''>('');
  const [tempSortOrder, setTempSortOrder] = useState<string>('default');

  const getFullImageUrl = (url?: string) => {
    if (!url) return 'https://placehold.co/400x400?text=No+Image';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Sync temp filters with active filters when modal opens
  useEffect(() => {
    if (isFilterOpen) {
      setTempMinPrice(activeMinPrice);
      setTempMaxPrice(activeMaxPrice);
      setTempSortOrder(activeSortOrder);
    }
  }, [isFilterOpen]);

  // 1. Fetch category/brand ID when slug changes, reset filters
  useEffect(() => {
    const fetchId = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        setPage(0);
        setActiveMinPrice('');
        setActiveMaxPrice('');
        setActiveSortOrder('default');
        setTempMinPrice('');
        setTempMaxPrice('');
        setTempSortOrder('default');

        if (isCategory) {
          const cat = await categoryService.getCategoryBySlug(slug);
          setTitle(cat.categoryName);
          setCurrentCategoryId(cat.id);
          setCurrentBrandId(undefined);
        } else if (isBrand) {
          const brand = await brandService.getBrandBySlug(slug);
          setTitle(brand.brandName);
          setCurrentBrandId(brand.id);
          setCurrentCategoryId(undefined);
        }
      } catch (error) {
        console.error('Failed to fetch category/brand details:', error);
        setLoading(false);
      }
    };

    fetchId();
  }, [slug, isCategory, isBrand]);

  // 2. Fetch products when category/brand ID, page, or active filters change
  useEffect(() => {
    const fetchProducts = async () => {
      if (isCategory && currentCategoryId === undefined) return;
      if (isBrand && currentBrandId === undefined) return;

      setLoading(true);
      try {
        const response = await productService.searchProductsFiltered(
          '',
          {
            categoryId: isCategory ? currentCategoryId : undefined,
            brandId: isBrand ? currentBrandId : undefined,
            minPrice: activeMinPrice !== '' ? Number(activeMinPrice) : undefined,
            maxPrice: activeMaxPrice !== '' ? Number(activeMaxPrice) : undefined,
            sort: activeSortOrder,
          },
          page,
          12
        );

        if (response) {
          setProducts(response.content);
          setTotalPages(response.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch filtered products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo(0, 0);
  }, [currentCategoryId, currentBrandId, page, activeMinPrice, activeMaxPrice, activeSortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Breadcrumbs & Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">
            <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors">Trang chủ</button>
            <ChevronRight size={12} className="mx-2" />
            <span className="text-gray-400">{isCategory ? 'Danh mục' : 'Thương hiệu'}</span>
            <ChevronRight size={12} className="mx-2" />
            <span className="text-blue-600">{title}</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
                  {title}
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Khám phá {products.length} sản phẩm công nghệ
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden md:flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ListIcon size={18} />
                </button>
              </div>
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                <Filter size={16} />
                Bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Sidebar Overlay */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsFilterOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Bộ lọc sản phẩm</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-10">
                {/* Price Filter */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Khoảng giá</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Từ (đ)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={tempMinPrice}
                        onChange={e => setTempMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Đến (đ)</label>
                      <input 
                        type="number" 
                        placeholder="100.000.000" 
                        value={tempMaxPrice}
                        onChange={e => setTempMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { label: 'Dưới 10tr', min: 0, max: 10000000 },
                      { label: '10tr - 20tr', min: 10000000, max: 20000000 },
                      { label: '20tr - 50tr', min: 20000000, max: 50000000 },
                      { label: 'Trên 50tr', min: 50000000, max: '' }
                    ].map(p => {
                      const isSelected = tempMinPrice === p.min && tempMaxPrice === p.max;
                      return (
                        <button 
                          key={p.label} 
                          onClick={() => {
                            setTempMinPrice(p.min);
                            setTempMaxPrice(p.max);
                          }}
                          className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' 
                              : 'border-gray-100 hover:border-blue-500 hover:text-blue-600 text-gray-500'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort Order */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Sắp xếp theo</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Mới nhất', value: 'newest' },
                      { label: 'Giá thấp đến cao', value: 'price_asc' },
                      { label: 'Giá cao đến thấp', value: 'price_desc' },
                      { label: 'Bán chạy nhất', value: 'discount' }
                    ].map(s => (
                      <label 
                        key={s.value} 
                        className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-colors group ${
                          tempSortOrder === s.value ? 'bg-blue-50' : 'bg-gray-50 hover:bg-blue-50/50'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="sort" 
                          checked={tempSortOrder === s.value}
                          onChange={() => setTempSortOrder(s.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                        />
                        <span className={`text-sm font-bold group-hover:text-blue-700 ${
                          tempSortOrder === s.value ? 'text-blue-700' : 'text-gray-700'
                        }`}>{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                <button 
                  onClick={() => {
                    setTempMinPrice('');
                    setTempMaxPrice('');
                    setTempSortOrder('default');
                    setActiveMinPrice('');
                    setActiveMaxPrice('');
                    setActiveSortOrder('default');
                    setPage(0);
                    setIsFilterOpen(false);
                  }}
                  className="flex-1 py-4 border border-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-white transition-all"
                >
                  Xóa bộ lọc
                </button>
                <button 
                  onClick={() => {
                    setActiveMinPrice(tempMinPrice);
                    setActiveMaxPrice(tempMaxPrice);
                    setActiveSortOrder(tempSortOrder);
                    setPage(0);
                    setIsFilterOpen(false);
                  }}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 lg:px-8 mt-10">
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutGrid size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có sản phẩm nào</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Chúng tôi đang cập nhật các sản phẩm mới nhất cho danh mục này. Vui lòng quay lại sau!</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
            >
              Quay lại trang chủ
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product.id}
                onClick={() => navigate(`/product/${product.slug}`)}
                className="group bg-white rounded-3xl p-4 border border-gray-100 hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer flex flex-col h-full"
              >
                <div className="relative aspect-square mb-6 bg-gray-50 rounded-2xl overflow-hidden p-6 flex items-center justify-center">
                  <img 
                    src={getFullImageUrl(product.thumbnail)} 
                    alt={product.productName}
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.originalPrice > product.salePrice && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                      -{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}%
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <WishlistButton
                      productId={product.id}
                      className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md hover:bg-white border border-gray-100"
                      size={16}
                    />
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{product.categoryName}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{product.brandName}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                    {product.productName}
                  </h3>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}
                      </span>
                      {product.originalPrice > product.salePrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-50">
                  <button className="w-full py-3 bg-gray-50 text-gray-900 font-bold rounded-xl text-xs uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="flex flex-col gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.slug}`)}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer flex items-center gap-6 p-4"
              >
                {/* Thumbnail */}
                <div className="relative w-28 h-28 flex-shrink-0 bg-gray-50 rounded-2xl overflow-hidden p-3 flex items-center justify-center">
                  <img
                    src={getFullImageUrl(product.thumbnail)}
                    alt={product.productName}
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.originalPrice > product.salePrice && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow">
                      -{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}%
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{product.categoryName}</span>
                    <span className="text-[10px] text-gray-300">•</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{product.brandName}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-1 leading-snug group-hover:text-blue-600 transition-colors text-base">
                    {product.productName}
                  </h3>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-lg font-black text-gray-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}
                    </span>
                    {product.originalPrice > product.salePrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex-shrink-0 flex flex-col items-end gap-3">
                  <WishlistButton
                    productId={product.id}
                    className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shadow-sm hover:bg-blue-50 border border-gray-100"
                    size={16}
                  />
                  <button
                    className="px-5 py-2.5 bg-gray-50 text-gray-900 font-bold rounded-xl text-xs uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all whitespace-nowrap"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-20 flex items-center justify-center gap-3 pb-10">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-12 h-12 rounded-2xl font-black text-xs transition-all ${
                    page === i 
                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/30 scale-110' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
