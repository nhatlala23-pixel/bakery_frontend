import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, LayoutGrid, ChevronLeft, ChevronRight, 
  Search, Layers, Folder, EyeOff, 
  CheckSquare, Square, RotateCcw, Info, FolderOpen
} from 'lucide-react';
import categoryService, { type CategoryDTO } from '../../../services/api/categoryService';
import { CategoryModal } from '../components/CategoryModal';
import { getFullImageUrl } from '../../../utils/image';

export const AdminCategories = () => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [allCategoriesList, setAllCategoriesList] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ROOT' | 'SUB'>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);


  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Fetch paginated categories for the current page
      const response = await categoryService.getAllCategories(page, 10);
      setCategories(response.content || []);
      setTotalPages(response.totalPages || 0);

      // Fetch all categories for parent matching & stats
      const allData = await categoryService.getAllCategoriesList();
      setAllCategoriesList(allData || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = allCategoriesList.length;
    const active = allCategoriesList.filter(c => c.status === 1).length;
    const hidden = allCategoriesList.filter(c => c.status === 0).length;
    const root = allCategoriesList.filter(c => !c.parentId).length;
    const sub = allCategoriesList.filter(c => c.parentId).length;

    return { total, active, hidden, root, sub };
  }, [allCategoriesList]);

  // Client-side filtering & searching (matches UI for instant responsiveness)
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const matchSearch = 
        category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = 
        statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && category.status === 1) ||
        (statusFilter === 'HIDDEN' && category.status === 0);

      const matchLevel = 
        levelFilter === 'ALL' || 
        (levelFilter === 'ROOT' && !category.parentId) ||
        (levelFilter === 'SUB' && category.parentId);

      return matchSearch && matchStatus && matchLevel;
    });
  }, [categories, searchTerm, statusFilter, levelFilter]);

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: CategoryDTO) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const children = allCategoriesList.filter(c => c.parentId === id);
    if (children.length > 0) {
      alert(`Không thể xóa danh mục này vì có ${children.length} danh mục con trực thuộc! Hãy chuyển các danh mục con hoặc xóa chúng trước.`);
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        await categoryService.deleteCategory(id);
        alert('Xóa danh mục thành công!');
        fetchCategories();
      } catch (error) {
        alert('Xóa thất bại! Vui lòng thử lại.');
      }
    }
  };

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = filteredCategories.map(c => c.id);
      setSelectedIds(pageIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    // Check if any selected category has children not selected
    const cannotDelete = selectedIds.filter(id => {
      const children = allCategoriesList.filter(c => c.parentId === id);
      // If children exist and are not in the selection, block it
      const unselectedChildren = children.filter(child => !selectedIds.includes(child.id));
      return unselectedChildren.length > 0;
    });

    if (cannotDelete.length > 0) {
      alert(`Không thể xóa hàng loạt vì một số danh mục đã chọn có danh mục con chưa được chọn. (Mã danh mục: ${cannotDelete.join(', ')})`);
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} danh mục đã chọn?`)) {
      setLoading(true);
      let deleted = 0;
      let failed = 0;
      for (const id of selectedIds) {
        try {
          await categoryService.deleteCategory(id);
          deleted++;
        } catch (e) {
          failed++;
        }
      }
      alert(`Đã xóa thành công ${deleted} danh mục.${failed > 0 ? ` Thất bại: ${failed} danh mục.` : ''}`);
      setSelectedIds([]);
      fetchCategories();
    }
  };

  const handleBulkStatusChange = async (newStatus: number) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    let updated = 0;
    for (const id of selectedIds) {
      try {
        await categoryService.updateCategory(id, { status: newStatus });
        updated++;
      } catch (e) {
        console.error(`Failed to update status for category ${id}`, e);
      }
    }
    alert(`Đã cập nhật trạng thái hoạt động cho ${updated} danh mục.`);
    setSelectedIds([]);
    fetchCategories();
  };


  // Find parent category name helper
  const getParentName = (parentId?: number) => {
    if (!parentId) return null;
    const parent = allCategoriesList.find(c => c.id === parentId);
    return parent ? parent.categoryName : `ID: #${parentId}`;
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản Lý Danh Mục</h1>
            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Danh mục hàng</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Phân cấp và cấu trúc nhóm sản phẩm trên toàn hệ thống cửa hàng.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh button */}
          <button 
            onClick={fetchCategories}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all font-bold text-xs text-slate-700 shadow-sm"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>



          <button 
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-xs shadow-md shadow-slate-200"
          >
            <Plus className="w-4 h-4 text-white" />
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-3 relative">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Tổng số</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Danh mục đã định nghĩa</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-3 relative">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <FolderOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Hoạt động</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Hiển thị trên website</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-3 relative">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <EyeOff className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Đang ẩn</span>
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.hidden}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Đã ẩn khỏi menu mua sắm</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-3 relative">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Cấu trúc</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.root} <span className="text-sm font-normal text-slate-400">gốc</span> / {stats.sub} <span className="text-sm font-normal text-slate-400">con</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Phân cấp cây danh mục</p>
        </div>

      </div>

      {/* Filter and Bulk action panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm danh mục theo tên, slug hoặc mô tả..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900/5 outline-none font-medium transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Lọc trạng thái</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full lg:w-44 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-100"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="HIDDEN">Đã ẩn</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Cấp bậc</label>
              <select 
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                className="w-full lg:w-44 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-100"
              >
                <option value="ALL">Tất cả cấp bậc</option>
                <option value="ROOT">Danh mục gốc (Cha)</option>
                <option value="SUB">Danh mục phụ (Con)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Ribbon */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-700" />
              <span className="text-xs font-bold text-blue-900">Đã chọn **{selectedIds.length}** danh mục</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkStatusChange(1)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-all shadow-sm"
              >
                Kích hoạt loạt
              </button>
              <button 
                onClick={() => handleBulkStatusChange(0)}
                className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] hover:bg-slate-50 transition-all shadow-sm"
              >
                Ẩn loạt
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-[11px] hover:bg-red-700 transition-all shadow-sm"
              >
                Xóa hàng loạt
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 bg-white text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg font-bold text-[11px] transition-all"
              >
                Hủy chọn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Categories Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-12 text-center">
                  <button
                    onClick={() => handleSelectAll(selectedIds.length !== filteredCategories.length)}
                    className="text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    {selectedIds.length === filteredCategories.length && filteredCategories.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 w-24">ID</th>
                <th className="px-6 py-4">Tên danh mục</th>
                <th className="px-6 py-4">Đường dẫn (Slug)</th>
                <th className="px-6 py-4">Danh mục cha</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCcw className="w-6 h-6 animate-spin text-slate-300" />
                      <span>Đang tải danh mục...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Folder className="w-8 h-8 text-slate-300" />
                      <span>Không tìm thấy danh mục nào phù hợp.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => {
                  const isSelected = selectedIds.includes(category.id);
                  const parentName = getParentName(category.parentId);
                  return (
                    <tr 
                      key={category.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-blue-50/20' : ''}`}
                    >
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleSelectOne(category.id, !isSelected)}
                          className="text-slate-400 hover:text-slate-800 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-400">
                        #{category.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {category.image ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-200/60 bg-amber-50 flex-shrink-0 shadow-sm">
                              <img 
                                src={getFullImageUrl(category.image)} 
                                alt={category.categoryName} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  // Fallback if image path is broken
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                              category.parentId ? 'bg-slate-50 text-slate-500' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {category.parentId ? <Folder className="w-5 h-5" /> : <FolderOpen className="w-5 h-5" />}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{category.categoryName}</div>
                            {category.description ? (
                              <div className="text-slate-400 text-xs line-clamp-1 max-w-[250px]">{category.description}</div>
                            ) : (
                              <div className="text-slate-300 text-xs italic">Không có mô tả</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded italic font-mono">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {parentName ? (
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {parentName}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                            <Info className="w-3.5 h-3.5 text-blue-400" />
                            Danh mục gốc
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          category.status === 1 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            category.status === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'
                          }`} />
                          {category.status === 1 ? 'Hoạt động' : 'Đã ẩn'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(category)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                            title="Chỉnh sửa danh mục"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(category.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-bold">
            Hiển thị trang {page + 1} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg disabled:opacity-30 transition-all text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg disabled:opacity-30 transition-all text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCategories}
        category={selectedCategory}
      />
    </div>
  );
};
