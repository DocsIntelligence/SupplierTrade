import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, DataTable } from '@org/ui';
import { toast } from 'sonner';
import { apiGet } from './_api';

interface UsageRow {
  id: string;
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number | null;
  durationMs: number;
  status: string;
  createdAt: string;
}

interface Summary {
  totals: { calls: number; tokens: number; costUsd: number };
}

export function ConfigAiUsage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<{ rows: UsageRow[] }>('/ai-usage?limit=100'),
      apiGet<Summary>('/ai-usage/summary'),
    ])
      .then(([r, s]) => {
        setRows(r.rows ?? []);
        setSummary(s);
      })
      .catch(() => toast.error(t('config.aiUsage.loadError', 'Failed to load AI usage')))
      .finally(() => setLoading(false));
  }, [t]);

  const columns = useMemo(
    () => [
      {
        key: 'when',
        header: t('config.aiUsage.col.when', 'When'),
        cell: (r: UsageRow) => (
          <span className="text-foreground/70 text-xs">
            {new Date(r.createdAt).toLocaleString()}
          </span>
        ),
        sortValue: (r: UsageRow) => r.createdAt,
      },
      {
        key: 'provider',
        header: t('config.aiUsage.col.provider', 'Provider'),
        cell: (r: UsageRow) => <span className="capitalize">{r.provider}</span>,
      },
      {
        key: 'model',
        header: t('config.aiUsage.col.model', 'Model'),
        cell: (r: UsageRow) => <span className="font-mono text-xs">{r.model}</span>,
      },
      {
        key: 'operation',
        header: t('config.aiUsage.col.operation', 'Operation'),
        cell: (r: UsageRow) => r.operation,
      },
      {
        key: 'tokens',
        header: t('config.aiUsage.col.tokens', 'Tokens (in/out)'),
        align: 'right' as const,
        cell: (r: UsageRow) => (
          <span className="font-mono">
            {r.inputTokens.toLocaleString()} / {r.outputTokens.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'cost',
        header: t('config.aiUsage.col.cost', 'Cost (USD)'),
        align: 'right' as const,
        cell: (r: UsageRow) => (
          <span className="font-mono">
            {r.estimatedCostUsd != null ? `$${r.estimatedCostUsd.toFixed(4)}` : '—'}
          </span>
        ),
        sortValue: (r: UsageRow) => r.estimatedCostUsd ?? 0,
      },
      {
        key: 'status',
        header: t('config.aiUsage.col.status', 'Status'),
        cell: (r: UsageRow) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              r.status === 'success'
                ? 'bg-primary/10 text-primary'
                : 'bg-error/10 text-error'
            }`}
          >
            {r.status}
          </span>
        ),
      },
    ],
    [t],
  );

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t('config.aiUsage.title', 'AI usage')}
        </h2>
        <p className="text-foreground/60 mt-1">
          {t('config.aiUsage.subtitle', 'Token consumption and cost across providers.')}
        </p>
      </div>
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-xl p-5">
            <p className="text-xs font-medium text-foreground/50 uppercase">
              {t('config.aiUsage.calls', 'Calls')}
            </p>
            <p className="text-2xl font-bold mt-1">{summary.totals.calls.toLocaleString()}</p>
          </Card>
          <Card className="rounded-xl p-5">
            <p className="text-xs font-medium text-foreground/50 uppercase">
              {t('config.aiUsage.tokens', 'Tokens')}
            </p>
            <p className="text-2xl font-bold mt-1">{summary.totals.tokens.toLocaleString()}</p>
          </Card>
          <Card className="rounded-xl p-5">
            <p className="text-xs font-medium text-foreground/50 uppercase">
              {t('config.aiUsage.totalCost', 'Cost (USD)')}
            </p>
            <p className="text-2xl font-bold mt-1">${summary.totals.costUsd.toFixed(2)}</p>
          </Card>
        </div>
      )}
      <Card className="rounded-xl p-6">
        <DataTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          search={(r) => `${r.provider} ${r.model} ${r.operation}`}
          searchPlaceholder={t('config.aiUsage.search', 'Search usage…')}
          tableId="config-ai-usage"
        />
      </Card>
    </div>
  );
}

export default ConfigAiUsage;
