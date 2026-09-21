import { useState, useEffect } from 'react';
import { X, Tags, Percent, DollarSign, Search } from 'lucide-react';
import productService, { type ProductResponse } from '@/services/api/productService';
import promotionService from '@/services/api/promotionService';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promotion?: any;
}

export const PromotionModal = ({ isOpen, onClose, onSuccess, promotion }: PromotionModalProps) => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    startDate: '',
    endDate: '',
    status: 1,
    productIds: [] as number[]
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts(0, 1000); // Lấy nhiều sản phẩm để chọn
        setProducts(response.content || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      }
    };
    if (isOpen) fetchProducts();
  }, [isOpen]);

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name || '',
        discountType: promotion.discountType || 'PERCENTAGE',
        discountValue: promotion.discountValue || 0,
        startDate: promotion.startDate?.split('T')[0] || '',
        endDate: promotion.endDate?.split('T')[0] || '',
        status: promotion.status ?? 1,
        productIds: promotion.productIds || []
      });
    } else {
      setFormData({
        name: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        startDate: '',
        endDate: '',
        status: 1,
        productIds: []
      });
    }
  }, [promotion, isOpen]);

  const toggleProduct = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }));
  };

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Backend expects LocalDateTime so append time
      const payload = {
        ...formData,
        startDate: formData.startDate + 'T00:00:00',
        endDate: formData.endDate + 'T23:59:59',
      };
      
      if (promotion) {
        await promotionService.updatePromotion(promotion.id, payload);
      } else {
        await promotionService.createPromotion(payload);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save promotion:', error);
      alert('Có lỗi xảy ra khi lưu khuyến mãi.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Tags className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900">
              {promotion ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi mới'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Tên chương trình</label>
              <input 
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm"
                placeholder="VD: Siêu sale mùa hè"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Loại giảm giá</label>
                <select 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm"
                  value={formData.discountType}
                  onChange={e => setFormData({...formData, discountType: e.target.value})}
                >
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Giá trị giảm</label>
                <div className="relative">
                  <input 
                    type="number"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm"
                    value={formData.discountValue}
                    onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {formData.discountType === 'PERCENTAGE' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Ngày bắt đầu</label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Ngày kết thúc</label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm"
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Trạng thái</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm"
                value={formData.status}
                onChange={e => setFormData({...formData, status: Number(e.target.value)})}
              >
                <option value={1}>Kích hoạt</option>
                <option value={0}>Tạm ngưng</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col border-l border-gray-100 pl-6 h-full">
            <label className="text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
              <span>Sản phẩm áp dụng ({formData.productIds.length})</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Danh sách</span>
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-black/5"
                placeholder="Tìm sản phẩm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[300px]">
              {filteredProducts.map(p => (
                <label key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded-lg border-gray-300 text-black focus:ring-black"
                    checked={formData.productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <img src={p.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{p.productName}</p>
                    <p className="text-[10px] text-gray-500">{p.salePrice.toLocaleString()}đ</p>
                  </div>
                </label>
              ))}
            </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors text-sm"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 text-sm"
            >
              {promotion ? 'Lưu' : 'Tạo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
