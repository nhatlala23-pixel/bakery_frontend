import { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Upload, Globe, Tag, FileText, Image as ImageIcon, Building2, Save, X } from 'lucide-react';
import axiosClient from '@/services/api/axiosClient';
import brandService, { type BrandRequest, type BrandDTO } from '../../../services/api/brandService';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  brand?: BrandDTO | null;
}

const generateSlug = (str: string) =>
  str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const BrandModal = ({ isOpen, onClose, onSuccess, brand }: BrandModalProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<BrandRequest>({
    brandName: '',
    slug: '',
    country: '',
    logoUrl: '',
    description: '',
    status: 1,
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        brandName: brand.brandName,
        slug: brand.slug,
        country: brand.country || '',
        logoUrl: brand.logoUrl || '',
        description: brand.description || '',
        status: brand.status,
      });
    } else {
      setFormData({ brandName: '', slug: '', country: '', logoUrl: '', description: '', status: 1 });
    }
  }, [brand, isOpen]);

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      brandName: name,
      slug: brand ? prev.slug : generateSlug(name),
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    setUploading(true);
    try {
      const response: any = await axiosClient.post('/upload', data);
      setFormData(prev => ({ ...prev, logoUrl: response.url }));
    } catch {
      alert('Tải ảnh logo thất bại!');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (brand) {
        await brandService.updateBrand(brand.id, formData);
      } else {
        await brandService.createBrand(formData);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Lưu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={brand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Logo Upload Section ─────────────────────────── */}
        <div className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700">
          {/* Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group overflow-hidden shadow-sm"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : formData.logoUrl ? (
              <>
                <img src={getFullImageUrl(formData.logoUrl)} alt="Logo" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="w-5 h-5 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-300">
                <ImageIcon size={28} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Logo</span>
              </div>
            )}
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleLogoUpload} />
          </div>

          {/* URL input + hint */}
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={13} /> Logo thương hiệu
            </label>
            <div className="relative">
              <input
                placeholder="Hoặc dán link ảnh logo vào đây..."
                value={formData.logoUrl}
                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Nhấn vào ô vuông để tải ảnh lên, hoặc dán link URL trực tiếp.</p>
          </div>
        </div>

        {/* ── Basic Info ──────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Building2 size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider">Thông tin cơ bản</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-0.5">
                Tên thương hiệu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  placeholder="VD: Apple, Samsung..."
                  value={formData.brandName}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-0.5">Quốc gia</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="VD: Mỹ, Hàn Quốc..."
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-0.5 flex items-center gap-1.5">
              Slug (URL) <span className="text-rose-500">*</span>
              <span className="text-[9px] normal-case text-slate-400 font-normal">(tự động tạo theo tên)</span>
            </label>
            <input
              required
              placeholder="vd: apple, samsung..."
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-600"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-0.5">Trạng thái</label>
            <div className="flex gap-3">
              {[{ value: 1, label: '✅ Hiển thị' }, { value: 0, label: '🚫 Ẩn' }].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: opt.value })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    formData.status === opt.value
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Description ─────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <FileText size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider">Mô tả thương hiệu</h3>
          </div>
          <textarea
            rows={3}
            placeholder="Giới thiệu ngắn về thương hiệu (lịch sử, xuất xứ, định vị...)..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
          />
        </div>

        {/* ── Footer Actions ───────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
            ) : (
              <><Save size={16} /> {brand ? 'Cập nhật' : 'Thêm thương hiệu'}</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
