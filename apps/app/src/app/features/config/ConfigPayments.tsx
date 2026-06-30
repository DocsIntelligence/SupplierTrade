import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, DataTable } from '@org/ui';
import { toast } from 'sonner';
import { apiGet } from './_api';

interface Payment {
  id: string;
  userId: string;
  gateway: string;
  gatewayPaymentId: string | null;
  status: string;
  amount: number;
  currency: string;
  initiatedAt: string;
  confirmedAt: string | null;
}

const statusClass: Record<string, string> = {
  paid: 'bg-primary/10 text-primary',
  pending: 'bg-secondary text-secondary-foreground',
  failed: 'bg-error/10 text-error',
};

export function ConfigPayments() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Payment[]>('/admin/payments')
      .then(setRows)
      .catch(() => toast.error(t('config.payments.loadError', 'Failed to load payments')))
      .finally(() => setLoading(false));
  }, [t]);

  const columns = useMemo(
    () => [
      {
        key: 'id',
        header: t('config.payments.col.id', 'ID'),
        cell: (p: Payment) => (
          <span className="font-mono text-xs text-foreground/70">{p.id.slice(0, 8)}</span>
        ),
      },
      {
        key: 'gateway',
        header: t('config.payments.col.gateway', 'Gateway'),
        cell: (p: Payment) => <span className="capitalize">{p.gateway}</span>,
      },
      {
        key: 'amount',
        header: t('config.payments.col.amount', 'Amount'),
        align: 'right' as const,
        cell: (p: Payment) => (
          <span className="font-mono">
            {(p.amount / 100).toFixed(2)} {p.currency}
          </span>
        ),
        sortValue: (p: Payment) => p.amount,
      },
      {
        key: 'status',
        header: t('config.payments.col.status', 'Status'),
        cell: (p: Payment) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              statusClass[p.status] ?? 'bg-secondary text-secondary-foreground'
            }`}
          >
            {p.status}
          </span>
        ),
        sortValue: (p: Payment) => p.status,
      },
      {
        key: 'date',
        header: t('config.payments.col.date', 'Date'),
        cell: (p: Payment) => (
          <span className="text-foreground/70 text-xs">
            {new Date(p.initiatedAt).toLocaleString()}
          </span>
        ),
        sortValue: (p: Payment) => p.initiatedAt,
      },
    ],
    [t],
  );

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <Card className="rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        {t('config.payments.title', 'Payments')}
      </h2>
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(p) => p.id}
        search={(p) => `${p.id} ${p.gatewayPaymentId ?? ''} ${p.status}`}
        searchPlaceholder={t('config.payments.search', 'Search payments…')}
        tableId="config-payments"
      />
    </Card>
  );
}

export default ConfigPayments;
