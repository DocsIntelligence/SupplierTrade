import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@org/ui';
import { toast } from 'sonner';
import { apiGet } from './_api';

interface QueueRow {
  name: string;
  available: boolean;
  counts?: Record<string, number>;
}

interface QueueJob {
  id: string | number;
  name: string;
  status: string;
  attempts: number;
  failedReason?: string;
  timestamp?: number;
  finishedOn?: number;
}

const STATUS_KEYS = ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'] as const;

export function ConfigQueues() {
  const { t } = useTranslation();
  const [queues, setQueues] = useState<QueueRow[]>([]);
  const [recent, setRecent] = useState<Record<string, QueueJob[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<QueueRow[]>('/admin/queues')
      .then(async (rows) => {
        setQueues(rows);
        const r: Record<string, QueueJob[]> = {};
        await Promise.all(
          rows
            .filter((q) => q.available)
            .map(async (q) => {
              try {
                const res = await apiGet<{ jobs: QueueJob[] }>(`/admin/queues/${q.name}/recent`);
                r[q.name] = res.jobs ?? [];
              } catch {
                r[q.name] = [];
              }
            }),
        );
        setRecent(r);
      })
      .catch(() => toast.error(t('config.queues.loadError', 'Failed to load queues')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t('config.queues.title', 'Queues')}
        </h2>
        <p className="text-foreground/60 mt-1">
          {t('config.queues.subtitle', 'BullMQ queue counts and recent jobs. Requires REDIS_URL.')}
        </p>
      </div>

      {queues.map((q) => (
        <Card key={q.name} className="rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground capitalize">{q.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                q.available
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {q.available
                ? t('config.queues.available', 'Available')
                : t('config.queues.disabled', 'Disabled (no REDIS_URL)')}
            </span>
          </div>

          {q.available && q.counts && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-sm">
              {STATUS_KEYS.map((k) => (
                <div key={k} className="bg-secondary/30 rounded-md p-2 text-center">
                  <div className="text-xs uppercase text-foreground/50">{k}</div>
                  <div className="font-mono mt-1">{q.counts?.[k] ?? 0}</div>
                </div>
              ))}
            </div>
          )}

          {q.available && (recent[q.name]?.length ?? 0) > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-foreground/70 hover:text-foreground">
                {t('config.queues.recentJobs', 'Recent jobs')}
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-foreground/50">
                    <tr>
                      <th className="text-left pb-1">id</th>
                      <th className="text-left pb-1">name</th>
                      <th className="text-left pb-1">status</th>
                      <th className="text-right pb-1">attempts</th>
                      <th className="text-left pb-1">finished</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recent[q.name] ?? []).map((j) => (
                      <tr key={String(j.id)} className="border-t border-border/20">
                        <td className="py-1 font-mono">{String(j.id).slice(0, 8)}</td>
                        <td className="py-1">{j.name}</td>
                        <td className="py-1">{j.status}</td>
                        <td className="py-1 text-right">{j.attempts}</td>
                        <td className="py-1">
                          {j.finishedOn ? new Date(j.finishedOn).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </Card>
      ))}
    </div>
  );
}

export default ConfigQueues;
