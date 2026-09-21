import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ImageIcon, CheckCircle, XCircle, Upload, Layers } from 'lucide-react';
import collectionService, { type CollectionDTO } from '@/services/api/collectionService';
import productService, { type ProductResponse } from '@/services/api/productService';
import axiosClient from '@/services/api/axiosClient';
import { getFullImageUrl } from '@/utils/image';
import { Modal } from '@/components/ui/Modal';

export const AdminCollections = () => {
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<CollectionDTO | null>(null);
  const [allProducts, setAllProducts] = useState<ProductResponse[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CollectionDTO>({
    name: '',
    slug: '',
    description: '',
    thumbnail: '',
    active: true,
    productIds: [],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [colsData, prodsData] = await Promise.all([
        collectionService.getAllCollectionsForAdmin(),
        productService.getAllProducts(0, 100)
      ]);
      setCollections(colsData || []);
      setAllProducts(prodsData.content || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const convertToSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleOpenModal = (col?: CollectionDTO) => {
    if (col) {
      setSelectedCollection(col);
      setFormData({
        name: col.name,
        slug: col.slug,
        description: col.description || '',
        thumbnail: col.thumbnail || '',
        active: col.active ?? true,
        productIds: col.productIds || (col.products ? col.products.map(p => p.id) : []),
      });
    } else {
      setSelectedCollection(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        thumbnail: '',
        active: true,
        productIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = convertToSlug(name);
    setFormData(prev => ({ ...prev, name, slug }));
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
      setFormData(prev => ({ ...prev, thumbnail: url }));
    } catch (error) {
      alert('Tải ảnh thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCollection?.id) {
        await collectionService.updateCollection(selectedCollection.id, formData);
      } else {
        await collectionService.createCollection(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      alert('Lưu bộ sưu tập thất bại!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ sưu tập này?')) return;
    try {
      await collectionService.deleteCollection(id);
      loadData();
    } catch (error) {
      alert('Xóa bộ sưu tập thất bại!');
    }
  };

  const toggleProductId = (id: number) => {
    setFormData(prev => {
      const currentIds = prev.productIds || [];
      if (currentIds.includes(id)) {
        return { ...prev, productIds: currentIds.filter(item => item !== id) };
      } else {
        return { ...prev, productIds: [...currentIds, id] };
      }
    });
  };

  const filtered = collections.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-amber-950 tracking-tight">Quản Lý Bộ Sưu Tập Bánh</h1>
          <p className="text-xs font-semibold text-amber-900/60">Tạo các bộ sưu tập mẫu bánh ấn tượng theo chủ đề, sự kiện hay mùa lễ</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-amber-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-amber-950 transition-all shadow-md w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm bộ sưu tập mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Tìm kiếm bộ sưu tập theo tên hoặc slug..."
          className="w-full text-sm outline-none bg-transparent"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid Collections */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Đang tải dữ liệu bộ sưu tập...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          Chưa có bộ sưu tập nào. Nhấn "Thêm bộ sưu tập mới" để bắt đầu!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(col => (
            <div key={col.id} className="bg-white rounded-2xl border border-amber-100/80 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-amber-50 overflow-hidden border-b border-amber-100">
                {col.thumbnail ? (
                  <img 
                    src={getFullImageUrl(col.thumbnail)} 
                    alt={col.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-600/40">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-xs font-bold">Chưa có ảnh bìa</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm ${
                    col.active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                  }`}>
                    {col.active ? 'Hoạt động' : 'Tạm ẩn'}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{col.name}</h3>
                  <code className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono block w-fit mb-3">
                    /{col.slug}
                  </code>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                    {col.description || 'Chưa có mô tả cho bộ sưu tập này.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {(col.productIds?.length || col.products?.length || 0)} mẫu bánh
                  </span>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(col)}
                      className="p-2 text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => col.id && handleDelete(col.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCollection ? `Chỉnh sửa Bộ Sưu Tập #${selectedCollection.id}` : 'Thêm Bộ Sưu Tập Mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Tên Bộ Sưu Tập</label>
            <input 
              required
              placeholder="VD: Bộ Sưu Tập Bánh Sinh Nhật Mùa Hè"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.name}
              onChange={e => handleNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Slug</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>

          {/* Upload Ảnh */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Ảnh Bìa Bộ Sưu Tập</label>
            <div className="flex items-center gap-4 p-3 bg-amber-50/40 rounded-xl border border-amber-100">
              {formData.thumbnail ? (
                <img 
                  src={getFullImageUrl(formData.thumbnail)} 
                  alt="Thumbnail" 
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
                  <span>{uploading ? 'Đang tải...' : 'Tải ảnh bìa'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <input 
                  type="text" 
                  placeholder="Hoặc nhập URL ảnh..."
                  className="w-full px-3 py-1 bg-white border border-slate-200 rounded-md text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  value={formData.thumbnail || ''}
                  onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Mô Tả Bộ Sưu Tập</label>
            <textarea 
              rows={2}
              placeholder="Giới thiệu tóm tắt nét đặc biệt của bộ sưu tập..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Trạng thái */}
          <div className="flex items-center gap-3 pt-1">
            <input 
              type="checkbox"
              id="colActive"
              className="w-4 h-4 accent-amber-900 rounded"
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
            />
            <label htmlFor="colActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              Kích hoạt (Hiển thị ra ngoài giao diện)
            </label>
          </div>

          {/* Danh sách Mẫu Bánh thuộc Bộ Sưu Tập */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold uppercase text-slate-700 block">
              Gắn mẫu bánh vào bộ sưu tập ({formData.productIds?.length || 0} đã chọn)
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1 custom-scrollbar">
              {allProducts.map(p => {
                const isSelected = formData.productIds?.includes(p.id);
                return (
                  <div 
                    key={p.id}
                    onClick={() => toggleProductId(p.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isSelected ? 'bg-amber-100/70 border border-amber-300 font-bold text-amber-950' : 'bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="line-clamp-1">{p.productName} (#{p.id})</span>
                    {isSelected ? <CheckCircle className="w-4 h-4 text-amber-900 shrink-0" /> : <div className="w-4 h-4 shrink-0" />}
                  </div>
                );
              })}
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
              {selectedCollection ? 'Cập Nhật Bộ Sưu Tập' : 'Tạo Bộ Sưu Tập Mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
