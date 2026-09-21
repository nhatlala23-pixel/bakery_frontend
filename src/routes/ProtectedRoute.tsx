import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const isAdminPath = window.location.pathname.startsWith('/admin');
  const userKey = isAdminPath ? 'adminUser' : 'user';
  const userStr = localStorage.getItem(userKey);
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    const roleName = user.roleName || 'USER';

    if (allowedRoles && !allowedRoles.includes(roleName)) {
      return <Navigate to="/" replace />; // redirect to home if not authorized
    }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
