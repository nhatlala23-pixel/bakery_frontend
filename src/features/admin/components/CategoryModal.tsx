import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import categoryService, { type CategoryRequest, type CategoryDTO } from '../../../services/api/categoryService';
import axiosClient from '../../../services/api/axiosClient';
import { getFullImageUrl } from '../../../utils/image';
import { Image as ImageIcon, Upload, Trash2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: CategoryDTO | null;
}

export const CategoryModal = ({ isOpen, onClose, onSuccess, category }: CategoryModalProps) => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<CategoryRequest>({
    categoryName: '',
    slug: '',
    parentId: undefined,
    description: '',
    image: '',
    status: 1,
  });

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

  const handleNameChange = (name: string) => {
    const slug = convertToSlug(name);
    setFormData({ ...formData, categoryName: name, slug });
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
      setFormData(prev => ({ ...prev, image: url }));
    } catch (error) {
      alert('Tải ảnh danh mục thất bại. Vui lòng thử lại!');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await categoryService.getAllCategoriesList();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    if (isOpen) fetchCats();
  }, [isOpen]);

  useEffect(() => {
    if (category) {
      setFormData({
        categoryName: category.categoryName,
        slug: category.slug,
        parentId: category.parentId,
        description: category.description || '',
        image: category.image || '',
        status: category.status,
      });
    } else {
      setFormData({
        categoryName: '',
        slug: '',
        parentId: undefined,
        description: '',
        image: '',
        status: 1,
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (category) {
        await categoryService.updateCategory(category.id, formData);
      } else {
        await categoryService.createCategory(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert('Lưu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={category ? `Chỉnh sửa danh mục (ID: #${category.id})` : 'Thêm danh mục bánh mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Tên danh mục bánh</label>
          <input 
            required
            placeholder="Ví dụ: Bánh Kem Sinh Nhật, Bánh Mỳ Sweet..."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-semibold"
            value={formData.categoryName}
            onChange={e => handleNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Đường dẫn thân thiện (Slug)</label>
          <input 
            required
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs font-mono"
            value={formData.slug}
            onChange={e => setFormData({...formData, slug: e.target.value})}
          />
        </div>

        {/* Ảnh đại diện danh mục */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Ảnh đại diện danh mục</label>
          <div className="flex items-start gap-4 p-3 bg-amber-50/40 rounded-2xl border border-amber-100">
            {formData.image ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-amber-200 bg-white flex-shrink-0 group">
                <img src={getFullImageUrl(formData.image)} alt="Category preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa ảnh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-amber-200 bg-white flex flex-col items-center justify-center text-amber-500 flex-shrink-0">
                <ImageIcon className="w-6 h-6 mb-1 opacity-60" />
                <span className="text-[10px] font-bold">Chưa có ảnh</span>
              </div>
            )}

            <div className="flex-1 space-y-2">
              <label className="flex items-center gap-2 px-3 py-2 bg-amber-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-950 transition-colors w-fit shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Đang tải ảnh lên...' : 'Tải ảnh đại diện'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  disabled={uploading}
                  onChange={handleImageUpload}
                />
              </label>
              
              <input 
                type="text" 
                placeholder="Hoặc dán URL đường dẫn ảnh tại đây..."
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500"
                value={formData.image || ''}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Danh mục cha (Tùy chọn)</label>
          <select 
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
            value={formData.parentId || ''}
            onChange={e => setFormData({...formData, parentId: Number(e.target.value) || undefined})}
          >
            <option value="">Danh mục gốc (Cha)</option>
            {categories.filter(c => c.id !== category?.id).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Mô tả ngắn danh mục</label>
          <textarea 
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
            rows={2}
            placeholder="Mô tả tóm tắt về nhóm bánh này..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Trạng thái</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="status" 
                checked={formData.status === 1}
                onChange={() => setFormData({...formData, status: 1})}
                className="w-4 h-4 accent-amber-900"
              />
              <span className="text-sm font-semibold">Hoạt động (Hiển thị)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="status" 
                checked={formData.status === 0}
                onChange={() => setFormData({...formData, status: 0})}
                className="w-4 h-4 accent-amber-900"
              />
              <span className="text-sm font-semibold text-gray-500">Tạm ẩn</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-xs text-gray-700 hover:bg-gray-50 transition-all"
          >
            Hủy
          </button>
          <button 
            type="submit"
            disabled={loading || uploading}
            className="px-8 py-2.5 rounded-xl bg-amber-900 text-white font-bold text-xs hover:bg-amber-950 transition-all disabled:opacity-50 shadow-md"
          >
            {loading ? 'Đang lưu...' : (category ? 'Cập nhật danh mục' : 'Thêm danh mục mới')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
