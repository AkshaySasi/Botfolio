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
  const { user, backendReady } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [showWakingUp, setShowWakingUp] = useState(false);

  useEffect(() => {
    // Check maintenance status in background without blocking initial render
    axios.get(`${API_URL}/api/maintenance-status`).then(r => {
      setMaintenance(r.data.maintenance);
    }).catch(() => { });

    // If backend isn't ready in 3 seconds, show "Waking up" feedback
    const timer = setTimeout(() => {
      if (!backendReady) setShowWakingUp(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [backendReady]);

  // Admins bypass maintenance screen
  if (maintenance && !user?.is_admin) return <MaintenancePage />;

  return (
    <>
      {showWakingUp && !backendReady && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-full flex items-center gap-3 shadow-lg shadow-emerald-500/10">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest whitespace-nowrap">
            Waking up Botfolio Servers...
          </span>
        </div>
      )}
      {children}
    </>
  );
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