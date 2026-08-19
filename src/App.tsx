import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TasksPage from './pages/dashboard/TasksPage';
import AdsPage from './pages/dashboard/AdsPage';
import WalletPage from './pages/dashboard/WalletPage';
import VIPPage from './pages/dashboard/VIPPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminTasks from './pages/admin/AdminTasks';
import AdminAds from './pages/admin/AdminAds';
import AdminVIP from './pages/admin/AdminVIP';
import AdminSettings from './pages/admin/AdminSettings';
import AdminPaymentMethods from './pages/admin/AdminPaymentMethods';
import AdminTaskReview from './pages/admin/AdminTaskReview';

// Auth Guard
const RequireAuth = ({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-neutral-950"><div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <WalletProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                <Route index element={<DashboardPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="ads" element={<AdsPage />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="vip" element={<VIPPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route path="/admin" element={<RequireAuth requireAdmin><AdminLayout /></RequireAuth>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="payment-methods" element={<AdminPaymentMethods />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="tasks" element={<AdminTasks />} />
                <Route path="task-submissions" element={<AdminTaskReview />} />
                <Route path="tasks-review" element={<AdminTaskReview />} />
                <Route path="ads" element={<AdminAds />} />
                <Route path="vip" element={<AdminVIP />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
