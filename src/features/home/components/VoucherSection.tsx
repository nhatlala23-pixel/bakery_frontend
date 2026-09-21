import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import voucherService, { type VoucherResponse } from '@/services/api/voucherService';

export const VoucherSection = () => {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await voucherService.getAllVouchers();
        const now = new Date();
        const activeVouchers = response.filter(v => 
          v.status === 1 && 
          new Date(v.endDate) >= now &&
          new Date(v.startDate) <= now
        );
        setVouchers(activeVouchers);
      } catch (error) {
        console.error('Failed to fetch vouchers', error);
      }
    };
    fetchVouchers();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (vouchers.length === 0) return null;

  return (
    <section className="py-16 bg-[#f8f9fa]">
      <div className="container mx-auto px-4 lg:px-16 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <h3 className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px]">Đặc quyền mua sắm</h3>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mã Giảm Giá Độc Quyền</h2>
          </div>
          <p className="text-gray-500 font-medium max-w-xs text-[11px]">
            Săn ngay mã giảm giá để tối ưu chi phí cho đơn hàng công nghệ của bạn.
          </p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-10 snap-x snap-mandatory no-scrollbar">
          {vouchers.map((voucher) => (
            <div 
              key={voucher.id} 
              className="flex-shrink-0 w-[280px] snap-center bg-white rounded-[2rem] border-2 border-dashed border-gray-200 hover:border-blue-300 transition-all duration-500 hover:shadow-xl hover:shadow-blue-100 flex relative group overflow-hidden"
            >
              {/* Left Side: Value */}
              <div className="w-[80px] bg-gray-900 p-4 flex flex-col items-center justify-center text-white relative group-hover:bg-blue-600 transition-colors duration-500">
                <span className="text-[8px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">Giảm</span>
                <span className="text-2xl font-black tracking-tighter">
                  {voucher.discountType === 'PERCENTAGE' || voucher.discountType === 'PERCENT'
                    ? `${voucher.discountValue}%` 
                    : `${Math.round(voucher.discountValue / 1000)}K`}
                </span>
                
                {/* Decorative Dots */}
                <div className="absolute -right-1 top-0 bottom-0 flex flex-col justify-around py-3">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className="w-2 h-2 rounded-full bg-white" />
                   ))}
                </div>
              </div>

              {/* Right Side: Info */}
              <div className="flex-1 p-5 flex flex-col justify-between relative">
                <div>
                   <h3 className="font-black text-gray-900 text-sm leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{voucher.name}</h3>
                   <div className="flex items-center gap-2 mb-3">
                      <div className="px-1.5 py-0.5 bg-gray-100 rounded text-[8px] font-black text-gray-500 uppercase tracking-widest">
                         Min {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(voucher.minOrderValue)}
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-[0.15em]">
                     <Clock size={10} className="text-blue-500" />
                     <span>Hết hạn: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <div className="font-mono text-xs font-black text-gray-900 tracking-wider">
                    {voucher.code}
                  </div>
                  <button 
                    onClick={() => handleCopy(voucher.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${
                      copiedCode === voucher.code 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-900 text-white hover:bg-blue-600 shadow-lg shadow-gray-200'
                    }`}
                  >
                    {copiedCode === voucher.code ? 'Đã Lưu' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
