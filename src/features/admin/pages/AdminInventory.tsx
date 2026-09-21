import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, RotateCcw, AlertTriangle, Package, Edit3, 
  Plus, Minus, ArrowUpRight, ArrowDownRight, 
  FileDown, FileUp, Settings, History, 
  DollarSign, CheckSquare, Square, X, ShieldAlert,
  ChevronLeft, ChevronRight, Barcode
} from 'lucide-react';
import productService, { type ProductResponse } from '@/services/api/productService';
import { InventoryModal } from '../components/InventoryModal';
import * as XLSX from 'xlsx';

// Define structures for inventory history
interface HistoryLog {
  id: string;
  timestamp: string;
  productId: number;
  productName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'SALE' | 'ADJUST';
  quantity: number;
  balance: number;
  reason: string;
  actor: string;
}

export const AdminInventory = () => {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tabs: 'inventory' | 'history' | 'settings'
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'settings'>('inventory');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [warningThreshold, setWarningThreshold] = useState<number>(10);

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);

  // Stock Adjustment Panels (Nhập / Xuất kho nhanh)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<ProductResponse | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState<string>('Nhập hàng từ nhà cung cấp');

  // Bulk Actions
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);
  const [bulkAdjustQty, setBulkAdjustQty] = useState<number>(0);
  const [bulkAdjustType, setBulkAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [bulkAdjustReason, setBulkAdjustReason] = useState<string>('Điều chỉnh hàng loạt');

  // Local storage history log state
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('ALL');

  // Excel Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all products with pagination
  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Fetch larger batch to allow dynamic statistics and client filtering/pagination
      const response = await productService.getAllProducts(0, 1000);
      setProducts(response.content || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize logs
  useEffect(() => {
    fetchInventory();
    
    // Load warning threshold
    const savedThreshold = localStorage.getItem('inventory_warning_threshold');
    if (savedThreshold) {
      setWarningThreshold(Number(savedThreshold));
    }

    // Load or initialize history log
    const savedHistory = localStorage.getItem('inventory_history_logs');
    if (savedHistory) {
      setHistoryLogs(JSON.parse(savedHistory));
    } else {
      const initialHistory: HistoryLog[] = [
        {
          id: 'H1',
          timestamp: '2026-05-22 15:30:12',
          productId: 1,
          productName: 'iPhone 15 Pro Max 256GB',
          sku: 'IP15-PM-256',
          type: 'IN',
          quantity: 50,
          balance: 50,
          reason: 'Nhập hàng từ nhà cung cấp Apple Inc',
          actor: 'Admin Techno'
        },
        {
          id: 'H2',
          timestamp: '2026-05-22 14:15:22',
          productId: 2,
          productName: 'Samsung Galaxy S24 Ultra',
          sku: 'SS-S24U-256',
          type: 'IN',
          quantity: 30,
          balance: 30,
          reason: 'Nhập kho ban đầu',
          actor: 'Admin Techno'
        },
        {
          id: 'H3',
          timestamp: '2026-05-22 10:05:00',
          productId: 3,
          productName: 'MacBook Pro 14 inch M3',
          sku: 'MAC-M3-14',
          type: 'SALE',
          quantity: -1,
          balance: 14,
          reason: 'Đơn hàng #10243 (Tự động trừ kho)',
          actor: 'Hệ thống (Auto)'
        },
        {
          id: 'H4',
          timestamp: '2026-05-21 16:45:00',
          productId: 4,
          productName: 'Tai nghe AirPods Pro 2',
          sku: 'AP-PRO-2',
          type: 'OUT',
          quantity: -2,
          balance: 8,
          reason: 'Xuất hủy hàng lỗi màng loa',
          actor: 'Lê Văn Kho'
        },
        {
          id: 'H5',
          timestamp: '2026-05-21 09:30:00',
          productId: 1,
          productName: 'iPhone 15 Pro Max 256GB',
          sku: 'IP15-PM-256',
          type: 'ADJUST',
          quantity: 2,
          balance: 52,
          reason: 'Kiểm kho định kỳ - Bù lệch thừa',
          actor: 'Admin Techno'
        }
      ];
      localStorage.setItem('inventory_history_logs', JSON.stringify(initialHistory));
      setHistoryLogs(initialHistory);
    }
  }, []);

  // Save warning threshold
  const handleSaveThreshold = (val: number) => {
    setWarningThreshold(val);
    localStorage.setItem('inventory_warning_threshold', val.toString());
    alert('Đã lưu cấu hình ngưỡng cảnh báo tồn kho!');
  };

  // Helper: add log to history
  const addLog = (
    productId: number, 
    productName: string, 
    sku: string, 
    type: 'IN' | 'OUT' | 'ADJUST' | 'SALE', 
    quantity: number, 
    balance: number, 
    reason: string
  ) => {
    const newLog: HistoryLog = {
      id: 'H' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      productId,
      productName,
      sku,
      type,
      quantity,
      balance,
      reason,
      actor: 'Admin Techno'
    };
    const updated = [newLog, ...historyLogs];
    setHistoryLogs(updated);
    localStorage.setItem('inventory_history_logs', JSON.stringify(updated));
  };

  // Calculate statistics (Dashboard)
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.salePrice), 0);
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < warningThreshold).length;
    const healthyStock = products.filter(p => p.stock >= warningThreshold).length;

    return {
      totalProducts,
      totalStock,
      totalValue,
      outOfStock,
      lowStock,
      healthyStock
    };
  }, [products, warningThreshold]);

  // Categories list for filtering
  const categories = useMemo(() => {
    const list = products.map(p => p.categoryName).filter(Boolean);
    return ['ALL', ...Array.from(new Set(list))];
  }, [products]);

  // Dynamic filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search term (name, sku, category)
      const matchSearch = 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category filter
      const matchCategory = categoryFilter === 'ALL' || p.categoryName === categoryFilter;

      // Status filter
      let matchStatus = true;
      if (statusFilter === 'IN_STOCK') {
        matchStatus = p.stock >= warningThreshold;
      } else if (statusFilter === 'LOW_STOCK') {
        matchStatus = p.stock > 0 && p.stock < warningThreshold;
      } else if (statusFilter === 'OUT_OF_STOCK') {
        matchStatus = p.stock === 0;
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter, warningThreshold]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page, pageSize]);

  // Update total pages when filtered list changes
  useEffect(() => {
    setTotalPages(Math.ceil(filteredProducts.length / pageSize));
    setPage(0); // Reset page on filter change
  }, [filteredProducts, pageSize]);

  // Bulk selections helper
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = paginatedProducts.map(p => p.id);
      setSelectedProductIds(ids);
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, id]);
    } else {
      setSelectedProductIds(selectedProductIds.filter(x => x !== id));
    }
  };

  // Quick Stock Adjustment single
  const openAdjustModal = (product: ProductResponse, type: 'IN' | 'OUT') => {
    setAdjustProduct(product);
    setAdjustType(type);
    setAdjustQty(10); // default
    setAdjustReason(type === 'IN' ? 'Nhập hàng từ nhà cung cấp' : 'Xuất hủy hàng lỗi / hỏng');
    setIsAdjustModalOpen(true);
  };

  const handleQuickAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct || adjustQty <= 0) return;

    const change = adjustType === 'IN' ? adjustQty : -adjustQty;
    const targetStock = Math.max(0, adjustProduct.stock + change);

    setLoading(true);
    try {
      // Call real backend update
      await productService.updateProductStock(adjustProduct.id, targetStock);

      // Record logs
      addLog(
        adjustProduct.id, 
        adjustProduct.productName, 
        adjustProduct.sku, 
        adjustType, 
        change, 
        targetStock, 
        adjustReason
      );

      alert(`Đã ${adjustType === 'IN' ? 'Nhập' : 'Xuất'} kho thành công cho sản phẩm!`);
      setIsAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Cập nhật thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Bulk Adjust Submit
  const handleBulkAdjustSubmit = async () => {
    if (selectedProductIds.length === 0 || bulkAdjustQty <= 0) return;

    setLoading(true);
    let successCount = 0;
    try {
      for (const id of selectedProductIds) {
        const prod = products.find(p => p.id === id);
        if (!prod) continue;

        const change = bulkAdjustType === 'IN' ? bulkAdjustQty : -bulkAdjustQty;
        const targetStock = Math.max(0, prod.stock + change);

        await productService.updateProductStock(id, targetStock);

        addLog(
          id, 
          prod.productName, 
          prod.sku, 
          bulkAdjustType, 
          change, 
          targetStock, 
          bulkAdjustReason
        );
        successCount++;
      }

      alert(`Đã điều chỉnh kho thành công hàng loạt cho ${successCount} sản phẩm!`);
      setSelectedProductIds([]);
      setBulkAdjustOpen(false);
      fetchInventory();
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi xảy ra trong quá trình điều chỉnh hàng loạt.');
    } finally {
      setLoading(false);
    }
  };

  // Excel Export - fetch fresh data from API to guarantee non-empty export
  const handleExportExcel = async () => {
    setLoading(true);
    try {
      // Always fetch fresh data from API to avoid empty export
      const response = await productService.getAllProducts(0, 1000);
      const allProducts: ProductResponse[] = response.content || [];

      if (allProducts.length === 0) {
        alert('Không có sản phẩm nào trong kho để xuất báo cáo!');
        return;
      }

      const dataToExport = allProducts.map(p => {
        const statusText = p.stock === 0 ? 'Hết hàng' : (p.stock < warningThreshold ? 'Sắp hết' : 'Còn hàng');
        return {
          'Mã ID': p.id,
          'Tên sản phẩm': p.productName,
          'Mã SKU': p.sku,
          'Danh mục': p.categoryName || '',
          'Đơn giá bán': p.salePrice,
          'Tồn kho hiện tại': p.stock,
          'Giá trị tồn kho': p.stock * p.salePrice,
          'Trạng thái': statusText
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ton Kho Enterprise');

      // Auto-fit column widths
      const headers = Object.keys(dataToExport[0]);
      worksheet['!cols'] = headers.map((header) => {
        let maxLen = header.length;
        dataToExport.forEach(row => {
          const cellValue = String(row[header as keyof typeof row] || '');
          if (cellValue.length > maxLen) maxLen = cellValue.length;
        });
        return { wch: maxLen + 4 };
      });

      XLSX.writeFile(workbook, `Bao_cao_kho_hang_${new Date().toISOString().substring(0, 10)}.xlsx`);
      alert(`Đã xuất thành công ${dataToExport.length} sản phẩm ra file Excel!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Có lỗi xảy ra khi xuất file Excel!');
    } finally {
      setLoading(false);
    }
  };

  // Excel Import
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const data: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
          alert('Không tìm thấy dữ liệu trong file Excel!');
          return;
        }

        setLoading(true);
        let updatedCount = 0;
        
        // Loop and update stock levels based on ID or SKU matches
        for (const row of data) {
          const sku = row['Mã SKU'] || row['sku'] || row['SKU'];
          const id = row['Mã ID'] || row['id'] || row['ID'];
          const newStock = Number(row['Tồn kho hiện tại'] || row['stock'] || row['Tồn kho'] || 0);

          let matchedProduct = products.find(p => p.id === Number(id));
          if (!matchedProduct && sku) {
            matchedProduct = products.find(p => p.sku === String(sku));
          }

          if (matchedProduct) {
            await productService.updateProductStock(matchedProduct.id, newStock);

            const difference = newStock - matchedProduct.stock;
            if (difference !== 0) {
              addLog(
                matchedProduct.id,
                matchedProduct.productName,
                matchedProduct.sku,
                difference > 0 ? 'IN' : 'OUT',
                difference,
                newStock,
                'Import từ file Excel'
              );
            }
            updatedCount++;
          }
        }

        alert(`Đã cập nhật tồn kho thành công cho ${updatedCount} sản phẩm từ Excel!`);
        fetchInventory();
      } catch (err: any) {
        console.error('Import error:', err);
        alert('Có lỗi xảy ra khi đọc hoặc cập nhật file Excel. Vui lòng kiểm tra lại định dạng file!');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Filter History Logs
  const filteredHistoryLogs = useMemo(() => {
    return historyLogs.filter(log => {
      const matchSearch = 
        log.productName.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.sku.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.reason.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.actor.toLowerCase().includes(historySearch.toLowerCase());
      
      const matchType = historyTypeFilter === 'ALL' || log.type === historyTypeFilter;

      return matchSearch && matchType;
    });
  }, [historyLogs, historySearch, historyTypeFilter]);

  // Clear History
  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử biến động kho?')) {
      localStorage.removeItem('inventory_history_logs');
      setHistoryLogs([]);
    }
  };

  // Formatting currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hệ Thống Quản Lý Kho Hàng</h1>
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Enterprise Mode</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Theo dõi thời gian thực, cảnh báo tồn kho, nhập/xuất kho & quản lý lịch sử biến động hàng hóa.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh button */}
          <button 
            onClick={fetchInventory}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all font-bold text-xs text-slate-700 shadow-sm"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới kho
          </button>

          <button 
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold text-xs shadow-md"
            title="Xuất file báo cáo tồn kho hiện tại"
          >
            <FileDown className="w-4 h-4" />
            Xuất Excel
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-xs shadow-md shadow-slate-200"
            title="Import Excel để cập nhật số lượng tồn kho"
          >
            <FileUp className="w-4 h-4 text-emerald-400" />
            Nhập Excel
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Tabs Selector System */}
      <div className="flex border-b border-slate-200/80 bg-white/50 backdrop-blur p-1 rounded-2xl border border-slate-100 max-w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Danh Sách Tồn Kho</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch Sử Biến Động</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'settings' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cấu Hình Kho</span>
        </button>
      </div>

      {/* Tab CONTENT: INVENTORY DIRECTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          
          {/* Premium Enterprise Widgets row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center justify-between mb-3 relative">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Mặt hàng</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.totalProducts}</div>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">Đang lưu kho hoạt động</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center justify-between mb-3 relative">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Tổng giá trị</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalValue)}</div>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">Dựa trên giá bán hiện tại</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center justify-between mb-3 relative">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Cảnh báo</span>
              </div>
              <div className="text-2xl font-black text-amber-600">{stats.lowStock}</div>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">Mức tồn &lt; {warningThreshold} sản phẩm</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center justify-between mb-3 relative">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Hết hàng</span>
              </div>
              <div className="text-2xl font-black text-rose-600">{stats.outOfStock}</div>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">Cần nhập hàng ngay lập tức</p>
            </div>

          </div>

          {/* Search, Filter & Bulk actions panel */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              
              {/* Search bar */}
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Tìm kiếm sản phẩm theo Tên, mã SKU, barcode hoặc danh mục..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900/5 outline-none font-medium transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status & Category filters */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex-1 lg:flex-none">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Lọc trạng thái</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full lg:w-44 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="IN_STOCK">Còn hàng (Đủ hàng)</option>
                    <option value="LOW_STOCK">⚠️ Sắp hết hàng (&lt;{warningThreshold})</option>
                    <option value="OUT_OF_STOCK">🚫 Đã hết hàng (=0)</option>
                  </select>
                </div>

                <div className="flex-1 lg:flex-none">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Lọc danh mục</label>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full lg:w-44 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="ALL">Tất cả danh mục</option>
                    {categories.filter(c => c !== 'ALL').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Bulk actions status panel (Fades in when checked) */}
            {selectedProductIds.length > 0 && (
              <div className="bg-slate-55 p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-slate-800" />
                  <span className="text-xs font-bold text-slate-800">Đã chọn **{selectedProductIds.length}** sản phẩm hàng loạt</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setBulkAdjustType('IN');
                      setBulkAdjustQty(10);
                      setBulkAdjustReason('Nhập hàng loạt');
                      setBulkAdjustOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-all"
                  >
                    ⚡ Điều chỉnh kho hàng loạt
                  </button>
                  <button 
                    onClick={() => setSelectedProductIds([])}
                    className="px-2.5 py-1.5 bg-white text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg font-bold text-[11px] transition-all"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Adjust Modal Inner Form popup */}
            {bulkAdjustOpen && (
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest">🛠️ Biểu mẫu điều chỉnh tồn kho hàng loạt</h4>
                  <button onClick={() => setBulkAdjustOpen(false)} className="text-amber-600 hover:text-amber-800"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase">Loại điều chỉnh</label>
                    <select 
                      value={bulkAdjustType} 
                      onChange={e => setBulkAdjustType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-700"
                    >
                      <option value="IN">Nhập thêm kho (+)</option>
                      <option value="OUT">Xuất bớt kho (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase">Số lượng thay đổi</label>
                    <input 
                      type="number" 
                      min="1"
                      value={bulkAdjustQty}
                      onChange={e => setBulkAdjustQty(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-700"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-amber-800 uppercase">Lý do điều chỉnh</label>
                    <input 
                      type="text" 
                      value={bulkAdjustReason}
                      onChange={e => setBulkAdjustReason(e.target.value)}
                      placeholder="Nhập lý do điều chỉnh..."
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setBulkAdjustOpen(false)} className="px-3 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-800">Hủy</button>
                  <button onClick={handleBulkAdjustSubmit} className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold">Xác nhận thực hiện</button>
                </div>
              </div>
            )}

          </div>

          {/* MAIN INVENTORY TABLE */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-4 w-12 text-center">
                      <button 
                        onClick={() => handleSelectAll(selectedProductIds.length !== paginatedProducts.length)}
                        className="text-slate-400 hover:text-slate-800 transition-colors"
                      >
                        {selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-slate-900" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4">Mặt hàng</th>
                    <th className="px-4 py-4">SKU / Barcode</th>
                    <th className="px-4 py-4 text-center">Số lượng</th>
                    <th className="px-4 py-4 text-right">Đơn giá bán</th>
                    <th className="px-4 py-4 text-right">Giá trị tồn kho</th>
                    <th className="px-4 py-4">Trạng thái</th>
                    <th className="px-5 py-4 text-right">Nhập/Xuất nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang kết nối hệ thống kho...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-slate-400">
                        <Package className="w-10 h-10 mx-auto opacity-10 mb-2" />
                        <span className="text-xs font-bold uppercase">Không tìm thấy bất kỳ mặt hàng nào thỏa mãn điều kiện lọc.</span>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => {
                      const isChecked = selectedProductIds.includes(product.id);
                      const isOutOfStock = product.stock === 0;
                      const isLowStock = product.stock > 0 && product.stock < warningThreshold;
                      const totalValue = product.stock * product.salePrice;

                      return (
                        <tr 
                          key={product.id} 
                          className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${
                            isChecked ? 'bg-blue-50/10' : ''
                          } ${isOutOfStock ? 'bg-rose-50/5' : ''}`}
                        >
                          {/* Selection Checkbox */}
                          <td className="px-5 py-4 text-center">
                            <button 
                              onClick={() => handleSelectOne(product.id, !isChecked)}
                              className="text-slate-400 hover:text-slate-800 transition-colors"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-slate-900" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Product Info */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={product.thumbnail || 'https://via.placeholder.com/60'} 
                                alt="" 
                                className="w-11 h-11 rounded-xl object-cover border border-slate-100 shadow-sm"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60'; }}
                              />
                              <div className="max-w-[280px]">
                                <div className="font-bold text-slate-900 text-sm truncate">{product.productName}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{product.categoryName || 'Không phân loại'}</div>
                              </div>
                            </div>
                          </td>

                          {/* SKU & Barcode */}
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-lg max-w-fit">
                                {product.sku}
                              </span>
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 italic">
                                <Barcode className="w-3.5 h-3.5" />
                                <span>{product.sku ? `BC-${product.id}${product.sku.replace('-', '')}` : 'Chưa gán Barcode'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="px-4 py-4 text-center">
                            <div className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-bold text-xs min-w-[44px] ${
                              isOutOfStock ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              isLowStock ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-slate-50 text-slate-800 border border-slate-200/20'
                            }`}>
                              {product.stock}
                            </div>
                          </td>

                          {/* Single price */}
                          <td className="px-4 py-4 text-right font-semibold text-slate-800 text-xs">
                            {formatCurrency(product.salePrice)}
                          </td>

                          {/* Inventory Value */}
                          <td className="px-4 py-4 text-right font-bold text-slate-900 text-xs">
                            {formatCurrency(totalValue)}
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-4">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-bold uppercase tracking-wider">🔴 Đã hết hàng</span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[9px] font-bold uppercase tracking-wider">⚠️ Sắp hết hàng</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-wider">🟢 Đang sẵn hàng</span>
                            )}
                          </td>

                          {/* Direct Actions: Nhập/Xuất nhanh */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => openAdjustModal(product, 'IN')}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                                title="Nhập thêm kho nhanh"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => openAdjustModal(product, 'OUT')}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                title="Xuất bớt kho nhanh"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                                title="Chỉnh sửa chi tiết hoặc phiên bản"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
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

            {/* Pagination panel */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
              <div className="text-xs text-slate-500 font-medium">
                Hiển thị dòng {page * pageSize + 1} - {Math.min((page + 1) * pageSize, filteredProducts.length)} trong tổng số **{filteredProducts.length}** sản phẩm.
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Số dòng hiển thị:</span>
                  <select 
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-700"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">Trang {page + 1} / {totalPages || 1}</span>
                  <button 
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab CONTENT: INVENTORY ADJUSTMENT HISTORY LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Tìm lịch sử theo Tên sản phẩm, mã SKU, lý do, người thực hiện..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900/5 outline-none font-medium transition-all text-sm"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="flex-1 lg:flex-none">
                  <select 
                    value={historyTypeFilter}
                    onChange={(e) => setHistoryTypeFilter(e.target.value)}
                    className="w-full lg:w-44 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="ALL">Tất cả nghiệp vụ</option>
                    <option value="IN">📥 Nhập kho</option>
                    <option value="OUT">📤 Xuất kho</option>
                    <option value="ADJUST">⚖️ Kiểm kho / Cân bằng</option>
                    <option value="SALE">🛍️ Bán hàng (Đơn hàng)</option>
                  </select>
                </div>

                <button 
                  onClick={handleClearHistory}
                  className="px-4 py-2.5 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-xl transition-all font-bold text-xs"
                >
                  Xóa lịch sử
                </button>
              </div>

            </div>
          </div>

          {/* History table log */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-4">Thời gian</th>
                    <th className="px-4 py-4">Sản phẩm</th>
                    <th className="px-4 py-4">Mã SKU</th>
                    <th className="px-4 py-4">Nghiệp vụ</th>
                    <th className="px-4 py-4 text-center">Số lượng điều chỉnh</th>
                    <th className="px-4 py-4 text-center">Số lượng tồn mới</th>
                    <th className="px-4 py-4">Lý do biến động</th>
                    <th className="px-5 py-4">Người thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-slate-400">
                        <History className="w-10 h-10 mx-auto opacity-10 mb-2" />
                        <span className="text-xs font-bold uppercase">Không tìm thấy bất kỳ ghi chép lịch sử kho nào.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryLogs.map((log) => {
                      const isPositive = log.quantity > 0;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-xs font-semibold text-slate-500 font-mono">
                            {log.timestamp}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-slate-900 text-xs">{log.productName}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-lg">
                              {log.sku}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {log.type === 'IN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold uppercase">📥 Nhập kho</span>
                            ) : log.type === 'OUT' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-bold uppercase">📤 Xuất kho</span>
                            ) : log.type === 'ADJUST' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[9px] font-bold uppercase">⚖️ Kiểm kho</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase">🛍️ Bán hàng</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-bold text-xs ${
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {isPositive ? `+${log.quantity}` : log.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-bold text-xs text-slate-800">
                            {log.balance}
                          </td>
                          <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                            {log.reason}
                          </td>
                          <td className="px-5 py-4 text-xs font-bold text-slate-800">
                            {log.actor}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab CONTENT: INVENTORY CONFIGURATION SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Settings className="w-6 h-6 text-slate-900" />
            <div>
              <h2 className="text-lg font-black text-slate-900">Cấu hình hệ thống cảnh báo tồn kho</h2>
              <p className="text-slate-500 text-xs">Cấu hình các ngưỡng cảnh báo kho dành cho chế độ Enterprise.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase block">Ngưỡng cảnh báo sắp hết hàng (Sản phẩm đơn lẻ) *</label>
              <p className="text-slate-400 text-[11px] font-medium">Khi số lượng tồn kho giảm xuống thấp hơn ngưỡng này, sản phẩm sẽ được dán nhãn màu vàng cảnh báo "Sắp hết" để thông báo cho thủ kho.</p>
              <div className="flex gap-2">
                <input 
                  type="number"
                  min="1"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(Number(e.target.value))}
                />
                <button 
                  onClick={() => handleSaveThreshold(warningThreshold)}
                  className="px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-200"
                >
                  Lưu cấu hình
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50 space-y-2.5">
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Lưu ý đồng bộ tự động
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                * Khi một đơn hàng mới được tạo lập ở tab <b>Bán hàng / Đơn hàng</b>, hệ thống kho sẽ tự động trừ đi số lượng tương ứng của mã SKU đó.<br />
                * Mọi nghiệp vụ nhập/xuất kho thủ công sẽ ghi đè lên số lượng và tạo một dòng ghi chép ở tab <b>Lịch sử biến động</b> nhằm phục vụ mục đích kiểm toán cuối tháng.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT DIALOG (Nhập/Xuất kho nhanh) */}
      {isAdjustModalOpen && adjustProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleQuickAdjustSubmit}
            className="bg-white rounded-3xl border border-slate-100 max-w-md w-full shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                {adjustType === 'IN' ? (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                    <span>Nghiệp vụ nhập kho hàng hóa</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-5 h-5 text-rose-600" />
                    <span>Nghiệp vụ xuất kho hàng hóa</span>
                  </>
                )}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              
              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200/20 flex items-center gap-3">
                <img src={adjustProduct.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 leading-tight">{adjustProduct.productName}</h4>
                  <span className="font-mono text-[9px] font-bold text-slate-500 bg-white border px-1.5 py-0.5 rounded mt-1 inline-block">{adjustProduct.sku}</span>
                </div>
              </div>

              {/* Quantities summary previews */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/10">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Tồn kho hiện tại</span>
                  <span className="text-sm font-bold text-slate-800">{adjustProduct.stock}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/10">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Số lượng thay đổi</span>
                  <span className={`text-sm font-black ${adjustType === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {adjustType === 'IN' ? `+${adjustQty}` : `-${adjustQty}`}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-xl border">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Số lượng tồn mới</span>
                  <span className="text-sm font-black">
                    {adjustType === 'IN' ? adjustProduct.stock + adjustQty : Math.max(0, adjustProduct.stock - adjustQty)}
                  </span>
                </div>
              </div>

              {/* Numeric Qty Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Số lượng nhập/xuất *</label>
                <input 
                  type="number"
                  min="1"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
                  value={adjustQty || ''}
                  onChange={(e) => setAdjustQty(Math.max(0, Number(e.target.value)))}
                />
              </div>

              {/* Reason string field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Lý do biến động kho *</label>
                {adjustType === 'IN' ? (
                  <select 
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="Nhập hàng từ nhà cung cấp">📥 Nhập hàng từ nhà cung cấp</option>
                    <option value="Khách trả hàng (Đơn trả)">📦 Khách trả hàng (Đơn trả)</option>
                    <option value="Cân bằng kho (Kiểm kho định kỳ)">⚖️ Cân bằng kho (Kiểm kho định kỳ)</option>
                  </select>
                ) : (
                  <select 
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="Xuất hủy hàng lỗi / hỏng">📤 Xuất hủy hàng lỗi / hỏng</option>
                    <option value="Xuất trả hàng nhà cung cấp">📦 Xuất trả hàng nhà cung cấp</option>
                    <option value="Cân bằng kho (Kiểm kho định kỳ)">⚖️ Cân bằng kho (Kiểm kho định kỳ)</option>
                  </select>
                )}
              </div>

            </div>

            {/* Modal actions buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                disabled={loading || adjustQty <= 0}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                  adjustType === 'IN' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                }`}
              >
                {loading ? 'Đang thực thi...' : 'Đồng ý ghi sổ'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Renders default Edit Detail variants Modal */}
      <InventoryModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          fetchInventory();
        }}
        product={selectedProduct}
      />

    </div>
  );
};
