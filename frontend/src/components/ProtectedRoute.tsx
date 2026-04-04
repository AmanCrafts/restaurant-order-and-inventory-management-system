import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { MainLayout } from './layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === UserRole.ADMIN) {
      return <Navigate to="/" replace />;
    } else if (user.role === UserRole.WAITER) {
      return <Navigate to="/waiter/orders" replace />;
    } else if (user.role === UserRole.COOK) {
      return <Navigate to="/kitchen" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
};
