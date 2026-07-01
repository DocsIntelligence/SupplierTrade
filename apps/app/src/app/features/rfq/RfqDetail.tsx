import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@org/ui';
import { toast } from 'sonner';
import {
  BadgeCheck,
  ChevronDown,
  FlaskConical,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { StatusBadge } from '../suppliertrade/StatusBadge';
import { RfqStatusChip } from './RfqList';
import {
  st,
  type Rfq,
  type RfqResponse,
  type Supplier,
} from '../suppliertrade/api';

export function RfqDetail() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [suppliers, setSuppliers] = useState<Record<string, Supplier>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await st.rfq(id);
    setRfq(r);
    // Resolve supplier names for the matched responses.
    const ids = [...new Set(r.responses.map((x) => x.supplierId))];
    const map: Record<string, Supplier> = {};
    await Promise.all(
      ids.map((sid) =>
        st
          .supplier(sid)
          .then((s) => {
            map[sid] = s;
          })
          .catch(() => undefined),
      ),
    );
    setSuppliers(map);
  }, [id]);

  useEffect(() => {
    load().catch(() => toast.error(t('st.common.loading')));
  }, [load, t]);

  const act = async (key: string, fn: () => Promise<unknown>, msg?: string) => {
    setBusy(key);
    try {
      await fn();
      await load();
      if (msg) toast.success(msg);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!rfq) return <p className="text-foreground/60">{t('st.common.loading')}</p>;

  const canOpen = rfq.status === 'draft';
  const canMatch = ['open', 'matched', 'sampling'].includes(rfq.status);
  const canClose = !['closed', 'cancelled', 'awarded'].includes(rfq.status);

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <div>
        <Link to="/rfqs" className="text-sm text-primary hover:underline">
          ← {t('st.rfq.back')}
        </Link>
      </div>

      {/* Header + actions */}
      <Card className="rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{rfq.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
              {rfq.deliveryState && (
                <span className="capitalize">{rfq.deliveryState}</span>
              )}
              {rfq.targetDate && (
                <span>· {new Date(rfq.targetDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <RfqStatusChip status={rfq.status} />
        </div>

        {/* Lines */}
        <div className="mt-4 flex flex-wrap gap-2">
          {rfq.lines.map((l) => (
            <span
              key={l.id}
              className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
            >
              <span className="capitalize">{l.commodityKey}</span> · {l.quantity}{' '}
              {l.unit}
              {l.targetGrade ? ` · ${l.targetGrade}` : ''}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {canOpen && (
            <Button
              disabled={busy !== null}
              onClick={() =>
                act('open', () => st.openRfq(id), t('st.rfq.open'))
              }
            >
              {t('st.rfq.open')}
            </Button>
          )}
          {canMatch && (
            <Button
              variant={canOpen ? 'secondary' : 'primary'}
              disabled={busy !== null}
              onClick={() =>
                act('match', () => st.generateMatches(id), t('st.rfq.matches'))
              }
            >
              <Search size={16} className="mr-1.5" />
              {busy === 'match' ? t('st.rfq.generating') : t('st.rfq.generate')}
            </Button>
          )}
          {canClose && (
            <Button
              variant="ghost"
              disabled={busy !== null}
              onClick={() =>
                act(
                  'close',
                  () => st.closeRfq(id, { status: 'closed' }),
                  t('st.rfq.close'),
                )
              }
            >
              {t('st.rfq.close')}
            </Button>
          )}
        </div>
      </Card>

      {/* Matched suppliers */}
      <Card className="rounded-xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t('st.rfq.matches')}
        </h2>
        {rfq.responses.length === 0 ? (
          <p className="text-sm text-foreground/60">{t('st.rfq.noMatches')}</p>
        ) : (
          <div className="grid gap-3">
            {rfq.responses.map((r) => (
              <MatchRow
                key={r.id}
                rfqId={id}
                resp={r}
                supplier={suppliers[r.supplierId]}
                onAction={act}
                busy={busy}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Buyer intent (Phase-0 validation) */}
      <ValidationPanel rfq={rfq} onRecorded={load} />
    </div>
  );
}

function MatchRow({
  rfqId,
  resp,
  supplier,
  onAction,
  busy,
}: {
  rfqId: string;
  resp: RfqResponse;
  supplier?: Supplier;
  onAction: (k: string, fn: () => Promise<unknown>, msg?: string) => void;
  busy: string | null;
}) {
  const { t } = useTranslation();
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">
            {supplier?.legalName ?? resp.supplierId.slice(0, 10)}
          </span>
          {supplier && <StatusBadge status={supplier.status} size="sm" />}
        </div>
        <div className="flex items-center gap-2">
          {resp.matchScore != null && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <BadgeCheck size={12} />
              {t('st.rfq.score', { score: resp.matchScore })}
            </span>
          )}
          <RfqStatusChip status={resp.status} />
        </div>
      </div>

      {resp.quotedPricePaise != null && (
        <p className="mt-1 text-sm text-foreground/70">
          ₹{(resp.quotedPricePaise / 100).toLocaleString()} ·{' '}
          {resp.availableQuantity} {resp.unit}
        </p>
      )}

      {resp.matchReasonsJson && resp.matchReasonsJson.length > 0 && (
        <>
          <button
            type="button"
            className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={() => setShowWhy((v) => !v)}
          >
            <ChevronDown
              size={13}
              className={showWhy ? 'rotate-180 transition' : 'transition'}
            />
            {t('st.rfq.whyMatch')}
          </button>
          {showWhy && (
            <div className="mt-2 grid gap-1">
              {resp.matchReasonsJson.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md bg-secondary/30 px-2.5 py-1 text-xs"
                >
                  <span className="capitalize text-foreground/70">
                    {reason.factor}: {reason.detail}
                  </span>
                  <span className="tabular-nums font-medium">
                    +{reason.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {resp.listingId && (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy !== null}
            onClick={() =>
              onAction(
                `qc-${resp.id}`,
                () => st.requestRfqQc(rfqId, resp.listingId as string),
                t('st.rfq.requestQc'),
              )
            }
          >
            <FlaskConical size={14} className="mr-1.5" />
            {t('st.rfq.requestQc')}
          </Button>
        )}
        {resp.status !== 'shortlisted' && resp.status !== 'awarded' && (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy !== null}
            onClick={() =>
              onAction(`sl-${resp.id}`, () =>
                st.updateRfqResponse(rfqId, resp.id, { status: 'shortlisted' }),
              )
            }
          >
            {t('st.rfq.shortlist')}
          </Button>
        )}
        {resp.status !== 'awarded' && (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy !== null}
            onClick={() =>
              onAction(
                `aw-${resp.id}`,
                () =>
                  st.closeRfq(rfqId, {
                    status: 'awarded',
                    awardedResponseId: resp.id,
                  }),
                t('st.rfq.award'),
              )
            }
          >
            <ShieldCheck size={14} className="mr-1.5" />
            {t('st.rfq.award')}
          </Button>
        )}
        {resp.status !== 'rejected' && resp.status !== 'awarded' && (
          <Button
            size="sm"
            variant="ghost"
            className="text-error"
            disabled={busy !== null}
            onClick={() =>
              onAction(`rj-${resp.id}`, () =>
                st.updateRfqResponse(rfqId, resp.id, { status: 'rejected' }),
              )
            }
          >
            {t('st.rfq.reject')}
          </Button>
        )}
      </div>
    </div>
  );
}

function ValidationPanel({ rfq, onRecorded }: { rfq: Rfq; onRecorded: () => void }) {
  const { t } = useTranslation();
  const signals = [
    { key: 'verification_fee_interest', label: t('st.rfq.paidVerification') },
    { key: 'qc_fee_interest', label: t('st.rfq.paidQc') },
    { key: 'pilot_commitment', label: t('st.rfq.pilot') },
    { key: 'rejected_price', label: t('st.rfq.rejectedPrice') },
  ];
  const record = async (signal: string) => {
    try {
      await st.recordRfqValidation(rfq.id, { signal });
      toast.success(t('st.rfq.recordIntent'));
      onRecorded();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Card className="rounded-xl p-6">
      <h2 className="mb-1 text-lg font-semibold text-foreground">
        {t('st.rfq.validation')}
      </h2>
      <p className="mb-4 text-sm text-foreground/60">{t('st.rfq.recordIntent')}</p>
      <div className="flex flex-wrap gap-2">
        {signals.map((s) => (
          <Button
            key={s.key}
            size="sm"
            variant="secondary"
            onClick={() => record(s.key)}
          >
            {s.label}
          </Button>
        ))}
      </div>
      {rfq.validationSignals.length > 0 && (
        <div className="mt-4 flex flex-col gap-1">
          {rfq.validationSignals.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-1.5 text-xs"
            >
              <span className="capitalize text-foreground/70">
                {v.signal.replace(/_/g, ' ')}
              </span>
              <span className="text-foreground/40">
                {new Date(v.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default RfqDetail;
