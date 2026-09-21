import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bannerService, { type BannerResponse } from '@/services/api/bannerService';
import categoryService, { type CategoryDTO } from '@/services/api/categoryService';
import { getFullImageUrl } from '@/utils/image';

const catIcons: Record<string, string> = {
  'điện thoại': '📱', 'phone': '📱',
  'laptop': '💻', 'máy tính': '💻',
  'tablet': '📲', 'tai nghe': '🎧',
  'audio': '🔊', 'loa': '🔊',
  'đồng hồ': '⌚', 'watch': '⌚',
  'máy ảnh': '📷', 'camera': '📷',
  'game': '🎮', 'bàn phím': '⌨️',
  'chuột': '🖱️', 'phụ kiện': '🔌',
  'sạc': '🔋', 'màn hình': '🖥️',
  'mạng': '📡', 'tivi': '📺',
};

const getCatIcon = (name: string) => {
  const lower = name.toLowerCase();
  for (const key of Object.keys(catIcons)) {
    if (lower.includes(key)) return catIcons[key];
  }
  return '📦';
};

const POLICIES = [
  { label: 'Miễn phí vận chuyển', sub: 'Đơn từ 499k', icon: '🚚' },
  { label: 'Đổi trả dễ dàng', sub: 'Trong 7 ngày', icon: '🔄' },
  { label: 'Chính hãng 100%', sub: 'Cam kết 100%', icon: '✔' },
  { label: 'Hỗ trợ 24/7', sub: '1900 1234', icon: '🎧' },
];

export const HeroWithSidebar = () => {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    bannerService.getAllBanners()
      .then(d => setBanners(d.filter(b => b.status === 1).sort((a, b) => a.sortOrder - b.sortOrder)))
      .catch(() => {});
    categoryService.getAllCategoriesList()
      .then(d => setCategories(d.filter(c => c.status === 1)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % banners.length), 3000);
    return () => clearInterval(t);
  }, [banners]);

  const prev = () => setCurrent(p => (p - 1 + banners.length) % banners.length);
  const next = () => setCurrent(p => (p + 1) % banners.length);

  const slides = banners.length > 0 ? banners : [
    { id: 0, title: '', imageUrl: '', linkUrl: '/', sortOrder: 1, status: 1 }
  ];

  return (
    <section className="bg-white pt-6 pb-4">
      <div className="max-w-[1440px] mx-auto px-[20px]">
        {/* Hero Section */}
        <div className="flex gap-6 items-stretch h-[350px]">
          {/* Cột trái: Danh mục sản phẩm (20%) */}
          <div className="w-1/5 bg-white rounded-[12px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col overflow-hidden">
            <div className="bg-[#5c3cff] px-4 py-3 flex items-center gap-2 shrink-0">
              <span className="text-white text-sm font-bold uppercase tracking-wide">
                ☰ Danh mục sản phẩm
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-gray-50 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[16px] shrink-0 leading-none group-hover:scale-110 transition-transform">
                      {getCatIcon(cat.categoryName)}
                    </span>
                    <span className="text-[14px] font-medium text-gray-700 group-hover:text-[#5c3cff] truncate transition-colors">
                      {cat.categoryName}
                    </span>
                  </div>
                  <ArrowIcon size={14} className="text-gray-300 group-hover:text-[#5c3cff] transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Cột phải: Banner Slider (80%) */}
          <div className="w-4/5 relative rounded-[16px] overflow-hidden group shadow-sm bg-gray-100 h-full">
            {slides.map((b, i) => (
              <div
                key={b.id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                {b.imageUrl ? (
                  <>
                    <img
                      src={getFullImageUrl(b.imageUrl)}
                      alt={b.title}
                      draggable={false}
                      className="w-full h-full object-cover object-center select-none cursor-pointer"
                      onClick={() => b.linkUrl && navigate(b.linkUrl)}
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/1200x350/e0e7ff/6366f1?text=Banner';
                      }}
                    />
                    {/* Banner Overlay Text & Button */}
                    {b.title && (
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent pointer-events-none flex flex-col justify-center px-12 md:px-16 z-0">
                        <h2 className="text-white text-3xl md:text-4xl font-black max-w-lg leading-tight drop-shadow-lg mb-6 animate-in fade-in slide-in-from-left-4 duration-700">
                          {b.title}
                        </h2>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (b.linkUrl) navigate(b.linkUrl);
                          }}
                          className="bg-gradient-to-r from-[#5c3cff] to-blue-600 hover:from-blue-600 hover:to-[#5c3cff] text-white px-8 py-3 rounded-xl font-bold w-max shadow-lg shadow-blue-500/30 hover:scale-105 hover:shadow-blue-500/50 transition-all pointer-events-auto uppercase tracking-widest text-sm flex items-center gap-2"
                        >
                          Mua ngay
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-100 to-purple-100">
                    <span className="text-indigo-300 font-bold text-lg">Chưa có banner</span>
                  </div>
                )}
              </div>
            ))}

            {/* Banner Controls */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Indicators */}
            {slides.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-[#5c3cff]' : 'w-2 bg-white/70 hover:bg-white'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chính sách bán hàng */}
        <div className="mt-8 grid grid-cols-4 gap-6">
          {POLICIES.map((p, i) => (
            <div
              key={i}
              className="bg-white rounded-[12px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-gray-50 p-4 flex items-center gap-4 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all cursor-default"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-xl shrink-0">
                {p.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-800 leading-tight mb-1 truncate">{p.label}</p>
                <p className="text-[12px] text-gray-500 leading-tight truncate">{p.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
