import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'user';
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isLoggedIn, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
