import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Menu, X, Phone } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import categoryService, { type CategoryDTO } from '@/services/api/categoryService';
import contactSettingService from '@/services/api/contactSettingService';
import { getFullImageUrl } from '@/utils/image';

export const Header = () => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadLogo = () => {
      contactSettingService.getContactSetting()
        .then(res => {
          if (res?.logoUrl) setLogoUrl(res.logoUrl);
        })
        .catch(() => {});
    };
    loadLogo();
    window.addEventListener('logoUpdate', loadLogo);
    return () => window.removeEventListener('logoUpdate', loadLogo);
  }, []);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catData = await categoryService.getAllCategoriesList();
        setCategories(catData.filter(c => c.status === 1));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Danh mục', path: '/categories', hasDropdown: true },
    { name: 'Bộ sưu tập', path: '/collections' },
    { name: 'Câu chuyện', path: '/about' },
    { name: 'Tin tức', path: '/blogs' },
    { name: 'Liên hệ', path: '/contact' },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-brand-dark text-brand-light text-[11px] uppercase tracking-[0.2em] font-medium py-2.5 px-4 text-center">
        Chào mừng bạn đến với Gấu Bakery - Bánh tươi mỗi ngày
      </div>

      {/* Main Header */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-500 bg-brand-light ${
          isScrolled ? 'shadow-sm py-4' : 'py-6'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden text-brand-dark p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link 
              to="/" 
              onClick={(e) => {
                e.preventDefault();
                if (window.location.pathname === '/') {
                  window.location.reload();
                } else {
                  window.location.href = '/';
                }
              }}
              className="text-2xl md:text-3xl font-serif font-bold text-brand-dark tracking-tight flex-shrink-0 flex items-center gap-3"
            >
              {logoUrl ? (
                <img 
                  src={getFullImageUrl(logoUrl)} 
                  alt="Gấu Bakery Logo"  
                  className="h-10 md:h-12 w-auto object-contain shrink-0" 
                />
              ) : null}
              <span>Gấu<span className="text-brand-accent italic">Bakery</span></span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              {navLinks.map((link) => (
                <div key={link.name} className="relative group">
                  <Link 
                    to={link.path}
                    className="text-sm font-medium text-brand-dark hover:text-brand-accent transition-colors tracking-wide flex items-center gap-1 py-2"
                  >
                    {link.name}
                    {link.hasDropdown && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />}
                  </Link>
                  
                  {/* Category Dropdown */}
                  {link.hasDropdown && categories.length > 0 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-[240px]">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2">
                        {categories.map(cat => (
                          <Link 
                            key={cat.id} 
                            to={`/category/${cat.slug}`}
                            className="block px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-brand-accent hover:bg-brand-light transition-colors"
                          >
                            {cat.categoryName}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
              <button 
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="text-brand-dark hover:text-brand-accent transition-colors p-2"
              >
                {searchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
              
              <a 
                href="https://zalo.me/0987654321" 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-black transition-colors"
              >
                <Phone size={16} />
                <span>Đặt bánh ngay</span>
              </a>
            </div>
          </div>

          {/* Search Bar Overlay */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${searchOpen ? 'max-h-24 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm hương vị bạn yêu thích..."
                className="w-full bg-white border-b-2 border-brand-accent/30 text-brand-dark px-4 py-3 focus:outline-none focus:border-brand-accent text-sm font-medium transition-colors"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-accent">
                <Search size={20} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-white z-40 lg:hidden transition-transform duration-500 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-32 px-6 flex flex-col gap-6 h-full overflow-y-auto">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className="text-2xl font-serif font-medium text-brand-dark"
            >
              {link.name}
            </Link>
          ))}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <a 
              href="https://zalo.me/0987654321" 
              className="flex items-center justify-center gap-2 bg-brand-dark text-white px-6 py-4 rounded-full text-lg font-medium w-full"
            >
              <Phone size={20} />
              <span>Liên hệ Zalo Đặt Bánh</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
