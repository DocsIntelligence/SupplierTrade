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

  // Wait while the initial auth check hasn't resolved yet. `idle` means the
  // app just mounted (e.g. a hard refresh on a deep route) and fetchMe is about
  // to run; `pending` means it's in flight. Redirecting during these states
  // would drop the current URL and bounce the user to /dashboard after login.
  if (status === 'idle' || status === 'pending') {
    return <PageLoader />;
  }

  // Auth check has resolved: redirect only if genuinely unauthenticated
  // (failed = 401, or succeeded with no user).
  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children as React.ReactElement;
}

export default ProtectedRoute;
