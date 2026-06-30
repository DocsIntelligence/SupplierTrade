import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  fetchMeThunk,
  selectAuthStatus,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { ProtectedRoute } from './components/protected-route/ProtectedRoute';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { ConfigLayout } from './features/config/ConfigLayout';
import { ConfigOverview } from './features/config/ConfigOverview';
import { ConfigUsers } from './features/config/ConfigUsers';
import { ConfigPlans } from './features/config/ConfigPlans';
import { ConfigPayments } from './features/config/ConfigPayments';
import { ConfigAiUsage } from './features/config/ConfigAiUsage';
import { ConfigMailLogs } from './features/config/ConfigMailLogs';
import { ConfigNotifications } from './features/config/ConfigNotifications';
import { ConfigVerification } from './features/config/ConfigVerification';
import { ConfigLookups } from './features/config/ConfigLookups';
import { ConfigSettings } from './features/config/ConfigSettings';
import { AuthCallback } from './features/auth/callback/AuthCallback';
import { ForgotPassword } from './features/auth/forgot-password/ForgotPassword';
import { Login } from './features/auth/login/Login';
import { Register } from './features/auth/register/Register';
import { ResetPassword } from './features/auth/reset-password/ResetPassword';
import { Dashboard } from './features/dashboard/Dashboard';
import { Settings } from './features/settings/Settings';
import { AuthLayout } from './layouts/auth-layout/AuthLayout';
import { MainLayout } from './layouts/main-layout/MainLayout';

export function App() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const attempted = useRef(false);

  // Try to fetch user once on mount (cookie sent automatically).
  // If it fails (no cookie / expired), we just stay on auth pages.
  useEffect(() => {
    if (!attempted.current && status === 'idle') {
      attempted.current = true;
      void dispatch(fetchMeThunk());
    }
  }, [dispatch, status]);

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/config" element={<ConfigLayout />}>
          <Route index element={<ConfigOverview />} />
          <Route path="users" element={<ConfigUsers />} />
          <Route path="plans" element={<ConfigPlans />} />
          <Route path="payments" element={<ConfigPayments />} />
          <Route path="ai-usage" element={<ConfigAiUsage />} />
          <Route path="mail-logs" element={<ConfigMailLogs />} />
          <Route path="notifications" element={<ConfigNotifications />} />
          <Route path="verification" element={<ConfigVerification />} />
          <Route path="lookups" element={<ConfigLookups />} />
          <Route path="settings" element={<ConfigSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
