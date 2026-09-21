import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ExternalLink, Search } from 'lucide-react';
import { BannerModal } from '../components/BannerModal';
import bannerService, { type BannerResponse } from '@/services/api/bannerService';
import { getFullImageUrl } from '@/utils/image';

export const AdminBanners = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBanners = banners.filter(banner => 
    banner.title.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const fetchBanners = async () => {
    try {
      const data = await bannerService.getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa Banner này?')) {
      try {
        await bannerService.deleteBanner(id);
        fetchBanners();
      } catch (error) {
        console.error('Failed to delete banner:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Banner</h1>
          <p className="text-gray-500 text-sm">Quản lý hình ảnh quảng cáo và slide trên trang chủ</p>
        </div>
        <button 
          onClick={() => {
            setSelectedBanner(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all font-bold text-sm shadow-lg shadow-black/10"
        >
          <Plus className="w-5 h-5" />
          Thêm Banner mới
        </button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Tìm kiếm banner..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black/5"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredBanners.length === 0 ? (
          <div className="py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
            {searchTerm ? 'Không tìm thấy banner nào khớp' : 'Chưa có banner nào'}
          </div>
        ) : (
          filteredBanners.sort((a,b) => a.sortOrder - b.sortOrder).map((banner) => (
            <div key={banner.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-xl hover:shadow-black/5 transition-all">
              <div className="md:w-1/3 h-48 md:h-auto overflow-hidden relative">
                <img 
                  src={getFullImageUrl(banner.imageUrl)} 
                  alt={banner.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                    banner.status === 1 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {banner.status === 1 ? 'Đang hiển thị' : 'Đang ẩn'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-500 uppercase mb-1">Thứ tự: {banner.sortOrder}</div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">{banner.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ExternalLink className="w-4 h-4" />
                    <span>Link: {banner.linkUrl}</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setSelectedBanner(banner);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-gray-50 text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(banner.id)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BannerModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBanner(null);
        }}
        onSuccess={fetchBanners}
        banner={selectedBanner}
      />
    </div>
  );
};
