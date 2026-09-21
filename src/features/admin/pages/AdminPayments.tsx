import { useState, useEffect } from 'react';
import { Search, CreditCard, Wallet, CheckCircle, Clock, XCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import paymentService, { type PaymentResponse } from '@/services/api/paymentService';

export const AdminPayments = () => {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const response = await paymentService.getAllPayments(page, 10);
        setPayments(response.content || []);
        setTotalPages(response.totalPages || 0);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [page]);

  const totalReceived = payments.filter(p => p.paymentStatus === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter(p => p.paymentStatus === 'PENDING').length;
  const failedCount = payments.filter(p => p.paymentStatus === 'FAILED').length;

  const filteredPayments = payments.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.orderCode?.toLowerCase().includes(term) ||
      p.customerName?.toLowerCase().includes(term) ||
      p.transactionNo?.toLowerCase().includes(term)
    );
  });

  const exportToExcel = () => {
    const headers = ['Mã thanh toán', 'Mã đơn hàng (Đối soát)', 'Khách hàng', 'Phương thức', 'Số tiền', 'Trạng thái', 'Mã GD Cổng TT', 'Ngày'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(p => 
        [
          p.id, 
          p.orderCode, 
          `"${p.customerName || ''}"`, 
          p.paymentMethod, 
          p.amount, 
          p.paymentStatus, 
          p.gatewayTransactionId || '', 
          p.paidAt || p.createdAt
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lich-su-thanh-toan-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giao dịch & Thanh toán</h1>
          <p className="text-gray-500 text-sm">Theo dõi dòng tiền và trạng thái thanh toán đơn hàng</p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle className="w-24 h-24 text-green-500" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Doanh thu đã nhận</p>
          <div className="text-2xl font-black text-gray-900">{totalReceived.toLocaleString()}đ</div>
          <div className="flex items-center text-xs text-gray-400 font-bold mt-2">
            Tổng doanh thu thành công
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-24 h-24 text-blue-500" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Đang chờ xử lý</p>
          <div className="text-2xl font-black text-gray-900">{pendingCount}</div>
          <div className="text-xs text-gray-400 font-bold mt-2">Đơn hàng chờ thanh toán</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <XCircle className="w-24 h-24 text-red-500" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Thất bại / Hủy</p>
          <div className="text-2xl font-black text-gray-900">{failedCount}</div>
          <div className="text-xs text-gray-400 font-bold mt-2">Giao dịch không thành công</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm mã đơn hàng, giao dịch, khách hàng..."
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-50 rounded-2xl focus:ring-2 focus:ring-black/5 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-medium whitespace-nowrap"
        >
          <Download className="w-5 h-5" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mã giao dịch</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Phương thức</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Số tiền</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Chưa có giao dịch nào</td></tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-gray-900">#{payment.id} {payment.gatewayTransactionId && `(${payment.gatewayTransactionId})`}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Đơn: <span className="text-blue-600">{payment.orderCode}</span></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">{payment.customerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                          {payment.paymentMethod === 'COD' ? <Wallet className="w-3 h-3 text-orange-500" /> : <CreditCard className="w-3 h-3 text-blue-500" />}
                          <span className="text-[10px] font-bold text-gray-600 uppercase">{payment.paymentMethod}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{payment.amount.toLocaleString()}đ</div>
                    </td>
                    <td className="px-6 py-4">
                      {payment.paymentStatus === 'SUCCESS' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-bold uppercase">Thành công</span>
                      ) : payment.paymentStatus === 'PENDING' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">Chờ xử lý</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold uppercase">Thất bại</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-xs text-gray-500">
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleString('vi-VN') : new Date(payment.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Trang {page + 1} / {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 hover:bg-gray-50 border border-gray-100 rounded-lg disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 hover:bg-gray-50 border border-gray-100 rounded-lg disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
