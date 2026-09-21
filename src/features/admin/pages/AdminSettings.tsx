import { useState, useEffect } from 'react';
import { Upload, Save, Loader2, Image as ImageIcon, Store, Phone, Mail, MapPin, Globe, Clock, CheckCircle } from 'lucide-react';
import contactSettingService, { type ContactSettingDTO } from '@/services/api/contactSettingService';
import axiosClient from '@/services/api/axiosClient';

export const AdminSettings = () => {
  const [formData, setFormData] = useState<ContactSettingDTO>({
    zaloUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    hotline: '',
    email: '',
    address: '',
    googleMaps: '',
    openingHours: '',
    logoUrl: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getFullImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await contactSettingService.getContactSetting();
        if (data) {
          setFormData(data);
        }
      } catch (error) {
        console.error('Failed to fetch contact settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const response = await axiosClient.post<{ url: string }>('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.url) {
        const updatedData = { ...formData, logoUrl: response.url };
        setFormData(updatedData);
        await contactSettingService.updateContactSetting(updatedData);
        window.dispatchEvent(new Event('logoUpdate'));
        setToastMessage('Tải ảnh Logo thành công & đã tự động lưu!');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (error) {
      console.error('Upload logo failed:', error);
      alert('Tải ảnh Logo thất bại, vui lòng thử lại.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await contactSettingService.updateContactSetting(formData);
      window.dispatchEvent(new Event('logoUpdate'));
      setToastMessage('Cập nhật thông tin cửa hàng thành công!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Cập nhật thất bại, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl font-medium text-sm animate-in slide-in-from-top-2">
          <CheckCircle size={18} />
          {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark tracking-tight">Cấu Hình Thương Hiệu & Logo</h1>
          <p className="text-brand-muted text-sm mt-1">Tải lên Logo, cập nhật Hotline, địa chỉ và kênh liên hệ Zalo / Fanpage.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Logo Box */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-secondary space-y-4">
          <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-accent" />
            Logo Tiệm Bánh
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-brand-secondary bg-brand-light flex items-center justify-center overflow-hidden relative group shrink-0">
              {formData.logoUrl ? (
                <img
                  src={getFullImageUrl(formData.logoUrl)}
                  alt="Logo Gấu Bakery"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Store className="w-12 h-12 text-brand-muted" />
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 text-center sm:text-left">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-brand-accent/90 transition-all shadow-sm">
                <Upload className="w-4 h-4" />
                {uploadingLogo ? 'Đang tải lên...' : 'Tải ảnh Logo mới'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-brand-muted">
                Khuyên dùng ảnh PNG trong suốt hoặc JPG hình vuông/tròn (Dung lượng &lt; 5MB).
              </p>
              {formData.logoUrl && (
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-brand-light border border-brand-secondary rounded-xl text-xs text-brand-muted font-mono"
                  placeholder="Đường dẫn URL Logo"
                />
              )}
            </div>
          </div>
        </div>

        {/* General Store Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-secondary space-y-4">
          <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
            <Store className="w-5 h-5 text-brand-accent" />
            Thông Tin Tiệm Bánh
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-brand-muted" /> Hotline / Điện thoại
              </label>
              <input
                type="text"
                value={formData.hotline || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hotline: e.target.value }))}
                className="w-full px-4 py-3 bg-brand-light/50 border border-brand-secondary rounded-xl text-sm font-medium focus:outline-none focus:border-brand-accent"
                placeholder="0987654321"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-brand-muted" /> Email liên hệ
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-brand-light/50 border border-brand-secondary rounded-xl text-sm font-medium focus:outline-none focus:border-brand-accent"
                placeholder="contact@gaubakery.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-muted" /> Địa chỉ tiệm bánh
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 bg-brand-light/50 border border-brand-secondary rounded-xl text-sm font-medium focus:outline-none focus:border-brand-accent"
                placeholder="123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-muted" /> Giờ mở cửa
              </label>
              <input
                type="text"
                value={formData.openingHours || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, openingHours: e.target.value }))}
                className="w-full px-4 py-3 bg-brand-light/50 border border-brand-secondary rounded-xl text-sm font-medium focus:outline-none focus:border-brand-accent"
                placeholder="08:00 - 22:00 (Mỗi ngày)"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-secondary space-y-4">
          <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-accent" />
            Liên Kết Mạng Xã Hội (Zalo / Facebook)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Đường dẫn Zalo</label>
              <input
                type="text"
                value={formData.zaloUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, zaloUrl: e.target.value }))}
                className="w-full px-4 py-3 bg-brand-light/50 border border-brand-secondary rounded-xl text-sm font-medium focus:outline-none focus:border-brand-accent"
                placeholder="https://zalo.me/0987654321"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Đường dẫn Facebook</label>
              <input
                type="text"
                value={formData.facebookUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                className="w-full px-4 py-3 bg-brand-light/50 border border-brand-secondary rounded-xl text-sm font-medium focus:outline-none focus:border-brand-accent"
                placeholder="https://facebook.com/gaubakery"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Đường dẫn Instagram</label>
              <input
                type="text"
                value={formData.instagramUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                className="w-full px-4 py-3 bg-brand-light/50 border border-brand-secondary rounded-xl text-sm font-medium focus:outline-none focus:border-brand-accent"
                placeholder="https://instagram.com/gaubakery"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Đường dẫn TikTok</label>
              <input
                type="text"
                value={formData.tiktokUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, tiktokUrl: e.target.value }))}
                className="w-full px-4 py-3 bg-brand-light/50 border border-brand-secondary rounded-xl text-sm font-medium focus:outline-none focus:border-brand-accent"
                placeholder="https://tiktok.com/@gaubakery"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 bg-brand-dark text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg shadow-brand-dark/10 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu Cấu Hình
          </button>
        </div>
      </form>
    </div>
  );
};
