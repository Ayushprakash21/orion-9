import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LoadingScreen } from './LoadingScreen';

export const AuthWrapper = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="LOADING WORKSPACE..." />;
  }

  if (!isAuthenticated) {
    // If they were trying to access /admin routes, send them to admin login
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const AdminRoute = () => {
  const { hasRole } = useAuth();
  
  if (hasRole(['platform_admin', 'organization_admin'])) {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
};

