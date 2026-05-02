import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Requires user to be logged in
export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Requires specific role
export const RoleGuard = ({ role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
