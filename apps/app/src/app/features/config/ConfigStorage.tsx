import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DataTable, Input } from '@org/ui';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface StorageFile {
  key: string;
  size?: number;
  lastModified?: string;
  url?: string;
}

export function ConfigStorage() {
  const { t } = useTranslation();
  const [prefix, setPrefix] = useState('');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    (p: string) => {
      setLoading(true);
      apiGet<{ files: StorageFile[] } | StorageFile[]>(
        `/storage/files${p ? `?prefix=${encodeURIComponent(p)}` : ''}`,
      )
        .then((r) => setFiles(Array.isArray(r) ? r : r.files ?? []))
        .catch(() => toast.error(t('config.storage.loadError', 'Failed to list files')))
        .finally(() => setLoading(false));
    },
    [t],
  );

  useEffect(() => {
    load('');
  }, [load]);

  const remove = useCallback(
    async (key: string) => {
      try {
        await apiSend(`/storage/${encodeURIComponent(key)}`, 'DELETE');
        setFiles((prev) => prev.filter((f) => f.key !== key));
        toast.success(t('config.storage.deleted', 'Deleted'));
      } catch {
        toast.error(t('config.storage.deleteFailed', 'Delete failed'));
      }
    },
    [t],
  );

  const columns = useMemo(
    () => [
      {
        key: 'key',
        header: t('config.storage.col.key', 'Key'),
        cell: (f: StorageFile) => <span className="font-mono text-xs">{f.key}</span>,
        sortValue: (f: StorageFile) => f.key,
      },
      {
        key: 'size',
        header: t('config.storage.col.size', 'Size'),
        align: 'right' as const,
        cell: (f: StorageFile) => (
          <span className="font-mono">{f.size != null ? formatBytes(f.size) : '—'}</span>
        ),
        sortValue: (f: StorageFile) => f.size ?? 0,
      },
      {
        key: 'modified',
        header: t('config.storage.col.modified', 'Modified'),
        cell: (f: StorageFile) => (
          <span className="text-foreground/70 text-xs">
            {f.lastModified ? new Date(f.lastModified).toLocaleString() : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('config.storage.col.actions', 'Actions'),
        pinned: 'right' as const,
        cell: (f: StorageFile) => (
          <Button size="sm" variant="ghost" className="text-error" onClick={() => remove(f.key)}>
            {t('config.storage.delete', 'Delete')}
          </Button>
        ),
      },
    ],
    [t, remove],
  );

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <Card className="rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-foreground flex-1">
          {t('config.storage.title', 'Storage browser')}
        </h2>
        <Input
          placeholder={t('config.storage.prefixPlaceholder', 'Prefix (e.g. uploads/)')}
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={() => load(prefix)}>
          {t('config.storage.refresh', 'Refresh')}
        </Button>
      </div>

      <DataTable
        data={files}
        columns={columns}
        rowKey={(f) => f.key}
        search={(f) => f.key}
        searchPlaceholder={t('config.storage.search', 'Search files…')}
        empty={<p className="text-foreground/60">{t('config.storage.empty', 'No files.')}</p>}
        tableId="config-storage"
      />
    </Card>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default ConfigStorage;
