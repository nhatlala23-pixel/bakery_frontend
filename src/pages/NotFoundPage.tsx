import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useState } from 'react';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden relative flex items-center justify-center py-20">
        
        {/* Background Decorative Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/15 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

        <div className="max-w-xl w-full mx-auto px-6 relative z-10 text-center space-y-8">
          
          {/* Animated 404 Header */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="text-[8rem] md:text-[11rem] font-black leading-none bg-gradient-to-b from-blue-400 via-indigo-400 to-[#0f172a] bg-clip-text text-transparent select-none filter drop-shadow-[0_10px_20px_rgba(59,130,246,0.15)]"
            >
              404
            </motion.div>
            
            {/* Floating Star/Sparkle Icon */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute top-4 right-12 md:right-16 text-yellow-400 opacity-80"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
          </div>

          {/* Heading and Description */}
          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white"
            >
              Không tìm thấy trang
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto"
            >
              Đường dẫn bạn đang truy cập không tồn tại, đã bị thay đổi hoặc tạm thời không khả dụng. Hãy thử tìm kiếm sản phẩm bên dưới.
            </motion.p>
          </div>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative max-w-md mx-auto"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm điện thoại, laptop, phụ kiện..."
              className="w-full bg-[#111827]/60 border border-slate-800 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-blue-500 transition-all text-white placeholder-slate-500 shadow-xl"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all group"
            >
              <Search size={18} className="text-white group-hover:scale-110 transition-transform" />
            </button>
          </motion.form>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.25)] flex items-center gap-2 group text-sm"
            >
              <Home className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay Lại</span>
            </button>
          </motion.div>

          {/* Quick Suggestion Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="pt-6 border-t border-slate-800/50 max-w-sm mx-auto"
          >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Bạn có thể quan tâm</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
              <Link to="/categories" className="text-blue-400 hover:underline">Danh mục</Link>
              <span className="text-slate-700">•</span>
              <Link to="/search?q=iPhone" className="text-blue-400 hover:underline">iPhone</Link>
              <span className="text-slate-700">•</span>
              <Link to="/search?q=Laptop" className="text-blue-400 hover:underline">Laptop</Link>
              <span className="text-slate-700">•</span>
              <Link to="/contact" className="text-blue-400 hover:underline">Liên hệ hỗ trợ</Link>
            </div>
          </motion.div>

        </div>
      </div>
    </MainLayout>
  );
};
