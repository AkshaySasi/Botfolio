import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import axios from 'axios';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BuilderPage from './pages/BuilderPage';
import PublicPortfolioPage from './pages/PublicPortfolioPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import PortfolioManagePage from './pages/PortfolioManagePage';
import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
import HowItWorksPage from './pages/HowItWorksPage';
import NotFoundPage from './pages/NotFoundPage';
import MaintenancePage from './pages/MaintenancePage';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import MessagesPage from './pages/admin/MessagesPage';
import CouponsPage from './pages/admin/CouponsPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import SystemPage from './pages/admin/SystemPage';
import RevenuePage from './pages/admin/RevenuePage';

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

  if (!checked) return null;
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
        </MaintenanceWrapper>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;