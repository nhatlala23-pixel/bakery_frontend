import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ImageIcon, MessageSquare, Upload, Calendar, Eye } from 'lucide-react';
import blogService, { type BlogDTO } from '@/services/api/blogService';
import axiosClient from '@/services/api/axiosClient';
import { getFullImageUrl } from '@/utils/image';
import { Modal } from '@/components/ui/Modal';

export const AdminBlogs = () => {
  const [blogs, setBlogs] = useState<BlogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogDTO | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<BlogDTO>({
    title: '',
    slug: '',
    thumbnail: '',
    excerpt: '',
    content: '',
    status: 'PUBLISHED',
    seoTitle: '',
    seoDescription: '',
  });

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const res = await blogService.getAllBlogsForAdmin(0, 100);
      setBlogs(res.content || []);
    } catch (error) {
      console.error('Failed to load blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
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

  const handleOpenModal = (blog?: BlogDTO) => {
    if (blog) {
      setSelectedBlog(blog);
      setFormData({
        title: blog.title,
        slug: blog.slug,
        thumbnail: blog.thumbnail || '',
        excerpt: blog.excerpt || '',
        content: blog.content || '',
        status: blog.status || 'PUBLISHED',
        seoTitle: blog.seoTitle || '',
        seoDescription: blog.seoDescription || '',
      });
    } else {
      setSelectedBlog(null);
      setFormData({
        title: '',
        slug: '',
        thumbnail: '',
        excerpt: '',
        content: '',
        status: 'PUBLISHED',
        seoTitle: '',
        seoDescription: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleTitleChange = (title: string) => {
    const slug = convertToSlug(title);
    setFormData(prev => ({ ...prev, title, slug }));
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
      alert('Tải ảnh đại diện thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedBlog?.id) {
        await blogService.updateBlog(selectedBlog.id, formData);
      } else {
        await blogService.createBlog(formData);
      }
      setIsModalOpen(false);
      loadBlogs();
    } catch (error) {
      alert('Lưu bài viết thất bại!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      await blogService.deleteBlog(id);
      loadBlogs();
    } catch (error) {
      alert('Xóa bài viết thất bại!');
    }
  };

  const filtered = blogs.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-amber-950 tracking-tight">Quản Lý Bài Viết & Blog</h1>
          <p className="text-xs font-semibold text-amber-900/60">Đăng bài viết chia sẻ kinh nghiệm chọn bánh, công thức nướng bánh và tin tức Gấu Bakery</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-amber-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-amber-950 transition-all shadow-md w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Viết bài mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Tìm kiếm bài viết theo tiêu đề..."
          className="w-full text-sm outline-none bg-transparent"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Bài Viết</th>
                <th className="px-6 py-4">Đường Dẫn (Slug)</th>
                <th className="px-6 py-4">Tác Giả</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4">Ngày Tạo</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Đang tải bài viết...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Chưa có bài viết nào trong hệ thống.</td>
                </tr>
              ) : (
                filtered.map(blog => (
                  <tr key={blog.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg bg-amber-50 border border-amber-100 overflow-hidden shrink-0">
                          {blog.thumbnail ? (
                            <img src={getFullImageUrl(blog.thumbnail)} alt={blog.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-400">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 line-clamp-1">{blog.title}</div>
                          {blog.excerpt && <div className="text-xs text-slate-500 line-clamp-1">{blog.excerpt}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono">
                        /{blog.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-xs font-semibold">
                      {blog.authorName || 'Admin'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        blog.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {blog.status === 'PUBLISHED' ? 'Đã Xuất Bản' : 'Bản Nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(blog)}
                        className="p-2 text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors inline-block"
                        title="Sửa bài viết"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => blog.id && handleDelete(blog.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                        title="Xóa bài viết"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Blog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBlog ? `Chỉnh sửa bài viết #${selectedBlog.id}` : 'Soạn Bài Viết Mới'}
      >
        <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Tiêu đề bài viết</label>
            <input 
              required
              placeholder="VD: Bí quyết chọn bánh sinh nhật siêu độc đáo cho bé yêu"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.title}
              onChange={e => handleTitleChange(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Slug bài viết</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>

          {/* Upload Ảnh Thumbnail */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Ảnh đại diện bài viết</label>
            <div className="flex items-center gap-4 p-3 bg-amber-50/40 rounded-xl border border-amber-100">
              {formData.thumbnail ? (
                <img 
                  src={getFullImageUrl(formData.thumbnail)} 
                  alt="Thumbnail" 
                  className="w-20 h-14 object-cover rounded-lg border border-amber-200 bg-white shrink-0" 
                />
              ) : (
                <div className="w-20 h-14 rounded-lg border-2 border-dashed border-amber-200 bg-white flex flex-col items-center justify-center text-amber-500 shrink-0">
                  <ImageIcon className="w-5 h-5 opacity-60" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-amber-900 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-950 transition-colors w-fit">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Đang tải...' : 'Tải ảnh đại diện'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <input 
                  type="text" 
                  placeholder="Hoặc dán URL ảnh..."
                  className="w-full px-3 py-1 bg-white border border-slate-200 rounded-md text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  value={formData.thumbnail || ''}
                  onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Trích dẫn ngắn (Excerpt)</label>
            <textarea 
              rows={2}
              placeholder="Tóm tắt nội dung bài viết hiển thị ở trang tin tức..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.excerpt || ''}
              onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Nội dung chi tiết bài viết</label>
            <textarea 
              required
              rows={8}
              placeholder="Nhập nội dung bài viết bằng văn bản hoặc mã HTML..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-700">Trạng thái xuất bản</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
            >
              <option value="PUBLISHED">Công khai (Xuất bản ngay)</option>
              <option value="DRAFT">Lưu nháp (Chưa hiển thị)</option>
            </select>
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
              {selectedBlog ? 'Cập Nhật Bài Viết' : 'Xuất Bản Bài Viết'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
