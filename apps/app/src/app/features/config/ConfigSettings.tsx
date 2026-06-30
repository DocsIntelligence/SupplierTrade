import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DataTable, Input } from '@org/ui';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface Setting {
  id: string;
  scope: string;
  scopeId: string | null;
  key: string;
  value: unknown;
  notes: string | null;
  updatedAt: string;
}

export function ConfigSettings() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ key: '', value: '', notes: '' });

  const refresh = useCallback(
    () =>
      apiGet<Setting[]>('/settings')
        .then(setRows)
        .catch(() => toast.error(t('config.settings.loadError', 'Failed to load settings')))
        .finally(() => setLoading(false)),
    [t],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async () => {
    if (!draft.key.trim()) return;
    let parsed: unknown = draft.value;
    try {
      parsed = JSON.parse(draft.value);
    } catch {
      // leave as string
    }
    try {
      await apiSend('/settings', 'POST', {
        scope: 'system',
        key: draft.key,
        value: parsed,
        notes: draft.notes,
      });
      setDraft({ key: '', value: '', notes: '' });
      refresh();
      toast.success(t('config.settings.saved', 'Saved'));
    } catch {
      toast.error(t('config.settings.saveFailed', 'Failed to save'));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'scope',
        header: t('config.settings.col.scope', 'Scope'),
        cell: (s: Setting) => <span className="capitalize">{s.scope}</span>,
      },
      {
        key: 'key',
        header: t('config.settings.col.key', 'Key'),
        cell: (s: Setting) => <span className="font-mono text-xs">{s.key}</span>,
        sortValue: (s: Setting) => s.key,
      },
      {
        key: 'value',
        header: t('config.settings.col.value', 'Value'),
        cell: (s: Setting) => (
          <code className="text-xs bg-secondary/40 px-2 py-0.5 rounded">
            {JSON.stringify(s.value)}
          </code>
        ),
      },
      {
        key: 'notes',
        header: t('config.settings.col.notes', 'Notes'),
        cell: (s: Setting) => <span className="text-foreground/60">{s.notes ?? '—'}</span>,
      },
    ],
    [t],
  );

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <Card className="rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {t('config.settings.title', 'Settings')}
        </h2>
      </div>

      <Card className="rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder={t('config.settings.keyPlaceholder', 'key.with.dots')}
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value })}
          />
          <Input
            placeholder={t('config.settings.valuePlaceholder', 'JSON value or string')}
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
          />
          <Input
            placeholder={t('config.settings.notesPlaceholder', 'Notes (optional)')}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </div>
        <Button size="sm" className="mt-3" onClick={save}>
          {t('config.settings.upsert', 'Upsert setting')}
        </Button>
      </Card>

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(s) => s.id}
        search={(s) => `${s.key} ${s.scope}`}
        searchPlaceholder={t('config.settings.search', 'Search settings…')}
        tableId="config-settings"
      />
    </Card>
  );
}

export default ConfigSettings;
