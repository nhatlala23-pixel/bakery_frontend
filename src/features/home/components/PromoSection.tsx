import { ArrowRight, Zap, Gift, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PromoSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Main Large Promo */}
          <div className="relative group overflow-hidden rounded-[3rem] bg-gray-900 h-[450px] flex items-center">
            <div className="absolute inset-0 opacity-40 group-hover:scale-110 transition-transform duration-[2s]">
              <img 
                src="https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000" 
                alt="Promo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            
            <div className="relative z-10 p-12 lg:p-16 space-y-6 max-w-lg">
              <div className="flex items-center gap-2 text-blue-400 font-black uppercase tracking-widest text-xs">
                <Zap size={16} fill="currentColor" />
                <span>Ưu đãi giới hạn</span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                iPhone 15 Pro <br/> <span className="text-blue-500">Giảm 5 Triệu</span>
              </h2>
              <p className="text-gray-400 text-lg font-medium">
                Sở hữu siêu phẩm titan với mức giá tốt nhất từ trước đến nay. Trả góp 0% qua thẻ tín dụng.
              </p>
              <button 
                onClick={() => navigate('/category/smartphones')}
                className="group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-black rounded-full hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20"
              >
                Mua ngay tại đây
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Two Smaller Banners or Features */}
          <div className="grid grid-cols-1 gap-8">
             {/* Card 1 */}
             <div className="relative group overflow-hidden rounded-[2.5rem] bg-indigo-900 flex-1 p-10 flex flex-col justify-center">
                <div className="absolute right-0 bottom-0 opacity-20 w-1/2 h-full">
                   <img src="https://www.apple.com/v/macbook-air/s/images/overview/hero/hero_static__f9p8ms9f46m6_large.jpg" alt="mac" className="w-full h-full object-contain" />
                </div>
                <div className="relative z-10 space-y-4">
                  <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Siêu Laptop</span>
                  <h3 className="text-3xl font-black text-white">MacBook M3 <br/> Mới Nhất</h3>
                  <p className="text-indigo-200 text-sm font-medium">Làm việc đỉnh cao, thời lượng pin cả ngày.</p>
                  <button className="text-xs font-black text-white uppercase tracking-widest border-b-2 border-white/30 hover:border-white transition-all pb-1 w-fit">Xem chi tiết</button>
                </div>
             </div>

             {/* Card 2 */}
             <div className="relative group overflow-hidden rounded-[2.5rem] bg-orange-100 flex-1 p-10 flex flex-col justify-center border border-orange-200">
                <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-80 group-hover:scale-110 transition-transform duration-700">
                   <Gift size={100} className="text-orange-400 opacity-20" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2 text-orange-600 font-black uppercase tracking-widest text-xs">
                    <ShieldCheck size={18} />
                    <span>Bảo hành vip</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900">Bảo Hành 2 Năm <br/> 1 Đổi 1</h3>
                  <p className="text-gray-600 text-sm font-medium">An tâm sử dụng với chính sách bảo hành độc quyền chỉ có tại TECHNO.</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};
