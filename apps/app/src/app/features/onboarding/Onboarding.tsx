import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  buildAttributesSchema,
  createSupplierSchema,
  type FormFieldMeta,
} from '@org/dto';
import { z } from 'zod';
import {
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';
import { toast } from 'sonner';
import {
  ArrowRight,
  Check,
  Factory,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { DynamicFields } from '../suppliertrade/DynamicFields';
import { st, type DomainConfigView, type DomainSummary } from '../suppliertrade/api';

/** Big EN | हिंदी toggle so users pick their language before anything else. */
function LangPills() {
  const { i18n } = useTranslation();
  const langs = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
  ];
  const active = i18n.language?.split('-')[0];
  return (
    <div className="inline-flex rounded-full border border-border p-1">
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => i18n.changeLanguage(l.code)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === l.code
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

const TYPE_ICON: Record<string, typeof Store> = {
  fpo: Users,
  trader: Store,
  processor: Factory,
  farmer: Users,
  business: Store,
};

export function Onboarding() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [domainKey, setDomainKey] = useState(params.get('domain') ?? '');
  const [config, setConfig] = useState<DomainConfigView | null>(null);
  const [fields, setFields] = useState<FormFieldMeta[]>([]);
  const [supplierType, setSupplierType] = useState('');
  const [step, setStep] = useState(0);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    st.domains()
      .then((d) => {
        setDomains(d);
        setDomainKey((p) => p || d[0]?.key || '');
      })
      .catch(() => toast.error(t('st.common.loading')));
  }, [t]);

  useEffect(() => {
    if (!domainKey) return;
    Promise.all([st.domain(domainKey), st.form(domainKey, 'supplier')])
      .then(([c, f]) => {
        setConfig(c);
        setFields(f);
        setSupplierType((prev) => prev || c.supplier_types[0]?.key || '');
      })
      .catch(() => toast.error(t('st.common.loading')));
  }, [domainKey, t]);

  const term = config?.terminology?.['supplier'] ?? 'Supplier';

  if (createdId) return <Success supplierId={createdId} />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
          {t('st.onboarding.eyebrow')}
        </p>
        <LangPills />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        {t('st.onboarding.title')}
      </h1>
      <p className="mb-6 mt-1 text-foreground/60">{t('st.onboarding.help')}</p>

      <Stepper active={step} />

      {step === 0 ? (
        <Card className="mt-6 rounded-xl p-6">
          {domains.length > 1 && (
            <div className="mb-6">
              <p className="mb-2 text-base font-medium">
                {t('st.onboarding.domain')}
              </p>
              <Select value={domainKey} onValueChange={setDomainKey}>
                <SelectTrigger className="h-12 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.key} value={d.key}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <p className="mb-3 text-base font-medium">
            {t('st.onboarding.chooseType')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(config?.supplier_types ?? []).map((tp) => {
              const active = tp.key === supplierType;
              const Icon = TYPE_ICON[tp.key] ?? Store;
              const docCount = tp.required_documents.length;
              return (
                <button
                  key={tp.key}
                  type="button"
                  onClick={() => setSupplierType(tp.key)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'border-border hover:bg-secondary/40'
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground/60'
                    }`}
                  >
                    <Icon size={22} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-medium">
                      {tp.label}
                      {active && <Check size={16} className="text-primary" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-foreground/50">
                      {t('st.onboarding.docsNeeded', { count: docCount })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              disabled={!supplierType || !config}
              onClick={() => setStep(1)}
            >
              {t('st.common.continue')}
              <ArrowRight size={18} className="ml-1.5" />
            </Button>
          </div>
        </Card>
      ) : (
        <OnboardForm
          key={`${domainKey}:${supplierType}`}
          domainKey={domainKey}
          supplierType={supplierType}
          fields={fields}
          term={term}
          step={step}
          onStep={setStep}
          onDone={setCreatedId}
        />
      )}
    </div>
  );
}

function Stepper({ active }: { active: number }) {
  const { t } = useTranslation();
  const steps = [
    t('st.onboarding.step1'),
    t('st.onboarding.step2'),
    t('st.onboarding.step3'),
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                done
                  ? 'bg-primary text-primary-foreground'
                  : current
                    ? 'bg-primary/10 text-primary ring-2 ring-primary'
                    : 'bg-secondary text-foreground/50'
              }`}
            >
              {done ? <Check size={15} /> : i + 1}
            </span>
            <span
              className={`text-sm ${current ? 'font-medium text-foreground' : 'text-foreground/50'}`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 h-px flex-1 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OnboardForm({
  domainKey,
  supplierType,
  fields,
  term,
  step,
  onStep,
  onDone,
}: {
  domainKey: string;
  supplierType: string;
  fields: FormFieldMeta[];
  term: string;
  step: number;
  onStep: (s: number) => void;
  onDone: (id: string) => void;
}) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      createSupplierSchema
        .pick({ legalName: true, gstin: true, consent: true })
        .extend({ attributes: buildAttributesSchema(fields) }),
    [fields],
  );
  type Values = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { legalName: '', gstin: '', consent: false, attributes: {} },
  });

  const toReview = async () => {
    const ok = await trigger(['legalName', 'gstin', 'attributes']);
    if (ok) onStep(2);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await st.createSupplier({
        domainKey,
        supplierType,
        legalName: values.legalName,
        gstin: values.gstin ? values.gstin : undefined,
        attributes: values.attributes,
        consent: values.consent,
      });
      toast.success(t('st.onboarding.successTitle'));
      onDone(created.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Card className="mt-6 rounded-xl p-6">
        {step === 1 ? (
          <div className="grid gap-5">
            <h2 className="text-lg font-semibold">
              {t('st.onboarding.detailsTitle')}
            </h2>
            <FormField
              label={`${t('st.onboarding.legalName')} *`}
              error={errors.legalName?.message}
              hint={t('st.onboarding.legalNameHint')}
            >
              <Input
                className="h-12 text-base"
                hasError={!!errors.legalName}
                {...register('legalName')}
              />
            </FormField>
            <FormField
              label={t('st.onboarding.gstin')}
              error={errors.gstin?.message}
              hint={t('st.onboarding.gstinHint')}
            >
              <Input
                className="h-12 text-base"
                placeholder="—"
                hasError={!!errors.gstin}
                {...register('gstin')}
              />
            </FormField>
            <DynamicFields fields={fields} control={control} errors={errors} />
            <div className="flex justify-between">
              <Button size="lg" variant="ghost" type="button" onClick={() => onStep(0)}>
                {t('st.common.back')}
              </Button>
              <Button size="lg" type="button" onClick={toReview}>
                {t('st.common.continue')}
                <ArrowRight size={18} className="ml-1.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            <h2 className="text-lg font-semibold">
              {t('st.onboarding.reviewTitle')}
            </h2>
            <ReviewSummary values={getValues()} />
            <Controller
              control={control}
              name="consent"
              render={({ field }) => (
                <label className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3 text-sm">
                  <Checkbox
                    checked={Boolean(field.value)}
                    onCheckedChange={(c) => field.onChange(Boolean(c))}
                    className="mt-0.5 h-5 w-5"
                  />
                  <span>
                    {t('st.onboarding.consent')}
                    {errors.consent && (
                      <span className="mt-0.5 block text-xs text-error">
                        {errors.consent.message}
                      </span>
                    )}
                  </span>
                </label>
              )}
            />
            <div className="flex justify-between">
              <Button size="lg" variant="ghost" type="button" onClick={() => onStep(1)}>
                {t('st.common.back')}
              </Button>
              <Button size="lg" type="submit" isLoading={isSubmitting}>
                {t('st.onboarding.create')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </form>
  );
}

function ReviewSummary({
  values,
}: {
  values: {
    legalName?: string;
    gstin?: string;
    attributes?: Record<string, unknown>;
  };
}) {
  const { t } = useTranslation();
  const rows: [string, string][] = [
    [t('st.onboarding.legalName'), values.legalName || '—'],
    [t('st.onboarding.gstin'), values.gstin || '—'],
    ...Object.entries(values.attributes ?? {}).map(
      ([k, v]) =>
        [
          k.replace(/_/g, ' '),
          Array.isArray(v) ? v.join(', ') : String(v ?? '—'),
        ] as [string, string],
    ),
  ];
  return (
    <dl className="divide-y divide-border/50 rounded-lg border border-border">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
          <dt className="capitalize text-foreground/55">{k}</dt>
          <dd className="text-right font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Success({ supplierId }: { supplierId: string }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <ShieldCheck size={30} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        {t('st.onboarding.successTitle')}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-foreground/60">
        {t('st.onboarding.successBody')}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link to={`/suppliers/${supplierId}`}>
            {t('st.onboarding.openSupplier')}
          </Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link to="/onboarding">{t('st.onboarding.addAnother')}</Link>
        </Button>
      </div>
    </div>
  );
}

export default Onboarding;
