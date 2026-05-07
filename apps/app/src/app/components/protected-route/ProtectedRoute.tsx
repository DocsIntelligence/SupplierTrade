import {
  selectAuthStatus,
  selectIsAuthenticated,
  useAppSelector,
} from '@org/store';
import { PageLoader } from '@org/ui';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectAuthStatus);
  const location = useLocation();

  // Show loading only while the initial fetchMe is in flight
  if (status === 'pending') {
    return <PageLoader />;
  }

  // If not authenticated (idle = never tried, failed = 401, succeeded but no user)
  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children as React.ReactElement;
}

export default ProtectedRoute;
