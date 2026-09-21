import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, ShieldCheck, Globe, ChevronLeft, ChevronRight, 
  Search, ShieldAlert, Award, CheckSquare, Square, 
  RotateCcw, MapPin, TextQuote
} from 'lucide-react';
import brandService, { type BrandDTO, type BrandRequest } from '../../../services/api/brandService';
import { BrandModal } from '../components/BrandModal';

export const AdminBrands = () => {
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [allBrandsList, setAllBrandsList] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandDTO | null>(null);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);



  const fetchBrands = async () => {
    setLoading(true);
    try {
      // Fetch paginated brands for current page
      const response = await brandService.getAllBrands(page, 10);
      setBrands(response.content || []);
      setTotalPages(response.totalPages || 0);

      // Fetch all brands for country filters & stats
      const allData = await brandService.getAllBrandsList();
      setAllBrandsList(allData || []);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [page]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = allBrandsList.length;
    const active = allBrandsList.filter(b => b.status === 1).length;
    const suspended = allBrandsList.filter(b => b.status === 0).length;
    
    // Unique countries list
    const countries = allBrandsList
      .map(b => b.country)
      .filter(c => c && c.trim() !== '')
      .map(c => c.trim());
    const uniqueCountries = new Set(countries).size;

    return { total, active, suspended, uniqueCountries };
  }, [allBrandsList]);

  // Unique countries for the dropdown filter
  const countriesDropdownList = useMemo(() => {
    const countries = allBrandsList
      .map(b => b.country)
      .filter(c => c && c.trim() !== '')
      .map(c => c.trim());
    return ['ALL', ...Array.from(new Set(countries))];
  }, [allBrandsList]);

  // Search & Filter brands logic
  const filteredBrands = useMemo(() => {
    return brands.filter(brand => {
      const matchSearch = 
        brand.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (brand.country && brand.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = 
        statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && brand.status === 1) ||
        (statusFilter === 'SUSPENDED' && brand.status === 0);

      const matchCountry = 
        countryFilter === 'ALL' || 
        (brand.country && brand.country.trim() === countryFilter);

      return matchSearch && matchStatus && matchCountry;
    });
  }, [brands, searchTerm, statusFilter, countryFilter]);

  const handleAdd = () => {
    setSelectedBrand(null);
    setIsModalOpen(true);
  };

  const handleEdit = (brand: BrandDTO) => {
    setSelectedBrand(brand);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này không?')) {
      try {
        await brandService.deleteBrand(id);
        alert('Xóa thương hiệu thành công!');
        fetchBrands();
      } catch (error) {
        console.error('Failed to delete brand:', error);
        alert('Xóa thất bại! Vui lòng thử lại.');
      }
    }
  };

  // Bulk actions handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = filteredBrands.map(b => b.id);
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
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} thương hiệu đã chọn?`)) {
      setLoading(true);
      let deleted = 0;
      let failed = 0;
      for (const id of selectedIds) {
        try {
          await brandService.deleteBrand(id);
          deleted++;
        } catch (e) {
          failed++;
        }
      }
      alert(`Đã xóa thành công ${deleted} thương hiệu.${failed > 0 ? ` Thất bại: ${failed} thương hiệu.` : ''}`);
      setSelectedIds([]);
      fetchBrands();
    }
  };

  const handleBulkStatusChange = async (newStatus: number) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    let updated = 0;
    for (const id of selectedIds) {
      const oldBrand = allBrandsList.find(b => b.id === id);
      if (!oldBrand) continue;
      try {
        const body: BrandRequest = {
          brandName: oldBrand.brandName,
          slug: oldBrand.slug,
          country: oldBrand.country,
          logoUrl: oldBrand.logoUrl,
          description: oldBrand.description,
          status: newStatus
        };
        await brandService.updateBrand(id, body);
        updated++;
      } catch (e) {
        console.error(`Failed to update status for brand ${id}`, e);
      }
    }
    alert(`Đã cập nhật trạng thái hoạt động cho ${updated} thương hiệu.`);
    setSelectedIds([]);
    fetchBrands();
  };



  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản Lý Thương Hiệu</h1>
            <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Đối tác chính</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Danh sách các đối tác, hãng sản xuất phân phối hàng hóa trên hệ thống.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh button */}
          <button 
            onClick={fetchBrands}
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
            Thêm thương hiệu
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-3 relative">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Tổng số hiệu</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Thương hiệu đồng hành</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-3 relative">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Đang hợp tác</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Đang hoạt động tốt</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-3 relative">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Tạm ngưng</span>
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.suspended}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Dừng nhập mới & hiển thị</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-3 relative">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Địa lý</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.uniqueCountries}</div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Quốc gia xuất xứ khác nhau</p>
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
              placeholder="Tìm kiếm thương hiệu theo tên, slug, quốc gia..."
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
                <option value="ACTIVE">Đang hợp tác</option>
                <option value="SUSPENDED">Tạm ngưng</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Quốc gia</label>
              <select 
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full lg:w-44 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-100"
              >
                <option value="ALL">Tất cả quốc gia</option>
                {countriesDropdownList.filter(c => c !== 'ALL').map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Ribbon */}
        {selectedIds.length > 0 && (
          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-100 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-700" />
              <span className="text-xs font-bold text-amber-900">Đã chọn **{selectedIds.length}** thương hiệu</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkStatusChange(1)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-all shadow-sm"
              >
                Hợp tác loạt
              </button>
              <button 
                onClick={() => handleBulkStatusChange(0)}
                className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] hover:bg-slate-50 transition-all shadow-sm"
              >
                Tạm ngưng loạt
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

      {/* Main Brands Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-12 text-center">
                  <button
                    onClick={() => handleSelectAll(selectedIds.length !== filteredBrands.length)}
                    className="text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    {selectedIds.length === filteredBrands.length && filteredBrands.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">Thương hiệu</th>
                <th className="px-6 py-4">Đường dẫn (Slug)</th>
                <th className="px-6 py-4">Quốc gia</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCcw className="w-6 h-6 animate-spin text-slate-300" />
                      <span>Đang tải thương hiệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Award className="w-8 h-8 text-slate-300" />
                      <span>Không tìm thấy thương hiệu nào phù hợp.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => {
                  const isSelected = selectedIds.includes(brand.id);
                  return (
                    <tr 
                      key={brand.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-amber-50/10' : ''}`}
                    >
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleSelectOne(brand.id, !isSelected)}
                          className="text-slate-400 hover:text-slate-800 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                            {brand.logoUrl ? (
                              <img src={brand.logoUrl} alt={brand.brandName} className="w-full h-full object-contain p-1.5" />
                            ) : (
                              <ShieldCheck className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{brand.brandName}</div>
                            {brand.description ? (
                              <div className="text-slate-400 text-xs line-clamp-1 max-w-[300px] flex items-center gap-1">
                                <TextQuote className="w-3 h-3 flex-shrink-0 text-slate-300" />
                                {brand.description}
                              </div>
                            ) : (
                              <div className="text-slate-300 text-xs italic">Không có mô tả chi tiết</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded italic font-mono">
                          {brand.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {brand.country ? (
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {brand.country}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">Chưa cập nhật</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          brand.status === 1 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            brand.status === 1 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'
                          }`} />
                          {brand.status === 1 ? 'Đang hợp tác' : 'Tạm ngưng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(brand)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                            title="Chỉnh sửa thương hiệu"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(brand.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors"
                            title="Xóa thương hiệu"
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

      <BrandModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchBrands}
        brand={selectedBrand}
      />
    </div>
  );
};
