import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Laptop, 
  Watch, 
  Headphones, 
  Gamepad2, 
  MousePointer2, 
  LayoutGrid, 
  Tv, 
  Camera, 
  Cpu, 
  Keyboard, 
  ChevronRight,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import categoryService, { type CategoryDTO } from '@/services/api/categoryService';
import { getFullImageUrl } from '@/utils/image';

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('điện thoại') || n.includes('phone') || n.includes('iphone')) return <Smartphone className="w-8 h-8" />;
  if (n.includes('laptop') || n.includes('máy tính') || n.includes('macbook')) return <Laptop className="w-8 h-8" />;
  if (n.includes('âm thanh') || n.includes('audio') || n.includes('loa') || n.includes('tai nghe')) return <Headphones className="w-8 h-8" />;
  if (n.includes('đồng hồ') || n.includes('watch')) return <Watch className="w-8 h-8" />;
  if (n.includes('game') || n.includes('playstation') || n.includes('nintendo')) return <Gamepad2 className="w-8 h-8" />;
  if (n.includes('phụ kiện') || n.includes('accessories')) return <MousePointer2 className="w-8 h-8" />;
  if (n.includes('tivi') || n.includes('tv') || n.includes('màn hình') || n.includes('monitor')) return <Tv className="w-8 h-8" />;
  if (n.includes('máy ảnh') || n.includes('camera')) return <Camera className="w-8 h-8" />;
  if (n.includes('bàn phím') || n.includes('keyboard')) return <Keyboard className="w-8 h-8" />;
  if (n.includes('smart') || n.includes('nhà thông minh') || n.includes('iot')) return <Cpu className="w-8 h-8" />;
  return <LayoutGrid className="w-8 h-8" />;
};

const getCategoryGlow = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('điện thoại') || n.includes('phone') || n.includes('iphone')) return 'from-blue-600/10 to-cyan-500/5 hover:shadow-blue-500/10';
  if (n.includes('laptop') || n.includes('máy tính') || n.includes('macbook')) return 'from-purple-600/10 to-pink-500/5 hover:shadow-purple-500/10';
  if (n.includes('âm thanh') || n.includes('audio') || n.includes('loa') || n.includes('tai nghe')) return 'from-orange-600/10 to-yellow-500/5 hover:shadow-orange-500/10';
  if (n.includes('đồng hồ') || n.includes('watch')) return 'from-green-600/10 to-emerald-500/5 hover:shadow-green-500/10';
  if (n.includes('game')) return 'from-red-600/10 to-rose-500/5 hover:shadow-red-500/10';
  return 'from-slate-300/20 to-slate-200/10 hover:shadow-slate-300/20';
};

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAllCategoriesList();
        setCategories(data.filter(c => c.status === 1));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const parents = categories.filter(c => !c.parentId || c.parentId === 0 || c.parentId === null);
  const getChildren = (parentId: number) => categories.filter(c => c.parentId === parentId);
  const displayCategories = parents.length > 0 ? parents : categories;

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đang tải danh mục...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-500/30 overflow-hidden relative pb-24">
        
        {/* Background Glowing Circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 pt-16 relative z-10">
          
          {/* Breadcrumbs */}
          <div className="flex items-center text-[10px] font-black text-gray-500 mb-8 uppercase tracking-[0.2em]">
            <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
            <ChevronRight size={12} className="mx-2" />
            <span className="text-blue-600">Tất cả danh mục</span>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Khám Phá Công Nghệ Mới</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-black tracking-tight text-gray-900"
            >
              Hệ Thống <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Danh Mục Sản Phẩm</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-gray-500 max-w-2xl mx-auto text-base"
            >
              Tìm kiếm nhanh chóng sản phẩm yêu thích thông qua hệ thống danh mục công nghệ được phân loại chi tiết và khoa học từ TECHNO.
            </motion.p>
          </div>

          {/* Categories Grid */}
          <motion.div 
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {displayCategories.map((parent) => {
              const children = getChildren(parent.id);
              const glowStyle = getCategoryGlow(parent.categoryName);

              return (
                <motion.div
                  key={parent.id}
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  className={`relative group bg-white border border-gray-100 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:border-blue-100 hover:shadow-xl shadow-sm overflow-hidden`}
                >
                  {/* Decorative internal glow background */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${glowStyle} rounded-full blur-[40px] opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      {parent.image ? (
                        <div className="w-14 h-14 bg-amber-50 border border-amber-200/60 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                          <img src={getFullImageUrl(parent.image)} alt={parent.categoryName} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-700 group-hover:bg-amber-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm flex-shrink-0">
                          {getCategoryIcon(parent.categoryName)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-amber-900 transition-colors">
                          {parent.categoryName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {parent.description || 'Khám phá bộ sưu tập mẫu bánh đa dạng và hấp dẫn'}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-[1px] bg-gray-100" />

                    {/* Subcategories / Child List */}
                    <div className="space-y-3">
                      {children.length > 0 ? (
                        children.map((child) => (
                          <Link 
                            key={child.id} 
                            to={`/category/${child.slug}`}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all text-sm group/item"
                          >
                            <span className="text-gray-700 font-medium group-hover/item:text-blue-600 transition-colors">{child.categoryName}</span>
                            <ChevronRight size={14} className="text-gray-400 group-hover/item:text-blue-600 group-hover/item:translate-x-0.5 transition-all" />
                          </Link>
                        ))
                      ) : (
                        <div className="text-xs text-gray-400 italic py-2 pl-2">
                          Chưa có danh mục con
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Action Button */}
                  <div className="mt-8 pt-4">
                    <button 
                      onClick={() => navigate(`/category/${parent.slug}`)}
                      className="w-full py-3.5 bg-gray-50 hover:bg-blue-600 hover:text-white border border-gray-200 hover:border-transparent text-gray-700 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                    >
                      <span>Xem tất cả sản phẩm</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Empty / Error state fallback */}
          {displayCategories.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-400">
                <Layers size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy danh mục nào</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">Hệ thống đang bảo trì danh sách danh mục. Vui lòng quay lại trang chủ.</p>
              <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-md">
                Quay lại trang chủ
              </Link>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
};
