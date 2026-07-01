import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildAttributesSchema, type FormFieldMeta } from '@org/dto';
import { z } from 'zod';
import { Button, Card } from '@org/ui';
import { toast } from 'sonner';
import { DynamicFields } from './DynamicFields';
import { DocumentsPanel } from './DocumentsPanel';
import { StatusBadge } from './StatusBadge';
import {
  st,
  statusTone,
  type DomainConfigView,
  type Listing,
  type SignalResult,
  type Supplier,
  type VerificationReport,
} from './api';

export function SupplierDetail() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [config, setConfig] = useState<DomainConfigView | null>(null);
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const s = await st.supplier(id);
    setSupplier(s);
    const [c, r] = await Promise.all([st.domain(s.domainKey), st.reports(id)]);
    setConfig(c);
    setReports(r);
  }, [id]);

  useEffect(() => {
    load().catch(() => toast.error(t('st.common.loading')));
  }, [load, t]);

  const act = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await fn();
      await load();
      toast.success(t('st.common.done'));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!supplier || !config) {
    return <p className="text-foreground/60">{t('st.common.loading')}</p>;
  }

  const latest = reports[0];

  return (
    <div className="max-w-4xl mx-auto grid gap-5">
      <div>
        <Link to="/suppliers" className="text-sm text-primary hover:underline">
          ← {t('st.supplier.back')}
        </Link>
      </div>

      {/* Header */}
      <Card className="rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {supplier.legalName}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-foreground/60">
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                {supplier.supplierType}
              </span>
              {supplier.gstin && (
                <span className="font-mono text-xs">{supplier.gstin}</span>
              )}
            </div>
          </div>
          <StatusBadge status={supplier.status} showHint />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={supplier.status !== 'draft' || busy !== null}
            onClick={() => act('Submit', () => st.supplierEvent(id, 'submit'))}
          >
            {t('st.supplier.submit')}
          </Button>
          <Button
            disabled={supplier.status === 'draft' || busy !== null}
            onClick={() => act('Verification', () => st.verify(id))}
          >
            {busy === 'Verification'
              ? t('st.supplier.running')
              : t('st.supplier.runVerification')}
          </Button>
        </div>
        {supplier.status === 'draft' && (
          <p className="mt-2 text-xs text-foreground/50">
            {t('st.supplier.submitFirst')}
          </p>
        )}
      </Card>

      {/* Graded verification report */}
      <Card className="rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t('st.supplier.verification')}
          </h2>
          {latest && <StatusBadge status={latest.status} />}
        </div>

        {!latest ? (
          <p className="text-foreground/60 text-sm">
            {t('st.supplier.noVerification')}
          </p>
        ) : (
          <div className="grid gap-3">
            {latest.summary && (
              <p className="text-sm text-foreground/70">{latest.summary}</p>
            )}
            {Object.entries(latest.signalsJson).map(([key, sig]) => (
              <SignalCard key={key} signalKey={key} sig={sig} />
            ))}
            <p className="text-xs text-foreground/40">
              {new Date(latest.createdAt).toLocaleString()} ·{' '}
              {t('st.supplier.reportsTotal', { count: reports.length })}
            </p>
          </div>
        )}
      </Card>

      {/* Documents & media (config-driven) */}
      <DocumentsPanel supplierId={supplier.id} />

      {/* Listings + QC */}
      <ListingsPanel supplier={supplier} config={config} />
    </div>
  );
}

function SignalCard({
  signalKey,
  sig,
}: {
  signalKey: string;
  sig: SignalResult;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm capitalize">
          {signalKey.replace(/_/g, ' ')}
        </span>
        <StatusBadge status={sig.status} size="sm" />
      </div>
      <p className="text-sm text-foreground/70 mt-1">{sig.summary}</p>
      <button
        type="button"
        className="text-xs text-primary hover:underline mt-1"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? t('st.supplier.hideEvidence') : t('st.supplier.showEvidence')}
      </button>
      {open && (
        <pre className="mt-2 text-xs bg-secondary/40 rounded-md p-2 overflow-x-auto">
          {JSON.stringify(sig.evidence, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ListingsPanel({
  supplier,
  config,
}: {
  supplier: Supplier;
  config: DomainConfigView;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [fields, setFields] = useState<FormFieldMeta[]>([]);
  const [adding, setAdding] = useState(false);
  const listingTerm = config.terminology?.['listing'] ?? 'Listing';

  const refresh = useCallback(() => {
    st.listings(supplier.domainKey)
      .then((all) => setListings(all.filter((l) => l.supplierId === supplier.id)))
      .catch(() => toast.error('Failed to load listings'));
  }, [supplier.domainKey, supplier.id]);

  useEffect(() => {
    refresh();
    st.form(supplier.domainKey, 'listing').then(setFields).catch(() => undefined);
  }, [refresh, supplier.domainKey]);

  return (
    <Card className="rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {listingTerm}s & QC
        </h2>
        <Button size="sm" variant="secondary" onClick={() => setAdding((a) => !a)}>
          {adding ? 'Close' : `Add ${listingTerm.toLowerCase()}`}
        </Button>
      </div>

      {adding && (
        <ListingForm
          supplier={supplier}
          fields={fields}
          onCreated={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      {listings.length === 0 ? (
        <p className="text-foreground/60 text-sm">No {listingTerm.toLowerCase()}s yet.</p>
      ) : (
        <div className="grid gap-3">
          {listings.map((l) => (
            <ListingRow key={l.id} listing={l} config={config} />
          ))}
        </div>
      )}
    </Card>
  );
}

function ListingForm({
  supplier,
  fields,
  onCreated,
}: {
  supplier: Supplier;
  fields: FormFieldMeta[];
  onCreated: () => void;
}) {
  const schema = useMemo(
    () => z.object({ attributes: buildAttributesSchema(fields) }),
    [fields],
  );
  type Values = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { attributes: {} },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await st.createListing({
        domainKey: supplier.domainKey,
        supplierId: supplier.id,
        attributes: values.attributes,
      });
      toast.success('Listing added');
      onCreated();
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-border/60 p-4 mb-4"
    >
      <DynamicFields fields={fields} control={control} errors={errors} />
      <div className="flex justify-end mt-3">
        <Button size="sm" type="submit" isLoading={isSubmitting}>
          Create
        </Button>
      </div>
    </form>
  );
}

function ListingRow({
  listing,
  config,
}: {
  listing: Listing;
  config: DomainConfigView;
}) {
  const criteria = config.qc_profile?.criteria ?? [];
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    grade?: string | null;
    status: string;
    details: Record<string, { value: number; ok: boolean; limit?: number }>;
  } | null>(null);
  const [scoring, setScoring] = useState(false);

  const runQc = async () => {
    setScoring(true);
    try {
      const parsed: Record<string, number> = {};
      for (const c of criteria) {
        if (values[c.key] !== undefined && values[c.key] !== '') {
          parsed[c.key] = Number(values[c.key]);
        }
      }
      const job = await st.scoreQc(listing.id, parsed);
      setResult({
        grade: job.grade,
        status: job.status,
        details: job.criteriaResultsJson,
      });
      toast.success(`Graded: ${job.grade ?? job.status}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setScoring(false);
    }
  };

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono text-foreground/70">
          {(listing.attributes['commodity'] as string) ?? listing.id.slice(0, 8)}
          {listing.attributes['quantity_mt']
            ? ` · ${String(listing.attributes['quantity_mt'])} MT`
            : ''}
        </span>
        {config.qc_profile && (
          <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close QC' : 'Score QC'}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {criteria.map((c) => (
              <div key={c.key} className="flex flex-col gap-1">
                <label className="text-xs text-foreground/70">
                  {c.key.replace(/_/g, ' ')}
                  {c.max !== undefined && (
                    <span className="text-foreground/40"> (max {c.max})</span>
                  )}
                </label>
                <input
                  type="number"
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={values[c.key] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [c.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <div>
            <Button size="sm" onClick={runQc} disabled={scoring}>
              {scoring ? 'Scoring…' : 'Run grading'}
            </Button>
          </div>

          {result && (
            <div className="rounded-md bg-secondary/40 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Grade:</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${statusTone(result.status)}`}
                >
                  {result.grade ?? result.status}
                </span>
              </div>
              <div className="grid gap-1">
                {Object.entries(result.details).map(([k, d]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-foreground/70">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className={d.ok ? 'text-success' : 'text-error'}>
                      {Number.isNaN(d.value) ? '—' : d.value}
                      {d.limit !== undefined ? ` / ${d.limit}` : ''}{' '}
                      {d.ok ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SupplierDetail;
