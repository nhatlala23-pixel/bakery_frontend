import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import contactSettingService from '@/services/api/contactSettingService';

export const ZaloButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [zaloUrl, setZaloUrl] = useState<string>('https://zalo.me/0987654321');

  useEffect(() => {
    contactSettingService.getContactSetting()
      .then(res => {
        if (res?.zaloUrl) setZaloUrl(res.zaloUrl);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100 hidden md:block"
          >
            <span className="text-sm font-medium text-brand-dark">Bạn cần tư vấn về bánh?</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={zaloUrl}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors"
        aria-label="Liên hệ Zalo"
      >
        <MessageCircle size={28} />
      </motion.a>
    </div>
  );
};
