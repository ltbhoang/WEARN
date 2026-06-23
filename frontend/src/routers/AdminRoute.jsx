// components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const AdminRoute = ({ children }) => {
  const { user, accessToken, loading } = useAuthStore();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_staff) {
    return <Navigate to="/" replace />;
  }

  return children;
};