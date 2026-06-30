import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DataTable, Input } from '@org/ui';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface Plan {
  id: string;
  name: string;
  type: string;
  interval: string | null;
  priceInCents: number;
  currency: string;
  active: boolean;
}

export function ConfigPlans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: '', priceInCents: 0, currency: 'INR' });

  const refresh = useCallback(
    () =>
      apiGet<Plan[]>('/admin/plans')
        .then(setPlans)
        .catch(() => toast.error(t('config.plans.loadError', 'Failed to load plans')))
        .finally(() => setLoading(false)),
    [t],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async () => {
    if (!draft.name.trim()) return;
    try {
      await apiSend('/admin/plans', 'POST', { ...draft, type: 'one_time' });
      setDraft({ name: '', priceInCents: 0, currency: 'INR' });
      setCreating(false);
      refresh();
      toast.success(t('config.plans.created', 'Plan created'));
    } catch {
      toast.error(t('config.plans.createFailed', 'Failed to create plan'));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('config.plans.col.name', 'Name'),
        cell: (p: Plan) => <span className="font-medium">{p.name}</span>,
        sortValue: (p: Plan) => p.name,
      },
      {
        key: 'type',
        header: t('config.plans.col.type', 'Type'),
        cell: (p: Plan) => <span className="text-foreground/70 capitalize">{p.type}</span>,
      },
      {
        key: 'interval',
        header: t('config.plans.col.interval', 'Interval'),
        cell: (p: Plan) => <span className="text-foreground/70">{p.interval ?? '—'}</span>,
      },
      {
        key: 'price',
        header: t('config.plans.col.price', 'Price'),
        align: 'right' as const,
        cell: (p: Plan) => (
          <span className="font-mono">
            {(p.priceInCents / 100).toFixed(2)} {p.currency}
          </span>
        ),
        sortValue: (p: Plan) => p.priceInCents,
      },
      {
        key: 'active',
        header: t('config.plans.col.active', 'Active'),
        cell: (p: Plan) =>
          p.active ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {t('config.plans.live', 'Live')}
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {t('config.plans.draft', 'Draft')}
            </span>
          ),
      },
    ],
    [t],
  );

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <Card className="rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {t('config.plans.title', 'Plans')}
        </h2>
        <Button size="sm" onClick={() => setCreating(!creating)}>
          {creating
            ? t('common.cancel', 'Cancel')
            : t('config.plans.new', 'New plan')}
        </Button>
      </div>

      {creating && (
        <Card className="rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder={t('config.plans.placeholders.name', 'Plan name')}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder={t('config.plans.placeholders.price', 'Price (cents)')}
              value={draft.priceInCents}
              onChange={(e) =>
                setDraft({ ...draft, priceInCents: Number(e.target.value) || 0 })
              }
            />
            <Input
              placeholder={t('config.plans.placeholders.currency', 'Currency')}
              value={draft.currency}
              onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })}
            />
          </div>
          <Button size="sm" className="mt-3" onClick={create}>
            {t('config.plans.create', 'Create')}
          </Button>
        </Card>
      )}

      <DataTable
        data={plans}
        columns={columns}
        rowKey={(p) => p.id}
        search={(p) => `${p.name} ${p.type}`}
        searchPlaceholder={t('config.plans.search', 'Search plans…')}
        tableId="config-plans"
      />
    </Card>
  );
}

export default ConfigPlans;
