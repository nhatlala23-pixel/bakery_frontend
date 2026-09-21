import { useState, useEffect } from 'react';
import { Search, Plus, Ticket, Trash2, CheckCircle, Clock, Edit2 } from 'lucide-react';
import { VoucherModal } from '../components/VoucherModal';
import voucherService, { type VoucherResponse } from '@/services/api/voucherService';

export const AdminVouchers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);

  const fetchVouchers = async () => {
    try {
      const data = await voucherService.getAllVouchers();
      setVouchers(data);
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa Voucher này?')) {
      try {
        await voucherService.deleteVoucher(id);
        fetchVouchers();
      } catch (error) {
        console.error('Failed to delete voucher:', error);
      }
    }
  };

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mã giảm giá (Voucher)</h1>
          <p className="text-gray-500 text-sm">Quản lý các mã coupon và chương trình khuyến mãi theo mã</p>
        </div>
        <button 
          onClick={() => {
            setSelectedVoucher(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all font-bold text-sm shadow-lg shadow-black/10"
        >
          <Plus className="w-5 h-5" />
          Tạo Voucher mới
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black/5"
          placeholder="Tìm theo mã hoặc tên..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVouchers.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
            {searchTerm ? 'Không tìm thấy Voucher nào khớp' : 'Chưa có mã giảm giá nào'}
          </div>
        ) : (
          filteredVouchers.map((voucher) => (
            <div key={voucher.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex hover:shadow-xl hover:shadow-black/5 transition-all group">
              <div className={`w-32 flex flex-col items-center justify-center border-r-2 border-dashed border-gray-100 p-4 ${
                voucher.status === 1 ? 'bg-yellow-50/50' : 'bg-gray-50'
              }`}>
                <Ticket className={`w-10 h-10 mb-2 ${
                  voucher.status === 1 ? 'text-yellow-500' : 'text-gray-400'
                }`} />
                <div className="text-center">
                  <div className="text-lg font-black text-gray-900">
                    {voucher.discountValue.toLocaleString()}{voucher.discountType === 'PERCENTAGE' ? '%' : 'đ'}
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">GIẢM</div>
                </div>
              </div>

              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-gray-900 tracking-wider uppercase">{voucher.code}</span>
                      <button 
                        onClick={() => {
                          setSelectedVoucher(voucher);
                          setIsModalOpen(true);
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                      voucher.status === 1 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {voucher.status === 1 ? 'Có hiệu lực' : 'Hết hạn'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Tên: <span className="font-bold text-gray-900">{voucher.name}</span></p>
                  <p className="text-xs text-gray-500">Đơn tối thiểu: <span className="font-bold text-gray-900">{voucher.minOrderValue.toLocaleString()}đ</span></p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Hạn: {voucher.endDate?.split('T')[0]}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {voucher.usageCount}/{voucher.usageLimit}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(voucher.id)}
                    className="text-red-400 hover:text-red-600 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <VoucherModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVoucher(null);
        }}
        onSuccess={fetchVouchers}
        voucher={selectedVoucher}
      />
    </div>
  );
};
