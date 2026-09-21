import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, RotateCcw, UserCheck, UserX, Mail, Phone,
  FileDown, FileUp, ShieldAlert, ChevronLeft, ChevronRight, 
  Eye, CheckSquare, Square, Award, 
  X, Users, ShieldCheck, MapPin, Calendar, ShoppingBag
} from 'lucide-react';
import userService, { type UserResponse } from '@/services/api/userService';
import orderService, { type OrderResponse } from '@/services/api/orderService';
import * as XLSX from 'xlsx';

export const AdminCustomers = () => {
  const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isAdmin = currentUser.roleName === 'ADMIN';

  const [customers, setCustomers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tabs & Navigation
  const [activeTab, setActiveTab] = useState<'directory' | 'insights'>('directory');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [spendingFilter, setSpendingFilter] = useState<string>('ALL'); // ALL, VIP (>10M), regular, low

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Customer Detail Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UserResponse | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderResponse[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Bulk Selections
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Excel Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map of customer expenditures & order counts (Real DB matching helper)
  const [spendingMap, setSpendingMap] = useState<Record<number, { totalSpent: number, orderCount: number }>>({});

  // Fetch all customers & analyze their actual spending dynamically from the orders database
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const usersData = await userService.getAllUsersList();
      setCustomers(usersData || []);

      // Now fetch all orders to compute actual spending dynamically for each customer
      const ordersResponse = await orderService.getAllOrders(0, 1000);
      const ordersList = ordersResponse.content || [];

      const tempMap: Record<number, { totalSpent: number, orderCount: number }> = {};
      
      // Initialize with 0s
      usersData.forEach(u => {
        tempMap[u.id] = { totalSpent: 0, orderCount: 0 };
      });

      // Match orders (Note: Match either by userName/email or receiverPhone since orders are placed)
      ordersList.forEach(order => {
        // Let's match based on receiver phone or general mapping
        const matchingUser = usersData.find(u => 
          u.phone === order.receiverPhone || 
          u.fullName === order.receiverName || 
          order.receiverName.toLowerCase().includes(u.fullName.toLowerCase())
        );

        if (matchingUser) {
          const current = tempMap[matchingUser.id] || { totalSpent: 0, orderCount: 0 };
          tempMap[matchingUser.id] = {
            totalSpent: current.totalSpent + (order.orderStatus !== 'CANCELLED' ? order.totalAmount : 0),
            orderCount: current.orderCount + 1
          };
        }
      });

      setSpendingMap(tempMap);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch orders for a specific user when detail modal opens
  const fetchUserOrders = async (user: UserResponse) => {
    setLoadingOrders(true);
    try {
      // Fetch user specific orders from backend
      const data = await orderService.getUserOrders(user.id);
      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      // Fallback: Filter from all orders if specific endpoint returns error
      try {
        const allOrd = await orderService.getAllOrders(0, 1000);
        const filtered = (allOrd.content || []).filter(o => 
          o.receiverPhone === user.phone || 
          o.receiverName.toLowerCase().includes(user.fullName.toLowerCase())
        );
        setCustomerOrders(filtered);
      } catch (err) {
        setCustomerOrders([]);
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  // Trigger Detail View
  const handleViewCustomer = (customer: UserResponse) => {
    setSelectedCustomer(customer);
    fetchUserOrders(customer);
    setIsDetailOpen(true);
  };

  // Toggle Single Customer Status (Lock / Unlock)
  const handleToggleStatus = async (customer: UserResponse) => {
    const newStatus = customer.status === 1 ? 0 : 1;
    const actionText = newStatus === 1 ? 'Mở khóa' : 'Khóa';
    
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của ${customer.fullName}?`)) {
      try {
        await userService.updateStatus(customer.id, newStatus);
        alert(`${actionText} tài khoản thành công!`);
        fetchCustomers();
        // Update selected user status inside modal if open
        if (selectedCustomer?.id === customer.id) {
          setSelectedCustomer({ ...customer, status: newStatus });
        }
      } catch (error) {
        console.error('Failed to update status:', error);
        alert('Cập nhật trạng thái thất bại. Vui lòng thử lại!');
      }
    }
  };

  // Bulk Actions
  const handleBulkStatusChange = async (newStatus: number) => {
    const actionText = newStatus === 1 ? 'Mở khóa' : 'Khóa';
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} hàng loạt ${selectedIds.length} tài khoản đã chọn?`)) {
      setLoading(true);
      try {
        for (const id of selectedIds) {
          await userService.updateStatus(id, newStatus);
        }
        alert(`Đã ${actionText} thành công ${selectedIds.length} tài khoản!`);
        setSelectedIds([]);
        fetchCustomers();
      } catch (error) {
        console.error('Bulk action failed:', error);
        alert('Một vài tài khoản chưa thể cập nhật.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === 1).length;
    const locked = customers.filter(c => c.status !== 1).length;
    
    // VIP defined as users who spent > 5,000,000 đ
    const vipCount = Object.keys(spendingMap).filter(key => {
      const userId = Number(key);
      return (spendingMap[userId]?.totalSpent || 0) >= 5000000;
    }).length;

    return { total, active, locked, vipCount };
  }, [customers, spendingMap]);

  // Filters logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // 1. Search filter
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        (c.fullName?.toLowerCase().includes(term)) ||
        (c.email?.toLowerCase().includes(term)) ||
        (c.phone?.includes(term)) ||
        (c.address?.toLowerCase().includes(term));

      // 2. Status filter
      const matchStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && c.status === 1) ||
        (statusFilter === 'LOCKED' && c.status !== 1);

      // 3. Role filter
      const matchRole = roleFilter === 'ALL' || 
        (roleFilter === 'ADMIN' && c.roleName?.toUpperCase() === 'ADMIN') ||
        (roleFilter === 'USER' && c.roleName?.toUpperCase() !== 'ADMIN');

      // 4. Spending filter
      const spending = spendingMap[c.id]?.totalSpent || 0;
      let matchSpending = true;
      if (spendingFilter === 'VIP') {
        matchSpending = spending >= 5000000;
      } else if (spendingFilter === 'REGULAR') {
        matchSpending = spending > 0 && spending < 5000000;
      } else if (spendingFilter === 'NONE') {
        matchSpending = spending === 0;
      }

      return matchSearch && matchStatus && matchRole && matchSpending;
    });
  }, [customers, searchTerm, statusFilter, roleFilter, spendingFilter, spendingMap]);

  // Paginated customers
  const paginatedCustomers = useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, page, pageSize]);

  // Handle total page update
  useEffect(() => {
    setTotalPages(Math.ceil(filteredCustomers.length / pageSize));
    setPage(0);
  }, [filteredCustomers, pageSize]);

  // Selection controls
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedCustomers.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const targetList = selectedIds.length > 0 
      ? customers.filter(c => selectedIds.includes(c.id)) 
      : filteredCustomers;

    if (targetList.length === 0) {
      alert('Không có dữ liệu khách hàng nào để xuất!');
      return;
    }

    const dataToExport = targetList.map(c => {
      const statsInfo = spendingMap[c.id] || { totalSpent: 0, orderCount: 0 };
      return {
        'Mã ID': c.id,
        'Họ và tên': c.fullName,
        'Email': c.email,
        'Số điện thoại': c.phone || 'Chưa cập nhật',
        'Địa chỉ': c.address || 'Chưa cập nhật',
        'Tổng số đơn hàng': statsInfo.orderCount,
        'Tổng chi tiêu (VND)': statsInfo.totalSpent,
        'Vai trò': c.roleName || 'USER',
        'Trạng thái': c.status === 1 ? 'Hoạt động' : 'Bị khóa',
        'Ngày gia nhập': c.createdAt?.substring(0, 10) || 'Chưa rõ'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Khach Hang');

    // Auto fit widths
    const headers = Object.keys(dataToExport[0]);
    worksheet['!cols'] = headers.map((header) => {
      let maxLen = header.length;
      dataToExport.forEach(row => {
        const val = String(row[header as keyof typeof row] || '');
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: maxLen + 4 };
    });

    XLSX.writeFile(workbook, `Bao_cao_khach_hang_${new Date().toISOString().substring(0, 10)}.xlsx`);
    alert(`Đã xuất thành công ${dataToExport.length} khách hàng ra file Excel!`);
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
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
          alert('Không tìm thấy dữ liệu trong file Excel!');
          return;
        }

        setLoading(true);
        let updatedCount = 0;

        for (const row of data) {
          const id = row['Mã ID'] || row['id'] || row['ID'];
          const statusText = row['Trạng thái'] || row['status'] || row['Status'];
          
          if (id) {
            const userId = Number(id);
            let targetStatus = 1;
            if (statusText === 'Bị khóa' || statusText === '0' || statusText === 0) {
              targetStatus = 0;
            }

            // Call status API to update
            await userService.updateStatus(userId, targetStatus);
            updatedCount++;
          }
        }

        alert(`Đã cập nhật trạng thái thành công cho ${updatedCount} khách hàng từ Excel!`);
        fetchCustomers();
      } catch (err: any) {
        console.error('Import error:', err);
        alert('Có lỗi xảy ra khi nhập file Excel. Vui lòng đảm bảo cấu trúc file chứa cột "Mã ID" và "Trạng thái"!');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hệ Thống Quản Lý Khách Hàng</h1>
            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">CRM Enterprise</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Theo dõi lịch sử đơn hàng, tổng chi tiêu khách hàng, quản lý khóa/mở khóa tài khoản & xuất báo cáo Excel.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={fetchCustomers}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all font-bold text-xs text-slate-700 shadow-sm"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới danh sách
          </button>

          <button 
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold text-xs shadow-md"
            title="Xuất danh sách khách hàng ra file Excel"
          >
            <FileDown className="w-4 h-4" />
            Xuất Excel
          </button>

          {isAdmin && (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-xs shadow-md"
                title="Nhập Excel để cập nhật trạng thái khóa tài khoản"
              >
                <FileUp className="w-4 h-4 text-emerald-400" />
                Nhập Excel cập nhật
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportExcel} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-2xl border border-slate-100 max-w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'directory' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Khách Hàng</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'insights' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Phân Tích & VIP Insights</span>
        </button>
      </div>

      {activeTab === 'directory' && (
        <div className="space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Tổng khách</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.total}</div>
              <p className="text-[11px] text-slate-500 mt-1">Khách hàng đã đăng ký</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Hoạt động</span>
              </div>
              <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
              <p className="text-[11px] text-slate-500 mt-1">Đang hoạt động tốt</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Bị khóa</span>
              </div>
              <div className="text-2xl font-black text-rose-600">{stats.locked}</div>
              <p className="text-[11px] text-slate-500 mt-1">Tài khoản bị vô hiệu hóa</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Khách VIP</span>
              </div>
              <div className="text-2xl font-black text-amber-600">{stats.vipCount}</div>
              <p className="text-[11px] text-slate-500 mt-1">Chi tiêu trên 5.000.000đ</p>
            </div>

          </div>

          {/* Search and Filters */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Tìm kiếm theo Tên, Email, Số điện thoại, Địa chỉ..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900/5 outline-none font-medium transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trạng thái</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="LOCKED">Đang bị khóa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phân hạng chi tiêu</label>
                  <select 
                    value={spendingFilter}
                    onChange={(e) => setSpendingFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white"
                  >
                    <option value="ALL">Tất cả chi tiêu</option>
                    <option value="VIP">💎 Khách VIP (&gt;= 5M)</option>
                    <option value="REGULAR">🛍️ Có mua hàng (&lt; 5M)</option>
                    <option value="NONE">Chưa mua hàng (0đ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vai trò</label>
                  <select 
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700 focus:bg-white"
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="USER">Khách mua hàng</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Bulk Action Toolbar */}
            {selectedIds.length > 0 && (
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex items-center justify-between animate-pulse">
                <span className="text-xs font-bold text-blue-900">Đã chọn **{selectedIds.length}** tài khoản khách hàng</span>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => handleBulkStatusChange(0)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-rose-700"
                      >
                        <UserX size={12} /> Khóa hàng loạt
                      </button>
                      <button 
                        onClick={() => handleBulkStatusChange(1)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-emerald-700"
                      >
                        <UserCheck size={12} /> Mở khóa hàng loạt
                      </button>
                    </>
                  )}
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-emerald-700 shadow-md"
                  >
                    <FileDown size={12} /> Xuất Excel đã chọn
                  </button>
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* MAIN CUSTOMERS DIRECTORY TABLE */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-4 w-12 text-center">
                      <button 
                        onClick={() => handleSelectAll(selectedIds.length !== paginatedCustomers.length)}
                        className="text-slate-400 hover:text-slate-800"
                      >
                        {selectedIds.length === paginatedCustomers.length && paginatedCustomers.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-slate-900" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4">Khách hàng</th>
                    <th className="px-4 py-4">Liên hệ</th>
                    <th className="px-4 py-4 text-center">Số đơn hàng</th>
                    <th className="px-4 py-4 text-right">Tổng chi tiêu</th>
                    <th className="px-4 py-4">Vai trò</th>
                    <th className="px-4 py-4">Trạng thái</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-bold text-slate-400 uppercase">Đang liên kết CRM...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto opacity-10 mb-2" />
                        <span className="text-xs font-bold uppercase">Không tìm thấy khách hàng nào thỏa mãn điều kiện lọc.</span>
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((customer) => {
                      const isChecked = selectedIds.includes(customer.id);
                      const statsInfo = spendingMap[customer.id] || { totalSpent: 0, orderCount: 0 };
                      const isVip = statsInfo.totalSpent >= 5000000;

                      return (
                        <tr 
                          key={customer.id} 
                          className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${
                            isChecked ? 'bg-blue-50/10' : ''
                          } ${customer.status !== 1 ? 'bg-rose-50/5' : ''}`}
                        >
                          <td className="px-5 py-4 text-center">
                            <button 
                              onClick={() => handleSelectOne(customer.id, !isChecked)}
                              className="text-slate-400 hover:text-slate-800"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-slate-900" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {customer.avatar ? (
                                <img src={customer.avatar} alt="" className="w-10 h-10 rounded-full object-cover border" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                                  {customer.fullName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  <span>{customer.fullName}</span>
                                  {isVip && (
                                    <span className="text-amber-500" title="Khách hàng VIP">💎</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-semibold font-mono">ID: #{customer.id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="space-y-0.5 text-xs text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{customer.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{customer.phone || 'Chưa cập nhật'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-center font-bold text-xs text-slate-800">
                            {statsInfo.orderCount || '-'}
                          </td>

                          <td className="px-4 py-4 text-right font-bold text-xs text-slate-900">
                            {statsInfo.totalSpent > 0 ? formatCurrency(statsInfo.totalSpent) : '0đ'}
                          </td>

                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              customer.roleName?.toUpperCase() === 'ADMIN' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {customer.roleName || 'USER'}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            {customer.status === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-wider">🟢 Hoạt động</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-bold uppercase tracking-wider">🔴 Đang Khóa</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleViewCustomer(customer)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                                title="Xem chi tiết & lịch sử mua hàng"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              
                              {isAdmin && (
                                <button 
                                  onClick={() => handleToggleStatus(customer)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    customer.status === 1 
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' 
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                                  }`}
                                  title={customer.status === 1 ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                                >
                                  {customer.status === 1 ? (
                                    <UserX className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
              <div className="text-xs text-slate-500 font-medium">
                Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, filteredCustomers.length)} trong tổng số **{filteredCustomers.length}** khách hàng.
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Dòng hiển thị:</span>
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
                    className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">Trang {page + 1} / {totalPages || 1}</span>
                  <button 
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* INSIGHTS TAB */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Phân Tích & Phân Hạng Nhóm Khách Hàng VIP</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100 space-y-3">
                <h4 className="text-xs font-black text-amber-800 uppercase">🏆 Chính sách đãi ngộ hội viên VIP</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Tài khoản có tổng chi tiêu thực tế tích lũy từ **5.000.000đ** trở lên sẽ tự động được dán nhãn hội viên <b>VIP 💎</b>.<br />
                  Các hội viên VIP được hưởng các ưu đãi đặc quyền:<br />
                  * Chiết khấu tự động 5% cho mọi đơn hàng tiếp theo.<br />
                  * Miễn phí vận chuyển toàn quốc cho các hóa đơn mua hàng.<br />
                  * Nhận mã quà tặng sinh nhật định kỳ trị giá 500k.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase">📊 Thống kê nhóm hội viên hiện tại</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white p-3 rounded-xl border">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">VIP hạng Vàng</span>
                    <span className="text-lg font-black text-slate-900">{stats.vipCount}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Thành viên thường</span>
                    <span className="text-lg font-black text-slate-900">{stats.total - stats.vipCount}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DETAIL CUSTOMER PROFILE & PURCHASE HISTORY MODAL */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-5xl w-full shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-700 text-lg">
                  {selectedCustomer.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight flex items-center gap-2">
                    <span>Hồ Sơ Khách Hàng: {selectedCustomer.fullName}</span>
                    {selectedCustomer.status === 1 ? (
                      <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">Hoạt động</span>
                    ) : (
                      <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-wider">Đang bị khóa</span>
                    )}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Xem lịch sử hoạt động, chỉnh sửa trạng thái & thống kê giao dịch chi tiết.</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 bg-slate-50 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Split Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Personal info */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/40 space-y-4 max-h-fit">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b pb-2">📂 Thông tin liên hệ</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-xs">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-400">Email đăng ký</span>
                      <span className="font-semibold text-slate-700">{selectedCustomer.email}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-400">Số điện thoại</span>
                      <span className="font-semibold text-slate-700">{selectedCustomer.phone || 'Chưa cập nhật'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-400">Địa chỉ giao hàng</span>
                      <span className="font-semibold text-slate-700 leading-normal">{selectedCustomer.address || 'Chưa cập nhật'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-400">Ngày gia nhập</span>
                      <span className="font-semibold text-slate-700">{selectedCustomer.createdAt?.substring(0, 10) || 'Chưa rõ'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <Award className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block font-bold text-slate-400">Vai trò hệ thống</span>
                      <span className="font-bold text-slate-700 uppercase tracking-wider">{selectedCustomer.roleName || 'USER'}</span>
                    </div>
                  </div>
                </div>

                {/* Lock Action Button inside profile */}
                <div className="pt-4 border-t border-slate-200/50">
                  <button 
                    onClick={() => handleToggleStatus(selectedCustomer)}
                    className={`w-full py-2 px-4 text-xs font-bold text-white rounded-xl shadow transition-all flex items-center justify-center gap-2 ${
                      selectedCustomer.status === 1 
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                    }`}
                  >
                    {selectedCustomer.status === 1 ? (
                      <>
                        <UserX size={14} /> Khóa tài khoản hội viên
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} /> Kích hoạt tài khoản
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Columns: Purchase History */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-4.5 h-4.5 text-slate-800" />
                  <span>Lịch sử đặt mua hàng hóa ({customerOrders.length} đơn hàng)</span>
                </h4>

                {loadingOrders ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs font-bold uppercase">Đang liên kết đơn hàng...</span>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="bg-slate-50 py-12 rounded-2xl border text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto opacity-10 mb-1" />
                    <span className="text-xs font-bold uppercase">Khách hàng chưa có lịch sử phát sinh đơn hàng.</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {customerOrders.map(order => (
                      <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-3">
                        <div className="flex justify-between items-center text-xs border-b pb-2">
                          <span className="font-bold text-slate-900">Mã đơn: <b className="font-mono text-blue-600">{order.orderCode}</b></span>
                          <span className="text-slate-400 font-semibold">{order.createdAt?.substring(0, 16)}</span>
                        </div>

                        {/* Ordered items summary */}
                        <div className="space-y-2">
                          {order.items?.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-xs">
                              <span className="text-slate-700 font-medium truncate max-w-[280px]">
                                {item.productName} <span className="font-mono text-slate-400">({item.variantSku})</span>
                              </span>
                              <span className="text-slate-500 font-bold">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Bottom Total Amount and status tags */}
                        <div className="flex justify-between items-center pt-2 border-t text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              order.orderStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              order.orderStatus === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {order.orderStatus}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                          <span className="font-black text-slate-900">Tổng thanh toán: {formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
