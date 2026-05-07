import { selectUser, useAppSelector } from '@org/store';
import { Card, UserAvatar } from '@org/ui';

export function Dashboard() {
  const user = useAppSelector(selectUser);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <p className="text-foreground/60 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Profile card */}
      <Card className="rounded-xl p-6">
        <div className="flex items-center gap-4">
          <UserAvatar name={user?.name} src={user?.picture} size="lg" />
          <div>
            <p className="font-medium text-foreground">{user?.name}</p>
            <p className="text-sm text-foreground/60">{user?.email}</p>
            <p className="text-xs text-foreground/40">@{user?.username}</p>
          </div>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl p-5">
          <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
            Role
          </p>
          <p className="text-lg font-semibold text-foreground mt-1 capitalize">
            {user?.role}
          </p>
        </Card>
        <Card className="rounded-xl p-5">
          <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
            Member since
          </p>
          <p className="text-lg font-semibold text-foreground mt-1">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : '—'}
          </p>
        </Card>
        <Card className="rounded-xl p-5">
          <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
            Email verified
          </p>
          <p className="text-lg font-semibold text-foreground mt-1">
            {user?.emailVerified ? '✓ Yes' : '✗ No'}
          </p>
        </Card>
      </div>

      {/* Placeholder content */}
      <Card className="rounded-xl p-6">
        <h3 className="font-medium text-foreground mb-2">Getting Started</h3>
        <p className="text-sm text-foreground/60 leading-relaxed">
          This is your dashboard. The React app runs at{' '}
          <code className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">
            dashboard.xyz.com
          </code>{' '}
          in production and handles all authenticated functionality. Add your
          features here.
        </p>
      </Card>
    </div>
  );
}

export default Dashboard;
