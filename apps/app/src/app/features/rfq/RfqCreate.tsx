import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';
import { toast } from 'sonner';
import { localizedLookupLabel } from '@org/utils';
import { LOOKUP_KEYS } from '@org/dto';
import { Plus, Trash2 } from 'lucide-react';
import { st, type DomainSummary, type LookupValueView } from '../suppliertrade/api';

interface LineDraft {
  commodityKey: string;
  quantity: string;
  unit: string;
  targetGrade: string;
}

const emptyLine = (): LineDraft => ({
  commodityKey: '',
  quantity: '',
  unit: 'MT',
  targetGrade: '',
});

export function RfqCreate() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [domainKey, setDomainKey] = useState('');
  const [commodities, setCommodities] = useState<LookupValueView[]>([]);
  const [states, setStates] = useState<LookupValueView[]>([]);

  const [title, setTitle] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    st.domains()
      .then((d) => {
        setDomains(d);
        setDomainKey((p) => p || d[0]?.key || '');
      })
      .catch(() => toast.error(t('st.common.loading')));
    st.lookup(LOOKUP_KEYS.AGRI_COMMODITIES)
      .then((g) => setCommodities(g.values))
      .catch(() => undefined);
    st.lookup(LOOKUP_KEYS.INDIAN_STATES)
      .then((g) => setStates(g.values))
      .catch(() => undefined);
  }, [t]);

  const setLine = (i: number, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const titleError = touched && title.trim().length < 2;
  const linesValid = lines.every(
    (l) => l.commodityKey && Number(l.quantity) > 0,
  );

  const submit = async () => {
    setTouched(true);
    if (title.trim().length < 2 || !linesValid) {
      toast.error(t('st.rfq.nameHint'));
      return;
    }
    setSubmitting(true);
    try {
      const rfq = await st.createRfq({
        domainKey,
        title: title.trim(),
        deliveryState: deliveryState || undefined,
        targetDate: targetDate || undefined,
        notes: notes || undefined,
        lines: lines.map((l) => ({
          commodityKey: l.commodityKey,
          quantity: Number(l.quantity),
          unit: l.unit || 'MT',
          targetGrade: l.targetGrade || undefined,
        })),
      });
      toast.success(t('st.rfq.create'));
      navigate(`/rfqs/${rfq.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link to="/rfqs" className="text-sm text-primary hover:underline">
          ← {t('st.rfq.back')}
        </Link>
      </div>
      <Card className="rounded-xl p-6">
        <h1 className="mb-5 text-xl font-semibold tracking-tight">
          {t('st.rfq.createTitle')}
        </h1>

        <div className="grid gap-5">
          {domains.length > 1 && (
            <FormField label={t('st.onboarding.domain')}>
              <Select value={domainKey} onValueChange={setDomainKey}>
                <SelectTrigger>
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
            </FormField>
          )}

          <FormField
            label={`${t('st.rfq.name')} *`}
            hint={t('st.rfq.nameHint')}
            error={titleError ? t('st.rfq.nameHint') : undefined}
          >
            <Input
              value={title}
              hasError={titleError}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('st.rfq.deliveryState')}>
              <Select value={deliveryState} onValueChange={setDeliveryState}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.value ?? s.label}>
                      {localizedLookupLabel(s, i18n.language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t('st.rfq.targetDate')}>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </FormField>
          </div>

          {/* Commodity lines */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground/80">
              {t('st.rfq.lines')}
            </p>
            <div className="grid gap-3">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-[1fr_90px_70px_auto]"
                >
                  <Select
                    value={line.commodityKey || undefined}
                    onValueChange={(v) => setLine(i, { commodityKey: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('st.rfq.commodity')} />
                    </SelectTrigger>
                    <SelectContent>
                      {commodities.map((c) => (
                        <SelectItem key={c.id} value={c.value ?? c.label}>
                          {localizedLookupLabel(c, i18n.language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder={t('st.rfq.quantity')}
                    value={line.quantity}
                    onChange={(e) => setLine(i, { quantity: e.target.value })}
                  />
                  <Input
                    placeholder={t('st.rfq.unit')}
                    value={line.unit}
                    onChange={(e) => setLine(i, { unit: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    aria-label={t('st.documents.remove')}
                  >
                    <Trash2 size={16} className="text-foreground/50" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="mt-2"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
            >
              <Plus size={15} className="mr-1.5" />
              {t('st.rfq.addLine')}
            </Button>
          </div>

          <FormField label={t('st.rfq.notes')}>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" asChild>
              <Link to="/rfqs">{t('st.common.cancel')}</Link>
            </Button>
            <Button onClick={submit} isLoading={submitting} disabled={!domainKey}>
              {t('st.rfq.create')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default RfqCreate;
