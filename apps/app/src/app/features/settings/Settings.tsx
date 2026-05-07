import { useEffect, useState } from 'react';
import { selectUser, useAppSelector } from '@org/store';
import { Button, Card, UserAvatar } from '@org/ui';
import { toast } from 'sonner';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface Identity {
  id: string;
  provider: string;
  email: string | null;
  createdAt: string;
}

export function Settings() {
  const user = useAppSelector(selectUser);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/user/identities`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setIdentities)
      .catch(() => toast.error('Failed to load connected accounts'))
      .finally(() => setLoading(false));
  }, []);

  const unlinkProvider = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/identities/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      setIdentities((prev) => prev.filter((i) => i.id !== id));
      toast.success('Provider disconnected');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to unlink');
    }
  };

  const linkProvider = (provider: string) => {
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  };

  const allProviders = ['google', 'github', 'linkedin'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
        <p className="text-foreground/60 mt-1">
          Manage your account and connected providers
        </p>
      </div>

      {/* Profile */}
      <Card className="rounded-xl p-6">
        <h3 className="font-medium text-foreground mb-4">Profile</h3>
        <div className="flex items-center gap-4">
          <UserAvatar name={user?.name} size="lg" />
          <div>
            <p className="font-medium text-foreground">{user?.name}</p>
            <p className="text-sm text-foreground/60">{user?.email}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {user?.role}
            </span>
          </div>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="rounded-xl p-6">
        <h3 className="font-medium text-foreground mb-4">Connected Accounts</h3>
        {loading ? (
          <p className="text-sm text-foreground/60">Loading...</p>
        ) : (
          <div className="space-y-3">
            {allProviders.map((provider) => {
              const identity = identities.find((i) => i.provider === provider);
              return (
                <div
                  key={provider}
                  className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="capitalize font-medium text-sm">
                      {provider}
                    </span>
                    {identity && (
                      <span className="text-xs text-foreground/60">
                        {identity.email}
                      </span>
                    )}
                  </div>
                  {identity ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unlinkProvider(identity.id)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => linkProvider(provider)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Settings;
