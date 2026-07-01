import { cookies } from 'next/headers';
import Link from 'next/link';
import { AuthenticatedHome } from './authenticated-home';

export const metadata = {
  title: 'SupplierTrade — verify suppliers before you trade',
  description:
    'A B2B trust and quality layer for supply chains. Graded, evidence-backed supplier verification and config-driven quality control — starting with agriculture.',
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6100';

export default async function HomePage() {
  const cookieStore = await cookies();
  if (cookieStore.has('access_token')) {
    return <AuthenticatedHome />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Features />
      <CtaBand />
      <SiteFooter />
    </main>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
        S
      </span>
      SupplierTrade
    </span>
  );
}

function SiteNav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Brand />
      <nav className="flex items-center gap-1 text-sm">
        <a
          href="#how"
          className="hidden rounded-md px-3 py-2 text-foreground/70 hover:text-foreground sm:block"
        >
          How it works
        </a>
        <a
          href="#features"
          className="hidden rounded-md px-3 py-2 text-foreground/70 hover:text-foreground sm:block"
        >
          Platform
        </a>
        <Link
          href="/login"
          className="rounded-md px-3 py-2 text-foreground/70 hover:text-foreground"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-8 pt-14 sm:pt-20">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/70">
        <span className="h-2 w-2 rounded-full bg-success" />
        Now live for agriculture — produce
      </p>
      <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
        Know your suppliers before you trade.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground/65">
        SupplierTrade is the trust and quality layer for B2B supply chains.
        Verification is{' '}
        <span className="text-foreground">graded and evidence-backed</span> —
        never a hollow green checkmark — and quality control adapts to each
        commodity by configuration.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className="rounded-lg bg-primary px-6 py-3 text-center font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          Onboard your first supplier
        </Link>
        <a
          href={APP_URL}
          className="rounded-lg border border-border bg-card px-6 py-3 text-center font-medium text-foreground transition-colors hover:bg-secondary/40"
        >
          Open the console →
        </a>
      </div>
    </section>
  );
}

/** Signature: verification is graded, shown as a distribution — never binary. */
function TrustStrip() {
  const segments = [
    { label: 'Verified', pct: 62, className: 'bg-success' },
    { label: 'In verification', pct: 20, className: 'bg-primary' },
    { label: 'Flagged for review', pct: 12, className: 'bg-error' },
    { label: 'Draft', pct: 6, className: 'bg-secondary' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground/70">
            A graded view of your supplier base
          </h2>
          <span className="text-xs text-foreground/45">
            evidence on every signal
          </span>
        </div>
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-secondary/50">
          {segments.map((s) => (
            <div
              key={s.label}
              className={s.className}
              style={{ width: `${s.pct}%` }}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {segments.map((s) => (
            <span key={s.label} className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${s.className}`} />
              <span className="text-foreground/70">{s.label}</span>
              <span className="font-medium tabular-nums">{s.pct}%</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Onboard',
      body: 'Capture the supplier and the documents their type requires — GST, licences, land records, storefront photos.',
    },
    {
      n: '02',
      title: 'Verify',
      body: 'Run graded checks across every signal. Each returns a status plus the evidence behind it — you see why, not just yes/no.',
    },
    {
      n: '03',
      title: 'Inspect',
      body: 'Grade the goods against a commodity-specific QC profile — moisture, foreign matter, broken, admixture.',
    },
    {
      n: '04',
      title: 'Trade',
      body: 'Match verified supply to demand with the trust and quality already established.',
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-14">
      <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
      <p className="mt-2 max-w-xl text-foreground/60">
        One flow, from unknown supplier to a trade you can stand behind.
      </p>
      <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <li key={s.n} className="rounded-xl border border-border bg-card p-5">
            <span className="text-sm font-semibold text-primary tabular-nums">
              {s.n}
            </span>
            <h3 className="mt-2 font-medium">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Features() {
  const items = [
    {
      title: 'Graded verification',
      body: 'Every report is a grade with evidence and a summary — we never collapse trust into a single boolean.',
    },
    {
      title: 'Config-driven quality control',
      body: 'QC criteria and grading scales are configuration per commodity, scored by pluggable graders.',
    },
    {
      title: 'Document vault',
      body: 'Collect the exact documents and media each supplier type needs, stored securely and tied to KYC signals.',
    },
    {
      title: 'Multi-vertical by design',
      body: 'Add a new vertical as configuration — schemas, workflow, signals — without rebuilding the platform.',
    },
  ];
  return (
    <section id="features" className="border-y border-border bg-secondary/20">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">
          Built for supply chains that can’t afford surprises
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {items.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 text-center">
      <h2 className="text-balance text-3xl font-semibold tracking-tight">
        Start with one supplier. Trust the whole chain.
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-foreground/60">
        Create an account and onboard your first supplier in minutes.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-secondary/40"
        >
          View pricing
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-foreground/50 sm:flex-row">
        <Brand />
        <div className="flex items-center gap-5">
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <a href="/docs" className="hover:text-foreground">
            API docs
          </a>
        </div>
        <span>© {new Date().getFullYear()} SupplierTrade</span>
      </div>
    </footer>
  );
}
