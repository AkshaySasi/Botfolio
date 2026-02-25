import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import axios from 'axios';

// Pages
// Pages (Lazy Loaded)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BuilderPage = lazy(() => import('./pages/BuilderPage'));
const PublicPortfolioPage = lazy(() => import('./pages/PublicPortfolioPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PortfolioManagePage = lazy(() => import('./pages/PortfolioManagePage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));

// Admin Pages (Lazy Loaded)
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const MessagesPage = lazy(() => import('./pages/admin/MessagesPage'));
const CouponsPage = lazy(() => import('./pages/admin/CouponsPage'));
const NotificationsPage = lazy(() => import('./pages/admin/NotificationsPage'));
const SystemPage = lazy(() => import('./pages/admin/SystemPage'));
const RevenuePage = lazy(() => import('./pages/admin/RevenuePage'));

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (!user.is_admin) return <Navigate to="/dashboard" />;
  return children;
};

// Maintenance mode wrapper — checks if the backend is in maintenance mode
const MaintenanceWrapper = ({ children }) => {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/maintenance-status`).then(r => {
      setMaintenance(r.data.maintenance);
    }).catch(() => { }).finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 mb-8 animate-pulse text-center">
          <img src="/assets/botfolio-logo-transparent.png" alt="Botfolio" className="w-12 h-12" />
          <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Botfolio
          </span>
        </div>
      </div>
    );
  }
  // Admins bypass maintenance screen
  if (maintenance && !user?.is_admin) return <MaintenancePage />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <MaintenanceWrapper>
          <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/builder" element={
                <ProtectedRoute>
                  <BuilderPage />
                </ProtectedRoute>
              } />
              <Route path="/analytics/:portfolioId" element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/p/:customUrl" element={<PublicPortfolioPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              } />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/manage/:portfolioId" element={
                <ProtectedRoute>
                  <PortfolioManagePage />
                </ProtectedRoute>
              } />

              {/* Admin Console — cryptic path */}
              <Route path="/console-admin5353v1" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="revenue" element={<RevenuePage />} />
                <Route path="coupons" element={<CouponsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="system" element={<SystemPage />} />
              </Route>

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </MaintenanceWrapper>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;