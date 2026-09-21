import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, ChevronLeft, ChevronRight, Upload, FileDown, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import productService, { type ProductResponse } from '../../../services/api/productService';
import { ProductModal } from '../components/ProductModal';

export const AdminProducts = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  
  const filteredProducts = products.filter(product => 
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: ProductResponse) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts(page, 10, 'id,desc');
      setProducts(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await productService.deleteProduct(id);
        fetchProducts(); // Refresh list
      } catch (error) {
        alert('Xóa thất bại!');
      }
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        setLoading(true);
        // Bulk import logic: call create API for each row
        // Expecting Excel columns: productName, sku, originalPrice, salePrice, stock, categoryId
        for (const row of data) {
          await productService.createProduct({
            productName: row.productName || row['Tên sản phẩm'],
            sku: row.sku || row['Mã SKU'],
            originalPrice: row.originalPrice || row['Giá gốc'] || 0,
            salePrice: row.salePrice || row['Giá bán'] || 0,
            stock: row.stock || row['Tồn kho'] || 0,
            categoryId: row.categoryId || row['Mã Danh mục'] || 1, 
            thumbnail: row.thumbnail || row['Ảnh đại diện'] || '',
            description: row.description || row['Mô tả'] || '',
            status: row.status || 1,
            brandId: row.brandId || 1
          } as any);
        }
        alert(`Đã import thành công ${data.length} sản phẩm!`);
        fetchProducts();
      } catch (error: any) {
        console.error('Import error:', error);
        let errorMsg = 'Có lỗi xảy ra khi import file Excel.';
        if (error.response?.data) {
          const apiError = error.response.data;
          if (apiError.message) {
            errorMsg += `\n\nChi tiết: ${apiError.message}`;
          }
          if (apiError.validationErrors) {
            const details = Object.entries(apiError.validationErrors)
              .map(([field, msg]) => `- ${field}: ${msg}`)
              .join('\n');
            errorMsg += `\n\nCác lỗi dữ liệu:\n${details}`;
          }
        }
        alert(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    if (products.length === 0) {
      alert('Không có sản phẩm để xuất!');
      return;
    }
    const dataToExport = products.map(p => ({
      'Mã ID': p.id,
      'Tên sản phẩm': p.productName,
      'Mã SKU': p.sku,
      'Danh mục': p.categoryName || '',
      'Giá gốc (VND)': p.originalPrice,
      'Giá bán (VND)': p.salePrice,
      'Tồn kho': p.stock,
      'Trạng thái': p.status === 1 ? 'Đang bán' : 'Tạm ngưng',
      'Ảnh đại diện': p.thumbnail || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'San Pham');

    const headers = Object.keys(dataToExport[0]);
    worksheet['!cols'] = headers.map(header => {
      let maxLen = header.length;
      dataToExport.forEach(row => {
        const val = String(row[header as keyof typeof row] || '');
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: maxLen + 4 };
    });

    XLSX.writeFile(workbook, `Danh_sach_san_pham_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  const removeVN = (str: string): string => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') 
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const handleExportPDF = () => {
    if (products.length === 0) {
      alert('Không có sản phẩm để xuất!');
      return;
    }
    const doc = new jsPDF('landscape');
    const now = new Date();

    doc.setFontSize(16);
    doc.text('DANH SACH SAN PHAM', 148, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(
      `Ngay xuat: ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`,
      148, 22, { align: 'center' }
    );

    const tableData = products.map(p => {
      const name = removeVN(p.productName);
      const truncated = name.length > 45 ? name.substring(0, 45) + '...' : name;
      return [
        p.id,
        truncated,
        p.sku,
        removeVN(p.categoryName || 'N/A'),   // ← Fix: bỏ dấu tên danh mục
        new Intl.NumberFormat('vi-VN').format(p.salePrice) + ' VND',
        p.stock,
        p.status === 1 ? 'Dang ban' : 'Tam ngung'
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Ten san pham', 'SKU', 'Danh muc', 'Gia ban', 'Ton kho', 'Trang thai']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35, halign: 'right' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 25 }
      }
    });

    doc.save(`Danh_sach_san_pham_${now.toISOString().substring(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý mẫu bánh & Bộ sưu tập</h2>
          <p className="text-sm text-gray-500">Danh sách các mẫu bánh kem, bánh ngọt đang giới thiệu và trưng bày trên hệ thống.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold text-xs shadow-md"
            title="Xuất catalog mẫu bánh ra PDF"
          >
            <FileText className="w-4 h-4" />
            Xuất Catalog PDF
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold text-xs shadow-md"
            title="Xuất danh sách mẫu bánh ra Excel"
          >
            <FileDown className="w-4 h-4" />
            Xuất Excel
          </button>

          <label className="flex items-center justify-center gap-2 bg-white text-black border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all font-bold text-xs cursor-pointer shadow-sm">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Nhập Excel</span>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              onChange={handleImportExcel}
            />
          </label>

          <button 
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 bg-amber-900 text-white px-4 py-2.5 rounded-xl hover:bg-amber-950 transition-all font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mẫu bánh mới</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm mẫu bánh, mã SKU..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-amber-50/50 text-amber-950 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Mẫu bánh</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Giá tham khảo</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Đang tải danh sách bánh...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Không tìm thấy mẫu bánh nào.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                          <img src={product.thumbnail || '/images/placeholder.png'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm line-clamp-1">{product.productName}</div>
                          <div className="text-amber-800/60 text-[10px] font-medium uppercase tracking-tight">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-lg">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-amber-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}
                      </div>
                      {product.originalPrice > 0 && product.originalPrice > product.salePrice && (
                        <div className="text-[10px] text-gray-400 line-through">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        product.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {product.status === 1 ? 'Đang trưng bày' : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Trang {page + 1} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 hover:bg-gray-50 border border-gray-100 rounded-lg disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 hover:bg-gray-50 border border-gray-100 rounded-lg disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchProducts}
        product={selectedProduct}
      />
    </div>
  );
};
