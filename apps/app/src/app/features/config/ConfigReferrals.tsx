import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DataTable } from '@org/ui';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface AdminReferral {
  id: string;
  code: string;
  rewardStatus: string;
  rewardMetadata: unknown;
  createdAt: string;
  usedAt: string | null;
  referrer: { id: string; name: string; email: string };
  referred: { id: string; name: string; email: string } | null;
}

export function ConfigReferrals() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AdminReferral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<AdminReferral[]>('/admin/referrals')
      .then(setRows)
      .catch(() => toast.error(t('config.referrals.loadError', 'Failed to load referrals')))
      .finally(() => setLoading(false));
  }, [t]);

  const reward = useCallback(
    async (id: string) => {
      try {
        await apiSend('/admin/referrals/' + id + '/reward', 'POST', { id });
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, rewardStatus: 'awarded' } : r)),
        );
        toast.success(t('config.referrals.rewarded', 'Marked as awarded'));
      } catch {
        toast.error(t('config.referrals.rewardFailed', 'Failed to mark as awarded'));
      }
    },
    [t],
  );

  const columns = useMemo(
    () => [
      {
        key: 'when',
        header: t('config.referrals.col.when', 'When'),
        cell: (r: AdminReferral) => (
          <span className="text-foreground/70 text-xs">
            {new Date(r.createdAt).toLocaleString()}
          </span>
        ),
        sortValue: (r: AdminReferral) => r.createdAt,
      },
      {
        key: 'referrer',
        header: t('config.referrals.col.referrer', 'Referrer'),
        cell: (r: AdminReferral) => (
          <div className="flex flex-col">
            <span className="font-medium">{r.referrer.name}</span>
            <span className="text-xs text-foreground/60">{r.referrer.email}</span>
          </div>
        ),
      },
      {
        key: 'code',
        header: t('config.referrals.col.code', 'Code'),
        cell: (r: AdminReferral) => <span className="font-mono text-xs">{r.code}</span>,
      },
      {
        key: 'referred',
        header: t('config.referrals.col.referred', 'Referred'),
        cell: (r: AdminReferral) =>
          r.referred ? (
            <div className="flex flex-col">
              <span className="font-medium">{r.referred.name}</span>
              <span className="text-xs text-foreground/60">{r.referred.email}</span>
            </div>
          ) : (
            '—'
          ),
      },
      {
        key: 'status',
        header: t('config.referrals.col.status', 'Reward'),
        cell: (r: AdminReferral) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              r.rewardStatus === 'awarded'
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {r.rewardStatus}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('config.referrals.col.actions', 'Actions'),
        pinned: 'right' as const,
        cell: (r: AdminReferral) =>
          r.rewardStatus === 'awarded' ? (
            <span className="text-foreground/40 text-xs">—</span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => reward(r.id)}>
              {t('config.referrals.markAwarded', 'Mark awarded')}
            </Button>
          ),
      },
    ],
    [t, reward],
  );

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <Card className="rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        {t('config.referrals.title', 'Referrals')}
      </h2>
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        search={(r) =>
          `${r.referrer.name} ${r.referrer.email} ${r.referred?.email ?? ''} ${r.code}`
        }
        searchPlaceholder={t('config.referrals.search', 'Search referrals…')}
        empty={
          <p className="text-foreground/60">
            {t('config.referrals.empty', 'No referrals yet.')}
          </p>
        }
        tableId="config-referrals"
      />
    </Card>
  );
}

export default ConfigReferrals;
