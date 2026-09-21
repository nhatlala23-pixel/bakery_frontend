import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react';
import userService, { type UserResponse } from '../../../services/api/userService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserResponse | null; // null = tạo mới, UserResponse = chỉnh sửa
}

export const UserModal = ({ isOpen, onClose, onSuccess, user }: UserModalProps) => {
  const isCreating = user === null;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    newPassword: '',
    phone: '',
    address: '',
    roleName: 'STAFF',
    roleId: 3,
    status: 1,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      // Chỉnh sửa: load dữ liệu user hiện tại
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        password: '',
        newPassword: '',
        phone: user.phone || '',
        address: user.address || '',
        roleName: user.roleName || 'USER',
        roleId: user.roleName === 'ADMIN' ? 1 : user.roleName === 'STAFF' ? 3 : 2,
        status: user.status ?? 1,
      });
    } else {
      // Tạo mới: reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        newPassword: '',
        phone: '',
        address: '',
        roleName: 'STAFF',
        roleId: 3,
        status: 1,
      });
    }
    setShowNewPassword(false);
    setError('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const roleOptions = [
    { label: 'Nhân viên (STAFF)', value: 'STAFF', id: 3 },
    { label: 'Quản trị viên (ADMIN)', value: 'ADMIN', id: 1 },
    { label: 'Khách hàng (USER)', value: 'USER', id: 2 },
  ];

  const handleRoleChange = (roleName: string) => {
    const opt = roleOptions.find(r => r.value === roleName);
    setFormData(prev => ({ ...prev, roleName, roleId: opt?.id ?? 2 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isCreating && !formData.password) {
      setError('Vui lòng nhập mật khẩu cho tài khoản mới.');
      return;
    }

    if (!isCreating && formData.newPassword && formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      if (isCreating) {
        await userService.createAccount({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          roleId: formData.roleId,
        });
      } else {
        await userService.updateUserByAdmin(user!.id, {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          roleName: formData.roleName,
          status: formData.status,
          ...(formData.newPassword.trim() ? { newPassword: formData.newPassword } : {}),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            {isCreating && <UserPlus className="w-5 h-5 text-indigo-600" />}
            <h3 className="text-lg font-bold text-gray-900">
              {isCreating ? 'Tạo tài khoản nhân viên mới' : 'Sửa thông tin người dùng'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Họ tên */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          {/* Email (chỉ hiện khi tạo mới) */}
          {isCreating && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          )}

          {/* Password (chỉ hiện khi tạo mới) */}
          {isCreating && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Tối thiểu 8 ký tự, chữ hoa, số, ký tự đặc biệt.</p>

              <p className="text-xs text-gray-400 mt-1">Gửi email + mật khẩu này cho nhân viên sau khi tạo.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* SĐT */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Số điện thoại</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Trạng thái (chỉ hiện khi chỉnh sửa) */}
            {!isCreating && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Trạng thái</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Vô hiệu hóa</option>
                </select>
              </div>
            )}
          </div>

          {/* Vai trò */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Vai trò (Phân quyền)</label>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleRoleChange(opt.value)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all ${formData.roleName === opt.value
                      ? opt.value === 'ADMIN'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : opt.value === 'STAFF'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                    }`}
                >
                  {opt.value === 'STAFF' ? '🧑‍💼 Nhân viên' : opt.value === 'ADMIN' ? '👑 Quản trị' : '👤 Khách hàng'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {formData.roleName === 'STAFF'
                ? '✅ Nhân viên: xem/quản lý sản phẩm & đơn hàng.'
                : formData.roleName === 'ADMIN'
                  ? '⚠️ Quản trị viên: toàn quyền truy cập hệ thống.'
                  : 'Khách hàng: chỉ mua sắm, không vào trang quản lý.'}
            </p>
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Địa chỉ</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Đặt lại mật khẩu (chỉ hiện khi chỉnh sửa) */}
          {!isCreating && (
            <div className="border border-dashed border-orange-200 bg-orange-50/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-500 text-[10px]">🔑</span>
                </div>
                <span className="text-sm font-bold text-orange-700">Đặt lại mật khẩu</span>
                <span className="text-xs text-orange-400 font-normal">(tùy chọn - để trống để giữ nguyên)</span>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                  className="w-full px-4 py-2.5 pr-12 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 outline-none transition-all text-sm"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.newPassword && formData.newPassword.length > 0 && formData.newPassword.length < 6 && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Mật khẩu phải có ít nhất 6 ký tự.
                </p>
              )}
              {formData.newPassword && formData.newPassword.length >= 6 && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  ✅ Mật khẩu hợp lệ — sẽ được cập nhật khi lưu.
                </p>
              )}
            </div>
          )}

          </div>

          {/* Actions - sticky footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isCreating ? <UserPlus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {loading ? 'Đang lưu...' : isCreating ? 'Tạo tài khoản' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
