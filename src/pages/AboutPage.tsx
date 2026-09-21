import { motion } from 'framer-motion';
import { 
  Award, 
  ShieldCheck, 
  Truck, 
  HeartHandshake, 
  Target, 
  TrendingUp, 
  ChevronRight,
  ArrowRight,
  Sparkles,
  Smartphone,
  Laptop,
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';

export const AboutPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const milestones = [
    {
      year: '2020',
      title: 'Khởi Đầu Đầy Đam Mê',
      description: 'TECHNO bắt đầu từ một cửa hàng sửa chữa và bán lẻ thiết bị công nghệ nhỏ tại TP. Hồ Chí Minh với đội ngũ 5 thành viên đam mê công nghệ.'
    },
    {
      year: '2022',
      title: 'Chuyển Mình Bứt Phá',
      description: 'Chính thức vận hành hệ thống thương mại điện tử, mở rộng danh mục sản phẩm bao gồm Laptop Gaming, Điện thoại cao cấp và Linh kiện chính hãng.'
    },
    {
      year: '2024',
      title: 'Khẳng Định Vị Thế',
      description: 'Trở thành đối tác chiến lược trực tiếp của ASUS, Apple, Samsung và MSI tại Việt Nam. Phục vụ hơn 100,000 khách hàng trên toàn quốc.'
    },
    {
      year: '2026',
      title: 'Hệ Sinh Thái Toàn Diện',
      description: 'Nâng cấp trải nghiệm khách hàng với Trợ lý ảo AI thông minh và cam kết bảo hành vàng 1-đổi-1 nhanh chóng.'
    }
  ];

  const coreValues = [
    {
      icon: <Award className="w-8 h-8 text-blue-500" />,
      title: 'Chất Lượng Tiên Phong',
      description: 'Chúng tôi chỉ cung cấp những sản phẩm công nghệ chính hãng 100% với kiểm định chất lượng nghiêm ngặt nhất.'
    },
    {
      icon: <HeartHandshake className="w-8 h-8 text-orange-400" />,
      title: 'Khách Hàng Là Trọng Tâm',
      description: 'Mọi chính sách và dịch vụ của TECHNO đều hướng tới việc bảo vệ quyền lợi và đem lại trải nghiệm mua sắm hài lòng tuyệt đối.'
    },
    {
      icon: <Target className="w-8 h-8 text-red-500" />,
      title: 'Đổi Mới Sáng Tạo',
      description: 'Liên tục cập nhật công nghệ mới, nâng cấp hệ thống và dịch vụ để hỗ trợ khách hàng tìm kiếm thiết bị phù hợp tối đa.'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      title: 'Phát Triển Bền Vững',
      description: 'Đồng hành cùng sự phát triển của cộng đồng công nghệ Việt Nam thông qua việc chia sẻ tri thức và hỗ trợ thế hệ trẻ.'
    }
  ];

  const statistics = [
    { value: '150,000+', label: 'Khách Hàng Tin Dùng' },
    { value: '98.5%', label: 'Đánh Giá Hài Lòng' },
    { value: '50+', label: 'Thương Hiệu Toàn Cầu' },
    { value: '6 Tỉnh Thành', label: 'Cửa Hàng Trải Nghiệm' }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-500/30 overflow-hidden relative">
        
        {/* Background Decorative Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none" />
        <div className="absolute top-[30%] right-[-10%] w-[45%] h-[45%] rounded-full bg-yellow-400/5 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[130px] pointer-events-none" />

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-6 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Định Hình Tương Lai Công Nghệ</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-6 text-gray-900"
          >
            Chúng Tôi Là <br className="md:hidden" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              TECHNO SYSTEM
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10"
          >
            Nền tảng cung cấp giải pháp và thiết bị công nghệ chính hãng hàng đầu tại Việt Nam. 
            Chúng tôi sinh ra để kết nối người dùng với những sản phẩm công nghệ tối tân nhất, 
            nâng tầm trải nghiệm công việc và giải trí của bạn.
          </motion.p>

          {/* Quick CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link 
              to="/" 
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-[0_4px_20px_rgba(59,130,246,0.3)] flex items-center gap-2 group"
            >
              <span>Mua Sắm Ngay</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/contact" 
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold px-8 py-4 rounded-2xl transition-all flex items-center gap-2 shadow-sm hover:shadow"
            >
              <span>Liên Hệ Hỗ Trợ</span>
            </Link>
          </motion.div>
        </section>

        {/* Brand Banner Features */}
        <section className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Laptop className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Laptop Gaming & Văn Phòng</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Bộ sưu tập Laptop chính hãng từ các thương hiệu hàng đầu thế giới với cấu hình mạnh mẽ nhất.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Thiết Bị Di Động</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Đầy đủ các dòng smartphone, tablet đời mới nhất với mức giá tối ưu và khuyến mãi hấp dẫn.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Linh Phụ Kiện Độc Bản</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Cung cấp chuột, bàn phím, tai nghe gaming và các linh kiện nâng cấp máy tính đa dạng.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {statistics.map((stat, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                className="bg-white border border-gray-200 rounded-2xl py-8 px-4 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md"
              >
                <div className="text-3xl md:text-4xl font-extrabold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Our Story / Timeline Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Hành Trình <span className="text-blue-600">Phát Triển</span>
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">
              Nhìn lại những cột mốc đáng nhớ mà tập thể TECHNO đã đi qua cùng với sự tin tưởng của khách hàng.
            </p>
          </div>

          <div className="relative border-l-2 border-gray-200 ml-4 md:ml-1/2 md:translate-x-[-1px] space-y-12 max-w-4xl mx-auto">
            {milestones.map((milestone, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div key={idx} className="relative flex items-center md:justify-between group">
                  {/* Timeline Dot */}
                  <div className="absolute left-[-9px] md:left-1/2 md:translate-x-[-8px] w-4.5 h-4.5 rounded-full bg-gray-50 border-4 border-blue-500 z-20 group-hover:scale-125 transition-transform" />
                  
                  {/* Space filler to align columns in desktop layout */}
                  <div className="hidden md:block w-[45%]" />

                  {/* Milestone Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="ml-8 md:ml-0 w-[calc(100%-2rem)] md:w-[45%] bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 transition-colors shadow-sm hover:shadow-md"
                  >
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{milestone.year}</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1 mb-2 group-hover:text-blue-600 transition-colors">{milestone.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{milestone.description}</p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Core Values Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Giá Trị <span className="text-orange-500">Cốt Lõi</span>
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">
              Chúng tôi luôn giữ vững những nguyên tắc cốt lõi làm kim chỉ nam cho mọi hoạt động kinh doanh.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {coreValues.map((value, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="bg-white border border-gray-200 rounded-3xl p-6 hover:border-blue-200 hover:shadow-xl shadow-sm transition-all flex flex-col items-start gap-4 group"
              >
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Trust Badge / Commitments */}
        <section className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:justify-between shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-purple-50 opacity-50" />
            <div className="space-y-3 max-w-2xl text-center md:text-left relative z-10">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
                Cam Kết Vàng Từ TECHNO
              </h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Chúng tôi cam kết bồi thường 200% giá trị sản phẩm nếu phát hiện hàng giả, 
                hàng dựng. Toàn bộ thiết bị bán ra được áp dụng bảo hành chính hãng và bảo hành mở rộng 
                ưu việt tại hệ thống trung tâm TECHNO Care.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap justify-center relative z-10">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Chính Hãng</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-orange-50 border border-orange-100 text-xs font-bold text-orange-700">
                <Truck className="w-4 h-4" />
                <span>Giao Siêu Tốc 2H</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Call to Action */}
        <section className="max-w-7xl mx-auto px-6 py-20 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
              Sẵn Sàng Nâng Tầm <br className="sm:hidden" />
              Trải Nghiệm Công Nghệ?
            </h2>
            <p className="text-gray-600 text-base md:text-lg">
              Tham gia cùng hàng ngàn khách hàng đã hài lòng với giải pháp công nghệ hiện đại và dịch vụ tận tâm tại TECHNO.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link 
                to="/" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(59,130,246,0.3)] flex items-center gap-2"
              >
                <span>Khám Phá Cửa Hàng</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </MainLayout>
  );
};
