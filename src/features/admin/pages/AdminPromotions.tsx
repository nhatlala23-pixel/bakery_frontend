import { useState, useEffect } from 'react';
import { Search, Plus, Tags, Calendar, Edit2, Trash2 } from 'lucide-react';
import { PromotionModal } from '../components/PromotionModal';
import promotionService, { type PromotionResponse } from '@/services/api/promotionService';

export const AdminPromotions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);

  const fetchPromotions = async () => {
    try {
      const data = await promotionService.getAllPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      try {
        await promotionService.deletePromotion(id);
        fetchPromotions();
      } catch (error) {
        console.error('Failed to delete promotion:', error);
      }
    }
  };

  const filteredPromotions = promotions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chiến dịch Khuyến mãi</h1>
          <p className="text-gray-500 text-sm">Tạo và quản lý các chương trình giảm giá cho sản phẩm</p>
        </div>
        <button 
          onClick={() => {
            setSelectedPromotion(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all font-bold text-sm shadow-lg shadow-black/10"
        >
          <Plus className="w-5 h-5" />
          Tạo khuyến mãi mới
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black/5"
          placeholder="Tìm kiếm khuyến mãi..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Promotion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromotions.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
            {searchTerm ? 'Không tìm thấy khuyến mãi nào khớp' : 'Chưa có chiến dịch khuyến mãi nào'}
          </div>
        ) : (
          filteredPromotions.map((promo) => (
            <div key={promo.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-black/5 transition-all">
              <div className={`p-6 ${
                promo.status === 1 ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                    <Tags className={`w-6 h-6 ${
                      promo.status === 1 ? 'text-green-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    promo.status === 1 ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                  }`}>
                    {promo.status === 1 ? 'Đang chạy' : 'Tạm ngưng'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1">{promo.name}</h3>
                <div className="text-2xl font-black text-red-500">
                  -{promo.discountValue.toLocaleString()}{promo.discountType === 'PERCENTAGE' ? '%' : 'đ'}
                </div>
              </div>
              
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Hạn: {promo.startDate?.split('T')[0]} - {promo.endDate?.split('T')[0]}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedPromotion(promo);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(promo.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {promo.products?.length || 0} sản phẩm áp dụng
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <PromotionModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPromotion(null);
        }}
        onSuccess={fetchPromotions}
        promotion={selectedPromotion}
      />
    </div>
  );
};
