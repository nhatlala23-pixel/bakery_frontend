import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, MessageCircle } from 'lucide-react';
import contactSettingService, { type ContactSettingDTO } from '@/services/api/contactSettingService';

export const FloatingSocialWidget = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<ContactSettingDTO>({
    zaloUrl: 'https://zalo.me/0987654321',
    facebookUrl: 'https://facebook.com/gaubakery',
    tiktokUrl: 'https://tiktok.com/@gaubakery',
    hotline: '0987654321',
  });

  useEffect(() => {
    contactSettingService.getContactSetting()
      .then(res => {
        if (res) {
          setSettings({
            zaloUrl: res.zaloUrl || 'https://zalo.me/0987654321',
            facebookUrl: res.facebookUrl || 'https://facebook.com/gaubakery',
            tiktokUrl: res.tiktokUrl || 'https://tiktok.com/@gaubakery',
            hotline: res.hotline || '0987654321',
          });
        }
      })
      .catch(() => {});
  }, []);

  // Do not render on Admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-4 group">
      {/* 1. MESSENGER / FACEBOOK BUTTON */}
      <div className="relative flex items-center justify-end group/btn">
        {/* Pulsing Ripple Rings */}
        <div className="absolute -inset-2 rounded-full bg-indigo-500/25 animate-ping duration-1000 pointer-events-none" />
        <div className="absolute -inset-4 rounded-full bg-purple-400/20 animate-pulse pointer-events-none" />

        <a
          href={settings.facebookUrl}
          target="_blank"
          rel="noreferrer"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-all duration-300 z-10"
          aria-label="Nhắn tin Messenger"
        >
          {/* Messenger Icon */}
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.909 1.455 5.518 3.734 7.228V22l3.359-1.844c.91.252 1.879.388 2.907.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.09 12.352l-2.548-2.716-4.97 2.716 5.467-5.802 2.607 2.716 4.911-2.716-5.467 5.802z" />
          </svg>
        </a>

        {/* Tooltip */}
        <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
          Chat Facebook Messenger
        </div>
      </div>

      {/* 2. TIKTOK BUTTON */}
      <div className="relative flex items-center justify-end group/btn">
        {/* Pulsing Ripple Rings */}
        <div className="absolute -inset-2 rounded-full bg-slate-800/30 animate-ping duration-1000 pointer-events-none" />
        <div className="absolute -inset-4 rounded-full bg-slate-900/15 animate-pulse pointer-events-none" />

        <a
          href={settings.tiktokUrl}
          target="_blank"
          rel="noreferrer"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black flex items-center justify-center text-white shadow-lg shadow-black/40 hover:scale-110 active:scale-95 transition-all duration-300 z-10 border border-slate-800"
          aria-label="Xem Kênh TikTok"
        >
          {/* TikTok Icon */}
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-1.42V9.01a6.34 6.34 0 0 0-5.82 6.3 6.34 6.34 0 0 0 10.74 4.54 6.3 6.3 0 0 0 1.94-4.54V9.33a8.31 8.31 0 0 0 4.77 1.48V7.38a4.85 4.85 0 0 1-1.52-.69z" />
          </svg>
        </a>

        {/* Tooltip */}
        <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
          Theo dõi TikTok @gaubakery
        </div>
      </div>

      {/* 3. PHONE / HOTLINE BUTTON */}
      <div className="relative flex items-center justify-end group/btn">
        {/* Pulsing Ripple Rings */}
        <div className="absolute -inset-2 rounded-full bg-red-600/35 animate-ping duration-1000 pointer-events-none" />
        <div className="absolute -inset-4 rounded-full bg-red-500/20 animate-pulse pointer-events-none" />

        <a
          href={`tel:${settings.hotline}`}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/40 hover:scale-110 active:scale-95 transition-all duration-300 z-10 animate-bounce"
          aria-label="Gọi ngay Hotline"
        >
          <Phone className="w-6 h-6 animate-pulse" />
        </a>

        {/* Tooltip */}
        <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
          Gọi điện ngay: {settings.hotline}
        </div>
      </div>

      {/* 4. ZALO CHAT BUTTON */}
      <div className="relative flex items-center justify-end group/btn">
        {/* Pulsing Ripple Rings */}
        <div className="absolute -inset-2 rounded-full bg-blue-600/35 animate-ping duration-1000 pointer-events-none" />
        <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-pulse pointer-events-none" />

        <a
          href={settings.zaloUrl}
          target="_blank"
          rel="noreferrer"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/40 hover:scale-110 active:scale-95 transition-all duration-300 z-10"
          aria-label="Tư vấn Zalo"
        >
          <span className="font-extrabold text-sm tracking-tighter italic">Zalo</span>
        </a>

        {/* Tooltip */}
        <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
          Chat Zalo tư vấn bánh
        </div>
      </div>
    </div>
  );
};
