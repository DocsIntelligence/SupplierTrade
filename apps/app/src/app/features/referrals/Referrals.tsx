import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DataTable, Input } from '@org/ui';
import { toast } from 'sonner';
import { APP_ENV } from '../../../config';

const API = APP_ENV.apiUrl;

interface MeResponse {
  code: string;
  shareUrl: string;
  stats: { invited: number; awarded: number; pending: number };
}

interface ReferralRow {
  id: string;
  rewardStatus: string;
  createdAt: string;
  referred: { id: string; name: string; email: string; createdAt: string } | null;
}

export function Referrals() {
  const { t } = useTranslation();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/referrals/me`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${API}/referrals/me/list`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([m, list]) => {
        setMe(m);
        setRows(Array.isArray(list) ? list : []);
      })
      .catch(() => toast.error(t('referrals.loadError', 'Failed to load referrals')))
      .finally(() => setLoading(false));
  }, [t]);

  const copy = (s: string) => {
    void navigator.clipboard.writeText(s);
    toast.success(t('referrals.copied', 'Copied to clipboard'));
  };

  if (loading) return <p className="text-foreground/60">{t('common.loading', 'Loading…')}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('referrals.title', 'Refer & earn')}
        </h2>
        <p className="text-foreground/60 mt-1">
          {t('referrals.subtitle', 'Share your code. We track every signup that comes from you.')}
        </p>
      </div>

      {me && (
        <>
          <Card className="rounded-xl p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
                {t('referrals.yourCode', 'Your code')}
              </p>
              <div className="mt-2 flex gap-2">
                <Input value={me.code} readOnly className="font-mono text-lg max-w-[200px]" />
                <Button variant="ghost" size="sm" onClick={() => copy(me.code)}>
                  {t('referrals.copyCode', 'Copy code')}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
                {t('referrals.shareLink', 'Share link')}
              </p>
              <div className="mt-2 flex gap-2">
                <Input value={me.shareUrl} readOnly className="font-mono text-sm" />
                <Button variant="ghost" size="sm" onClick={() => copy(me.shareUrl)}>
                  {t('referrals.copyLink', 'Copy link')}
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label={t('referrals.invited', 'Invited')} value={me.stats.invited} />
            <Stat label={t('referrals.pending', 'Pending reward')} value={me.stats.pending} />
            <Stat label={t('referrals.awarded', 'Awarded')} value={me.stats.awarded} />
          </div>
        </>
      )}

      <Card className="rounded-xl p-6">
        <h3 className="font-medium text-foreground mb-4">
          {t('referrals.list.title', 'People you referred')}
        </h3>
        <DataTable
          data={rows}
          columns={[
            {
              key: 'name',
              header: t('referrals.list.name', 'Name'),
              cell: (r: ReferralRow) => (
                <span className="font-medium">{r.referred?.name ?? '—'}</span>
              ),
            },
            {
              key: 'email',
              header: t('referrals.list.email', 'Email'),
              cell: (r: ReferralRow) => (
                <span className="text-foreground/70">{r.referred?.email ?? '—'}</span>
              ),
            },
            {
              key: 'joined',
              header: t('referrals.list.joined', 'Joined'),
              cell: (r: ReferralRow) =>
                r.referred ? (
                  <span className="text-foreground/70 text-xs">
                    {new Date(r.referred.createdAt).toLocaleDateString()}
                  </span>
                ) : (
                  '—'
                ),
            },
            {
              key: 'reward',
              header: t('referrals.list.reward', 'Reward'),
              cell: (r: ReferralRow) => (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    r.rewardStatus === 'awarded'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {r.rewardStatus}
                </span>
              ),
            },
          ]}
          rowKey={(r) => r.id}
          empty={
            <p className="text-foreground/60">
              {t('referrals.empty', 'No referrals yet. Share your code!')}
            </p>
          }
          tableId="referrals"
        />
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-xl p-5">
      <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </Card>
  );
}

export default Referrals;
