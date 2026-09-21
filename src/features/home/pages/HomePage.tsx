import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star, Heart } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import productService, { type ProductResponse } from '@/services/api/productService';
import bannerService, { type BannerResponse } from '@/services/api/bannerService';
import categoryService, { type CategoryDTO } from '@/services/api/categoryService';
import { getFullImageUrl } from '@/utils/image';
import { Link } from 'react-router-dom';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  'banh-kem': 'https://images.unsplash.com/photo-1535141192574-5d4897c13636?w=800&auto=format&fit=crop&q=80',
  'banh-ngot': 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=800&auto=format&fit=crop&q=80',
  'banh-man': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  'combo': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
};

export const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ProductResponse[]>([]);
  const [heroBanner, setHeroBanner] = useState<BannerResponse | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, bannersData, catsData] = await Promise.all([
          productService.getAllProducts(0, 4),
          bannerService.getAllBanners(),
          categoryService.getAllCategoriesList()
        ]);
        setFeaturedProducts(productsData.content || []);
        if (bannersData.length > 0) {
          setHeroBanner(bannersData[0]);
        }
        setCategories((catsData || []).filter(c => c.status === 1));
      } catch (error) {
        console.error("Failed to load homepage data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Header />
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center bg-brand-light overflow-hidden pt-12 md:pt-0">
        <div className="container mx-auto px-4 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl z-10"
          >
            <motion.p 
              variants={fadeInUp}
              className="text-brand-accent text-sm md:text-base font-medium tracking-[0.2em] uppercase mb-6"
            >
              BAKERY • HANDCRAFTED • LOVE
            </motion.p>
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-[5rem] leading-[1.1] font-serif font-bold text-brand-dark mb-6"
            >
              Ngọt ngào cho những khoảnh khắc đáng nhớ.
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-brand-muted text-lg md:text-xl leading-relaxed mb-10 max-w-lg"
            >
              Những chiếc bánh được tạo nên từ sự tận tâm, nguyên liệu được chọn lọc và những câu chuyện đáng nhớ.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-6">
              <Link 
                to="/collections" 
                className="group flex items-center gap-3 bg-brand-dark text-brand-light px-8 py-4 rounded-full text-sm font-medium hover:bg-black transition-colors"
              >
                Xem bộ sưu tập
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="https://zalo.me/0987654321" 
                target="_blank" 
                rel="noreferrer"
                className="text-sm font-medium text-brand-dark hover:text-brand-accent transition-colors underline underline-offset-4"
              >
                Liên hệ Zalo
              </a>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="relative h-[50vh] lg:h-[80vh] w-full rounded-[2rem] overflow-hidden"
          >
            <img 
              src={heroBanner?.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop&q=80"} 
              alt="Gấu Bakery" 
              className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-[2s]"
            />
          </motion.div>
        </div>
      </section>

      {/* 2. MARQUEE SECTION */}
      <div className="bg-brand-dark text-brand-light py-6 overflow-hidden flex whitespace-nowrap">
        <div className="animate-[marquee_20s_linear_infinite] flex items-center gap-12 text-sm font-medium tracking-[0.2em] uppercase">
          {Array(8).fill("FRESHLY BAKED • HANDCRAFTED • MADE WITH LOVE • GẤU BAKERY").map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </div>
      </div>

      {/* 3. CATEGORY SECTION */}
      <section className="py-24 md:py-32 bg-brand-secondary">
        <div className="container mx-auto px-4 lg:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mb-16 md:mb-24 text-center md:text-left"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-4">
              Khám phá hương vị
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-brand-muted text-lg">
              Những lựa chọn được tạo nên cho từng khoảnh khắc.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {(categories.length > 0 ? categories.slice(0, 4) : [
              { id: 1, categoryName: "Bánh kem", slug: "banh-kem", image: "" },
              { id: 2, categoryName: "Bánh ngọt", slug: "banh-ngot", image: "" },
              { id: 3, categoryName: "Bánh mặn", slug: "banh-man", image: "" },
              { id: 4, categoryName: "Bánh theo yêu cầu", slug: "combo", image: "" }
            ]).map((cat, i) => {
              const defaultImg = DEFAULT_CATEGORY_IMAGES[cat.slug] || DEFAULT_CATEGORY_IMAGES['combo'];
              const imgSrc = cat.image ? getFullImageUrl(cat.image) : defaultImg;

              return (
                <motion.div
                  key={cat.id || cat.categoryName}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <Link to={`/category/${cat.slug}`} className="group block relative rounded-[2rem] overflow-hidden aspect-[4/5] bg-amber-50">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors z-10" />
                    <img 
                      src={imgSrc} 
                      alt={cat.categoryName} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultImg;
                      }}
                    />
                    <div className="absolute bottom-0 left-0 p-8 z-20 w-full transform group-hover:-translate-y-2 transition-transform duration-500">
                      <h3 className="text-2xl font-serif font-bold text-white mb-2 drop-shadow-md">{cat.categoryName}</h3>
                      <div className="flex items-center gap-2 text-white/95 text-sm font-medium">
                        Khám phá <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS */}
      <section className="py-24 md:py-32 bg-brand-light">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-4">
                Những chiếc bánh được yêu thích
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-brand-muted text-lg">
                Khám phá những hương vị được khách hàng lựa chọn nhiều nhất.
              </motion.p>
            </motion.div>
            <Link to="/products" className="text-brand-dark hover:text-brand-accent transition-colors font-medium flex items-center gap-2">
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.length > 0 ? featuredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group cursor-pointer"
                onClick={() => window.location.href = `/product/${product.slug}`}
              >
                <div className="relative rounded-[2rem] overflow-hidden bg-brand-secondary aspect-[4/5] mb-6 border border-brand-secondary group-hover:shadow-xl group-hover:shadow-brand-accent/5 group-hover:-translate-y-1 transition-all duration-500">
                  <img 
                    src={product.thumbnail?.startsWith('http') ? product.thumbnail : `http://localhost:8080${product.thumbnail}`} 
                    alt={product.productName} 
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <span className="w-full bg-white text-brand-dark text-center py-3 rounded-full text-sm font-medium translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      Xem chi tiết →
                    </span>
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="text-brand-muted text-xs uppercase tracking-wider mb-2 font-medium">{product.categoryName}</p>
                  <h3 className="text-lg font-serif font-medium text-brand-dark mb-2 group-hover:text-brand-accent transition-colors line-clamp-1">{product.productName}</h3>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {Array(5).fill(0).map((_, idx) => (
                      <Star key={idx} size={12} className="fill-brand-accent text-brand-accent" />
                    ))}
                  </div>
                  <p className="text-brand-dark font-medium">
                    {(product.salePrice ?? product.originalPrice).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-4 text-center py-20 text-brand-muted">
                Đang tải dữ liệu sản phẩm...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. BRAND STORY */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="container mx-auto px-4 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="aspect-[3/4] rounded-[2rem] overflow-hidden"
            >
              <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800" alt="Kitchen" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -50, y: 50 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute -bottom-10 -right-10 w-2/3 aspect-square rounded-[2rem] border-8 border-white overflow-hidden hidden md:block shadow-2xl"
            >
              <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600" alt="Baking" className="w-full h-full object-cover" />
            </motion.div>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="lg:pl-12"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-6 leading-tight">
              Đằng sau mỗi chiếc bánh là một câu chuyện.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-brand-muted text-lg leading-relaxed mb-12">
              Gấu Bakery ra đời từ tình yêu vô hạn với những chiếc bánh nướng thơm lừng trong căn bếp nhỏ. Chúng tôi tin rằng, mỗi chiếc bánh trao đi không chỉ chứa đựng hương vị ngọt ngào, mà còn gửi gắm cả sự quan tâm, chân thành và lời chúc hạnh phúc.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-8 border-t border-brand-secondary pt-12">
              <div>
                <p className="text-4xl font-serif font-bold text-brand-accent mb-2">10+</p>
                <p className="text-sm text-brand-muted font-medium">Năm đam mê</p>
              </div>
              <div>
                <p className="text-4xl font-serif font-bold text-brand-accent mb-2">50K+</p>
                <p className="text-sm text-brand-muted font-medium">Chiếc bánh</p>
              </div>
              <div>
                <p className="text-4xl font-serif font-bold text-brand-accent mb-2">100%</p>
                <p className="text-sm text-brand-muted font-medium">Tận tâm</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="bg-brand-dark text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay">
           <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600" alt="Texture" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight text-brand-light"
          >
            Bạn đang tìm một chiếc bánh cho dịp đặc biệt?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/70 text-lg mb-10"
          >
            Hãy kể cho Gấu Bakery nghe về ý tưởng của bạn.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a 
              href="https://zalo.me/0987654321" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-3 bg-brand-primary text-brand-dark px-10 py-5 rounded-full text-base font-bold hover:bg-white transition-colors hover:scale-105 transform duration-300"
            >
              💬 Trao đổi qua Zalo
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
};
