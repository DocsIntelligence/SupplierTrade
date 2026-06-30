import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, DataTable } from '@org/ui';
import { toast } from 'sonner';
import { apiGet } from './_api';

interface MailLog {
  id: string;
  to: string;
  subject: string;
  template: string | null;
  status: string;
  attempts: number;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

const statusClass: Record<string, string> = {
  sent: 'bg-primary/10 text-primary',
  queued: 'bg-secondary text-secondary-foreground',
  failed: 'bg-error/10 text-error',
};

export function ConfigMailLogs() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<MailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<MailLog[]>('/admin/mail-logs')
      .then(setRows)
      .catch(() => toast.error(t('config.mailLogs.loadError', 'Failed to load mail logs')))
      .finally(() => setLoading(false));
  }, [t]);

  const columns = useMemo(
    () => [
      {
        key: 'when',
        header: t('config.mailLogs.col.when', 'When'),
        cell: (r: MailLog) => (
          <span className="text-foreground/70 text-xs">
            {new Date(r.createdAt).toLocaleString()}
          </span>
        ),
        sortValue: (r: MailLog) => r.createdAt,
      },
      {
        key: 'to',
        header: t('config.mailLogs.col.to', 'To'),
        cell: (r: MailLog) => <span className="font-mono text-xs">{r.to}</span>,
      },
      {
        key: 'subject',
        header: t('config.mailLogs.col.subject', 'Subject'),
        cell: (r: MailLog) => r.subject,
      },
      {
        key: 'template',
        header: t('config.mailLogs.col.template', 'Template'),
        cell: (r: MailLog) => (
          <span className="text-xs text-foreground/60">{r.template ?? '—'}</span>
        ),
      },
      {
        key: 'attempts',
        header: t('config.mailLogs.col.attempts', 'Attempts'),
        align: 'right' as const,
        cell: (r: MailLog) => r.attempts,
      },
      {
        key: 'status',
        header: t('config.mailLogs.col.status', 'Status'),
        cell: (r: MailLog) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              statusClass[r.status] ?? 'bg-secondary text-secondary-foreground'
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
    <Card className="rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        {t('config.mailLogs.title', 'Mail logs')}
      </h2>
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        search={(r) => `${r.to} ${r.subject} ${r.template ?? ''}`}
        searchPlaceholder={t('config.mailLogs.search', 'Search mail logs…')}
        tableId="config-mail-logs"
      />
    </Card>
  );
}

export default ConfigMailLogs;
