import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@org/ui';
import { apiGet } from './_api';

interface Stats {
  userCount: number;
  paymentCount: number;
  activeWallets: number;
}

export function ConfigOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiGet<Stats>('/admin/stats').then(setStats).catch(() => undefined);
  }, []);

  const cards: Array<{ key: string; label: string; value: number | string }> = [
    {
      key: 'users',
      label: t('config.overview.users', 'Users'),
      value: stats?.userCount ?? '—',
    },
    {
      key: 'payments',
      label: t('config.overview.payments', 'Payments'),
      value: stats?.paymentCount ?? '—',
    },
    {
      key: 'wallets',
      label: t('config.overview.activeWallets', 'Active wallets'),
      value: stats?.activeWallets ?? '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('config.overview.title', 'Admin overview')}
        </h2>
        <p className="text-foreground/60 mt-1">
          {t(
            'config.overview.subtitle',
            'Quick health snapshot. Use the sidebar to manage each module.',
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.key} className="rounded-xl p-5">
            <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
              {c.label}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ConfigOverview;
