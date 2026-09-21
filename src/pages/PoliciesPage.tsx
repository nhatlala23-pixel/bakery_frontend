import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Truck, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  HeartHandshake,
  BookOpen
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

type TabType = 'warranty' | 'privacy' | 'shipping';

export const PoliciesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab') as TabType;
  
  const [activeTab, setActiveTab] = useState<TabType>('warranty');

  useEffect(() => {
    if (activeTabFromUrl && ['warranty', 'privacy', 'shipping'].includes(activeTabFromUrl)) {
      setActiveTab(activeTabFromUrl);
    }
  }, [activeTabFromUrl]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
    transition: { duration: 0.4 }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden relative pb-24 pt-16">
        
        {/* Background Decorative Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Chính sách cửa hàng</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase">
              Điều Khoản & <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Chính Sách</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Chào mừng bạn đến với TECHNO. Để đảm bảo quyền lợi tốt nhất cho việc mua sắm, vui lòng tham khảo chi tiết các quy định của chúng tôi.
            </p>
          </div>

          {/* Grid Layout: Tabs Left, Content Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Sidebar Tabs */}
            <div className="lg:col-span-4 space-y-3 bg-[#111827]/40 border border-slate-800 p-5 rounded-3xl backdrop-blur-md">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2 block">Mục lục chính sách</span>
              
              <button
                onClick={() => handleTabChange('warranty')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all text-left group ${
                  activeTab === 'warranty'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span className="text-sm">Bảo Hành & Đổi Trả</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'warranty' ? 'translate-x-1' : 'opacity-30 group-hover:opacity-100'}`} />
              </button>

              <button
                onClick={() => handleTabChange('privacy')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all text-left group ${
                  activeTab === 'privacy'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Lock className="w-5 h-5 shrink-0" />
                  <span className="text-sm">Bảo Mật Thông Tin</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'privacy' ? 'translate-x-1' : 'opacity-30 group-hover:opacity-100'}`} />
              </button>

              <button
                onClick={() => handleTabChange('shipping')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all text-left group ${
                  activeTab === 'shipping'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Truck className="w-5 h-5 shrink-0" />
                  <span className="text-sm">Vận Chuyển & Giao Nhận</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'shipping' ? 'translate-x-1' : 'opacity-30 group-hover:opacity-100'}`} />
              </button>
            </div>

            {/* Content Display Area */}
            <div className="lg:col-span-8 bg-[#111827]/20 border border-slate-800 p-8 md:p-10 rounded-[2rem] backdrop-blur-md relative min-h-[500px]">
              <AnimatePresence mode="wait">
                
                {/* WARRANTY TAB CONTENT */}
                {activeTab === 'warranty' && (
                  <motion.div
                    key="warranty"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-800/50">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase">Chính Sách Bảo Hành & Đổi Trả</h2>
                        <p className="text-xs text-slate-400 mt-1">Áp dụng cho toàn bộ thiết bị điện thoại, máy tính mua trực tiếp & online.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Highlighted Policy banner */}
                      <div className="p-5 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 rounded-2xl space-y-2">
                        <h4 className="text-sm font-extrabold text-blue-400 flex items-center gap-2">
                          <HeartHandshake className="w-4 h-4" /> Cam kết bảo hành VÀNG
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          TECHNO cung cấp chính sách <strong>1 đổi 1 trong vòng 30 ngày đầu tiên</strong> nếu sản phẩm có lỗi phần cứng từ nhà sản xuất. Miễn hoàn toàn chi phí kiểm tra và sửa chữa.
                        </p>
                      </div>

                      {/* Timeline steps */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Thời hạn bảo hành chuẩn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-1">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Điện thoại / Tablet</span>
                            <h4 className="text-sm font-extrabold text-white">Bảo hành 12 Tháng chính hãng</h4>
                            <p className="text-xs text-slate-400">Bảo hành toàn bộ nguồn, màn hình, camera và linh kiện bên trong máy.</p>
                          </div>
                          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-1">
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Laptop / PC</span>
                            <h4 className="text-sm font-extrabold text-white">Bảo hành 24 Tháng chính hãng</h4>
                            <p className="text-xs text-slate-400">Hỗ trợ cài đặt phần mềm trọn đời. Vệ sinh tra keo tản nhiệt định kỳ miễn phí.</p>
                          </div>
                        </div>
                      </div>

                      {/* Terms & Conditions list */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Điều kiện được bảo hành</h3>
                        <ul className="space-y-2.5 text-xs text-slate-300">
                          {[
                            'Sản phẩm còn trong thời hạn bảo hành căn cứ theo hóa đơn hoặc số IMEI/Serial điện tử.',
                            'Tem bảo hành còn nguyên vẹn, không có dấu hiệu bong tróc, tẩy xóa hoặc rách nát.',
                            'Lỗi phần cứng xuất phát từ phía nhà sản xuất (không bao gồm rơi vỡ, ngấm nước, ẩm mốc, cháy chập do điện áp nguồn không ổn định).',
                            'Thiết bị chưa bị can thiệp phần cứng bởi bên thứ ba không thuộc ủy quyền bảo hành của TECHNO.'
                          ].map((item, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PRIVACY TAB CONTENT */}
                {activeTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-800/50">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase">Chính Sách Bảo Mật Thông Tin</h2>
                        <p className="text-xs text-slate-400 mt-1">Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn theo tiêu chuẩn SSL cao nhất.</p>
                      </div>
                    </div>

                    <div className="space-y-6 text-xs md:text-sm leading-relaxed text-slate-300">
                      <div className="space-y-2">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">1. Thu thập thông tin</h3>
                        <p>
                          Khi thực hiện giao dịch hoặc đăng ký tài khoản tại TECHNO, chúng tôi sẽ thu thập các thông tin cơ bản bao gồm: Họ tên, số điện thoại, địa chỉ giao nhận hàng và địa chỉ email cá nhân.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">2. Mục đích sử dụng</h3>
                        <p>Các dữ liệu cá nhân của khách hàng sẽ được sử dụng nội bộ để phục vụ cho các mục đích:</p>
                        <ul className="space-y-1.5 list-disc pl-5 text-slate-400">
                          <li>Xử lý, giao nhận đơn hàng và gọi điện xác nhận dịch vụ.</li>
                          <li>Gửi mã giảm giá, chương trình tri ân khách hàng thân thiết.</li>
                          <li>Hỗ trợ xử lý bảo hành điện tử nhanh chóng theo thông tin số điện thoại.</li>
                          <li>Cải thiện chất lượng và nâng cao tính tương tác trên website.</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">3. Cam kết bảo mật</h3>
                        <div className="p-4 bg-[#1e1b4b]/30 border border-purple-500/20 rounded-xl flex gap-3.5">
                          <AlertCircle className="w-5 h-5 text-purple-400 shrink-0" />
                          <p className="text-xs text-slate-300 leading-normal">
                            TECHNO cam kết <strong>không chia sẻ, bán hay chuyển giao thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào</strong> dưới mọi hình thức, trừ trường hợp có yêu cầu từ các cơ quan pháp luật có thẩm quyền.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SHIPPING TAB CONTENT */}
                {activeTab === 'shipping' && (
                  <motion.div
                    key="shipping"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-800/50">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase">Chính Sách Vận Chuyển & Giao Nhận</h2>
                        <p className="text-xs text-slate-400 mt-1">Đảm bảo hàng hóa tới tận tay người dùng nhanh chóng và an toàn tuyệt đối.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Shipping speed modes */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Các hình thức giao hàng</h3>
                        <div className="space-y-3">
                          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl flex justify-between items-center gap-4">
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-extrabold text-white">📦 Giao hàng Hỏa tốc 2H</h4>
                              <p className="text-xs text-slate-400">Áp dụng tại nội thành Hà Nội & TP. Hồ Chí Minh.</p>
                            </div>
                            <span className="text-xs font-black text-emerald-400 shrink-0 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded">Chỉ từ 30K</span>
                          </div>

                          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl flex justify-between items-center gap-4">
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-extrabold text-white">🚀 Giao hàng Nhanh tiêu chuẩn</h4>
                              <p className="text-xs text-slate-400">Giao hàng toàn quốc thông qua Viettel Post, GHTK.</p>
                            </div>
                            <span className="text-xs font-black text-emerald-400 shrink-0 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded">2 - 4 ngày</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery conditions */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Quy định nhận hàng & Đồng kiểm</h3>
                        <div className="space-y-3.5 text-xs text-slate-300">
                          <div className="flex gap-3">
                            <Clock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-white block mb-0.5">Đồng kiểm hàng hóa:</strong>
                              Khách hàng có quyền mở hộp kiểm tra ngoại quan sản phẩm trước khi thanh toán (COD) hoặc ký nhận hàng. Không được cắm nguồn hoặc kích hoạt (active) máy trước khi thanh toán.
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-white block mb-0.5">Quay video khui hộp:</strong>
                              Vui lòng quay lại video đầy đủ các góc của kiện hàng khi nhận hàng và quá trình mở hộp sản phẩm để bảo vệ quyền lợi nếu có tranh chấp phát sinh (móp méo, thiếu phụ kiện).
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>

        </div>
      </div>
    </MainLayout>
  );
};
