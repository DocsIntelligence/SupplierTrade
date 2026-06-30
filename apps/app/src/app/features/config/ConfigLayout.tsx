import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@org/ui';
import { selectUser, useAppSelector } from '@org/store';

interface NavItem {
  to: string;
  labelKey: string;
  defaultLabel: string;
}

const NAV: NavItem[] = [
  { to: '/config', labelKey: 'config.overview', defaultLabel: 'Overview' },
  { to: '/config/users', labelKey: 'config.users', defaultLabel: 'Users' },
  { to: '/config/plans', labelKey: 'config.plans', defaultLabel: 'Plans' },
  { to: '/config/payments', labelKey: 'config.payments', defaultLabel: 'Payments' },
  { to: '/config/ai-usage', labelKey: 'config.aiUsage', defaultLabel: 'AI usage' },
  { to: '/config/mail-logs', labelKey: 'config.mailLogs', defaultLabel: 'Mail logs' },
  { to: '/config/notifications', labelKey: 'config.notifications', defaultLabel: 'Notifications' },
  { to: '/config/verification', labelKey: 'config.verification', defaultLabel: 'Verification' },
  { to: '/config/lookups', labelKey: 'config.lookups', defaultLabel: 'Lookups' },
  { to: '/config/settings', labelKey: 'config.settings', defaultLabel: 'Settings' },
  { to: '/config/storage', labelKey: 'config.storage', defaultLabel: 'Storage' },
  { to: '/config/queues', labelKey: 'config.queues', defaultLabel: 'Queues' },
  { to: '/config/referrals', labelKey: 'config.referrals', defaultLabel: 'Referrals' },
];

/**
 * Admin shell for managing every generic module. Lives at /config/*.
 * Each child route hosts one module's admin UI.
 */
export function ConfigLayout() {
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground">
          {t('config.denied.title', 'Access denied')}
        </h2>
        <p className="text-foreground/60 mt-2">
          {t('config.denied.body', 'You need admin privileges to view this page.')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <Card className="rounded-xl p-3 h-fit sticky top-4">
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/config'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/70 hover:bg-secondary/50'
                }`
              }
            >
              {t(n.labelKey, n.defaultLabel)}
            </NavLink>
          ))}
        </nav>
      </Card>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

export default ConfigLayout;
