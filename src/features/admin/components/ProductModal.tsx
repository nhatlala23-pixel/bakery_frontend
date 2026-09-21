import { useState, useEffect, useRef } from 'react';
import { Upload, X, Plus, Trash2, Image as ImageIcon, CheckCircle2, Save, Layers } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import axiosClient from '../../../services/api/axiosClient';
import productService, { 
  type ProductRequest, 
  type ProductResponse, 
  type ProductVariantRequest,
  type ProductImageRequest
} from '../../../services/api/productService';
import categoryService, { type CategoryDTO } from '../../../services/api/categoryService';
import brandService, { type BrandDTO } from '../../../services/api/brandService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: ProductResponse | null;
}

export const ProductModal = ({ isOpen, onClose, onSuccess, product }: ProductModalProps) => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectingImageForVariant, setSelectingImageForVariant] = useState<number | null>(null);
  
  // States for Bulk Variant Generator
  const [bulkColors, setBulkColors] = useState('');
  const [bulkSizes, setBulkSizes] = useState('');
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductRequest>({
    sku: '',
    productName: '',
    slug: '',
    originalPrice: 0,
    salePrice: 0,
    stock: 0,
    thumbnail: '',
    shortDescription: '',
    description: '',
    categoryId: 0,
    brandId: undefined,
    status: 1,
    variants: [],
    images: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, brandData] = await Promise.all([
          categoryService.getAllCategoriesList(),
          brandService.getAllBrandsList()
        ]);
        setCategories(catData);
        setBrands(brandData);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    const fetchFullDetail = async () => {
      if (product && isOpen) {
        setFetchingDetail(true);
        try {
          const detail = await productService.getProductBySlug(product.slug);
          setFormData({
            sku: detail.sku,
            productName: detail.productName,
            slug: detail.slug,
            originalPrice: detail.originalPrice,
            salePrice: detail.salePrice,
            stock: detail.stock || 99,
            thumbnail: detail.thumbnail || '',
            shortDescription: detail.shortDescription || '',
            description: detail.description || '',
            categoryId: detail.category?.id || (categories[0]?.id || 1),
            brandId: detail.brand?.id || (brands[0]?.id || 1),
            status: detail.status,
            images: detail.images.map(img => ({
              imageUrl: img.imageUrl,
              isMain: img.isMain,
              sortOrder: img.sortOrder
            })),
            variants: detail.variants.map(v => ({
              sku: v.sku,
              price: v.variantPrice,
              stockQuantity: v.stock || 99,
              colorCode: v.colorCode || '',
              size: v.size || '',
              thumbnailUrl: v.thumbnailUrl,
              status: 1
            }))
          });
        } catch (error) {
          console.error('Failed to fetch product detail:', error);
        } finally {
          setFetchingDetail(false);
        }
      } else {
        setFormData({
          sku: 'BK-' + Math.floor(1000 + Math.random() * 9000),
          productName: '',
          slug: '',
          originalPrice: 0,
          salePrice: 0,
          stock: 99,
          thumbnail: '',
          shortDescription: 'Bánh tươi ngon làm mới mỗi ngày từ nguyên liệu cao cấp. Hỗ trợ ghi chữ lên bánh và tặng kèm bộ dao nĩa nến sinh nhật.',
          description: '<p><strong>Đặc điểm nổi bật:</strong></p><ul><li>Cốt bánh mềm mịn, vị ngọt nhẹ thanh mát.</li><li>Trang trí hoa quả tươi / kem bơ nhập khẩu cao cấp.</li><li>Bảo quản ở nhiệt độ 2 - 8°C (Dùng tốt nhất trong 48h).</li></ul>',
          categoryId: categories[0]?.id || 1,
          brandId: brands[0]?.id || 1,
          status: 1,
          variants: [],
          images: []
        });
      }
    };
    fetchFullDetail();
  }, [product, isOpen, categories, brands]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setUploading(true);
    try {
      const response: any = await axiosClient.post('/upload', uploadData);
      setFormData({ ...formData, thumbnail: response.url });
    } catch (error) {
      alert('Upload ảnh thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleMultiFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => {
        const data = new FormData();
        data.append('file', file);
        return axiosClient.post('/upload', data);
      });

      const responses: any[] = await Promise.all(uploadPromises);
      const newImages: ProductImageRequest[] = responses.map((res, index) => ({
        imageUrl: res.url,
        isMain: false,
        sortOrder: (formData.images?.length || 0) + index + 1
      }));

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages]
      }));
    } catch (error) {
      alert('Upload một số ảnh thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const addVariant = () => {
    const newVariant: ProductVariantRequest = {
      sku: `${formData.sku}-${(formData.variants?.length || 0) + 1}`,
      price: formData.salePrice,
      stockQuantity: 99,
      colorCode: 'Vani',
      size: '20cm',
      thumbnailUrl: '',
      status: 1
    };
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), newVariant]
    }));
  };

  const removeVariant = (index: number) => {
    const updated = [...(formData.variants || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, variants: updated });
  };

  const handleBulkGenerate = () => {
    const flavors = bulkColors.split(',').map(s => s.trim()).filter(s => s);
    const sizes = bulkSizes.split(',').map(s => s.trim()).filter(s => s);
    
    if (flavors.length === 0 && sizes.length === 0) {
      alert('Vui lòng nhập ít nhất một Hương vị hoặc Kích thước (ngăn cách bởi dấu phẩy)!');
      return;
    }

    const newVariants: ProductVariantRequest[] = [];
    const baseSku = formData.sku || 'BK';
    
    if (flavors.length > 0 && sizes.length > 0) {
      flavors.forEach(flavor => {
        sizes.forEach(size => {
          newVariants.push({
            sku: `${baseSku}-${flavor.toUpperCase()}-${size.toUpperCase()}`.replace(/\s+/g, ''),
            colorCode: flavor,
            size: size,
            price: formData.salePrice || 0,
            stockQuantity: 99,
            status: 1
          });
        });
      });
    } else if (flavors.length > 0) {
      flavors.forEach(flavor => {
        newVariants.push({
          sku: `${baseSku}-${flavor.toUpperCase()}`.replace(/\s+/g, ''),
          colorCode: flavor,
          price: formData.salePrice || 0,
          stockQuantity: 99,
          status: 1
        });
      });
    } else if (sizes.length > 0) {
      sizes.forEach(size => {
        newVariants.push({
          sku: `${baseSku}-${size.toUpperCase()}`.replace(/\s+/g, ''),
          size: size,
          price: formData.salePrice || 0,
          stockQuantity: 99,
          status: 1
        });
      });
    }

    if (confirm(`Hệ thống sẽ tạo ra ${newVariants.length} kích thước/hương vị bánh tự động. Tiếp tục?`)) {
      setFormData(prev => ({ ...prev, variants: newVariants }));
      setBulkColors('');
      setBulkSizes('');
      setShowBulkGenerator(false);
    }
  };

  const updateVariant = (index: number, field: keyof ProductVariantRequest, value: any) => {
    setFormData(prev => {
      const variants = [...(prev.variants || [])];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const selectImageForVariant = (variantIdx: number, imageUrl: string) => {
    updateVariant(variantIdx, 'thumbnailUrl', imageUrl);
    setSelectingImageForVariant(null);
  };

  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-fallback category & brand if omitted
    const payload = {
      ...formData,
      categoryId: formData.categoryId && formData.categoryId !== 0 ? formData.categoryId : (categories[0]?.id || 1),
      brandId: formData.brandId && formData.brandId !== 0 ? formData.brandId : (brands[0]?.id || 1),
      stock: formData.stock || 99
    };

    if (!payload.productName.trim()) {
      alert('Vui lòng nhập tên bánh!');
      return;
    }

    setLoading(true);
    try {
      if (product) {
        await productService.updateProduct(product.id, payload);
      } else {
        await productService.createProduct(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi khi lưu mẫu bánh:', error);
      const errorMsg = error.response?.data?.message || 'Lưu mẫu bánh thất bại!';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={product ? 'Chỉnh sửa mẫu bánh' : 'Thêm mẫu bánh mới'}
      size="5xl"
    >
      {fetchingDetail ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Đang tải thông tin mẫu bánh...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[85vh] overflow-y-auto px-1 custom-scrollbar">
          {/* Photos Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Ảnh đại diện chính mẫu bánh *</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition-all group overflow-hidden"
              >
                {uploading && !formData.thumbnail ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Đang tải ảnh...</span>
                  </div>
                ) : formData.thumbnail ? (
                  <>
                    <img src={getFullImageUrl(formData.thumbnail)} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-xs font-medium">Nhấn để chọn ảnh mẫu bánh</span>
                  </div>
                )}
                <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
              </div>
              <Input 
                placeholder="Hoặc dán URL ảnh trực tiếp..." 
                value={formData.thumbnail} 
                onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                className="text-xs"
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Album ảnh góc quay khác / Chi tiết bánh</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30">
                {formData.images?.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`relative aspect-square rounded-xl overflow-hidden group border-2 transition-all ${
                      selectingImageForVariant !== null ? 'cursor-pointer hover:border-amber-500 ring-2 ring-transparent hover:ring-amber-100' : 'border-slate-200'
                    }`}
                    onClick={() => selectingImageForVariant !== null && selectImageForVariant(selectingImageForVariant, img.imageUrl)}
                  >
                    <img src={getFullImageUrl(img.imageUrl)} alt="Sub" className="w-full h-full object-cover" />
                    {selectingImageForVariant === null ? (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    ) : (
                      <div className="absolute inset-0 bg-amber-600/40 flex items-center justify-center">
                        <CheckCircle2 className="text-white" size={24} />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-tr-md">#{idx + 1}</div>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => multiFileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-all"
                >
                  <Plus size={24} />
                  <span className="text-[10px] mt-1 font-bold">Thêm ảnh</span>
                </button>
                <input type="file" hidden multiple ref={multiFileInputRef} onChange={handleMultiFileChange} accept="image/*" />
              </div>
              {selectingImageForVariant !== null && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold animate-pulse">
                  <CheckCircle2 size={16} />
                  <span>💡 Bạn đang gắn ảnh đại diện cho kích thước/hương vị bánh...</span>
                </div>
              )}
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <Layers size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Thông tin bánh</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Tên mẫu bánh *</label>
                <Input 
                  required
                  placeholder="VD: Bánh Kem Dâu Tây Fresh Cream Premium"
                  value={formData.productName}
                  onChange={e => setFormData({...formData, productName: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Mã mẫu bánh (SKU) *</label>
                <Input 
                  required
                  placeholder="VD: BK-DAU-01"
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Giá niêm yết (Gốc)</label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.originalPrice}
                  onChange={e => setFormData({...formData, originalPrice: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Giá tham khảo / Khuyến mãi *</label>
                <Input 
                  type="number"
                  required
                  placeholder="0"
                  value={formData.salePrice}
                  onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})}
                  className="font-bold text-amber-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Danh mục bánh *</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})}
                >
                  <option value={0}>-- Chọn danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cake Variants Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-700">
                <Layers size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Kích thước & Hương vị bánh</h3>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowBulkGenerator(!showBulkGenerator)}
                  className="text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  ⚡ Tạo nhanh tùy chọn (Size / Vị)
                </Button>
                <Button type="button" size="sm" onClick={addVariant} className="bg-amber-800 hover:bg-amber-900 text-white">
                  <Plus size={16} className="mr-1" /> Thêm lẻ
                </Button>
              </div>
            </div>

            {showBulkGenerator && (
              <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <p className="text-xs text-slate-600 font-medium">Nhập các tùy chọn phân cách bởi dấu phẩy để hệ thống tự ghép các size và vị bánh.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Hương vị bánh (Vani, Socola, Matcha, Dâu tây...)</label>
                    <Input 
                      placeholder="Socola, Vani, Matcha..." 
                      value={bulkColors} 
                      onChange={e => setBulkColors(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Kích thước bánh (16cm, 20cm, 24cm, 2 tầng...)</label>
                    <Input 
                      placeholder="16cm, 20cm, 24cm..." 
                      value={bulkSizes} 
                      onChange={e => setBulkSizes(e.target.value)} 
                    />
                  </div>
                </div>
                <Button className="w-full bg-amber-800 hover:bg-amber-900 text-white" onClick={handleBulkGenerate}>Xác nhận tạo ma trận bánh</Button>
              </div>
            )}

            <div className="space-y-3">
              {formData.variants && formData.variants.length > 0 ? (
                formData.variants.map((variant, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border transition-all space-y-4 ${
                    selectingImageForVariant === idx 
                      ? 'border-amber-500 ring-4 ring-amber-50 bg-amber-50/10 shadow-md' 
                      : 'border-slate-100 dark:border-slate-800 hover:shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-[10px] font-bold text-amber-800 uppercase">Tùy chọn #{idx + 1}</span>
                        {selectingImageForVariant === idx && (
                          <span className="text-[10px] font-bold text-amber-600 animate-pulse uppercase tracking-widest">Đang chọn ảnh từ Album...</span>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => removeVariant(idx)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="col-span-2 md:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Mã tùy chọn SKU</label>
                        <Input 
                          value={variant.sku} 
                          onChange={e => updateVariant(idx, 'sku', e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Hương vị</label>
                        <Input 
                          placeholder="VD: Socola" 
                          value={variant.colorCode || ''} 
                          onChange={e => updateVariant(idx, 'colorCode', e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Kích thước (Size)</label>
                        <Input 
                          placeholder="VD: 20cm" 
                          value={variant.size || ''} 
                          onChange={e => updateVariant(idx, 'size', e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Giá bán (VND)</label>
                        <Input 
                          type="number" 
                          value={variant.price} 
                          onChange={e => updateVariant(idx, 'price', Number(e.target.value))}
                          className="h-9 text-xs font-bold text-amber-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Ảnh minh họa</label>
                        <div className="flex gap-1.5 h-9">
                          <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {variant.thumbnailUrl ? (
                              <img src={getFullImageUrl(variant.thumbnailUrl)} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-slate-300" size={16} />
                            )}
                          </div>
                          <Button 
                            type="button"
                            variant={selectingImageForVariant === idx ? 'default' : 'outline'}
                            className="flex-1 h-9 px-2 text-[10px] font-bold"
                            onClick={() => setSelectingImageForVariant(selectingImageForVariant === idx ? null : idx)}
                          >
                            {selectingImageForVariant === idx ? 'XONG' : 'GẮN ẢNH'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
                  <ImageIcon size={28} className="mx-auto mb-2 opacity-30 text-amber-700" />
                  <p className="text-xs font-medium">Chưa có kích thước/hương vị riêng. Bánh sẽ dùng giá tham khảo mặc định.</p>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <Layers size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Mô tả & Hướng dẫn bảo quản</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mô tả ngắn (Hiển thị ở trang danh sách bánh)</label>
                <textarea 
                  className="flex min-h-[60px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  placeholder="Nhập mô tả ngắn gọn thu hút khách hàng..."
                  value={formData.shortDescription}
                  onChange={e => setFormData({...formData, shortDescription: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mô tả chi tiết & Thành phần bánh (Hỗ trợ HTML)</label>
                <textarea 
                  className="flex min-h-[140px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-sans"
                  placeholder="Nhập chi tiết về thành phần nguyên liệu, cách bảo quản..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 z-10 -mx-1">
            <Button type="button" variant="outline" size="lg" onClick={onClose} className="rounded-xl px-8">Hủy</Button>
            <Button 
              type="submit" 
              size="lg" 
              disabled={loading} 
              className="rounded-xl px-10 bg-amber-900 hover:bg-amber-950 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save size={18} />
                  <span>{product ? 'Cập nhật mẫu bánh' : 'Lưu mẫu bánh'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
