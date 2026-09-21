import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import contactSettingService, { type ContactSettingDTO } from '@/services/api/contactSettingService';

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const TiktokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
);

export const Footer = () => {
  const [settings, setSettings] = useState<ContactSettingDTO | null>(null);

  useEffect(() => {
    const loadSettings = () => {
      contactSettingService.getContactSetting()
        .then(res => setSettings(res))
        .catch(() => {});
    };
    loadSettings();
    window.addEventListener('logoUpdate', loadSettings);
    return () => window.removeEventListener('logoUpdate', loadSettings);
  }, []);

  return (
    <footer className="bg-brand-dark text-brand-light pt-24 pb-12 font-sans border-t-[8px] border-brand-accent">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Info */}
          <div className="space-y-8">
            <Link to="/" className="text-3xl font-serif font-bold tracking-tight inline-block">
              Gấu<span className="text-brand-accent italic">Bakery</span>
            </Link>
            <p className="text-brand-light/70 text-sm leading-relaxed">
              Mỗi ngày tại Gấu Bakery là một câu chuyện ngọt ngào được kể bằng hương vị của các loại bánh tươi nóng hổi, làm bằng sự tận tâm và nguyên liệu cao cấp.
            </p>
            <div className="flex gap-4">
              <a href={settings?.facebookUrl || 'https://facebook.com/gaubakery'} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-accent hover:text-brand-dark transition-all duration-300">
                <FacebookIcon />
              </a>
              <a href={settings?.instagramUrl || 'https://instagram.com/gaubakery'} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-accent hover:text-brand-dark transition-all duration-300">
                <InstagramIcon />
              </a>
              <a href={settings?.tiktokUrl || 'https://tiktok.com/@gaubakery'} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-accent hover:text-brand-dark transition-all duration-300">
                <TiktokIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-8">
            <h4 className="text-sm font-serif font-medium uppercase tracking-[0.2em] text-brand-accent">Khám phá</h4>
            <ul className="space-y-4">
              {[
                { name: 'Bánh kem sinh nhật', path: '/category/banh-kem' },
                { name: 'Bánh ngọt (Pastry)', path: '/category/banh-ngot' },
                { name: 'Bánh mặn & Sandwich', path: '/category/banh-man' },
                { name: 'Combo Quà tặng', path: '/category/combo' },
                { name: 'Bộ sưu tập', path: '/collections' }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-brand-light/70 hover:text-brand-accent text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-8">
            <h4 className="text-sm font-serif font-medium uppercase tracking-[0.2em] text-brand-accent">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-brand-light/70 text-sm">
                <div className="mt-0.5"><Phone size={18} className="text-brand-accent" /></div>
                <span>{settings?.hotline || '0987 654 321'}</span>
              </li>
              <li className="flex items-start gap-3 text-brand-light/70 text-sm">
                <div className="mt-0.5"><Mail size={18} className="text-brand-accent" /></div>
                <span>{settings?.email || 'contact@gaubakery.com'}</span>
              </li>
              <li className="flex items-start gap-3 text-brand-light/70 text-sm">
                <div className="mt-0.5"><MapPin size={18} className="text-brand-accent" /></div>
                <span>{settings?.address || '123 Đường Ba Tháng Hai, Quận 10, TP. HCM'}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-8">
            <h4 className="text-sm font-serif font-medium uppercase tracking-[0.2em] text-brand-accent">Bản tin</h4>
            <p className="text-brand-light/70 text-sm">Nhận ưu đãi sớm nhất và tin tức về các bộ sưu tập bánh mới.</p>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Email của bạn..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-sm text-brand-light placeholder:text-white/30 focus:outline-none focus:border-brand-accent transition-colors"
              />
              <button className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center hover:bg-white hover:text-brand-dark transition-colors text-brand-dark">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <p className="text-brand-light/40 text-xs tracking-wider">
            © 2026 Gấu Bakery. Tinh túy từ đôi bàn tay Việt.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/policies?tab=terms" className="text-brand-light/40 hover:text-brand-light transition-colors text-xs tracking-widest uppercase">Điều khoản</Link>
            <Link to="/policies?tab=privacy" className="text-brand-light/40 hover:text-brand-light transition-colors text-xs tracking-widest uppercase">Bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
