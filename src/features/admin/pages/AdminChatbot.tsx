import { useState, useEffect } from 'react';
import { 
  Bot, Settings, BarChart2, MessageSquare, Save, Trash2, Key, Sparkles, 
  HelpCircle, User, CheckCircle, RefreshCw, AlertCircle, ShoppingBag
} from 'lucide-react';
import chatbotService, { 
  type ChatbotConfig, type ChatbotAnalytics, type ChatbotMessage 
} from '@/services/api/chatbotService';

export const AdminChatbot = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'settings' | 'history'>('analytics');
  
  // States
  const [config, setConfig] = useState<ChatbotConfig>({
    apiKey: '',
    provider: 'GEMINI',
    systemPrompt: '',
    faqData: ''
  });
  const [analytics, setAnalytics] = useState<ChatbotAnalytics | null>(null);
  const [history, setHistory] = useState<ChatbotMessage[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [confData, analData, histData] = await Promise.all([
        chatbotService.getConfig(),
        chatbotService.getAnalytics(),
        chatbotService.getHistory()
      ]);
      
      setConfig(confData);
      setAnalytics(analData);
      setHistory(histData);
    } catch (err) {
      console.error('Failed to load admin chatbot data', err);
      setError('Không thể kết nối đến máy chủ API Chatbot. Vui lòng kiểm tra lại dịch vụ backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await chatbotService.saveConfig(config);
      setConfig(saved);
      alert('Cấu hình Chatbot AI đã được cập nhật thành công!');
      loadData();
    } catch (err) {
      alert('Lưu cấu hình thất bại! Hãy kiểm tra lại kết nối.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử hội thoại của chatbot? Thao tác này không thể hoàn tác!')) {
      try {
        await chatbotService.clearHistory();
        setHistory([]);
        alert('Đã xóa sạch lịch sử trò chuyện thành công!');
        loadData();
      } catch (err) {
        alert('Xóa lịch sử thất bại.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bot className="w-7 h-7 text-blue-600" />
              Quản Trị AI Chatbot
            </h1>
            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Cấu hình & Thống kê</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Quản lý API Key AI, viết kịch bản tư vấn, theo dõi hiệu suất chuyển đổi của trợ lý.</p>
        </div>
        
        <button 
          onClick={loadData}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all font-bold text-xs text-slate-700 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại dữ liệu
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'analytics' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Thống kê (Analytics)
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'settings' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          Cấu hình AI (Settings)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'history' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Lịch sử chat
        </button>
      </div>

      {/* Tab Contents */}

      {/* 1. Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng số tin nhắn</p>
                <div className="text-3xl font-black text-slate-900">
                  {analytics ? analytics.totalChats : 0}
                </div>
                <p className="text-[11px] text-slate-500">Tin nhắn khách & AI gửi nhận</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phiên hội thoại</p>
                <div className="text-3xl font-black text-slate-900">
                  {analytics ? analytics.totalSessions : 0}
                </div>
                <p className="text-[11px] text-slate-500">Khách hàng truy cập trò chuyện</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Bot className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tỉ lệ chuyển đổi</p>
                <div className="text-3xl font-black text-emerald-600">
                  {analytics ? analytics.conversionRate : 0}%
                </div>
                <p className="text-[11px] text-slate-500">Tỷ lệ xem/click sản phẩm đề xuất</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Questions */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  Top Câu Hỏi Hỏi Nhiều Nhất
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Realtime</span>
              </div>
              <div className="divide-y divide-slate-50">
                {analytics && analytics.topQuestions.length > 0 ? (
                  analytics.topQuestions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{item.question}</span>
                      </div>
                      <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {item.count} lần
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">Chưa có đủ dữ liệu câu hỏi.</p>
                )}
              </div>
            </div>

            {/* Top Suggested Products */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  Sản Phẩm Được AI Đề Xuất Nhiều Nhất
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Gợi ý</span>
              </div>
              <div className="divide-y divide-slate-50">
                {analytics && analytics.topSuggestedProducts.length > 0 ? (
                  analytics.topSuggestedProducts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.productName} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Bot className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block line-clamp-1">
                            {item.productName}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">ID: #{item.productId}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {item.count} lần đề xuất
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">Chưa có sản phẩm đề xuất nào.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Settings Tab */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Thiết Lập Kết Nối API & Trí Tuệ Nhân Tạo
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Cơ chế fallback sẵn sàng
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Nhà cung cấp AI (Provider)</label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all"
              >
                <option value="GEMINI">Google Gemini API (Khuyên dùng)</option>
                <option value="OPENAI">OpenAI GPT API</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">API Key của dịch vụ</label>
              <input
                type="password"
                placeholder="Nhập API Key để kích hoạt Trí tuệ nhân tạo..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-slate-300 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all"
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
              <p className="text-[10px] text-slate-400 italic">Mẹo: Bạn có thể lấy Gemini Key miễn phí tại Google AI Studio.</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Kịch bản chỉ đạo AI (System Prompt)</label>
              <span className="text-[10px] text-slate-400">Định hình cá tính, văn phong tư vấn</span>
            </div>
            <textarea
              rows={4}
              placeholder="Bạn là chuyên gia tư vấn bán hàng của Techno..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-slate-300 rounded-2xl font-medium text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all leading-relaxed"
              value={config.systemPrompt || ''}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Bộ câu hỏi thường gặp & Dữ liệu huấn luyện (FAQ Context)</label>
              <span className="text-[10px] text-slate-400">Trả lời chính sách giao hàng, bảo hành, trả góp</span>
            </div>
            <textarea
              rows={6}
              placeholder="Q: Bảo hành bao lâu? A: Bảo hành chính hãng 12-24 tháng..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-slate-300 rounded-2xl font-medium text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all leading-relaxed"
              value={config.faqData || ''}
              onChange={(e) => setConfig({ ...config, faqData: e.target.value })}
            />
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md shadow-slate-200 transition-all"
            >
              <Save className="w-4 h-4 text-white" />
              {saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình AI'}
            </button>
          </div>
        </form>
      )}

      {/* 3. History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">Tổng cộng **{history.length}** dòng lịch sử tin nhắn</span>
            
            <button
              onClick={handleClearHistory}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all font-bold text-xs"
            >
              <Trash2 className="w-4 h-4" />
              Xóa sạch lịch sử
            </button>
          </div>

          {/* History table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 w-44">Phiên Session ID</th>
                    <th className="px-6 py-4 w-32">Người gửi</th>
                    <th className="px-6 py-4">Nội dung tin nhắn</th>
                    <th className="px-6 py-4 w-32">Sản phẩm gợi ý</th>
                    <th className="px-6 py-4 w-44 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Không có cuộc trò chuyện nào được lưu.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                          {item.sessionId.length > 15 ? item.sessionId.substring(0, 12) + '...' : item.sessionId}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.sender === 'USER' 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-slate-900 text-slate-200'
                          }`}>
                            {item.sender === 'USER' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                            {item.sender}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700 leading-relaxed max-w-lg truncate" title={item.message}>
                          {item.message}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {item.productSuggestedId ? (
                            <span className="font-bold text-blue-600">ID: #{item.productSuggestedId}</span>
                          ) : (
                            <span className="italic text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-400 text-right">
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
