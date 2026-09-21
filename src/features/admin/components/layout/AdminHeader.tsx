import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminHeader = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const fullName = user.fullName || 'Admin Gấu Bakery';
  const roleName = user.roleName || 'ADMIN';
  const displayRole = roleName === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'NHÂN VIÊN HỆ THỐNG';

  const handleLogout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  return (
    <header className="h-20 bg-brand-light flex items-center justify-end px-8 sticky top-0 z-10 border-b border-brand-secondary">
      <div className="flex items-center space-x-6">
        <button className="relative text-brand-dark hover:text-brand-accent transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-brand-accent rounded-full border border-white"></span>
        </button>

        <div className="h-8 w-px bg-brand-secondary"></div>

        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-bold text-brand-dark">{fullName}</p>
            <p className="text-xs text-brand-muted">{displayRole}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-accent overflow-hidden border-2 border-brand-light shadow-sm flex items-center justify-center">
             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=C96F6F&color=FFF`} alt="User Avatar" className="w-full h-full object-cover" />
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
          title="Đăng xuất"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

