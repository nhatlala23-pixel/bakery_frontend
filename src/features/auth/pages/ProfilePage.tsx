import { useState, useEffect } from 'react';
import { User, Package, MapPin, Phone, Mail, Camera, Loader2, ChevronRight, LogOut, ExternalLink, Shield, Key, Eye, EyeOff, Timer, CheckCircle2 } from 'lucide-react';
import userService from '@/services/api/userService';
import orderService, { type OrderResponse } from '@/services/api/orderService';
import { useNavigate } from 'react-router-dom';
import axiosClient from '@/services/api/axiosClient';

const getFullImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

export const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'security'>('profile');
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);
  const navigate = useNavigate();

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    avatar: ''
  });
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setAvatarUploading(true);
    setMessage(null);
    try {
      const response = await axiosClient.post<{ url: string }>('/upload', uploadData);
      const imageUrl = (response as any).url;
      
      setFormData(prev => ({ ...prev, avatar: imageUrl }));
      
      const updatedUser = await userService.updateProfile(user.id, {
        fullName: formData.fullName || user.fullName,
        phone: formData.phone || user.phone,
        address: formData.address || user.address,
        avatar: imageUrl
      });
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('userUpdate'));
      setMessage({ type: 'success', content: 'Cập nhật ảnh đại diện thành công!' });
    } catch (error) {
      console.error('Upload avatar failed:', error);
      setMessage({ type: 'error', content: 'Tải ảnh đại diện lên thất bại!' });
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    setFormData({
      fullName: userData.fullName || '',
      phone: userData.phone || '',
      address: userData.address || '',
      avatar: userData.avatar || ''
    });
    fetchData(userData.id);
  }, []);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const fetchData = async (userId: number) => {
    setIsLoading(true);
    try {
      const userOrders = await orderService.getUserOrders(userId);
      setOrders(userOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    try {
      const updatedUser = await userService.updateProfile(user.id, formData);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('userUpdate'));
      setIsEditing(false);
      setMessage({ type: 'success', content: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      setMessage({ type: 'error', content: 'Cập nhật thất bại. Vui lòng thử lại.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      fullName: user.fullName || '',
      phone: user.phone || '',
      address: user.address || '',
      avatar: user.avatar || ''
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleRequestOTP = async () => {
    if (countdown > 0) return;
    setIsUpdating(true);
    try {
      await userService.requestPasswordOTP(user.id);
      setOtpSent(true);
      setCountdown(60);
      setMessage({ type: 'success', content: 'Mã OTP đã được gửi về email của bạn!' });
    } catch (error: any) {
      setMessage({ type: 'error', content: error.response?.data?.message || 'Gửi OTP thất bại.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      setMessage({ type: 'error', content: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', content: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    if (!passwordForm.otp) {
      setMessage({ type: 'error', content: 'Vui lòng nhập mã OTP.' });
      return;
    }

    setIsUpdating(true);
    try {
      await userService.changePassword(user.id, passwordForm);
      setMessage({ type: 'success', content: 'Đổi mật khẩu thành công!' });
      setPasswordForm({ newPassword: '', confirmPassword: '', otp: '' });
      setOtpSent(false);
    } catch (error: any) {
      setMessage({ type: 'error', content: error.response?.data?.message || 'Đổi mật khẩu thất bại.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-gray-500 hover:text-black transition-all mb-8 w-max"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:bg-gray-50 transition-all">
            <ChevronRight size={18} className="rotate-180" />
          </div>
          <span className="text-sm font-bold tracking-tight">Quay lại trang chủ</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative group mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg overflow-hidden">
                    {avatarUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : formData.avatar ? (
                      <img src={getFullImageUrl(formData.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.fullName?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <input
                    type="file"
                    id="avatar-input"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                  />
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => document.getElementById('avatar-input')?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md text-gray-500 hover:text-blue-600 transition-colors border border-gray-100 disabled:opacity-50"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{user?.fullName}</h3>
                <p className="text-gray-500 text-xs mt-1">{user?.email}</p>
                <span className="mt-3 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {user?.roleName || 'Customer'}
                </span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                    activeTab === 'profile' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User size={18} />
                    <span className="text-sm font-semibold">Thông tin cá nhân</span>
                  </div>
                  <ChevronRight size={16} className={activeTab === 'profile' ? 'opacity-100' : 'opacity-0'} />
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                    activeTab === 'security' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} />
                    <span className="text-sm font-semibold">Bảo mật tài khoản</span>
                  </div>
                  <ChevronRight size={16} className={activeTab === 'security' ? 'opacity-100' : 'opacity-0'} />
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                    activeTab === 'orders' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package size={18} />
                    <span className="text-sm font-semibold">Đơn hàng của tôi</span>
                  </div>
                  <ChevronRight size={16} className={activeTab === 'orders' ? 'opacity-100' : 'opacity-0'} />
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all mt-4"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-semibold">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h2>
                    <p className="text-sm text-gray-500 mt-1">Quản lý và cập nhật thông tin tài khoản của bạn.</p>
                  </div>
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2"
                    >
                      <User size={14} /> Chỉnh sửa
                    </button>
                  ) : (
                    <button 
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-50 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-100 transition-all"
                    >
                      Hủy bỏ
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {message && activeTab === 'profile' && (
                    <div className={`p-4 rounded-2xl text-sm font-medium animate-in fade-in zoom-in duration-300 ${
                      message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <Shield size={16} />}
                        {message.content}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-2 uppercase tracking-wider">
                        <User size={12} className="text-blue-500" /> Họ và tên
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        disabled={!isEditing}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className={`w-full px-4 py-3.5 rounded-2xl outline-none transition-all font-medium ${
                          isEditing 
                          ? 'bg-white border border-blue-500 ring-4 ring-blue-500/10 text-gray-900' 
                          : 'bg-gray-50 border border-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div className="space-y-2 opacity-60">
                      <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-2 uppercase tracking-wider">
                        <Mail size={12} className="text-blue-500" /> Email (Không thể thay đổi)
                      </label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="w-full px-4 py-3.5 bg-gray-100 border border-gray-100 rounded-2xl cursor-not-allowed font-medium text-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-2 uppercase tracking-wider">
                        <Phone size={12} className="text-blue-500" /> Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        disabled={!isEditing}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className={`w-full px-4 py-3.5 rounded-2xl outline-none transition-all font-medium ${
                          isEditing 
                          ? 'bg-white border border-blue-500 ring-4 ring-blue-500/10 text-gray-900' 
                          : 'bg-gray-50 border border-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                        
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-2 uppercase tracking-wider">
                        <MapPin size={12} className="text-blue-500" /> Địa chỉ
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        disabled={!isEditing}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className={`w-full px-4 py-3.5 rounded-2xl outline-none transition-all font-medium ${
                          isEditing 
                          ? 'bg-white border border-blue-500 ring-4 ring-blue-500/10 text-gray-900' 
                          : 'bg-gray-50 border border-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-4 flex gap-3">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-8 py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 active:scale-95 flex items-center gap-2"
                      >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu thay đổi'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-8 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Bảo mật tài khoản</h2>
                  <p className="text-sm text-gray-500 mt-1">Thay đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
                  {message && activeTab === 'security' && (
                    <div className={`p-4 rounded-2xl text-sm font-medium animate-in fade-in zoom-in duration-300 ${
                      message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <Shield size={16} />}
                        {message.content}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Key size={14} className="text-blue-500" /> Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                          placeholder="••••••••"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 ml-1">
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${/.*[A-Z].*/.test(passwordForm.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${/.*[A-Z].*/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                          Chữ hoa
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${/.*[a-z].*/.test(passwordForm.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${/.*[a-z].*/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                          Chữ thường
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${/.*\d.*/.test(passwordForm.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${/.*\d.*/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                          Chữ số
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${/.*[@$!%*?&].*/.test(passwordForm.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${/.*[@$!%*?&].*/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                          Ký tự đặc biệt
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Key size={14} className="text-blue-500" /> Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2 pt-4">
                      <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                        <Mail size={14} className="text-blue-500" /> Mã xác thực (OTP)
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          maxLength={6}
                          value={passwordForm.otp}
                          onChange={(e) => setPasswordForm({...passwordForm, otp: e.target.value})}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-center tracking-[0.5em] text-lg"
                          placeholder="000000"
                        />
                        <button
                          type="button"
                          disabled={countdown > 0 || isUpdating}
                          onClick={handleRequestOTP}
                          className="px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-2xl hover:bg-blue-100 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap min-w-[140px] justify-center"
                        >
                          {countdown > 0 ? (
                            <>
                              <Timer size={16} />
                              {countdown}s
                            </>
                          ) : otpSent ? 'Gửi lại mã' : 'Nhận mã OTP'}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 ml-1">
                        * Mã OTP sẽ được gửi đến email: <b>{user?.email}</b>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isUpdating || !otpSent}
                      className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-500 min-h-[500px]">
                <div className="mb-8 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h2>
                    <p className="text-sm text-gray-500 mt-1">Lịch sử và trạng thái các đơn hàng bạn đã đặt.</p>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{orders.length} đơn hàng</span>
                </div>

                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                      <Package size={40} />
                    </div>
                    <h3 className="font-bold text-gray-900">Chưa có đơn hàng nào</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs">Hãy bắt đầu mua sắm và các đơn hàng của bạn sẽ xuất hiện tại đây.</p>
                    <button 
                      onClick={() => navigate('/')}
                      className="mt-6 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all"
                    >
                      Mua sắm ngay
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                              <Package size={20} />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Mã đơn hàng</div>
                              <div className="font-bold text-gray-900">#{order.orderCode}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Ngày đặt</div>
                              <div className="font-semibold text-gray-900 text-sm">
                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              order.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-600' :
                              order.orderStatus === 'SHIPPING' ? 'bg-blue-100 text-blue-600' :
                              order.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                          <div className="flex -space-x-3">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="w-10 h-10 rounded-lg border-2 border-white bg-white overflow-hidden shadow-sm">
                                <img src={item.productImage || '/placeholder.png'} alt="Product" className="w-full h-full object-contain" />
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-10 h-10 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Tổng cộng</div>
                              <div className="font-bold text-blue-600">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                              </div>
                            </div>
                            <button 
                              onClick={() => navigate(`/profile/orders/${order.id}`)}
                              className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-blue-600"
                            >
                              <ExternalLink size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
