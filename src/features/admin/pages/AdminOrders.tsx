import { useState, useEffect } from 'react';
import { Eye, Clock, CheckCircle, XCircle, Truck, ChevronLeft, ChevronRight, Search, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import orderService, { type OrderResponse } from '../../../services/api/orderService';

export const AdminOrders = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  const filteredOrders = orders.filter(order => 
    order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.receiverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getAllOrders(page, 10);
      setOrders(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'bg-green-100 text-green-600';
      case 'PENDING': return 'bg-yellow-100 text-yellow-600';
      case 'CANCELLED': return 'bg-red-100 text-red-600';
      case 'SHIPPING': return 'bg-blue-100 text-blue-600';
      case 'CONFIRMED': return 'bg-cyan-100 text-cyan-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return <CheckCircle className="w-3 h-3" />;
      case 'PENDING': return <Clock className="w-3 h-3" />;
      case 'CANCELLED': return <XCircle className="w-3 h-3" />;
      case 'SHIPPING': return <Truck className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'Hoàn tất';
      case 'PENDING': return 'Chờ xác nhận';
      case 'CANCELLED': return 'Đã hủy';
      case 'SHIPPING': return 'Đang giao';
      case 'CONFIRMED': return 'Đã xác nhận';
      default: return status;
    }
  };

  // Export danh sách đơn hàng ra Excel
  const exportOrdersExcel = () => {
    const exportData = filteredOrders.map(order => ({
      'Mã đơn hàng': order.orderCode,
      'Khách hàng': order.receiverName,
      'SĐT': order.receiverPhone,
      'Địa chỉ': order.shippingAddress,
      'Phương thức TT': order.paymentMethod,
      'Trạng thái TT': order.paymentStatus,
      'Trạng thái đơn': getStatusLabel(order.orderStatus),
      'Giảm giá': order.discountAmount,
      'Tổng tiền': order.totalAmount,
      'Ghi chú': order.note || '',
      'Ngày đặt': new Date(order.createdAt).toLocaleString('vi-VN'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    // Auto-fit column widths
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...exportData.map(row => String((row as any)[key] || '').length)) + 2
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng');
    XLSX.writeFile(wb, `don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Xuất hóa đơn PDF cho 1 đơn hàng
  const exportInvoicePDF = (order: OrderResponse) => {
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;

    const itemsRows = (order.items || []).map((item, idx) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;color:#6b7280;">${idx + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
          <div style="font-weight:600;color:#111827;">${item.productName}</div>
          <div style="font-size:11px;color:#9ca3af;">SKU: ${item.variantSku || 'N/A'}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${item.price.toLocaleString('vi-VN')}đ</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${item.subtotal.toLocaleString('vi-VN')}đ</td>
      </tr>
    `).join('');

    const subtotal = (order.items || []).reduce((sum, i) => sum + i.subtotal, 0);

    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Hóa đơn #${order.orderCode}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f9fafb; padding: 40px; color: #374151; }
        .invoice { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden; }
        .header { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); color: white; padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
        .header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .header .badge { background: rgba(250,204,21,0.2); color: #facc15; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 8px; display: inline-block; }
        .header-right { text-align: right; font-size: 13px; line-height: 1.8; opacity: 0.8; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 32px 40px; border-bottom: 1px solid #f3f4f6; }
        .info-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; font-weight: 700; margin-bottom: 12px; }
        .info-box p { font-size: 14px; line-height: 1.7; color: #374151; }
        .info-box .highlight { font-weight: 700; color: #111827; font-size: 15px; }
        .items-section { padding: 32px 40px; }
        .items-section h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; font-weight: 700; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        thead th { padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 700; border-bottom: 2px solid #f3f4f6; }
        .total-section { padding: 24px 40px 40px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .total-row.grand { border-top: 2px solid #111827; margin-top: 12px; padding-top: 16px; font-size: 18px; font-weight: 800; color: #111827; }
        .footer { text-align: center; padding: 24px 40px; background: #f9fafb; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
        .btn { font-family: inherit; font-weight: 700; font-size: 14px; cursor: pointer; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s ease; border: none; text-decoration: none; }
        .btn-back { background: #ffffff; color: #374151; border: 1px solid #e5e7eb; padding: 12px 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .btn-back:hover { background: #f9fafb; border-color: #d1d5db; transform: translateY(-1px); }
        .btn-print { background: #111827; color: white; padding: 12px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .btn-print:hover { background: #1f2937; transform: translateY(-1px); }
        @media print { body { padding: 0; background: white; } .invoice { box-shadow: none; border-radius: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align:center;margin-bottom:24px;display:flex;justify-content:center;gap:12px;">
        <button onclick="window.close()" class="btn btn-back">
          ← Quay lại
        </button>
        <button onclick="window.print()" class="btn btn-print">
          🖨️ In hóa đơn / Lưu PDF
        </button>
      </div>

      <div class="invoice">
        <div class="header">
          <div>
            <h1>TECHNO</h1>
            <div class="badge">Hóa đơn bán hàng</div>
          </div>
          <div class="header-right">
            <div style="font-weight:700;font-size:15px;opacity:1;">#${order.orderCode}</div>
            <div>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
            <div>${new Date(order.createdAt).toLocaleTimeString('vi-VN')}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>Thông tin người nhận</h3>
            <p class="highlight">${order.receiverName}</p>
            <p>📞 ${order.receiverPhone}</p>
            <p>📍 ${order.shippingAddress}</p>
          </div>
          <div class="info-box">
            <h3>Thông tin thanh toán</h3>
            <p><strong>Phương thức:</strong> ${order.paymentMethod}</p>
            <p><strong>Trạng thái TT:</strong> ${order.paymentStatus || 'Chưa thanh toán'}</p>
            <p><strong>Trạng thái đơn:</strong> ${getStatusLabel(order.orderStatus)}</p>
            ${order.note ? `<p style="margin-top:8px;"><strong>Ghi chú:</strong> ${order.note}</p>` : ''}
          </div>
        </div>

        <div class="items-section">
          <h3>Chi tiết sản phẩm</h3>
          <table>
            <thead>
              <tr>
                <th style="text-align:center;width:40px;">STT</th>
                <th>Sản phẩm</th>
                <th style="text-align:center;width:70px;">SL</th>
                <th style="text-align:right;width:120px;">Đơn giá</th>
                <th style="text-align:right;width:120px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#9ca3af;">Không có chi tiết sản phẩm</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>Tạm tính</span>
            <span>${subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          <div class="total-row">
            <span>Giảm giá</span>
            <span style="color:#ef4444;">-${(order.discountAmount || 0).toLocaleString('vi-VN')}đ</span>
          </div>
          <div class="total-row grand">
            <span>Tổng cộng</span>
            <span>${order.totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <div class="footer">
          <p>Cảm ơn quý khách đã mua hàng tại <strong>TECHNO</strong>!</p>
          <p style="margin-top:4px;">Hóa đơn được tạo tự động bởi hệ thống quản lý.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h2>
          <p className="text-sm text-gray-500">Theo dõi và cập nhật trạng thái đơn hàng từ khách hàng.</p>
        </div>
        <button 
          onClick={exportOrdersExcel}
          className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-medium"
        >
          <Download className="w-5 h-5" />
          <span>Export Excel</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm mã đơn hàng, khách hàng..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Ngày đặt</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Thanh toán</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Không tìm thấy đơn hàng nào.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-gray-900">#{order.orderCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-gray-900">{order.receiverName}</div>
                      <div className="text-xs text-gray-400">{order.receiverPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-gray-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600 uppercase italic">
                      {order.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusStyle(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {getStatusLabel(order.orderStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => exportInvoicePDF(order)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"
                          title="Xuất hóa đơn PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h3>
                <p className="text-sm text-gray-500">#{selectedOrder.orderCode}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => exportInvoicePDF(selectedOrder)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Xuất hóa đơn
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Người nhận</p>
                  <p className="font-bold text-gray-900">{selectedOrder.receiverName}</p>
                  <p className="text-sm text-gray-500">📞 {selectedOrder.receiverPhone}</p>
                  <p className="text-sm text-gray-500">📍 {selectedOrder.shippingAddress}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Thông tin đơn</p>
                  <p className="text-sm"><strong>PT thanh toán:</strong> {selectedOrder.paymentMethod}</p>
                  <p className="text-sm"><strong>TT thanh toán:</strong> {selectedOrder.paymentStatus || 'Chưa TT'}</p>
                  <p className="text-sm">
                    <strong>Trạng thái:</strong>{' '}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusStyle(selectedOrder.orderStatus)}`}>
                      {getStatusIcon(selectedOrder.orderStatus)}
                      {getStatusLabel(selectedOrder.orderStatus)}
                    </span>
                  </p>
                  {selectedOrder.note && <p className="text-sm"><strong>Ghi chú:</strong> {selectedOrder.note}</p>}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Sản phẩm</p>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className="w-14 h-14 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                        <img src={item.productImage || '/images/placeholder.png'} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-400">SKU: {item.variantSku || 'N/A'} • SL: {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-gray-900">{item.subtotal.toLocaleString('vi-VN')}đ</p>
                        <p className="text-[10px] text-gray-400">{item.price.toLocaleString('vi-VN')}đ x {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="font-medium">{(selectedOrder.items || []).reduce((s, i) => s + i.subtotal, 0).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Giảm giá</span>
                  <span className="font-medium text-red-500">-{(selectedOrder.discountAmount || 0).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-lg font-black pt-3 border-t border-gray-200">
                  <span>Tổng cộng</span>
                  <span>{selectedOrder.totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
