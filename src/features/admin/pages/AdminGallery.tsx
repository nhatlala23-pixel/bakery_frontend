import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ImageIcon, Upload, Eye, Tag } from 'lucide-react';
import galleryService, { type GalleryDTO } from '@/services/api/galleryService';
import axiosClient from '@/services/api/axiosClient';
import { getFullImageUrl } from '@/utils/image';
import { Modal } from '@/components/ui/Modal';

const CATEGORY_MAP: Record<string, string> = {
  PRODUCT: 'Mẫu bánh đẹp',
  STORE: 'Không gian tiệm',
  KITCHEN: 'Góc làm bánh',
  EVENT: 'Sự kiện & Tiệc',
  CUSTOMER: 'Khách hàng check-in',
};

export const AdminGallery = () => {
  const [galleries, setGalleries] = useState<GalleryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<GalleryDTO | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<GalleryDTO>({
    title: '',
    imageUrl: '',
    category: 'PRODUCT',
    displayOrder: 1,
    active: true,
  });

  const loadGalleries = async () => {
    setLoading(true);
    try {
      const res = await galleryService.getAllGalleriesForAdmin();
      setGalleries(res || []);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleries();
  }, []);

  const handleOpenModal = (item?: GalleryDTO) => {
    if (item) {
      setSelectedGallery(item);
      setFormData({
        title: item.title,
        imageUrl: item.imageUrl,
        category: item.category || 'PRODUCT',
        displayOrder: item.displayOrder ?? 1,
        active: item.active ?? true,
      });
    } else {
      setSelectedGallery(null);
      setFormData({
        title: '',
        imageUrl: '',
        category: 'PRODUCT',
        displayOrder: galleries.length + 1,
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append('file', file);

    setUploading(true);
    try {
      const res: any = await axiosClient.post('/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.url || res;
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      alert('Tải ảnh thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      alert('Vui lòng chọn hoặc tải tệp ảnh!');
      return;
    }
    try {
      if (selectedGallery?.id) {
        await galleryService.updateGallery(selectedGallery.id, formData);
      } else {
        await galleryService.createGallery(formData);
      }
      setIsModalOpen(false);
      loadGalleries();
    } catch (error) {
      alert('Lưu ảnh vào thư viện thất bại!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi thư viện?')) return;
    try {
      await galleryService.deleteGallery(id);
      loadGalleries();
    } catch (error) {
      alert('Xóa ảnh thất bại!');
    }
  };

  const filtered = filterCategory === 'ALL' 
    ? galleries 
    : galleries.filter(g => g.category === filterCategory);

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-amber-950 tracking-tight">Quản Lý Thư Viện Ảnh Thương Hiệu</h1>
          <p className="text-xs font-semibold text-amber-900/60">Bộ sưu tập hình ảnh không gian cửa hàng, góc bếp nướng bánh và ảnh khoảnh khắc đẹp</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-amber-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-amber-950 transition-all shadow-md w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm ảnh mới</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm">
        <button
          onClick={() => setFilterCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            filterCategory === 'ALL' ? 'bg-amber-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả ảnh ({galleries.length})
        </button>
        {Object.keys(CATEGORY_MAP).map(key => (
          <button
            key={key}
            onClick={() => setFilterCategory(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              filterCategory === key ? 'bg-amber-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {CATEGORY_MAP[key]} ({galleries.filter(g => g.category === key).length})
          </button>
        ))}
      </div>

      {/* Photo Gallery Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Đang tải thư viện ảnh...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          Chưa có hình ảnh nào trong mục này. Nhấn "Thêm ảnh mới" để tải lên!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-amber-100/80 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="relative aspect-square bg-amber-50 overflow-hidden">
                <img 
                  src={getFullImageUrl(item.imageUrl)} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2">
                  <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {CATEGORY_MAP[item.category || 'PRODUCT'] || item.category}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                    item.active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                  }`}>
                    {item.active ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </div>
              </div>

              <div className="p-4 flex flex-col justify-between flex-1">
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-3">{item.title || 'Ảnh không tên'}</h4>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Thứ tự: #{item.displayOrder ?? 0}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => item.id && handleDelete(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Gallery Image */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGallery ? `Chỉnh sửa ảnh #${selectedGallery.id}` : 'Thêm Ảnh Mới Vào Thư Viện'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Têu đề / Chú thích ảnh</label>
            <input 
              required
              placeholder="VD: Không gian trưng bày bánh kem tầng 1"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Phân loại ảnh</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as any })}
            >
              {Object.keys(CATEGORY_MAP).map(key => (
                <option key={key} value={key}>{CATEGORY_MAP[key]}</option>
              ))}
            </select>
          </div>

          {/* Upload Ảnh */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Tệp hình ảnh</label>
            <div className="flex items-center gap-4 p-3 bg-amber-50/40 rounded-xl border border-amber-100">
              {formData.imageUrl ? (
                <img 
                  src={getFullImageUrl(formData.imageUrl)} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-lg border border-amber-200 bg-white shrink-0" 
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-amber-200 bg-white flex flex-col items-center justify-center text-amber-500 shrink-0">
                  <ImageIcon className="w-5 h-5 opacity-60" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-amber-900 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-950 transition-colors w-fit">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Đang tải...' : 'Tải ảnh lên'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <input 
                  type="text" 
                  placeholder="Hoặc dán URL ảnh tại đây..."
                  className="w-full px-3 py-1 bg-white border border-slate-200 rounded-md text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-700">Thứ tự hiển thị</label>
              <input 
                type="number"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                value={formData.displayOrder || 1}
                onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-1 flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  className="w-4 h-4 accent-amber-900 rounded"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                />
                <span className="text-xs font-bold text-slate-700">Hiển thị trong thư viện</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={uploading}
              className="px-6 py-2 rounded-xl bg-amber-900 text-white font-bold text-xs hover:bg-amber-950 transition-all shadow-md disabled:opacity-50"
            >
              {selectedGallery ? 'Cập Nhật Ảnh' : 'Thêm Vào Thư Viện'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
