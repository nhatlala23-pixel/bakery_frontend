import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

const FEATURES = [
  {
    icon: <Truck size={32} />,
    title: "Miễn Phí Giao Hàng",
    desc: "Cho hóa đơn từ 500k"
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Chính Hãng 100%",
    desc: "Cam kết nguồn gốc"
  },
  {
    icon: <RotateCcw size={32} />,
    title: "Đổi Trả 30 Ngày",
    desc: "Thủ tục nhanh gọn"
  },
  {
    icon: <Headphones size={32} />,
    title: "Hỗ Trợ 24/7",
    desc: "Tư vấn nhiệt tình"
  }
];

export const Features = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((item, index) => (
            <div 
              key={index}
              className="group p-8 rounded-[2.5rem] bg-gray-50 hover:bg-white hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 border border-transparent hover:border-blue-50 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-white text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm mb-6 group-hover:rotate-6 group-hover:scale-110">
                {item.icon}
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black text-gray-900 tracking-tight">{item.title}</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
