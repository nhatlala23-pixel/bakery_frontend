import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Link as LinkIcon, Upload, Trash2 } from 'lucide-react';
import axiosClient from '@/services/api/axiosClient';
import bannerService from '@/services/api/bannerService';
import categoryService, { type CategoryDTO } from '@/services/api/categoryService';
import brandService, { type BrandDTO } from '@/services/api/brandService';
import productService from '@/services/api/productService';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  banner?: any;
}

export const BannerModal = ({ isOpen, onClose, onSuccess, banner }: BannerModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    sortOrder: 0,
    status: 1
  });
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [linkType, setLinkType] = useState('custom'); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, brandData, prodData] = await Promise.all([
          categoryService.getAllCategoriesList(),
          brandService.getAllBrandsList(),
          productService.getAllProducts(0, 100)
        ]);
        setCategories(catData.filter(c => c.status === 1));
        setBrands(brandData.filter(b => b.status === 1));
        setProducts(prodData.content.filter((p: any) => p.status === 1));
      } catch (error) {
        console.error('Failed to fetch modal data:', error);
      }
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        imageUrl: banner.imageUrl || '',
        linkUrl: banner.linkUrl || '',
        sortOrder: banner.sortOrder || 0,
        status: banner.status ?? 1
      });
      
      // Xác định linkType dựa trên linkUrl hiện tại
      if (banner.linkUrl === '/') setLinkType('home');
      else if (banner.linkUrl?.startsWith('/category/')) setLinkType('category');
      else if (banner.linkUrl?.startsWith('/brand/')) setLinkType('brand');
      else if (banner.linkUrl?.startsWith('/product/')) setLinkType('product');
      else setLinkType('custom');

    } else {
      setFormData({
        title: '',
        imageUrl: '',
        linkUrl: '',
        sortOrder: 0,
        status: 1
      });
      setLinkType('custom');
    }
  }, [banner, isOpen]);

  const handleLinkTypeChange = (type: string) => {
    setLinkType(type);
    if (type === 'home') setFormData({...formData, linkUrl: '/'});
    else if (type === 'category') setFormData({...formData, linkUrl: '/category/'});
    else if (type === 'brand') setFormData({...formData, linkUrl: '/brand/'});
    else if (type === 'product') setFormData({...formData, linkUrl: '/product/'});
    else if (type === 'custom') setFormData({...formData, linkUrl: ''});
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setUploading(true);
    try {
      const response: any = await axiosClient.post('/upload', uploadData);
      setFormData(prev => ({ ...prev, imageUrl: response.url }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Không thể upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (banner) {
        await bannerService.updateBanner(banner.id, formData);
      } else {
        await bannerService.createBanner(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save banner:', error);
      alert('Có lỗi xảy ra khi lưu Banner.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900">
              {banner ? 'Cập nhật Banner' : 'Thêm Banner mới'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Hình ảnh Banner</label>
            <div className="relative group aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 overflow-hidden flex flex-col items-center justify-center transition-all hover:border-black/10">
              {formData.imageUrl ? (
                <>
                  <img src={formData.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="p-2 bg-white rounded-full cursor-pointer hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-black" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, imageUrl: ''})}
                      className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer p-8">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-sm font-bold text-gray-500">
                    {uploading ? 'Đang tải lên...' : 'Nhấn để tải ảnh lên'}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Tiêu đề Banner</label>
            <input 
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
              placeholder="VD: Flash Sale - Giảm tới 50%"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <label className="text-sm font-bold text-gray-700 block">Link liên kết</label>
            
            <div className="grid grid-cols-5 gap-1.5">
              {['home', 'category', 'brand', 'product', 'custom'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleLinkTypeChange(type)}
                  className={`py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border ${
                    linkType === type 
                    ? 'bg-black text-white border-black shadow-md' 
                    : 'bg-white text-gray-400 border-gray-100 hover:text-gray-900 hover:border-gray-200'
                  }`}
                >
                  {type === 'home' ? 'Home' : type === 'category' ? 'D.Mục' : type === 'brand' ? 'Hãng' : type === 'product' ? 'S.Phẩm' : 'Tùy biến'}
                </button>
              ))}
            </div>

            {linkType === 'product' && (
              <select 
                className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm font-bold"
                value={formData.linkUrl.replace('/product/', '')}
                onChange={e => setFormData({...formData, linkUrl: `/product/${e.target.value}`})}
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.slug}>{p.productName}</option>
                ))}
              </select>
            )}

            {linkType === 'category' && (
              <select 
                className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm font-bold"
                value={formData.linkUrl.replace('/category/', '')}
                onChange={e => setFormData({...formData, linkUrl: `/category/${e.target.value}`})}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.categoryName}</option>
                ))}
              </select>
            )}

            {linkType === 'brand' && (
              <select 
                className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm font-bold"
                value={formData.linkUrl.replace('/brand/', '')}
                onChange={e => setFormData({...formData, linkUrl: `/brand/${e.target.value}`})}
              >
                <option value="">-- Chọn thương hiệu --</option>
                {brands.map(b => (
                  <option key={b.id} value={b.slug}>{b.brandName}</option>
                ))}
              </select>
            )}

            {linkType === 'custom' && (
              <div className="relative">
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm font-bold"
                  placeholder="VD: /promo-iphone-15"
                  value={formData.linkUrl}
                  onChange={e => setFormData({...formData, linkUrl: e.target.value})}
                />
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            )}

            {linkType === 'home' && (
              <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-400 italic">
                Link sẽ trỏ về trang chủ (/)
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Thứ tự</label>
              <input 
                type="number"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                value={formData.sortOrder}
                onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Trạng thái</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                value={formData.status}
                onChange={e => setFormData({...formData, status: Number(e.target.value)})}
              >
                <option value={1}>Hiện thị</option>
                <option value={0}>Ẩn</option>
              </select>
            </div>
          </div>

          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={uploading}
              className="px-8 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
            >
              {banner ? 'Lưu thay đổi' : 'Thêm Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
