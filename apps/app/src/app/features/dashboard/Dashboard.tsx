import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Flag,
  Loader,
  ShieldCheck,
  Store,
  UserPlus,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';
import { selectUser, useAppSelector } from '@org/store';
import {
  st,
  statusTone,
  type DomainSummary,
  type QcJob,
  type Supplier,
} from '../suppliertrade/api';
import {
  ChartCard,
  MiniBars,
  Panel,
  SectionLabel,
  StatCard,
  TrustBar,
  type BarPoint,
} from './widgets';

const VERIFIED = ['verified', 'qc_pending', 'qc_passed', 'qc_failed', 'escrow_active', 'completed'];
const IN_VERIFICATION = ['submitted', 'verifying'];
const FLAGGED = ['flagged', 'disputed'];

export function Dashboard() {
  const user = useAppSelector(selectUser);
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [domainKey, setDomainKey] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [qcJobs, setQcJobs] = useState<QcJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    st.domains()
      .then((d) => {
        setDomains(d);
        setDomainKey((p) => p || d[0]?.key || '');
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!domainKey) return;
    setLoading(true);
    Promise.all([
      st.suppliers({ domainKey, pageSize: 100 }),
      st.qcJobs(domainKey),
    ])
      .then(([s, q]) => {
        setSuppliers(s.items);
        setQcJobs(q);
      })
      .finally(() => setLoading(false));
  }, [domainKey]);

  const m = useMemo(() => metrics(suppliers, qcJobs), [suppliers, qcJobs]);
  const domainName = domains.find((d) => d.key === domainKey)?.name ?? '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
            Dashboard
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {domains.length > 1 && (
            <Select value={domainKey} onValueChange={setDomainKey}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Link
            to="/onboarding"
            className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <UserPlus size={16} />
            Onboard supplier
          </Link>
        </div>
      </div>

      {/* Signature: graded trust overview */}
      <section>
        <SectionLabel>Trust overview {domainName && `· ${domainName}`}</SectionLabel>
        <Panel className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-foreground/60">Verified suppliers</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
                {m.total ? Math.round((m.verified / m.total) * 100) : 0}
                <span className="text-2xl text-foreground/40">%</span>
              </p>
              <p className="mt-1 text-xs text-foreground/50">
                {m.verified} of {m.total} suppliers · graded, never binary
              </p>
            </div>
            {m.inVerification > 0 && (
              <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                {m.inVerification} in verification
              </span>
            )}
          </div>
          <div className="mt-5">
            <TrustBar
              segments={[
                { label: 'Verified', value: m.verified, className: 'bg-success' },
                { label: 'In verification', value: m.inVerification, className: 'bg-primary' },
                { label: 'Flagged', value: m.flagged, className: 'bg-error' },
                { label: 'Draft', value: m.draft, className: 'bg-secondary' },
              ]}
            />
          </div>
        </Panel>
      </section>

      {/* Stat cards */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Suppliers" sub={domainName} value={m.total} icon={Store} />
          <StatCard
            label="Verified"
            sub={m.total ? `${Math.round((m.verified / m.total) * 100)}% of base` : '—'}
            value={m.verified}
            icon={ShieldCheck}
            tone="text-success"
          />
          <StatCard
            label="In verification"
            sub="Awaiting signals"
            value={m.inVerification}
            icon={Loader}
            tone="text-primary"
          />
          <StatCard
            label="Needs review"
            sub="Flagged / disputed"
            value={m.flagged}
            icon={Flag}
            tone="text-error"
          />
        </div>
      </section>

      {/* Charts */}
      <section>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <ChartCard title="Onboarding" hint="Last 14 days">
            <MiniBars points={m.onboarding} />
          </ChartCard>
          <ChartCard title="QC activity" hint="Last 14 days">
            <MiniBars points={m.qcActivity} colorClass="bg-warning" />
          </ChartCard>
          <ChartCard title="QC grades" hint="All time">
            <LabeledBars rows={m.grades} />
          </ChartCard>
          <ChartCard title="QC pass rate" hint="Scored lots">
            <div className="flex h-20 flex-col justify-center">
              <p className="text-3xl font-semibold tabular-nums">
                {m.qcTotal ? Math.round((m.qcPassed / m.qcTotal) * 100) : 0}
                <span className="text-xl text-foreground/40">%</span>
              </p>
              <p className="mt-1 text-xs text-foreground/45">
                {m.qcPassed}/{m.qcTotal} lots passed
              </p>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* Recent */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionLabel>Recent activity</SectionLabel>
          <Panel className="p-0">
            {loading ? (
              <Empty text="Loading…" />
            ) : m.activity.length === 0 ? (
              <Empty text="No activity yet." />
            ) : (
              <ul className="divide-y divide-border/50">
                {m.activity.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
                    <span className="flex-1 text-foreground/80">{a.text}</span>
                    <span className="text-xs text-foreground/40">{a.ago}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div>
          <SectionLabel>Recent suppliers</SectionLabel>
          <Panel className="p-0">
            {loading ? (
              <Empty text="Loading…" />
            ) : suppliers.length === 0 ? (
              <Empty
                text="No suppliers yet."
                action={{ to: '/onboarding', label: 'Onboard the first supplier' }}
              />
            ) : (
              <ul className="divide-y divide-border/50">
                {suppliers.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/suppliers/${s.id}`}
                      className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-secondary/30"
                    >
                      <span className="flex-1 truncate font-medium text-foreground">
                        {s.legalName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusTone(s.status)}`}
                      >
                        {s.status}
                      </span>
                      <ArrowUpRight size={14} className="text-foreground/30" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Empty({
  text,
  action,
}: {
  text: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="px-5 py-8 text-center text-sm text-foreground/50">
      {text}
      {action && (
        <div className="mt-2">
          <Link to={action.to} className="text-primary hover:underline">
            {action.label}
          </Link>
        </div>
      )}
    </div>
  );
}

function LabeledBars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) {
    return <p className="text-sm text-foreground/40">No QC jobs yet.</p>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-xs">
          <span className="w-16 shrink-0 truncate text-foreground/60">{r.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right tabular-nums text-foreground/70">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── metrics ────────────────────────────────────────────────────

function metrics(suppliers: Supplier[], qcJobs: QcJob[]) {
  const count = (list: string[]) =>
    suppliers.filter((s) => list.includes(s.status)).length;

  const verified = count(VERIFIED);
  const inVerification = count(IN_VERIFICATION);
  const flagged = count(FLAGGED);
  const total = suppliers.length;
  const draft = total - verified - inVerification - flagged;

  const qcPassed = qcJobs.filter((j) => j.status === 'scored').length;
  const qcTotal = qcJobs.length;

  const grades = Object.entries(
    qcJobs.reduce<Record<string, number>>((acc, j) => {
      const g = j.grade ?? j.status;
      acc[g] = (acc[g] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([label, value]) => ({ label, value }));

  return {
    total,
    verified,
    inVerification,
    flagged,
    draft: Math.max(0, draft),
    qcPassed,
    qcTotal,
    grades,
    onboarding: buckets(suppliers.map((s) => s.createdAt)),
    qcActivity: buckets(qcJobs.map((j) => j.createdAt)),
    activity: recentActivity(suppliers, qcJobs),
  };
}

function buckets(dates: string[], days = 14): BarPoint[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime() - (days - 1) * 86_400_000;
  const out: BarPoint[] = Array.from({ length: days }, (_, i) => ({
    date: new Date(startMs + i * 86_400_000).toISOString(),
    value: 0,
  }));
  for (const d of dates) {
    const idx = Math.floor((new Date(d).getTime() - startMs) / 86_400_000);
    if (idx >= 0 && idx < days) out[idx].value++;
  }
  return out;
}

function recentActivity(suppliers: Supplier[], qcJobs: QcJob[]) {
  const events = [
    ...suppliers.map((s) => ({
      t: new Date(s.createdAt).getTime(),
      text: `${s.legalName} onboarded (${s.status})`,
      dot: dotFor(s.status),
    })),
    ...qcJobs.map((j) => ({
      t: new Date(j.createdAt).getTime(),
      text: `QC graded ${j.grade ?? j.status}`,
      dot: j.status === 'scored' ? 'bg-success' : 'bg-error',
    })),
  ]
    .sort((a, b) => b.t - a.t)
    .slice(0, 7);
  return events.map((e) => ({ ...e, ago: timeAgo(e.t) }));
}

function dotFor(status: string): string {
  if (VERIFIED.includes(status)) return 'bg-success';
  if (FLAGGED.includes(status)) return 'bg-error';
  if (IN_VERIFICATION.includes(status)) return 'bg-primary';
  return 'bg-foreground/30';
}

function timeAgo(t: number): string {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const mnt = Math.floor(s / 60);
  if (mnt < 60) return `${mnt}m ago`;
  const h = Math.floor(mnt / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default Dashboard;
