import { useNavigate } from 'react-router-dom';
import { GitCompareArrows, X, ArrowRight } from 'lucide-react';
import { useCompare } from '@/contexts/CompareContext';

const getFullImageUrl = (url?: string) => {
  if (!url || url === 'undefined') return 'https://placehold.co/80x80/f3f4f6/94a3b8?text=SP';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

export const CompareBar = () => {
  const { compareItems, removeFromCompare, clearCompare, isBarVisible } = useCompare();
  const navigate = useNavigate();

  if (!isBarVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-700 shadow-2xl shadow-black/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4 flex-wrap md:flex-nowrap">
          {/* Label */}
          <div className="flex items-center gap-2 shrink-0">
            <GitCompareArrows size={18} className="text-indigo-400" />
            <span className="text-sm font-black text-white uppercase tracking-wider">So sánh</span>
            <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {compareItems.length}/3
            </span>
          </div>

          {/* Compare items */}
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            {compareItems.map(product => (
              <div key={product.id} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 group">
                <img
                  src={getFullImageUrl(product.thumbnail)}
                  alt={product.productName}
                  className="w-8 h-8 object-contain rounded-lg bg-white p-0.5"
                />
                <span className="text-xs font-bold text-gray-200 max-w-[120px] truncate">{product.productName}</span>
                <button
                  onClick={() => removeFromCompare(product.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 3 - compareItems.length }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-800/50 border border-dashed border-gray-600 rounded-xl px-3 py-2 w-[160px] h-[44px]">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">+ Thêm sản phẩm</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearCompare}
              className="px-3 py-2 text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
            >
              Xóa tất cả
            </button>
            <button
              onClick={() => navigate('/compare')}
              disabled={compareItems.length < 2}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-indigo-900/30"
            >
              So sánh ngay <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
