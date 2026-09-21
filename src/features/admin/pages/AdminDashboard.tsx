import { useState, useEffect } from 'react';
import { Package, Layers, MessageSquare, Image as ImageIcon, TrendingUp, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import productService from '@/services/api/productService';
import categoryService from '@/services/api/categoryService';

export const AdminDashboard = () => {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  
  // Mock data for features that don't have APIs yet
  const totalBlogs = 12;
  const totalContacts = 45;
  const totalCollections = 4;

  const [chartData, setChartData] = useState<{name: string, views: number}[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productService.getAllProducts(0, 1),
          categoryService.getAllCategoriesList()
        ]);

        setTotalProducts(prodRes.totalElements || 0);
        setTotalCategories(catRes.length || 0);

        // Generate some mock chart data for "Lượt truy cập" (Page Views)
        const daysArray = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
        });

        const newChartData = daysArray.map(date => {
          return {
            name: `${date.getDate()}/${date.getMonth() + 1}`,
            views: Math.floor(Math.random() * 500) + 100 // Random views between 100-600
          };
        });
        setChartData(newChartData);

      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark tracking-tight">Tổng Quan Gấu Bakery</h1>
          <p className="text-brand-muted text-sm mt-1">Quản lý nội dung, sản phẩm và theo dõi tương tác của khách hàng.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-secondary">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-brand-muted text-sm font-medium mb-1">Sản phẩm (Bánh)</p>
              <h3 className="text-2xl font-black text-brand-dark tracking-tight">{totalProducts}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-secondary text-brand-accent flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-500 font-medium">+2 sản phẩm mới</span>
            <span className="text-brand-muted ml-1">tuần này</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-secondary">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-brand-muted text-sm font-medium mb-1">Danh mục</p>
              <h3 className="text-2xl font-black text-brand-dark tracking-tight">{totalCategories}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-secondary text-brand-accent flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-sm text-brand-muted">
            Bao gồm {totalCollections} bộ sưu tập
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-secondary">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-brand-muted text-sm font-medium mb-1">Lượt liên hệ (Zalo/Form)</p>
              <h3 className="text-2xl font-black text-brand-dark tracking-tight">{totalContacts}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-secondary text-brand-accent flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">+15%</span>
            <span className="text-brand-muted ml-1">so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-secondary">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-brand-muted text-sm font-medium mb-1">Bài viết Câu chuyện</p>
              <h3 className="text-2xl font-black text-brand-dark tracking-tight">{totalBlogs}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-secondary text-brand-accent flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-sm text-brand-muted">
            Trang blog hoạt động ổn định
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-brand-secondary">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-brand-dark">Lưu lượng truy cập website</h3>
              <p className="text-sm text-brand-muted">
                Thống kê số lượt xem trang trong 7 ngày qua
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C96F6F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C96F6F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#847A76' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#847A76' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#292322', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="views" stroke="#C96F6F" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Recent Contacts Mock */}
        <div className="bg-brand-dark rounded-2xl p-6 shadow-sm text-brand-light flex flex-col">
          <h3 className="font-bold text-lg mb-1 text-white">Khách hàng cần tư vấn</h3>
          <p className="text-sm text-brand-light/70 mb-6">Các yêu cầu liên hệ gần nhất</p>

          <div className="space-y-4 flex-1">
            {[
              { name: 'Nguyễn Thị A', request: 'Đặt bánh sinh nhật Custom', time: '10 phút trước' },
              { name: 'Trần Văn B', request: 'Tư vấn Combo quà tặng', time: '1 giờ trước' },
              { name: 'Lê Hoàng C', request: 'Hỏi về Bánh ngọt Pastry', time: '3 giờ trước' }
            ].map((contact, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold shrink-0">
                  {contact.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{contact.name}</p>
                  <p className="text-xs text-brand-light/70 truncate">{contact.request}</p>
                </div>
                <div className="text-[10px] text-brand-light/50 shrink-0 whitespace-nowrap">
                  {contact.time}
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 bg-brand-accent hover:bg-brand-accent/90 text-white py-3 rounded-xl font-medium transition-colors border border-transparent">
            Xem tất cả liên hệ
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-8 py-6 border-t border-brand-secondary text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs text-brand-muted">
        <div className="font-bold text-brand-dark text-sm mb-4 md:mb-0">
          Gấu<span className="italic text-brand-accent">Bakery</span> Admin
        </div>
        <p>© 2026 Gấu Bakery. Tinh túy từ đôi bàn tay Việt.</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-brand-dark">Tài liệu HDSD</a>
          <a href="#" className="hover:text-brand-dark">Hỗ trợ kỹ thuật</a>
        </div>
      </footer>
    </div>
  );
};
