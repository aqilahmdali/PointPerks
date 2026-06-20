import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';

// PrimeReact
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

// Layouts
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import VoucherList from './pages/user/VoucherList';
import VoucherDetail from './pages/user/VoucherDetail';
import MyRedemptions from './pages/user/MyRedemptions';
import PointsHistory from './pages/user/PointsHistory';
import ReferralPage from './pages/user/ReferralPage';
import PDFVoucherPage from './pages/user/PDFVoucherPage';
import ProfilePage from './pages/user/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageVouchers from './pages/admin/ManageVouchers';
import AddEditVoucher from './pages/admin/AddEditVoucher';
import ManageUsers from './pages/admin/ManageUsers';
import RedemptionAnalytics from './pages/admin/RedemptionAnalytics';

function App() {
  return (
    <Provider store={store}>
      <PrimeReactProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>

            {/* ── Public Routes ─────────────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* ── User Routes (login required) ──────────────────────── */}
            <Route element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/vouchers" element={<VoucherList />} />
              <Route path="/vouchers/:id" element={<VoucherDetail />} />
              <Route path="/my-redemptions" element={<MyRedemptions />} />
              <Route path="/my-redemptions/:id/pdf" element={<PDFVoucherPage />} />
              <Route path="/points-history" element={<PointsHistory />} />
              <Route path="/referral" element={<ReferralPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* ── Admin Routes (admin role required) ────────────────── */}
            <Route element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/vouchers" element={<ManageVouchers />} />
              <Route path="/admin/vouchers/new" element={<AddEditVoucher />} />
              <Route path="/admin/vouchers/:id/edit" element={<AddEditVoucher />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/redemptions" element={<RedemptionAnalytics />} />
              <Route path="/admin/analytics" element={<RedemptionAnalytics />} />
            </Route>

            {/* ── Fallback ──────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Router>
      </PrimeReactProvider>
    </Provider>
  );
}

export default App;
