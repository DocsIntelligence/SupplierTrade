import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DataTable } from '@org/ui';
import { toast } from 'sonner';
import { apiGet, apiSend } from './_api';

interface UserRow {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  provider: string;
  emailVerified: boolean;
  createdAt: string;
}

export function ConfigUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    () =>
      apiGet<{ users: UserRow[] }>('/admin/users')
        .then((r) => setUsers(r.users ?? []))
        .catch(() => toast.error(t('config.users.loadError', 'Failed to load users')))
        .finally(() => setLoading(false)),
    [t],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleRole = useCallback(
    async (id: string, role: string) => {
      const next = role === 'admin' ? 'user' : 'admin';
      try {
        await apiSend(`/admin/users/${id}/role`, 'PATCH', { role: next });
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: next } : u)));
        toast.success(t('config.users.roleUpdated', 'Role updated to {{role}}', { role: next }));
      } catch {
        toast.error(t('config.users.roleFailed', 'Failed to update role'));
      }
    },
    [t],
  );

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('config.users.col.name', 'Name'),
        cell: (u: UserRow) => <span className="font-medium">{u.name}</span>,
        sortValue: (u: UserRow) => u.name,
      },
      {
        key: 'email',
        header: t('config.users.col.email', 'Email'),
        cell: (u: UserRow) => <span className="text-foreground/70">{u.email}</span>,
        sortValue: (u: UserRow) => u.email,
      },
      {
        key: 'provider',
        header: t('config.users.col.provider', 'Provider'),
        cell: (u: UserRow) => (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
            {u.provider}
          </span>
        ),
      },
      {
        key: 'role',
        header: t('config.users.col.role', 'Role'),
        cell: (u: UserRow) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              u.role === 'admin'
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {u.role}
          </span>
        ),
        sortValue: (u: UserRow) => u.role,
      },
      {
        key: 'actions',
        header: t('config.users.col.actions', 'Actions'),
        pinned: 'right' as const,
        cell: (u: UserRow) => (
          <Button size="sm" variant="ghost" onClick={() => toggleRole(u.id, u.role)}>
            {u.role === 'admin'
              ? t('config.users.demote', 'Demote')
              : t('config.users.promote', 'Promote')}
          </Button>
        ),
      },
    ],
    [t, toggleRole],
  );

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <Card className="rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        {t('config.users.title', 'Users')}
      </h2>
      <DataTable
        data={users}
        columns={columns}
        rowKey={(u) => u.id}
        search={(u) => `${u.name} ${u.email} ${u.username}`}
        searchPlaceholder={t('config.users.search', 'Search users…')}
        tableId="config-users"
      />
    </Card>
  );
}

export default ConfigUsers;
