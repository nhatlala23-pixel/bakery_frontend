import { useState, useEffect } from 'react';
import { X, Ticket, DollarSign, Percent, Hash } from 'lucide-react';
import voucherService from '@/services/api/voucherService';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  voucher?: any;
}

export const VoucherModal = ({ isOpen, onClose, onSuccess, voucher }: VoucherModalProps) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscountValue: 0,
    usageLimit: 0,
    startDate: '',
    endDate: '',
    status: 1
  });

  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code || '',
        name: voucher.name || '',
        discountType: voucher.discountType || 'PERCENTAGE',
        discountValue: voucher.discountValue || 0,
        minOrderValue: voucher.minOrderValue || 0,
        maxDiscountValue: voucher.maxDiscountValue || 0,
        usageLimit: voucher.usageLimit || 0,
        startDate: voucher.startDate?.split('T')[0] || '',
        endDate: voucher.endDate?.split('T')[0] || '',
        status: voucher.status ?? 1
      });
    } else {
      setFormData({
        code: '',
        name: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minOrderValue: 0,
        maxDiscountValue: 0,
        usageLimit: 0,
        startDate: '',
        endDate: '',
        status: 1
      });
    }
  }, [voucher, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate + 'T00:00:00',
        endDate: formData.endDate + 'T23:59:59',
      };
      
      if (voucher) {
        await voucherService.updateVoucher(voucher.id, payload);
      } else {
        await voucherService.createVoucher(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save voucher:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi lưu Voucher.';
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900">
              {voucher ? 'Cập nhật Voucher' : 'Tạo Voucher mới'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Mã Voucher</label>
              <div className="relative">
                <input 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none font-mono uppercase"
                  placeholder="VD: TECHNO50"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                />
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Tên Voucher</label>
              <input 
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                placeholder="VD: Mã giảm giá 50k"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Loại giảm giá</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                value={formData.discountType}
                onChange={e => setFormData({...formData, discountType: e.target.value})}
              >
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Giá trị giảm</label>
              <div className="relative">
                <input 
                  type="number"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                  value={formData.discountValue}
                  onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {formData.discountType === 'PERCENTAGE' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Đơn hàng tối thiểu</label>
              <input 
                type="number"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                value={formData.minOrderValue}
                onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Giới hạn sử dụng</label>
              <input 
                type="number"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                placeholder="0 = Không giới hạn"
                value={formData.usageLimit}
                onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Ngày bắt đầu</label>
              <input 
                type="date"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Ngày kết thúc</label>
              <input 
                type="date"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black/5 outline-none"
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
            >
              {voucher ? 'Lưu thay đổi' : 'Tạo Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
