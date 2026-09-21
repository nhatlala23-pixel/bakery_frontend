import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import categoryService, { type CategoryDTO } from '@/services/api/categoryService';
import { getFullImageUrl } from '@/utils/image';

const catIcons: Record<string, string> = {
  'bánh sinh nhật': '🎂', 'bánh kem': '🎂', 'birthday': '🎂',
  'bánh mỳ': '🍞', 'bánh mì': '🥖', 'bread': '🍞',
  'bánh ngọt': '🍰', 'sweet': '🍰', 'cake': '🍰',
  'bánh quy': '🍪', 'cookie': '🍪',
  'cupcake': '🧁', 'muffin': '🧁',
  'donut': '🍩', 'bánh rán': '🍩',
  'croissant': '🥐', 'bánh sừng bò': '🥐',
  'trà': '🧋', 'nước': '🥤', 'drink': '🥤'
};

const getCatIcon = (name: string) => {
  const lower = name.toLowerCase();
  for (const key of Object.keys(catIcons)) {
    if (lower.includes(key)) return catIcons[key];
  }
  return '🍰';
};

export const Categories = () => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAllCategoriesList();
        setCategories(data.filter(c => c.status === 1));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="bg-amber-50/30 py-10">
      <div className="max-w-[1440px] mx-auto px-[20px]">
        {/* Title */}
        <div className="flex flex-col mb-8 text-center md:text-left">
          <h3 className="text-amber-800 font-extrabold uppercase tracking-widest text-[11px] mb-1">
            Khám Phá Hương Vị
          </h3>
          <h2 className="text-[28px] font-black text-amber-950 tracking-tight">
            Danh Mục Mẫu Bánh Nổi Bật
          </h2>
        </div>

        {/* Categories List */}
        <div className="flex flex-wrap gap-x-6 gap-y-8 justify-center md:justify-start">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="group cursor-pointer flex flex-col items-center w-[120px]"
            >
              <div className="w-[88px] h-[88px] bg-white rounded-2xl border border-amber-100 p-1 mb-3 transition-all duration-300 group-hover:border-amber-400 group-hover:shadow-[0_8px_25px_-6px_rgba(217,119,6,0.25)] group-hover:-translate-y-1.5 flex items-center justify-center overflow-hidden">
                {cat.image ? (
                  <img 
                    src={getFullImageUrl(cat.image)} 
                    alt={cat.categoryName} 
                    className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full bg-amber-50/60 rounded-xl flex items-center justify-center text-4xl">
                    <span className="group-hover:scale-110 transition-transform duration-300">
                      {getCatIcon(cat.categoryName)}
                    </span>
                  </div>
                )}
              </div>
              <h4 className="font-bold text-gray-800 text-[13px] text-center px-1 group-hover:text-amber-900 transition-colors line-clamp-2 leading-tight">
                {cat.categoryName}
              </h4>
            </div>
          ))}

          {/* Nút Xem thêm */}
          <div
            onClick={() => navigate('/categories')}
            className="group cursor-pointer flex flex-col items-center w-[120px]"
          >
            <div className="w-[84px] h-[84px] bg-gray-50 rounded-full flex items-center justify-center text-gray-500 mb-3 transition-all duration-300 group-hover:bg-gray-100 group-hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] group-hover:-translate-y-1">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                •••
              </span>
            </div>
            <h4 className="font-bold text-gray-800 text-[13px] text-center px-1 group-hover:text-gray-900 transition-colors line-clamp-2 leading-tight">
              Xem thêm
            </h4>
          </div>
        </div>
      </div>
    </section>
  );
};
