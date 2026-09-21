import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Package, Calendar, MapPin, Phone, User, 
  CreditCard, Truck, CheckCircle2, Clock, AlertCircle, 
  FileText, Download, Loader2
} from 'lucide-react';
import orderService, { type OrderResponse } from '@/services/api/orderService';
import { getFullImageUrl } from '@/utils/image';

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Thay đổi ý định');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!id) return;
    const finalReason = cancelReason === 'Lý do khác' ? customReason : cancelReason;
    if (cancelReason === 'Lý do khác' && !customReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn!');
      return;
    }

    setIsCancelling(true);
    try {
      const updatedOrder = await orderService.cancelOrder(parseInt(id), finalReason);
      setOrder(updatedOrder);
      setIsCancelModalOpen(false);
      alert('Đã hủy đơn hàng thành công!');
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      alert(error.response?.data?.message || 'Hủy đơn hàng thất bại, vui lòng thử lại!');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;
      try {
        const response = await orderService.getOrder(parseInt(id));
        setOrder(response);
      } catch (error) {
        console.error('Failed to fetch order details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-500 text-center max-w-sm mb-8">Xin lỗi, chúng tôi không tìm thấy thông tin cho đơn hàng này hoặc bạn không có quyền truy cập.</p>
        <button 
          onClick={() => navigate('/profile')}
          className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all"
        >
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-600 border-green-200';
      case 'SHIPPING': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'CANCELLED': return 'bg-red-100 text-red-600 border-red-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 py-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-bold text-sm w-fit"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <ChevronLeft size={18} />
            </div>
            Quay lại lịch sử đơn hàng
          </button>
          
          <div className="flex items-center gap-3">
             {order.orderStatus === 'PENDING' && (
               <button 
                 onClick={() => setIsCancelModalOpen(true)}
                 className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm cursor-pointer"
               >
                 Hủy đơn hàng
               </button>
             )}
             <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                <Download size={14} /> Tải hóa đơn
             </button>
             <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                <FileText size={14} /> Gửi hỗ trợ
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Order Items & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-8">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                       Đơn hàng #{order.orderCode}
                    </h1>
                    <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                       <Calendar size={14} /> 
                       Đặt ngày {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="pt-6 border-t border-gray-50 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100">
                        <div className="w-20 h-20 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex-shrink-0">
                          <img src={getFullImageUrl(item.productImage)} alt={item.productName} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{item.productName}</h4>
                           <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">SKU: {item.variantSku}</p>
                           <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-500">x{item.quantity}</span>
                              <span className="font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="pt-6 border-t border-gray-100 space-y-3">
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Tạm tính</span>
                        <span className="text-gray-900 font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount + order.discountAmount)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Giảm giá</span>
                        <span className="text-red-500 font-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discountAmount)}</span>
                     </div>
                     <div className="flex justify-between text-lg pt-3 border-t border-dashed border-gray-100">
                        <span className="font-black text-gray-900">Tổng thanh toán</span>
                        <span className="font-black text-blue-600 text-xl">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Tracking / Timeline */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
               <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-3">
                  <Truck size={20} className="text-indigo-600" /> Hành trình đơn hàng
               </h3>

               {/* Premium Horizontal Progress Line */}
               {order.orderStatus === 'CANCELLED' ? (
                 <div className="mb-10 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4">
                   <div className="w-12 h-12 bg-red-650 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                     <AlertCircle size={24} />
                   </div>
                   <div>
                     <h4 className="font-extrabold text-red-900 text-sm">Đơn hàng đã bị hủy</h4>
                     <p className="text-xs text-red-600/80 font-medium mt-0.5">
                       Đơn hàng đã được hoàn trả hoặc hủy bỏ. Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ bộ phận hỗ trợ.
                     </p>
                   </div>
                 </div>
               ) : (
                 <div className="mb-12 relative">
                   <div className="absolute top-5 left-8 right-8 h-1 bg-gray-100 -translate-y-1/2 z-0" />
                   
                   {/* Colored active path */}
                   <div 
                     className="absolute top-5 left-8 h-1 bg-gradient-to-r from-indigo-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-1000 ease-out" 
                     style={{ 
                       width: 
                         order.orderStatus === 'PENDING' ? '0%' :
                         order.orderStatus === 'CONFIRMED' ? '33.33%' :
                         order.orderStatus === 'SHIPPING' ? '66.66%' :
                         order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED' ? '100%' : '0%'
                     }}
                   />

                   <div className="relative z-10 flex justify-between">
                     {[
                       { label: 'Đặt hàng', desc: 'Chờ xác nhận', status: 'PENDING', step: 0 },
                       { label: 'Xác nhận', desc: 'Đang chuẩn bị', status: 'CONFIRMED', step: 1 },
                       { label: 'Đang giao', desc: 'Đang vận chuyển', status: 'SHIPPING', step: 2 },
                       { label: 'Hoàn thành', desc: 'Nhận hàng', status: 'COMPLETED', step: 3 }
                     ].map((item, idx) => {
                       const currentStep = 
                         order.orderStatus === 'PENDING' ? 0 :
                         order.orderStatus === 'CONFIRMED' ? 1 :
                         order.orderStatus === 'SHIPPING' ? 2 :
                         order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED' ? 3 : 0;
                       
                       const isDone = idx < currentStep;
                       const isActive = idx === currentStep;
                       
                       return (
                         <div key={idx} className="flex flex-col items-center text-center max-w-[120px]">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-all duration-500 ${
                             isDone ? 'bg-emerald-500 text-white' :
                             isActive ? 'bg-indigo-650 text-white ring-4 ring-indigo-550/20 scale-110 animate-pulse' :
                             'bg-gray-100 text-gray-400'
                           }`}>
                             {idx === 0 && <Clock size={16} />}
                             {idx === 1 && <CheckCircle2 size={16} />}
                             {idx === 2 && <Truck size={16} />}
                             {idx === 3 && <Package size={16} />}
                           </div>
                           <span className={`text-xs font-black mt-3 transition-colors ${
                             isActive ? 'text-indigo-600' : isDone ? 'text-emerald-600' : 'text-gray-400'
                           }`}>{item.label}</span>
                           <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">{item.desc}</span>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}

               {/* Detailed Timeline List */}
               <div className="relative space-y-8 ml-4 pl-6 border-l border-slate-100">
                  {[
                    { 
                      title: 'Đặt hàng thành công', 
                      desc: 'Đơn hàng của bạn đã được ghi nhận trên hệ thống.',
                      date: order.createdAt, 
                      active: true, 
                      icon: <FileText size={14}/> 
                    },
                    { 
                      title: 'Xác nhận đơn hàng', 
                      desc: 'Hệ thống/nhân viên đang kiểm tra và chuẩn bị sản phẩm.',
                      date: order.orderStatus !== 'PENDING' ? order.updatedAt : null, 
                      active: order.orderStatus !== 'PENDING' && order.orderStatus !== 'CANCELLED', 
                      icon: <CheckCircle2 size={14}/> 
                    },
                    { 
                      title: 'Đơn hàng đang được giao', 
                      desc: 'Sản phẩm đang được đối tác vận chuyển giao đến bạn.',
                      date: (order.orderStatus === 'SHIPPING' || order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED') ? order.updatedAt : null, 
                      active: order.orderStatus === 'SHIPPING' || order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED', 
                      icon: <Truck size={14}/> 
                    },
                    { 
                      title: 'Giao hàng thành công', 
                      desc: 'Đơn hàng đã được giao nhận thành công. Cảm ơn bạn đã mua sắm tại Techno!',
                      date: (order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED') ? order.updatedAt : null, 
                      active: order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED', 
                      icon: <Package size={14}/> 
                    },
                  ].map((step, idx) => (
                    <div key={idx} className="relative group">
                       {/* Circle node indicator */}
                       <div className={`absolute -left-[2.25rem] top-1 z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all ${
                         step.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                       }`}>
                          {step.icon}
                       </div>
                       <div>
                          <h4 className={`text-sm font-black ${step.active ? 'text-gray-900' : 'text-gray-450'}`}>{step.title}</h4>
                          <p className="text-xs text-gray-450 mt-1 leading-relaxed">{step.desc}</p>
                          {step.date && (
                            <p className="text-[10px] text-indigo-600 font-extrabold mt-1.5 uppercase tracking-wider bg-indigo-50 w-fit px-2 py-0.5 rounded-md">
                              {new Date(step.date).toLocaleString('vi-VN')}
                            </p>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Sidebar: Customer & Shipping Info */}
          <div className="space-y-6">
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div>
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Thông tin người nhận</h3>
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <User size={14} />
                         </div>
                         <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Họ và tên</p>
                            <p className="text-sm font-bold text-gray-900">{order.receiverName}</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <Phone size={14} />
                         </div>
                         <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Số điện thoại</p>
                            <p className="text-sm font-bold text-gray-900">{order.receiverPhone}</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <MapPin size={14} />
                         </div>
                         <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Địa chỉ nhận hàng</p>
                            <p className="text-sm font-bold text-gray-900 leading-relaxed">{order.shippingAddress}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-gray-50">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Thanh toán</h3>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                         <CreditCard size={14} />
                      </div>
                      <div>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">Phương thức</p>
                         <p className="text-sm font-bold text-gray-900">{order.paymentMethod}</p>
                      </div>
                   </div>
                   <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trạng thái</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                        order.paymentStatus === 'PAID' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
                      }`}>
                         {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </span>
                   </div>
                </div>

                {order.note && (
                  <div className="pt-6 border-t border-gray-50">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ghi chú</h3>
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl italic">"{order.note}"</p>
                  </div>
                )}
             </div>

             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
                <h4 className="font-black text-lg mb-2">Cần hỗ trợ?</h4>
                <p className="text-blue-100 text-xs mb-4 leading-relaxed">Nếu có bất kỳ thắc mắc nào về đơn hàng, vui lòng liên hệ với bộ phận chăm sóc khách hàng của chúng tôi.</p>
                <button className="w-full py-3 bg-white text-blue-600 font-black rounded-xl text-xs hover:bg-blue-50 transition-all uppercase tracking-widest">
                   Chat với chúng tôi
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 mb-2">Hủy đơn hàng</h3>
            <p className="text-gray-500 text-sm mb-6">
              Bạn có chắc chắn muốn hủy đơn hàng này? Vui lòng chọn lý do hủy để giúp chúng tôi cải thiện dịch vụ.
            </p>

            <div className="space-y-3 mb-6">
              {[
                'Thay đổi ý định',
                'Tìm thấy giá rẻ hơn ở nơi khác',
                'Sai thông tin nhận hàng',
                'Lý do khác'
              ].map((reason) => (
                <label 
                  key={reason} 
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl cursor-pointer transition-colors border border-transparent"
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-gray-700">{reason}</span>
                </label>
              ))}

              {cancelReason === 'Lý do khác' && (
                <textarea
                  placeholder="Nhập lý do hủy đơn hàng của bạn..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full mt-2 p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[80px] font-medium"
                  required
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all uppercase tracking-wider cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-xl text-xs transition-all uppercase tracking-wider shadow-lg shadow-red-500/20 cursor-pointer"
              >
                {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
