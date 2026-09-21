import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Package, Loader2 } from 'lucide-react';
import axiosClient from '@/services/api/axiosClient';

interface MomoReturnResult {
  success: boolean;
  updated: boolean;
  resultCode: number;
  orderId: string;
  message?: string;
}

const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<MomoReturnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const notifyBackend = async () => {
      // Lấy toàn bộ params MoMo trả về trong URL
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Nếu không có resultCode → không phải từ MoMo redirect
      if (!params.resultCode) {
        setLoading(false);
        setError('Không tìm thấy thông tin kết quả thanh toán.');
        return;
      }

      // Convert resultCode sang số
      const resultCodeNum = parseInt(params.resultCode, 10);
      const bodyToSend: Record<string, string | number> = {
        ...params,
        resultCode: resultCodeNum,
      };

      try {
        // Gọi backend để cập nhật trạng thái đơn hàng
        const res = await axiosClient.post<MomoReturnResult>(
          '/payments/momo-return',
          bodyToSend
        );
        setResult(res as unknown as MomoReturnResult);
      } catch (err: any) {
        // Nếu backend báo lỗi, vẫn hiển thị kết quả dựa theo resultCode từ MoMo
        const fallback: MomoReturnResult = {
          success: resultCodeNum === 0,
          updated: false,
          resultCode: resultCodeNum,
          orderId: params.orderId || '',
          message: err?.response?.data?.message || err?.message,
        };
        setResult(fallback);
      } finally {
        setLoading(false);
      }
    };

    notifyBackend();
  }, [searchParams]);

  const orderId = searchParams.get('orderId') || result?.orderId || '';
  const isSuccess = result?.success ?? (searchParams.get('resultCode') === '0');
  const message = searchParams.get('message') || result?.message;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-14 h-14 animate-spin text-indigo-500" />
            <p className="text-gray-500 font-medium">Đang xác nhận thanh toán...</p>
          </div>
        ) : error ? (
          <div>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Lỗi xác nhận</h1>
            <p className="text-gray-500 mb-8">{error}</p>
          </div>
        ) : isSuccess ? (
          <div className="animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-600 mb-2">
              Cảm ơn bạn đã tin tưởng mua sắm.
            </p>
            {orderId && (
              <p className="text-gray-500 mb-8">
                Đơn hàng <span className="font-semibold text-gray-900">{orderId}</span> đang được xử lý.
              </p>
            )}
          </div>
        ) : (
          <div className="animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
            <p className="text-gray-600 mb-8">
              {message || 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'}
            </p>
          </div>
        )}

        {!loading && (
          <div className="space-y-3 mt-4">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại trang chủ
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              Xem đơn hàng của tôi
            </button>
            {!isSuccess && (
              <button
                onClick={() => navigate('/cart')}
                className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl transition-colors"
              >
                Thử thanh toán lại
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
