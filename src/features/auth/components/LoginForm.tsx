import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import authService from '../services/authService';
import cartService from '@/services/api/cartService';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  // Merge guest cart items into the user's server-side cart after login
  const mergeGuestCart = async (userId: number) => {
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    if (!guestCart.length) return;

    const mergePromises = guestCart.map((item: any) => {
      if (item.variantId && item.variantId !== 0) {
        return cartService.addToCart(userId, item.variantId, item.quantity).catch(() => null);
      } else if (item.productId) {
        return cartService.addProductToCart(userId, item.productId, item.quantity).catch(() => null);
      }
      return Promise.resolve(null);
    });

    await Promise.all(mergePromises);
    localStorage.removeItem('guestCart');
    window.dispatchEvent(new Event('cartUpdate'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await authService.login({ email, password });
      const isAdmin = response.user.roleName === 'ADMIN' || response.user.roleName === 'STAFF';
      const tokenKey = isAdmin ? 'adminAccessToken' : 'accessToken';
      const refreshKey = isAdmin ? 'adminRefreshToken' : 'refreshToken';
      const userKey = isAdmin ? 'adminUser' : 'user';

      localStorage.setItem(tokenKey, response.accessToken);
      localStorage.setItem(refreshKey, response.refreshToken);
      localStorage.setItem(userKey, JSON.stringify(response.user));
      
      // Merge guest cart before navigation (only for customer users)
      if (!isAdmin) {
        await mergeGuestCart(response.user.id);
      }
      window.dispatchEvent(new Event('userUpdate'));

      const from = location.state?.from;
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate(from || '/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // Send the id_token (credential) from Google to our backend
      const response = await authService.googleLogin(credentialResponse.credential);
      const isAdmin = response.user.roleName === 'ADMIN' || response.user.roleName === 'STAFF';
      const tokenKey = isAdmin ? 'adminAccessToken' : 'accessToken';
      const refreshKey = isAdmin ? 'adminRefreshToken' : 'refreshToken';
      const userKey = isAdmin ? 'adminUser' : 'user';

      localStorage.setItem(tokenKey, response.accessToken);
      localStorage.setItem(refreshKey, response.refreshToken);
      localStorage.setItem(userKey, JSON.stringify(response.user));
      
      // Merge guest cart before navigation (only for customer users)
      if (!isAdmin) {
        await mergeGuestCart(response.user.id);
      }
      window.dispatchEvent(new Event('userUpdate'));

      const from = location.state?.from;
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate(from || '/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-10 space-y-8 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-br-[3rem] -z-10" />
      
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 bg-brand-secondary rounded-2xl text-brand-accent mb-2">
          <LogIn size={32} />
        </div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-brand-dark">Chào mừng trở lại</h2>
        <p className="text-sm text-brand-muted font-medium">Vui lòng đăng nhập để tiếp tục khám phá</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {successMessage && (
          <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-100 rounded-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in zoom-in duration-300 flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-brand-dark uppercase tracking-wider ml-1">Email tài khoản</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-accent transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-11 pr-4 py-4 bg-brand-light/50 border border-brand-secondary rounded-2xl focus:ring-4 focus:ring-brand-accent/10 focus:border-brand-accent outline-none transition-all font-medium"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Mật khẩu</label>
            <Link to="/forgot-password" className="text-xs font-bold text-brand-accent hover:opacity-80 transition-opacity">Quên mật khẩu?</Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-accent transition-colors">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-11 pr-12 py-4 bg-brand-light/50 border border-brand-secondary rounded-2xl focus:ring-4 focus:ring-brand-accent/10 focus:border-brand-accent outline-none transition-all font-medium"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-brand-accent transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-brand-dark text-white font-bold rounded-2xl hover:bg-black focus:outline-none focus:ring-4 focus:ring-brand-dark/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-brand-dark/10 active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <LogIn size={20} />
              Đăng nhập ngay
            </>
          )}
        </button>
        
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">Hoặc</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Đăng nhập Google thất bại hoặc bị hủy.');
            }}
            useOneTap
            shape="rectangular"
            theme="outline"
            text="signin_with"
            size="large"
          />
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-500 font-medium">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-brand-accent hover:opacity-80 hover:underline transition-all underline-offset-4">
            Đăng ký tài khoản
          </Link>
        </p>
      </div>
    </div>
  );
};
