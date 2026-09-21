import { useState, useEffect } from 'react';
import { Search, Mail, Phone, ShieldCheck, ShieldAlert, Edit2, FileDown, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';
import userService, { type UserResponse } from '@/services/api/userService';
import { UserModal } from '../components/UserModal';

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [allUsersList, setAllUsersList] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const totalUsers = allUsersList.length;
  const activeUsers = allUsersList.filter(c => c.status === 1).length;
  const disabledUsers = allUsersList.filter(c => c.status !== 1).length;
  const adminUsers = allUsersList.filter(c => c.roleName === 'ADMIN').length;
  const staffUsers = allUsersList.filter(c => c.roleName === 'STAFF').length;

  const filteredUsers = users.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.fullName?.toLowerCase().includes(term)) ||
      (c.email?.toLowerCase().includes(term)) ||
      (c.phone?.includes(term))
    );
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers(page, 10);
      setUsers(response.content || []);
      setTotalPages(response.totalPages || 0);

      const allData = await userService.getAllUsersList();
      setAllUsersList(allData || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleEdit = (user: UserResponse) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    const listToExport = searchTerm ? filteredUsers : allUsersList;
    if (listToExport.length === 0) return alert('Không có dữ liệu để xuất!');
    const data = listToExport.map(u => ({
      'ID': u.id,
      'Họ và tên': u.fullName,
      'Email': u.email,
      'Số điện thoại': u.phone || 'Chưa cập nhật',
      'Vai trò': u.roleName === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng',
      'Trạng thái': u.status === 1 ? 'Hoạt động' : 'Bị khóa'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nguoi_Dung');
    XLSX.writeFile(wb, `Danh_Sach_Nguoi_Dung_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm">Xem và quản lý thông tin tài khoản người dùng trên hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" /> Tạo tài khoản nhân viên
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
          >
            <FileDown className="w-4 h-4" /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tổng tài khoản</p>
          <div className="text-2xl font-black text-gray-900">{totalUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-green-500 uppercase mb-1">Đang hoạt động</p>
          <div className="text-2xl font-black text-gray-900">{activeUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-purple-500 uppercase mb-1">Quản trị viên</p>
          <div className="text-2xl font-black text-gray-900">{adminUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-indigo-500 uppercase mb-1">Nhân viên</p>
          <div className="text-2xl font-black text-gray-900">{staffUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-red-500 uppercase mb-1">Bị vô hiệu hóa</p>
          <div className="text-2xl font-black text-gray-900">{disabledUsers}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-50 rounded-2xl focus:ring-2 focus:ring-black/5 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Liên hệ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Chưa có người dùng nào</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                        {user.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{user.fullName}</div>
                        <div className="text-xs text-gray-500">ID: #{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="w-3 h-3" /> {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3 h-3" /> {user.phone || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.roleName === 'ADMIN' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-50 text-purple-600 text-[10px] font-bold uppercase">
                        👑 Quản trị viên
                      </span>
                    ) : user.roleName === 'STAFF' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase">
                        🧑‍💼 Nhân viên
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                        👤 Khách hàng
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 1 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-bold uppercase">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold uppercase">
                        <ShieldAlert className="w-3 h-3 mr-1" /> Khóa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-400 font-bold">
            Hiển thị trang {page + 1} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 hover:bg-gray-50 border border-gray-100 rounded-lg disabled:opacity-30 transition-all text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 hover:bg-gray-50 border border-gray-100 rounded-lg disabled:opacity-30 transition-all text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
};
