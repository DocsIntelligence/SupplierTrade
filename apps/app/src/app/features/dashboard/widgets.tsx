import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
      {children}
    </p>
  );
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-card p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'text-foreground/30',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        <Icon size={18} className={tone} strokeWidth={1.9} />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground/80">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-foreground/45">{sub}</p>}
    </Panel>
  );
}

export interface TrustSegment {
  label: string;
  value: number;
  className: string; // bg-* for the bar, text-* handled via dot
}

/**
 * The signature element: verification is GRADED, never binary. This segmented
 * bar shows the whole supplier base split across trust states at a glance.
 */
export function TrustBar({ segments }: { segments: TrustSegment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary/50">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className={s.className}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null,
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span className={`h-2 w-2 rounded-full ${s.className}`} />
            <span className="text-foreground/70">{s.label}</span>
            <span className="font-medium tabular-nums text-foreground">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface BarPoint {
  date: string; // ISO
  value: number;
}

export function MiniBars({
  points,
  colorClass = 'bg-primary',
}: {
  points: BarPoint[];
  colorClass?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  const mid = Math.floor(points.length / 2);
  return (
    <div>
      <div className="flex h-20 items-end gap-[3px] border-b border-border/50">
        {points.map((p, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-sm ${colorClass}`}
            style={{ height: `${(p.value / max) * 100}%`, minHeight: p.value ? 3 : 0 }}
            title={`${fmt(p.date)}: ${p.value}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-foreground/40">
        <span>{points.length ? fmt(points[0].date) : ''}</span>
        <span>{points.length ? fmt(points[mid].date) : ''}</span>
        <span>{points.length ? fmt(points[points.length - 1].date) : ''}</span>
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Panel>
      <p className="text-sm font-medium text-foreground/80">{title}</p>
      {hint && <p className="mb-4 text-xs text-foreground/40">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </Panel>
  );
}
