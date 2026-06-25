import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FeedbackPage from './pages/FeedbackPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const { checkAuth, isLoading, isLoggedIn } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />

          {/* Protected routes — any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Route>

          {/* Admin-only route */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
