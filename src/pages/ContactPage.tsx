import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageCircle, Info } from 'lucide-react';
import contactService, { type ContactRequest } from '../services/api/contactService';
import contactSettingService, { type ContactSettingDTO } from '@/services/api/contactSettingService';
import { MainLayout } from '@/components/layout/MainLayout';

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
);

export const ContactPage = () => {
  const [settings, setSettings] = useState<ContactSettingDTO | null>(null);
  const [formData, setFormData] = useState<ContactRequest>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    contactSettingService.getContactSetting()
      .then(res => setSettings(res))
      .catch(() => {});
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Vui lòng nhập chủ đề';
    if (!formData.message.trim()) newErrors.message = 'Vui lòng nhập nội dung liên hệ';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await contactService.submitContact(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to submit contact:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
    <div className="min-h-screen bg-brand-light/30 text-brand-dark font-sans selection:bg-brand-accent/30 overflow-hidden relative">
      
      {/* Floating Zalo / Contact Button */}
      <motion.a 
        href={settings?.zaloUrl || 'https://zalo.me/0987654321'}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/40 z-50 hover:bg-emerald-500 transition-colors"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.a>

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark">
            Liên Hệ <span className="text-brand-accent italic">Gấu Bakery</span>
          </h1>
          <p className="text-brand-muted max-w-2xl mx-auto text-base">
            Chúng tôi luôn sẵn sàng lắng nghe và tư vấn bánh theo yêu cầu. Hãy gửi lời nhắn hoặc gọi điện trực tiếp cho tiệm bánh!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8">
          
          {/* Left Column: Info & Map */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-white border border-brand-secondary shadow-sm rounded-2xl p-6 flex items-start gap-4 hover:border-brand-accent transition-colors group">
                <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                  <div className="text-xs text-brand-muted font-bold tracking-wider mb-1">HOTLINE TIỆM BÁNH</div>
                  <div className="text-xl font-bold text-brand-dark">{settings?.hotline || '0987654321'}</div>
                </div>
              </div>

              <div className="bg-white border border-brand-secondary shadow-sm rounded-2xl p-6 flex items-start gap-4 hover:border-brand-accent transition-colors group">
                <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                  <div className="text-xs text-brand-muted font-bold tracking-wider mb-1">EMAIL TƯ VẤN</div>
                  <div className="text-lg font-bold text-brand-dark">{settings?.email || 'contact@gaubakery.com'}</div>
                </div>
              </div>

              <div className="bg-white border border-brand-secondary shadow-sm rounded-2xl p-6 flex items-start gap-4 hover:border-brand-accent transition-colors group">
                <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                  <div className="text-xs text-brand-muted font-bold tracking-wider mb-1">ĐỊA CHỈ TIỆM BÁNH</div>
                  <div className="text-md font-bold text-brand-dark leading-relaxed">
                    {settings?.address || '123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh'}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-brand-secondary shadow-sm rounded-2xl p-6 flex items-start gap-4 hover:border-brand-accent transition-colors group">
                <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                  <div className="text-xs text-brand-muted font-bold tracking-wider mb-1">GIỜ MỞ CỬA</div>
                  <div className="text-md font-bold text-brand-dark">{settings?.openingHours || '08:00 - 22:00 (Mỗi ngày)'}</div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 pt-2">
              <a href={settings?.facebookUrl || 'https://facebook.com/gaubakery'} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white border border-brand-secondary text-brand-dark flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href={settings?.instagramUrl || 'https://instagram.com/gaubakery'} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white border border-brand-secondary text-brand-dark flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href={settings?.tiktokUrl || 'https://tiktok.com/@gaubakery'} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white border border-brand-secondary text-brand-dark flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all">
                <TiktokIcon className="w-5 h-5" />
              </a>
            </div>

            {/* Google Map */}
            <div className="h-48 rounded-2xl overflow-hidden border border-gray-200 shadow-sm opacity-90 hover:opacity-100 transition-opacity">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d209.0866530152966!2d109.21202500597612!3d13.76688292730159!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x316f6d003eefbf17%3A0x339e590d5356601c!2zR-G6pXUgYmFrZXJ5!5e1!3m2!1svi!2s!4v1786898451776!5m2!1svi!2s"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

          </motion.div>

          {/* Right Column: Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3"
          >
            <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-10 shadow-xl relative overflow-hidden">
              
              {/* Form internal glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2 text-gray-900">
                <Info className="w-6 h-6 text-blue-600" />
                Gửi Yêu Cầu Hỗ Trợ
              </h3>

              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Gửi liên hệ thành công!</h4>
                      <p className="text-sm mt-1 opacity-90">Cảm ơn bạn đã liên hệ. Đội ngũ CSKH sẽ phản hồi qua email hoặc số điện thoại trong vòng 24h làm việc.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 ml-1">Họ và tên <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className={`w-full bg-gray-50 border ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-xl px-4 py-3.5 outline-none transition-all focus:ring-4 ${errors.name ? 'focus:ring-red-500/10' : 'focus:ring-blue-500/10'} text-gray-900 placeholder:text-gray-400`}
                    />
                    {errors.name && <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} className="text-red-500 text-xs ml-1 font-medium">{errors.name}</motion.p>}
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 ml-1">Số điện thoại <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0912345678"
                      className={`w-full bg-gray-50 border ${errors.phone ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-xl px-4 py-3.5 outline-none transition-all focus:ring-4 ${errors.phone ? 'focus:ring-red-500/10' : 'focus:ring-blue-500/10'} text-gray-900 placeholder:text-gray-400`}
                    />
                    {errors.phone && <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} className="text-red-500 text-xs ml-1 font-medium">{errors.phone}</motion.p>}
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 ml-1">Địa chỉ Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                    className={`w-full bg-gray-50 border ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-xl px-4 py-3.5 outline-none transition-all focus:ring-4 ${errors.email ? 'focus:ring-red-500/10' : 'focus:ring-blue-500/10'} text-gray-900 placeholder:text-gray-400`}
                  />
                  {errors.email && <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} className="text-red-500 text-xs ml-1 font-medium">{errors.email}</motion.p>}
                </div>

                {/* Subject Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 ml-1">Chủ đề <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Vấn đề cần hỗ trợ (VD: Bảo hành, Tư vấn sản phẩm...)"
                    className={`w-full bg-gray-50 border ${errors.subject ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-xl px-4 py-3.5 outline-none transition-all focus:ring-4 ${errors.subject ? 'focus:ring-red-500/10' : 'focus:ring-blue-500/10'} text-gray-900 placeholder:text-gray-400`}
                  />
                  {errors.subject && <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} className="text-red-500 text-xs ml-1 font-medium">{errors.subject}</motion.p>}
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 ml-1">Nội dung chi tiết <span className="text-red-500">*</span></label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Mô tả chi tiết vấn đề của bạn..."
                    rows={5}
                    className={`w-full bg-gray-50 border ${errors.message ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} rounded-xl px-4 py-3.5 outline-none transition-all focus:ring-4 ${errors.message ? 'focus:ring-red-500/10' : 'focus:ring-blue-500/10'} text-gray-900 placeholder:text-gray-400 resize-none`}
                  ></textarea>
                  {errors.message && <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} className="text-red-500 text-xs ml-1 font-medium">{errors.message}</motion.p>}
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full relative group overflow-hidden bg-brand-dark hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-dark/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 text-brand-accent" />
                        GỬI YÊU CẦU LIÊN HỆ
                      </>
                    )}
                  </span>
                </motion.button>
              </form>
            </div>
            
            {/* Quick FAQ Below Form */}
            <div className="mt-8 space-y-4">
              <h4 className="font-bold text-brand-dark">Câu hỏi thường gặp:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-brand-secondary shadow-sm p-4 rounded-xl">
                  <div className="text-sm font-bold text-brand-accent mb-1">Bao lâu tôi nhận được phản hồi?</div>
                  <div className="text-xs text-brand-muted leading-relaxed">Chúng tôi cam kết phản hồi các yêu cầu đặt bánh qua form trong vòng 2h làm việc.</div>
                </div>
                <div className="bg-white border border-brand-secondary shadow-sm p-4 rounded-xl">
                  <div className="text-sm font-bold text-brand-accent mb-1">Tôi cần tư vấn đặt bánh gấp?</div>
                  <div className="text-xs text-brand-muted leading-relaxed">Vui lòng gọi trực tiếp Hotline {settings?.hotline || '0987654321'} hoặc nhắn qua Zalo để được hỗ trợ nhanh nhất.</div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
    </MainLayout>
  );
};
