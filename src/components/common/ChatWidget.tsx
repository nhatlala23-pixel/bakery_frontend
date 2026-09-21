import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Maximize2, Send, Bot, User, 
  Sparkles, ShoppingCart, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import chatbotService from '@/services/api/chatbotService';
import cartService from '@/services/api/cartService';
import { type ProductResponse } from '@/services/api/productService';

interface Message {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  suggestedProducts?: ProductResponse[];
  timestamp: Date;
}

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load sessionId and user info
  useEffect(() => {
    let sid = sessionStorage.getItem('chatbot_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('chatbot_session_id', sid);
    }
    setSessionId(sid);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u?.id) setUserId(u.id);
      } catch (e) {
        console.error('Failed to parse user info', e);
      }
    }

    // Add welcome message if empty
    setMessages([
      {
        id: 'welcome',
        sender: 'AI',
        text: 'Xin chào! Em là **Techno AI**, trợ lý tư vấn công nghệ thông minh. Em có thể tư vấn các dòng Laptop gaming, điện thoại pin trâu, máy tính văn phòng, kiểm tra trạng thái đơn hàng hoặc các chương trình khuyến mãi.\n\nAnh/chị cần em hỗ trợ gì hôm nay ạ? 🤖',
        timestamp: new Date()
      }
    ]);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessageText = textToSend.trim();
    setInputValue('');

    // Add user message locally
    const userMsgId = 'msg_' + Date.now();
    setMessages(prev => [...prev, {
      id: userMsgId,
      sender: 'USER',
      text: userMessageText,
      timestamp: new Date()
    }]);

    setLoading(true);

    try {
      const response = await chatbotService.chat(userMessageText, sessionId);

      // Add AI response
      setMessages(prev => [...prev, {
        id: 'msg_ai_' + Date.now(),
        sender: 'AI',
        text: response.reply,
        suggestedProducts: response.suggestedProducts,
        timestamp: new Date()
      }]);

      // Automatically handle adding product to cart if requested
      if (response.action === 'ADD_TO_CART' && response.actionProductId) {
        const targetProduct = response.suggestedProducts?.find(p => p.id === response.actionProductId);
        if (targetProduct) {
          setTimeout(() => {
            handleAddToCart(targetProduct);
          }, 600);
        }
      }
    } catch (error) {
      console.error('Failed to get chatbot reply', error);
      setMessages(prev => [...prev, {
        id: 'msg_err_' + Date.now(),
        sender: 'AI',
        text: 'Dạ, kết nối với máy chủ AI đang bị gián đoạn một chút. Tuy nhiên anh/chị vẫn có thể tham khảo trực tiếp các danh mục sản phẩm nổi bật của Techno hoặc gõ lại câu hỏi nhé!',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: ProductResponse) => {
    try {
      if (!userId) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const existingIndex = guestCart.findIndex((item: any) => item.productId === product.id);
        
        if (existingIndex > -1) {
          guestCart[existingIndex].quantity += 1;
          guestCart[existingIndex].subtotal = guestCart[existingIndex].quantity * guestCart[existingIndex].unitPrice;
        } else {
          guestCart.push({
            cartItemId: Date.now(),
            variantId: 0,
            variantSku: product.sku || '',
            productId: product.id,
            productName: product.productName,
            productSlug: product.slug,
            productThumbnail: product.thumbnail || '',
            variantAttributes: '',
            quantity: 1,
            unitPrice: product.salePrice,
            subtotal: product.salePrice
          });
        }
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
      } else {
        await cartService.addProductToCart(userId, product.id, 1);
      }
      
      // Toast notification instead of alert for better UX
      const existingToast = document.getElementById('chat-cart-toast');
      if (!existingToast) {
        const toast = document.createElement('div');
        toast.id = 'chat-cart-toast';
        toast.className = 'fixed top-6 right-6 z-[9999] bg-green-500 text-white px-5 py-4 rounded-2xl shadow-2xl font-bold text-xs transition-all animate-in slide-in-from-right-4 duration-300 flex items-center gap-2';
        toast.innerHTML = `<span>Đã tự động thêm <strong>${product.productName}</strong> vào giỏ hàng! 🛒</span>`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3500);
      }
      
      // Trigger cart reload event in Header
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      console.error('Add to cart failed:', error);
    }
  };

  const handleQuickAction = (question: string) => {
    handleSendMessage(question);
  };

  // Hide widget if on admin pages
  const isAdminPage = window.location.pathname.startsWith('/admin');
  if (isAdminPage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 relative group animate-bounce"
          title="Chat tư vấn công nghệ AI"
        >
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-40 group-hover:opacity-75 transition-opacity animate-pulse" />
          <MessageSquare className="w-6 h-6 relative z-10 text-white" />
          
          {/* Unread dot or notification badge */}
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow shadow-yellow-100 flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-blue-600 animate-spin" />
            AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isMaximized 
              ? 'fixed inset-4 md:inset-10 z-50' 
              : 'w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-100 tracking-wide">TECHNO AI ASSISTANT</span>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                  Sẵn sàng tư vấn 24/7
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-slate-100 transition-colors"
                title={isMaximized ? 'Thu nhỏ cửa sổ' : 'Phóng to cửa sổ'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-slate-100 transition-colors"
                title="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => {
              const isAi = msg.sender === 'AI';
              return (
                <div key={msg.id} className={`flex gap-3 ${isAi ? '' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    isAi 
                      ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Bubble Content */}
                  <div className="space-y-2 max-w-[80%]">
                    <div 
                      className={`rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                        isAi 
                          ? 'bg-slate-900 border border-slate-800 text-slate-200' 
                          : 'bg-blue-600 text-white shadow-md shadow-blue-600/15'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Timestamp */}
                    <div className={`text-[9px] text-slate-500 font-bold px-1 ${isAi ? '' : 'text-right'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Suggested Products Carousel */}
                    {isAi && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center gap-1.5 mb-2 px-1">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm gợi ý</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 max-w-[280px] sm:max-w-[320px] md:max-w-none">
                          {msg.suggestedProducts.map((product) => (
                            <div 
                              key={product.id} 
                              className="bg-slate-900 border border-slate-800 hover:border-blue-500/30 rounded-2xl p-3 flex-shrink-0 w-[200px] flex flex-col justify-between group transition-all"
                            >
                              <div className="space-y-2">
                                {/* Thumbnail */}
                                <div className="w-full aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 relative">
                                  {product.thumbnail ? (
                                    <img 
                                      src={product.thumbnail.startsWith('http') ? product.thumbnail : `http://localhost:8080${product.thumbnail}`} 
                                      alt={product.productName} 
                                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" 
                                    />
                                  ) : (
                                    <Bot className="w-8 h-8 text-slate-700" />
                                  )}
                                  {product.salePrice < product.originalPrice && (
                                    <span className="absolute top-2 left-2 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md shadow shadow-yellow-400/20">
                                      SALE
                                    </span>
                                  )}
                                </div>
                                {/* Product name */}
                                <h4 className="font-extrabold text-xs text-slate-200 line-clamp-2 min-h-[32px]">
                                  {product.productName}
                                </h4>
                                {/* Pricing */}
                                <div className="space-y-0.5">
                                  <div className="text-blue-400 font-extrabold text-sm">
                                    {product.salePrice.toLocaleString('vi-VN')}₫
                                  </div>
                                  {product.salePrice < product.originalPrice && (
                                    <div className="text-[10px] text-slate-500 line-through">
                                      {product.originalPrice.toLocaleString('vi-VN')}₫
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5 mt-3">
                                <button
                                  onClick={() => window.open(`/product/${product.slug}`, '_blank')}
                                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Chi tiết
                                </button>
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                                  title="Thêm vào giỏ hàng"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Loading state */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="space-y-1 max-w-[80%]">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Panel */}
          <div className="px-4 py-3 bg-slate-950 border-t border-slate-900/50 flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
            <button 
              onClick={() => handleQuickAction('Laptop gaming dưới 20 triệu')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1"
            >
              🎮 Laptop gaming dưới 20tr
            </button>
            <button 
              onClick={() => handleQuickAction('Điện thoại pin trâu')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1"
            >
              🔋 Điện thoại pin trâu
            </button>
            <button 
              onClick={() => handleQuickAction('Sản phẩm nào đang giảm giá?')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1"
            >
              🔥 Khuyến mãi sốc
            </button>
            <button 
              onClick={() => handleQuickAction('Kiểm tra đơn hàng của tôi')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1"
            >
              📦 Kiểm tra đơn hàng
            </button>
          </div>

          {/* Input Footer */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-4 bg-slate-950 border-t border-slate-900 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Hỏi Techno AI về laptop, điện thoại, đơn hàng..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/10 font-medium"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-2xl flex items-center justify-center text-white transition-all shadow-md hover:shadow-blue-500/10 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
