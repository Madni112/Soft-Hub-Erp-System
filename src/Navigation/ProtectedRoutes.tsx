import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/Auth';
interface ProtectedRouteProps {
  allowedRoles: string[];
  userRole: string;
  element: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  userRole,
  element,
}) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/auth/signin" replace />;
  }

  return <>{element}</>; // Directly render the element for the route
};

export default ProtectedRoute;
