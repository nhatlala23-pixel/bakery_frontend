import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Loader2, PackageSearch, ChevronLeft, ChevronRight, TrendingUp,
  SlidersHorizontal, X, RotateCcw
} from 'lucide-react';
import productService, { type ProductResponse } from '@/services/api/productService';
import categoryService, { type CategoryDTO } from '@/services/api/categoryService';
import brandService, { type BrandDTO } from '@/services/api/brandService';
import { MainLayout } from '@/components/layout/MainLayout';
import { WishlistButton } from '@/components/common/WishlistButton';

const getFullImageUrl = (url?: string) => {
  if (!url) return 'https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

const TRENDING_KEYWORDS = ['iPhone', 'MacBook', 'Samsung', 'Laptop', 'Tai nghe', 'Sạc nhanh'];

const PRICE_PRESETS = [
  { label: 'Dưới 10 triệu', min: 0, max: 10000000 },
  { label: '10 - 20 triệu', min: 10000000, max: 20000000 },
  { label: '20 - 30 triệu', min: 20000000, max: 30000000 },
  { label: 'Trên 30 triệu', min: 30000000, max: undefined },
];

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get('q') || '';

  // Data states
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter UI states
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Active filter values (synced with state & API query)
  const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandDTO | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<{ label: string; min: number; max?: number } | null>(null);
  const [sort, setSort] = useState<string>('default');

  // Advanced specifications states
  const [selectedRam, setSelectedRam] = useState<string>('');
  const [selectedCpu, setSelectedCpu] = useState<string>('');
  const [selectedScreen, setSelectedScreen] = useState<string>('');

  // Load categories and brands once on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [cats, brs] = await Promise.all([
          categoryService.getAllCategoriesList(),
          brandService.getAllBrandsList()
        ]);
        setCategories(cats.filter(c => c.status === 1));
        setBrands(brs.filter(b => b.status === 1));
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    loadFilters();
  }, []);

  // Reset pagination and fetch results on keyword, filters, or page change
  useEffect(() => {
    if (!keyword.trim()) {
      setProducts([]);
      setTotalPages(0);
      setTotalElements(0);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await productService.searchProductsFiltered(
          keyword,
          {
            brandId: selectedBrand?.id,
            categoryId: selectedCategory?.id,
            minPrice: selectedPrice?.min,
            maxPrice: selectedPrice?.max,
            sort: sort
          },
          page,
          12
        );
        setProducts(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      } catch (err) {
        console.error('Search filter query error:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [keyword, selectedCategory, selectedBrand, selectedPrice, sort, page]);

  // Reset page to 0 when filters change
  const handleCategorySelect = (cat: CategoryDTO) => {
    setPage(0);
    setSelectedCategory(prev => prev?.id === cat.id ? null : cat);
  };

  const handleBrandSelect = (brand: BrandDTO) => {
    setPage(0);
    setSelectedBrand(prev => prev?.id === brand.id ? null : brand);
  };

  const handlePriceSelect = (price: typeof PRICE_PRESETS[0]) => {
    setPage(0);
    setSelectedPrice(prev => prev?.label === price.label ? null : price);
  };

  const handleSortChange = (newSort: string) => {
    setPage(0);
    setSort(newSort);
  };

  const clearAllFilters = () => {
    setPage(0);
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedPrice(null);
    setSelectedRam('');
    setSelectedCpu('');
    setSelectedScreen('');
    setSort('default');
  };

  const activeFiltersCount = 
    (selectedCategory ? 1 : 0) + 
    (selectedBrand ? 1 : 0) + 
    (selectedPrice ? 1 : 0) +
    (selectedRam ? 1 : 0) +
    (selectedCpu ? 1 : 0) +
    (selectedScreen ? 1 : 0);

  // Client side sub-filtering by specifications
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedRam) {
        const hasRam = p.specifications?.some(s => 
          s.specKey.toLowerCase().includes('ram') && 
          s.specValue.toLowerCase().includes(selectedRam.toLowerCase())
        );
        if (!hasRam) return false;
      }
      if (selectedCpu) {
        const hasCpu = p.specifications?.some(s => 
          s.specKey.toLowerCase().includes('cpu') && 
          s.specValue.toLowerCase().includes(selectedCpu.toLowerCase())
        );
        if (!hasCpu) return false;
      }
      if (selectedScreen) {
        const hasScreen = p.specifications?.some(s => 
          (s.specKey.toLowerCase().includes('màn') || s.specKey.toLowerCase().includes('screen') || s.specKey.toLowerCase().includes('display')) && 
          s.specValue.toLowerCase().includes(selectedScreen.toLowerCase())
        );
        if (!hasScreen) return false;
      }
      return true;
    });
  }, [products, selectedRam, selectedCpu, selectedScreen]);

  const handleTrending = (kw: string) => {
    setSearchParams({ q: kw });
    clearAllFilters();
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50/50">
        {/* Breadcrumb section */}
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors">
                Trang chủ
              </button>
              <span className="mx-2 text-gray-300">/</span>
              <span className="text-gray-500">Tìm kiếm</span>
              {keyword && (
                <>
                  <span className="mx-2 text-gray-300">/</span>
                  <span className="text-blue-600 truncate max-w-[200px]">"{keyword}"</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-6">
          {/* Main search view */}
          {keyword ? (
            <>
              {/* Header Title & Result Counter */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <h1 className="text-2xl font-black text-gray-900">
                  Kết quả cho: <span className="text-blue-600">"{keyword}"</span>
                </h1>
                {!loading && products.length > 0 && (
                  <p className="text-sm text-gray-400 font-medium">
                    Tìm thấy <span className="font-black text-gray-700">{totalElements}</span> sản phẩm
                  </p>
                )}
              </div>

              {/* Filters & Sorting Panel */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-8 space-y-4">
                
                {/* Row 1: Filters Toggle and Active Tags */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all ${
                      showFilterPanel || activeFiltersCount > 0
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <SlidersHorizontal size={16} />
                    <span>Lọc</span>
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 px-2 py-0.5 text-xs font-black bg-orange-500 text-white rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {/* Active Filter Chips */}
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                      {selectedCategory.categoryName}
                      <button onClick={() => setSelectedCategory(null)} className="text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  )}

                  {selectedBrand && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                      {selectedBrand.brandName}
                      <button onClick={() => setSelectedBrand(null)} className="text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  )}

                  {selectedPrice && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                      {selectedPrice.label}
                      <button onClick={() => setSelectedPrice(null)} className="text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  )}

                  {selectedRam && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                      RAM: {selectedRam}
                      <button onClick={() => setSelectedRam('')} className="text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  )}

                  {selectedCpu && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                      CPU: {selectedCpu}
                      <button onClick={() => setSelectedCpu('')} className="text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  )}

                  {selectedScreen && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                      Màn hình: {selectedScreen}
                      <button onClick={() => setSelectedScreen('')} className="text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  )}

                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="px-3 py-2 text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw size={12} />
                      Xóa bộ lọc
                    </button>
                  )}
                </div>

                {/* Collapsible Filter Categories & Brands Grid */}
                {showFilterPanel && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50 animate-in fade-in duration-200">
                    
                    {/* Category Filter Group */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Danh mục</h4>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {categories.map(cat => {
                          const isSelected = selectedCategory?.id === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => handleCategorySelect(cat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                                  : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {cat.categoryName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Brand Filter Group */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Thương hiệu</h4>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {brands.map(brand => {
                          const isSelected = selectedBrand?.id === brand.id;
                          return (
                            <button
                              key={brand.id}
                              onClick={() => handleBrandSelect(brand)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                                  : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {brand.brandName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price presets filter group */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Khoảng giá</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {PRICE_PRESETS.map(price => {
                          const isSelected = selectedPrice?.label === price.label;
                          return (
                            <button
                              key={price.label}
                              onClick={() => handlePriceSelect(price)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                                  : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {price.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* RAM filter */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Bộ nhớ RAM</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {['8GB', '16GB', '32GB', '64GB'].map(ram => (
                          <button
                            key={ram}
                            onClick={() => setSelectedRam(prev => prev === ram ? '' : ram)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              selectedRam === ram
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {ram}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CPU filter */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Vi xử lý CPU</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {['Intel Core i5', 'Intel Core i7', 'Apple M1', 'Apple M2', 'Apple M3', 'Ryzen 5', 'Ryzen 7'].map(cpu => (
                          <button
                            key={cpu}
                            onClick={() => setSelectedCpu(prev => prev === cpu ? '' : cpu)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              selectedCpu === cpu
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {cpu}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Screen filter */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Kích thước màn hình</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {['13 inch', '14 inch', '15.6 inch', '16 inch'].map(screen => (
                          <button
                            key={screen}
                            onClick={() => setSelectedScreen(prev => prev === screen ? '' : screen)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              selectedScreen === screen
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {screen}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* Sắp xếp theo: row */}
                <div className="pt-4 border-t border-gray-50 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                  <span className="font-bold text-gray-400 uppercase tracking-widest">Sắp xếp theo:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'default', label: 'Nổi bật' },
                      { key: 'discount', label: 'Giảm giá' },
                      { key: 'newest', label: 'Mới' },
                      { key: 'price_asc', label: 'Giá tăng dần' },
                      { key: 'price_desc', label: 'Giá giảm dần' }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => handleSortChange(opt.key)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          sort === opt.key
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Loader */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Đang lọc sản phẩm...
                  </p>
                </div>
              )}

              {/* No results view */}
              {!loading && filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm gap-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                    <PackageSearch size={36} className="text-gray-300" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-black text-gray-900 mb-1">Không tìm thấy sản phẩm phù hợp</h3>
                    <p className="text-gray-400 text-xs max-w-xs mx-auto">
                      Hãy điều chỉnh lại các bộ lọc hoặc tìm kiếm từ khóa khác.
                    </p>
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
                  >
                    Khôi phục bộ lọc
                  </button>
                </div>
              )}

              {/* Product list grid */}
              {!loading && filteredProducts.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => navigate(`/product/${product.slug}`)}
                        className="group bg-white rounded-3xl p-4 border border-gray-100 hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer flex flex-col h-full"
                      >
                        <div className="relative aspect-square mb-4 bg-gray-50 rounded-2xl overflow-hidden p-4 flex items-center justify-center">
                          <img
                            src={getFullImageUrl(product.thumbnail)}
                            alt={product.productName}
                            className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                            onError={e => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image';
                            }}
                          />
                          {product.originalPrice > product.salePrice && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow">
                              -{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}%
                            </div>
                          )}
                          {/* Wishlist Button */}
                          <div className="absolute top-2 right-2">
                            <WishlistButton
                              productId={product.id}
                              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md hover:bg-white border border-gray-100"
                              size={14}
                            />
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                              {product.categoryName}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              {product.brandName}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors text-sm">
                            {product.productName}
                          </h3>
                          <div className="pt-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-base font-black text-gray-900">
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

                        <div className="mt-4 pt-3 border-t border-gray-50">
                          <button className="w-full py-2.5 bg-gray-50 text-gray-900 font-bold rounded-xl text-xs uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all">
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination control */}
                  {totalPages > 1 && (
                    <div className="mt-16 flex items-center justify-center gap-3 pb-10">
                      <button
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      {[...Array(Math.min(totalPages, 7))].map((_, i) => (
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
                      <button
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            // No search keyword state
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <Search size={36} className="text-blue-500" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-black text-gray-900 mb-2">Bạn muốn tìm gì?</h2>
                <p className="text-gray-400 text-sm">Nhập tên sản phẩm vào ô tìm kiếm phía trên.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <TrendingUp size={14} />
                  Gợi ý phổ biến
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {TRENDING_KEYWORDS.map(kw => (
                    <button
                      key={kw}
                      onClick={() => handleTrending(kw)}
                      className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
