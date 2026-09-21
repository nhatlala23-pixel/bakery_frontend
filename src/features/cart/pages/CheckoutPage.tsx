import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Truck, CreditCard, Check, Package,
  ShieldCheck, ArrowRight, Loader2, CheckCircle2, User, Phone, FileText,
  Building2, Banknote
} from 'lucide-react';
import cartService, { type CartItemResponse } from '@/services/api/cartService';
import orderService, { type OrderRequest } from '@/services/api/orderService';
import voucherService, { type VoucherResponse } from '@/services/api/voucherService';

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(n));

const STEPS = [
  { id: 1, label: 'Thông tin', icon: MapPin },
  { id: 2, label: 'Vận chuyển', icon: Truck },
  { id: 3, label: 'Thanh toán', icon: CreditCard },
];

const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Giao hàng tiêu chuẩn', desc: '3-5 ngày làm việc', price: 30000, icon: '📦' },
  { id: 'express', name: 'Giao hàng nhanh', desc: '1-2 ngày làm việc', price: 50000, icon: '🚀' },
  { id: 'same_day', name: 'Giao trong ngày', desc: 'Nhận hàng hôm nay (nội thành)', price: 80000, icon: '⚡' },
];

const PAYMENT_METHODS = [
  { id: 'COD', name: 'Thanh toán khi nhận hàng', desc: 'Trả tiền mặt cho shipper', icon: Banknote, color: 'green' },
  { id: 'MOMO', name: 'Ví MoMo', desc: 'Thanh toán qua ví điện tử MoMo', icon: CreditCard, color: 'pink' },
  { id: 'VNPAY', name: 'VNPay', desc: 'Thanh toán qua VNPay / ATM / Visa', icon: Building2, color: 'blue' },
];

const getFullImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userId = user?.id;

  const [step, setStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    receiverName: user?.fullName || '',
    receiverPhone: user?.phone || '',
    shippingAddress: user?.address || '',
    note: '',
    city: '',
    district: '',
    ward: '',
    addressDetail: '',
  });
  
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [shipping, setShipping] = useState('standard');
  const [payment, setPayment] = useState('COD');
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherResponse | null>(null);

  useEffect(() => {
    const savedVoucher = localStorage.getItem('appliedVoucher');
    if (savedVoucher) {
      setAppliedVoucher(JSON.parse(savedVoucher));
    }
  }, []);

  useEffect(() => {
    if (!userId) { navigate('/login'); return; }
    (async () => {
      try {
        const [items, provs] = await Promise.all([
          cartService.getCart(userId),
          fetch('https://provinces.open-api.vn/api/p/')
            .then(res => res.json())
            .catch(err => {
              console.error("Failed to fetch provinces:", err);
              return [];
            })
        ]);
        if (!items.length) { navigate('/cart'); return; }
        setCartItems(items);
        setProvinces(provs);

        // Auto-scan and apply the best voucher
        try {
          const vouchers = await voucherService.getAllVouchers();
          const subtotalVal = items.reduce((s, i) => s + i.subtotal, 0);
          const now = new Date();
          
          let bestVoucher: VoucherResponse | null = null;
          let maxDiscount = 0;
          
          vouchers.forEach(v => {
            if (v.status !== 1) return;
            const start = new Date(v.startDate);
            const end = new Date(v.endDate);
            if (now < start || now > end) return;
            if (v.usageLimit && v.usageCount >= v.usageLimit) return;
            if (subtotalVal < v.minOrderValue) return;

            let currentDiscount = 0;
            if (v.discountType === 'PERCENTAGE') {
              currentDiscount = (subtotalVal * v.discountValue) / 100;
              if (v.maxDiscountValue) {
                currentDiscount = Math.min(currentDiscount, v.maxDiscountValue);
              }
            } else {
              currentDiscount = v.discountValue;
            }

            if (currentDiscount > maxDiscount) {
              maxDiscount = currentDiscount;
              bestVoucher = v;
            }
          });

          if (bestVoucher) {
            setAppliedVoucher(bestVoucher);
            localStorage.setItem('appliedVoucher', JSON.stringify(bestVoucher));
          }
        } catch (vErr) {
          console.error("Auto voucher application failed:", vErr);
        }
      } catch { navigate('/cart'); }
      finally { setLoading(false); }
    })();
  }, [userId, navigate]);

  // Handle cascading address
  useEffect(() => {
    if (form.city) {
      const p = provinces.find(p => p.name === form.city);
      if (p) {
        fetch(`https://provinces.open-api.vn/api/p/${p.code}?depth=2`)
          .then(res => res.json())
          .then(data => setDistricts(data.districts || []))
          .catch(err => {
            console.error("Error fetching districts:", err);
            setDistricts([]);
          });
      }
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [form.city, provinces]);

  useEffect(() => {
    if (form.district) {
      const d = districts.find(d => d.name === form.district);
      if (d) {
        fetch(`https://provinces.open-api.vn/api/d/${d.code}?depth=2`)
          .then(res => res.json())
          .then(data => setWards(data.wards || []))
          .catch(err => {
            console.error("Error fetching wards:", err);
            setWards([]);
          });
      }
    } else {
      setWards([]);
    }
  }, [form.district, districts]);

  const fullAddress = `${form.addressDetail}${form.ward ? ', ' + form.ward : ''}${form.district ? ', ' + form.district : ''}${form.city ? ', ' + form.city : ''}`;

  const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const shippingFee = SHIPPING_OPTIONS.find(o => o.id === shipping)?.price || 30000;
  const freeShip = subtotal >= 2000000;
  const actualShipping = freeShip ? 0 : shippingFee;
  
  let discount = 0;
  if (appliedVoucher) {
    discount = appliedVoucher.discountType === 'PERCENTAGE'
      ? Math.min((subtotal * appliedVoucher.discountValue) / 100, appliedVoucher.maxDiscountValue || Infinity)
      : appliedVoucher.discountValue;
  }
  
  const total = subtotal + actualShipping - discount;

  const canNext = () => {
    if (step === 1) return form.receiverName && form.receiverPhone && form.city && form.district && form.ward && form.addressDetail;
    if (step === 2) return !!shipping;
    return !!payment;
  };

  const handlePlaceOrder = async () => {
    if (!canNext()) return;
    setPlacing(true);
    try {
      const req: OrderRequest = {
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        shippingAddress: fullAddress,
        note: form.note || undefined,
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
        paymentMethod: payment,
        items: cartItems.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
      };
      
      const order = await orderService.placeOrder(userId, req);
      
      // Cleanup cart and voucher
      await cartService.clearCart(userId);
      localStorage.removeItem('appliedVoucher');

      // If MoMo/VNPay and we have a paymentUrl, redirect
      if ((payment === 'MOMO' || payment === 'VNPAY') && order.paymentUrl) {
        window.location.href = order.paymentUrl;
        return;
      }

      setOrderSuccess(order.orderCode);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Đặt hàng thất bại!';
      alert(msg);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  // Success Screen
  if (orderSuccess) return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black text-gray-900">Đặt hàng thành công!</h2>
        <p className="text-gray-500">Mã đơn hàng của bạn</p>
        <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl font-mono text-xl font-black tracking-widest">
          {orderSuccess}
        </div>
        <p className="text-sm text-gray-400">Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.</p>
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button onClick={() => navigate('/')}
            className="py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm">
            Về trang chủ
          </button>
          <button onClick={() => navigate('/profile')}
            className="py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-200">
            Xem đơn hàng
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/cart')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-medium text-sm transition-all">
            <ChevronLeft className="w-5 h-5" /> {step > 1 ? 'Quay lại' : 'Giỏ hàng'}
          </button>
          {/* Steps */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-0.5 rounded-full transition-all ${step > i ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  step === s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' :
                  step > s.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s.id ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form Area */}
          <div className="lg:col-span-7">

            {/* STEP 1: Address */}
            {step === 1 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-white/80" />
                  <h2 className="font-black text-white text-lg">Thông tin giao hàng</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Họ và tên *
                      </label>
                      <input value={form.receiverName} onChange={e => setForm({ ...form, receiverName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all" placeholder="Nguyễn Văn A" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Số điện thoại *
                      </label>
                      <input value={form.receiverPhone} onChange={e => setForm({ ...form, receiverPhone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all" placeholder="0901234567" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tỉnh / Thành phố *</label>
                      {provinces.length > 0 ? (
                        <select 
                          value={form.city} 
                          onChange={e => setForm({ ...form, city: e.target.value, district: '', ward: '' })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Chọn Tỉnh/Thành</option>
                          {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          placeholder="Nhập Tỉnh/Thành"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quận / Huyện *</label>
                      {districts.length > 0 ? (
                        <select 
                          disabled={!form.city}
                          value={form.district} 
                          onChange={e => setForm({ ...form, district: e.target.value, ward: '' })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Chọn Quận/Huyện</option>
                          {districts.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form.district}
                          onChange={e => setForm({ ...form, district: e.target.value })}
                          placeholder="Nhập Quận/Huyện"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phường / Xã *</label>
                      {wards.length > 0 ? (
                        <select 
                          disabled={!form.district}
                          value={form.ward} 
                          onChange={e => setForm({ ...form, ward: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">Chọn Phường/Xã</option>
                          {wards.map(w => <option key={w.code} value={w.name}>{w.name}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form.ward}
                          onChange={e => setForm({ ...form, ward: e.target.value })}
                          placeholder="Nhập Phường/Xã"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Địa chỉ chi tiết (Số nhà, tên đường) *
                    </label>
                    <input value={form.addressDetail} onChange={e => setForm({ ...form, addressDetail: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Ghi chú đơn hàng
                    </label>
                    <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition-all resize-none" placeholder="Ghi chú cho đơn hàng (không bắt buộc)..." />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Shipping */}
            {step === 2 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center gap-3">
                  <Truck className="w-5 h-5 text-white/80" />
                  <h2 className="font-black text-white text-lg">Phương thức vận chuyển</h2>
                </div>
                <div className="p-6 space-y-3">
                  {SHIPPING_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setShipping(opt.id)}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                        shipping === opt.id
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-100'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}>
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{opt.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                      </div>
                      <div className="text-right">
                        {freeShip ? (
                          <div>
                            <span className="text-xs text-gray-400 line-through">{fmt(opt.price)}</span>
                            <div className="font-black text-emerald-500 text-sm">Miễn phí</div>
                          </div>
                        ) : (
                          <span className="font-black text-gray-900">{fmt(opt.price)}</span>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        shipping === opt.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                      }`}>
                        {shipping === opt.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                  {freeShip && (
                    <div className="bg-emerald-50 rounded-xl px-4 py-3 text-xs text-emerald-700 font-bold text-center">
                      🎉 Đơn hàng trên 2.000.000₫ — Miễn phí vận chuyển tất cả hình thức!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Payment */}
            {step === 3 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-5 flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-white/80" />
                  <h2 className="font-black text-white text-lg">Phương thức thanh toán</h2>
                </div>
                <div className="p-6 space-y-3">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} onClick={() => setPayment(m.id)}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                        payment === m.id
                          ? 'border-purple-500 bg-purple-50/50 shadow-lg shadow-purple-100'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        m.color === 'green' ? 'bg-green-100' : m.color === 'pink' ? 'bg-pink-100' : 'bg-blue-100'
                      }`}>
                        <m.icon className={`w-6 h-6 ${
                          m.color === 'green' ? 'text-green-600' : m.color === 'pink' ? 'text-pink-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        payment === m.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                      }`}>
                        {payment === m.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/cart')}
                className="px-6 py-3 text-gray-500 hover:text-gray-900 font-bold text-sm rounded-2xl hover:bg-gray-100 transition-all">
                ← {step > 1 ? 'Quay lại' : 'Giỏ hàng'}
              </button>
              {step < 3 ? (
                <button onClick={() => setStep(step + 1)} disabled={!canNext()}
                  className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg disabled:opacity-40 flex items-center gap-2 active:scale-95">
                  Tiếp tục <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handlePlaceOrder} disabled={placing || !canNext()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-40 flex items-center gap-2 active:scale-95">
                  {placing ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <>Đặt hàng • {fmt(total)}</>}
                </button>
              )}
            </div>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-900 flex items-center justify-between">
                  <h3 className="font-black text-white">Đơn hàng của bạn</h3>
                  <span className="text-xs font-bold text-white/60">{cartItems.length} sản phẩm</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-[340px] overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.cartItemId} className="flex items-center gap-3 px-6 py-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 relative">
                        {item.productThumbnail
                          ? <img src={getFullImageUrl(item.productThumbnail)} alt="" className="w-full h-full object-contain p-1" />
                          : <Package className="w-6 h-6 text-gray-300 absolute inset-0 m-auto" />}
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{item.productName}</div>
                        {item.variantAttributes && <div className="text-[10px] text-gray-400 mt-0.5">{item.variantAttributes}</div>}
                      </div>
                      <span className="font-bold text-sm text-gray-900 shrink-0">{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                {appliedVoucher && (
                  <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2">
                    <span className="text-base">🎉</span>
                    <div className="text-[10px] text-emerald-800 leading-tight">
                      <span className="font-black block uppercase tracking-wider">Tự động áp dụng</span>
                      Hệ thống đã tự chọn voucher tốt nhất cho bạn: <strong className="font-extrabold text-xs">{appliedVoucher.code}</strong>
                    </div>
                  </div>
                )}
                <div className="px-6 py-5 bg-gray-50/50 space-y-3 border-t border-gray-100">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Tạm tính</span><span className="font-bold">{fmt(subtotal)}</span></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Vận chuyển</span>
                    <span className={`font-bold ${freeShip ? 'text-emerald-500' : ''}`}>{freeShip ? 'Miễn phí' : fmt(actualShipping)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 font-medium">Giảm giá ({appliedVoucher?.code})</span>
                      <span className="font-bold text-emerald-600">- {fmt(discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-black text-gray-900">Tổng</span>
                    <span className="font-black text-blue-600 text-xl">{fmt(total)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery info summary (visible on step 2+) */}
              {step >= 2 && form.receiverName && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Giao đến</span>
                    <button onClick={() => setStep(1)} className="text-xs text-blue-600 font-bold hover:underline">Sửa</button>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{form.receiverName} • {form.receiverPhone}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">{fullAddress}</div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Bảo mật SSL 256-bit • Thanh toán an toàn
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
