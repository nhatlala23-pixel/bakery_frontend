import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/features/home/pages/HomePage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { ProfilePage } from '@/features/auth/pages/ProfilePage';
import { ProductDetailPage } from '@/features/products/pages/ProductDetailPage';
import { ProductListingPage } from '@/features/products/pages/ProductListingPage';
import { ContactPage } from '@/pages/ContactPage';
import { AboutPage } from '@/pages/AboutPage';
import { SearchPage } from '@/pages/SearchPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PoliciesPage } from '@/pages/PoliciesPage';
import { AdminLayout } from '@/features/admin/components/layout/AdminLayout';
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard';
import { AdminProducts } from '@/features/admin/pages/AdminProducts';
import { AdminCategories } from '@/features/admin/pages/AdminCategories';
import { AdminCollections } from '@/features/admin/pages/AdminCollections';
import { AdminBlogs } from '@/features/admin/pages/AdminBlogs';
import { AdminGallery } from '@/features/admin/pages/AdminGallery';
import { AdminBanners } from '@/features/admin/pages/AdminBanners';
import { AdminContacts } from '@/features/admin/pages/AdminContacts';
import { AdminUsers } from '@/features/admin/pages/AdminUsers';
import { AdminSettings } from '@/features/admin/pages/AdminSettings';

import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/product/:slug" element={<ProductDetailPage />} />
      <Route path="/category/:slug" element={<ProductListingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/policies" element={<PoliciesPage />} />
      
      {/* Management / Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          {/* Shared: Admin & Staff */}
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="collections" element={<AdminCollections />} />
          <Route path="blogs" element={<AdminBlogs />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="contacts" element={<AdminContacts />} />

          {/* Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
