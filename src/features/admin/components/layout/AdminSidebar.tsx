import { LayoutDashboard, Package, ShoppingCart, Users, BarChart2, Layers, Tags, Ticket, Image as ImageIcon, CreditCard, MessageSquare, Award, Box, ShieldCheck, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navGroups = [
  {
    title: 'TỔNG QUAN',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    title: 'SẢN PHẨM & NỘI DUNG',
    items: [
      { name: 'Danh mục bánh', path: '/admin/categories', icon: Layers },
      { name: 'Sản phẩm', path: '/admin/products', icon: Package },
      { name: 'Bộ sưu tập', path: '/admin/collections', icon: ImageIcon },
      { name: 'Bài viết (Blog)', path: '/admin/blogs', icon: MessageSquare },
      { name: 'Thư viện ảnh', path: '/admin/gallery', icon: ImageIcon },
    ]
  },
  {
    title: 'TƯƠNG TÁC',
    items: [
      { name: 'Banner', path: '/admin/banners', icon: ImageIcon },
      { name: 'Khách liên hệ', path: '/admin/contacts', icon: Users },
    ]
  },
  {
    title: 'HỆ THỐNG',
    items: [
      { name: 'Người dùng', path: '/admin/users', icon: ShieldCheck },
      { name: 'Cấu hình & Logo', path: '/admin/settings', icon: Settings },
    ]
  }
];

import { useState, useEffect } from 'react';
import contactSettingService from '@/services/api/contactSettingService';

export const AdminSidebar = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const roleName = user.roleName || '';

  const getFullImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const loadLogo = () => {
      contactSettingService.getContactSetting()
        .then(res => {
          if (res?.logoUrl) setLogoUrl(res.logoUrl);
        })
        .catch(() => {});
    };
    loadLogo();
    window.addEventListener('logoUpdate', loadLogo);
    return () => window.removeEventListener('logoUpdate', loadLogo);
  }, []);

  const filteredNavGroups = navGroups.map(group => {
    const items = group.items.filter(item => {
      if (roleName === 'ADMIN') return true;
      if (roleName === 'STAFF') {
        const allowedPathsForStaff = [
          '/admin',
          '/admin/products',
          '/admin/categories',
          '/admin/collections',
          '/admin/blogs',
          '/admin/gallery',
          '/admin/banners',
          '/admin/contacts',
        ];
        return allowedPathsForStaff.includes(item.path);
      }
      return false;
    });
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  return (
    <aside className="w-64 bg-brand-light border-r border-brand-secondary flex flex-col h-screen sticky top-0 overflow-y-auto custom-scrollbar">
      <div className="p-6 pb-6 sticky top-0 bg-brand-light z-10 border-b border-brand-secondary flex items-center gap-3">
        {logoUrl ? (
          <img 
            src={getFullImageUrl(logoUrl)} 
            alt="Logo Gấu Bakery" 
            className="w-10 h-10 object-contain rounded-lg border border-brand-secondary p-0.5 bg-white shrink-0" 
          />
        ) : null}
        <div>
          <h1 className="text-xl font-serif font-bold tracking-tight text-brand-dark leading-none">
            Gấu<span className="text-brand-accent italic">Bakery</span>
          </h1>
          <span className="text-[10px] font-bold tracking-widest uppercase text-brand-muted">Admin Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-6">
        {filteredNavGroups.map((group, index) => (
          <div key={index}>
            <h3 className="px-4 text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 rounded-xl font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-accent text-white shadow-sm'
                        : 'text-brand-dark hover:bg-brand-secondary'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};
