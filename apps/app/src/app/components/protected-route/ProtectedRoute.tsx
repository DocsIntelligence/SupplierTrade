import {
  selectAuthStatus,
  selectIsAuthenticated,
  useAppSelector,
} from '@org/store';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuth = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectAuthStatus);
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (status === 'pending') {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
