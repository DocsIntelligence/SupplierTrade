import { lazy, Suspense, useEffect, useRef, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  fetchMeThunk,
  selectAuthStatus,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { ProtectedRoute } from './components/protected-route/ProtectedRoute';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AuthCallback } from './features/auth/callback/AuthCallback';
import { ForgotPassword } from './features/auth/forgot-password/ForgotPassword';
import { Login } from './features/auth/login/Login';
import { Register } from './features/auth/register/Register';
import { ResetPassword } from './features/auth/reset-password/ResetPassword';
import { Dashboard } from './features/dashboard/Dashboard';
import { Settings } from './features/settings/Settings';
import { AuthLayout } from './layouts/auth-layout/AuthLayout';
import { DashboardLayout } from './layouts/dashboard-layout/DashboardLayout';

/**
 * Lazy-load a NAMED export as a route element so each admin/config page lives
 * in its own chunk (smaller initial bundle). `/config/*` is rarely visited by
 * normal users, so we don't want it on the critical path.
 */
function lazyNamed<P = Record<string, never>>(
  factory: () => Promise<Record<string, unknown>>,
  name: string,
) {
  return lazy(() =>
    factory().then((m) => ({ default: m[name] as ComponentType<P> })),
  );
}

// Config admin shell + its children — all lazy.
const ConfigLayout = lazyNamed(() => import('./features/config/ConfigLayout'), 'ConfigLayout');
const ConfigOverview = lazyNamed(() => import('./features/config/ConfigOverview'), 'ConfigOverview');
const ConfigUsers = lazyNamed(() => import('./features/config/ConfigUsers'), 'ConfigUsers');
const ConfigPlans = lazyNamed(() => import('./features/config/ConfigPlans'), 'ConfigPlans');
const ConfigPayments = lazyNamed(() => import('./features/config/ConfigPayments'), 'ConfigPayments');
const ConfigAiUsage = lazyNamed(() => import('./features/config/ConfigAiUsage'), 'ConfigAiUsage');
const ConfigMailLogs = lazyNamed(() => import('./features/config/ConfigMailLogs'), 'ConfigMailLogs');
const ConfigNotifications = lazyNamed(() => import('./features/config/ConfigNotifications'), 'ConfigNotifications');
const ConfigVerification = lazyNamed(() => import('./features/config/ConfigVerification'), 'ConfigVerification');
const ConfigLookups = lazyNamed(() => import('./features/config/ConfigLookups'), 'ConfigLookups');
const ConfigSettings = lazyNamed(() => import('./features/config/ConfigSettings'), 'ConfigSettings');
const ConfigStorage = lazyNamed(() => import('./features/config/ConfigStorage'), 'ConfigStorage');
const ConfigQueues = lazyNamed(() => import('./features/config/ConfigQueues'), 'ConfigQueues');
const ConfigReferrals = lazyNamed(() => import('./features/config/ConfigReferrals'), 'ConfigReferrals');
const Referrals = lazyNamed(() => import('./features/referrals/Referrals'), 'Referrals');

// SupplierTrade — operational domain UI (suppliers, verification, listings, QC)
const SuppliersList = lazyNamed(() => import('./features/suppliertrade/SuppliersList'), 'SuppliersList');
const SupplierDetail = lazyNamed(() => import('./features/suppliertrade/SupplierDetail'), 'SupplierDetail');
const Onboarding = lazyNamed(() => import('./features/onboarding/Onboarding'), 'Onboarding');
const RfqList = lazyNamed(() => import('./features/rfq/RfqList'), 'RfqList');
const RfqCreate = lazyNamed(() => import('./features/rfq/RfqCreate'), 'RfqCreate');
const RfqDetail = lazyNamed(() => import('./features/rfq/RfqDetail'), 'RfqDetail');

export function App() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const attempted = useRef(false);

  useEffect(() => {
    if (!attempted.current && status === 'idle') {
      attempted.current = true;
      void dispatch(fetchMeThunk());
    }
  }, [dispatch, status]);

  return (
    <Suspense fallback={<div className="text-foreground/60 p-6">Loading…</div>}>
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
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/suppliers" element={<SuppliersList />} />
          <Route path="/suppliers/new" element={<Navigate to="/onboarding" replace />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
          <Route path="/rfqs" element={<RfqList />} />
          <Route path="/rfqs/new" element={<RfqCreate />} />
          <Route path="/rfqs/:id" element={<RfqDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/referrals" element={<Referrals />} />

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
            <Route path="storage" element={<ConfigStorage />} />
            <Route path="queues" element={<ConfigQueues />} />
            <Route path="referrals" element={<ConfigReferrals />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
