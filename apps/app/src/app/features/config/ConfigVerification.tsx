import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DataTable, Input } from '@org/ui';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface QueueRow {
  id: string;
  kind: string;
  status: string;
  payload: Record<string, unknown> | null;
  evidenceKey: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export function ConfigVerification() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonByRow, setReasonByRow] = useState<Record<string, string>>({});

  const refresh = useCallback(
    () =>
      apiGet<QueueRow[]>('/admin/verification/queue')
        .then(setRows)
        .catch(() => toast.error(t('config.verification.loadError', 'Failed to load queue')))
        .finally(() => setLoading(false)),
    [t],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const decide = useCallback(
    async (id: string, decision: 'approve' | 'reject') => {
      const reason = reasonByRow[id];
      if (decision === 'reject' && !reason?.trim()) {
        toast.error(t('config.verification.reasonRequired', 'A reason is required to reject'));
        return;
      }
      try {
        await apiSend(`/admin/verification/${id}/decide`, 'POST', {
          decision,
          reason,
          purgeEvidence: true,
        });
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success(
          decision === 'approve'
            ? t('config.verification.approved', 'Approved')
            : t('config.verification.rejected', 'Rejected'),
        );
      } catch {
        toast.error(t('config.verification.decideFailed', 'Decision failed'));
      }
    },
    [reasonByRow, t],
  );

  const columns = useMemo(
    () => [
      {
        key: 'when',
        header: t('config.verification.col.when', 'When'),
        cell: (r: QueueRow) => (
          <span className="text-foreground/70 text-xs">
            {new Date(r.createdAt).toLocaleString()}
          </span>
        ),
        sortValue: (r: QueueRow) => r.createdAt,
      },
      {
        key: 'user',
        header: t('config.verification.col.user', 'User'),
        cell: (r: QueueRow) => (
          <div className="flex flex-col">
            <span className="font-medium">{r.user.name}</span>
            <span className="text-xs text-foreground/60">{r.user.email}</span>
          </div>
        ),
      },
      {
        key: 'kind',
        header: t('config.verification.col.kind', 'Kind'),
        cell: (r: QueueRow) => (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
            {r.kind}
          </span>
        ),
      },
      {
        key: 'evidence',
        header: t('config.verification.col.evidence', 'Evidence'),
        cell: (r: QueueRow) =>
          r.evidenceKey ? (
            <span className="text-xs font-mono text-foreground/60">{r.evidenceKey.slice(0, 24)}…</span>
          ) : (
            <span className="text-xs text-foreground/40">—</span>
          ),
      },
      {
        key: 'actions',
        header: t('config.verification.col.actions', 'Actions'),
        pinned: 'right' as const,
        cell: (r: QueueRow) => (
          <div className="flex gap-2 items-center">
            <Input
              className="w-44"
              placeholder={t('config.verification.reasonPlaceholder', 'Reason (if rejecting)')}
              value={reasonByRow[r.id] ?? ''}
              onChange={(e) =>
                setReasonByRow((prev) => ({ ...prev, [r.id]: e.target.value }))
              }
            />
            <Button size="sm" onClick={() => decide(r.id, 'approve')}>
              {t('config.verification.approve', 'Approve')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-error"
              onClick={() => decide(r.id, 'reject')}
            >
              {t('config.verification.reject', 'Reject')}
            </Button>
          </div>
        ),
      },
    ],
    [t, reasonByRow, decide],
  );

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <Card className="rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        {t('config.verification.title', 'Verification queue')}
      </h2>
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        search={(r) => `${r.user.name} ${r.user.email} ${r.kind}`}
        searchPlaceholder={t('config.verification.search', 'Search queue…')}
        empty={<p className="text-foreground/60">{t('config.verification.empty', 'Nothing pending.')}</p>}
        tableId="config-verification"
      />
    </Card>
  );
}

export default ConfigVerification;
