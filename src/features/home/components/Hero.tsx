import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Loader2, Sparkles, Cpu, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bannerService, { type BannerResponse } from '@/services/api/bannerService';
import { getFullImageUrl } from '@/utils/image';

export const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await bannerService.getAllBanners();
        setBanners(data.filter(b => b.status === 1).sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [banners]);

  const next = () => setCurrent(prev => (prev + 1) % banners.length);
  const prev = () => setCurrent(prev => (prev - 1 + banners.length) % banners.length);

  // Generate glowing tech particle styles
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 6}s`,
      duration: `${15 + Math.random() * 15}s`,
      size: `${2 + Math.random() * 4}px`
    }));
  }, []);

  if (loading) {
    return (
      <div className="h-[650px] w-full bg-[#05020c] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-[0.4em] animate-pulse">Initializing Cyber Engine...</span>
      </div>
    );
  }

  // Fallback banner if none uploaded
  const activeBanners = banners.length > 0 ? banners : [
    {
      id: 999,
      title: 'iPhone 15 Pro Titanium',
      imageUrl: 'https://i.imgur.com/kX2p3B2.png',
      linkUrl: '/category/smartphones',
      sortOrder: 1,
      status: 1
    }
  ];

  return (
    <section className="relative h-[650px] w-full overflow-hidden bg-[#030008] border-b border-purple-950/20">
      
      {/* Inline Styles for Sci-Fi keyframes to avoid modifying global CSS */}
      <style>{`
        @keyframes float-tech {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.15); }
        }
        @keyframes laser-scan {
          0% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes particle-drift {
          0% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(30px, -50px); opacity: 0.7; }
          100% { transform: translate(0, 0); opacity: 0.3; }
        }
        .animate-float-tech {
          animation: float-tech 6s ease-in-out infinite;
        }
        .animate-glow-pulse {
          animation: glow-pulse 8s ease-in-out infinite;
        }
        .animate-laser-scan {
          animation: laser-scan 4s linear infinite;
        }
        .cyber-grid {
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
        }
      `}</style>

      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 cyber-grid opacity-75 z-0" />

      {/* Glowing Neon Background Auras */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[130px] rounded-full animate-glow-pulse pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] bg-cyan-600/10 blur-[140px] rounded-full animate-glow-pulse pointer-events-none z-0" style={{ animationDelay: '3s' }} />

      {/* Horizontal Laser Scanning Line */}
      <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-laser-scan pointer-events-none z-0" />

      {/* Floating Sparkles & Tech Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-purple-400/40"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
              animation: `particle-drift ${p.duration} ease-in-out infinite`,
              animationDelay: p.delay
            }}
          />
        ))}
      </div>

      {/* Main Slides */}
      {activeBanners.map((slide, index) => {
        const isCurrent = index === current;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center ${
              isCurrent ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-105 invisible'
            }`}
          >
            {/* High-Resolution Full-Screen Background Image Layer */}
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#030008]">
              <img 
                src={getFullImageUrl(slide.imageUrl)} 
                alt={slide.title} 
                className="w-full h-full object-cover object-center transition-all duration-[20s] ease-out"
                style={{
                  opacity: 1.0, // 100% bright, fully visible across the entire form
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://i.imgur.com/kX2p3B2.png';
                }}
              />
            </div>

            {/* Foreground Content */}
            <div className="container mx-auto px-6 lg:px-16 relative z-10 h-full flex items-center">
              
              {/* Text Side (Sci-Fi Glassmorphic Card Container for extreme readability and visual pop) */}
              <div className={`space-y-6 text-left max-w-2xl bg-[#030008]/40 border border-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.65)] border-purple-500/10 transition-all duration-1000 ${isCurrent ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                
                {/* Tech Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-[10px] font-mono font-black text-purple-300 uppercase tracking-widest">Futuristic Innovation</span>
                </div>

                {/* Cyberpunk Title */}
                <h1 className="text-5xl sm:text-7xl font-black text-white leading-tight tracking-tight uppercase">
                  {slide.title.split(' ').map((word, i) => {
                    const isLast = i === slide.title.split(' ').length - 1;
                    return (
                      <span key={i} className={isLast ? 'block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'mr-3'}>
                        {word}
                      </span>
                    );
                  })}
                </h1>

                {/* Subtitle / Tech Spec Bullet Points */}
                <div className="space-y-3 py-1 text-slate-300 font-medium text-sm sm:text-base leading-relaxed max-w-xl">
                  <p>Trải nghiệm chuẩn mực công nghệ tối tân nhất hành tinh. Sức mạnh đột phá từ bộ vi xử lý thế hệ mới đưa hiệu năng lên tầm cao chưa từng có.</p>
                  
                  {/* Subtle Tech Indicators */}
                  <div className="flex flex-wrap gap-4 pt-3 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Cpu size={12} className="text-purple-400" /> Bionic chip 4nm</span>
                    <span className="flex items-center gap-1.5"><Zap size={12} className="text-cyan-400 animate-bounce" /> Fast Charge 100W</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-400" /> 2-Year Warranty</span>
                  </div>
                </div>

                {/* Sci-Fi CTA Buttons with Glow & Halo */}
                <div className="pt-4 flex flex-wrap gap-4 items-center">
                  <button 
                    onClick={() => navigate(slide.linkUrl || '/category/smartphones')}
                    className="relative group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95 shadow-[0_0_25px_rgba(147,51,234,0.4)] flex items-center gap-2 overflow-hidden border border-purple-400/30"
                  >
                    {/* Hover light sheen effect */}
                    <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000" />
                    <span>Sở hữu ngay</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => navigate(slide.linkUrl || '/category/smartphones')}
                    className="px-7 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 hover:border-purple-500/40 rounded-xl text-xs font-black uppercase tracking-widest transition-all backdrop-blur-md"
                  >
                    Đặc quyền trả góp 0%
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })}

      {/* Glassmorphism Navigation Arrows */}
      {activeBanners.length > 1 && (
        <div className="hidden sm:block">
          <button 
            onClick={prev} 
            className="absolute left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-purple-500/20 flex items-center justify-center text-slate-400 hover:text-white transition-all z-20 backdrop-blur-md shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={next} 
            className="absolute right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-purple-500/20 flex items-center justify-center text-slate-400 hover:text-white transition-all z-20 backdrop-blur-md shadow-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Cyberpunk Interactive Dot Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-2xl backdrop-blur-lg shadow-xl z-20">
        {activeBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === current 
                ? 'w-8 bg-gradient-to-r from-purple-500 to-cyan-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]' 
                : 'w-2.5 bg-white/20 hover:bg-white/40'
            }`}
            title={`Chuyển đến Slide ${i + 1}`}
          />
        ))}
      </div>

    </section>
  );
};
