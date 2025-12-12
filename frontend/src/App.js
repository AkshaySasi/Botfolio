import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import '@/App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import MessagesPage from './pages/admin/MessagesPage';
import { CouponsPage, NotificationsPage } from './pages/admin/PlaceholderPages';

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
  if (loading) return <div>Loading...</div>;
  // For now we allow any logged in user to access admin for demo purposes, 
  // or you can strictly check user.is_admin if you manually updated the db
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
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

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;