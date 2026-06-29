import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AdminGuard from './components/AdminGuard';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import AdminLayout from './layouts/AdminLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminCombosPage from './pages/admin/AdminCombosPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminRatesPage from './pages/admin/AdminRatesPage';
import AdminRevenuePage from './pages/admin/AdminRevenuePage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminVouchersPage from './pages/admin/AdminVouchersPage';
import CombosPage from './pages/public/CombosPage';
import HomePage from './pages/public/HomePage';
import PricingPage from './pages/public/PricingPage';
import RoomsPage from './pages/public/RoomsPage';
import VouchersPage from './pages/public/VouchersPage';

function PublicWrapper({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicWrapper><HomePage /></PublicWrapper>} />
          <Route path="/phong" element={<PublicWrapper><RoomsPage /></PublicWrapper>} />
          <Route path="/gia" element={<PublicWrapper><PricingPage /></PublicWrapper>} />
          <Route path="/combo" element={<PublicWrapper><CombosPage /></PublicWrapper>} />
          <Route path="/uu-dai" element={<PublicWrapper><VouchersPage /></PublicWrapper>} />

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="doanh-thu" element={<AdminRevenuePage />} />
            <Route path="phong" element={<AdminRoomsPage />} />
            <Route path="gia" element={<AdminRatesPage />} />
            <Route path="san-pham" element={<AdminProductsPage />} />
            <Route path="voucher" element={<AdminVouchersPage />} />
            <Route path="combo" element={<AdminCombosPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
