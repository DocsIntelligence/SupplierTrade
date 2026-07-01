import { useEffect, useState } from 'react';
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldErrors,
  type FieldValues,
} from 'react-hook-form';
// Control<T> is invariant, so callers pass differently-typed forms; accept any.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from 'react-i18next';
import { localizedLookupLabel } from '@org/utils';
import {
  Checkbox,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';
import { st, type FormField as FieldMeta, type LookupValueView } from './api';

/**
 * ONE schema-driven, react-hook-form-integrated renderer for every domain
 * (DOMAIN-ARCHITECTURE.md §3). Widgets come from the server's `FormFieldMeta`
 * (`x-widget` / `x-lookup`); reference data (states, commodities, …) is fetched
 * from the lookup module — never hard-coded. See docs/FORMS.md.
 */

const lookupCache = new Map<string, LookupValueView[]>();

export function useLookup(key?: string): {
  values: LookupValueView[];
  loading: boolean;
} {
  const [values, setValues] = useState<LookupValueView[]>(() =>
    key ? (lookupCache.get(key) ?? []) : [],
  );
  const [loading, setLoading] = useState<boolean>(
    Boolean(key) && !lookupCache.has(key ?? ''),
  );

  useEffect(() => {
    if (!key) return;
    const cached = lookupCache.get(key);
    if (cached) {
      setValues(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    st.lookup(key)
      .then((g) => {
        const vs = g.values ?? [];
        lookupCache.set(key, vs);
        setValues(vs);
      })
      .catch(() => setValues([]))
      .finally(() => setLoading(false));
  }, [key]);

  return { values, loading };
}

export function DynamicFields({
  fields,
  control,
  errors,
}: {
  fields: FieldMeta[];
  control: Control<any>;
  errors: FieldErrors<FieldValues>;
}) {
  if (!fields.length) {
    return (
      <p className="text-sm text-foreground/50">
        This domain defines no extra fields.
      </p>
    );
  }
  const attrErrors = (errors['attributes'] ?? {}) as Record<
    string,
    { message?: string } | undefined
  >;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <Controller
          key={f.key}
          control={control}
          name={`attributes.${f.key}`}
          render={({ field }) => (
            <FieldRow field={f} rhf={field} error={attrErrors[f.key]?.message} />
          )}
        />
      ))}
    </div>
  );
}

function FieldRow({
  field,
  rhf,
  error,
}: {
  field: FieldMeta;
  rhf: ControllerRenderProps<FieldValues, string>;
  error?: string;
}) {
  const label = field.required ? `${field.label} *` : field.label;

  // Multiselect renders its own label (avoids the <label> wrapping many inputs).
  if (field.widget === 'multiselect') {
    return (
      <div className="sm:col-span-2 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <LookupChips
          lookupKey={field.lookup}
          value={Array.isArray(rhf.value) ? (rhf.value as string[]) : []}
          onChange={rhf.onChange}
        />
        {field.description && (
          <span className="text-xs text-foreground/50">{field.description}</span>
        )}
        {error && (
          <span role="alert" className="text-xs text-error">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <FormField label={label} error={error} hint={field.description}>
      {renderControl(field, rhf)}
    </FormField>
  );
}

function renderControl(
  field: FieldMeta,
  rhf: ControllerRenderProps<FieldValues, string>,
) {
  if (field.widget === 'select') {
    if (field.lookup) {
      return (
        <LookupSelect
          lookupKey={field.lookup}
          value={(rhf.value as string) ?? ''}
          onChange={rhf.onChange}
        />
      );
    }
    return (
      <Select
        value={(rhf.value as string) || undefined}
        onValueChange={(v) => rhf.onChange(v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {(field.enum ?? []).map((o) => (
            <SelectItem key={String(o)} value={String(o)}>
              {String(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.widget === 'checkbox') {
    return (
      <div className="flex h-9 items-center">
        <Checkbox
          checked={Boolean(rhf.value)}
          onCheckedChange={(c) => rhf.onChange(Boolean(c))}
        />
      </div>
    );
  }

  if (field.widget === 'number') {
    return (
      <Input
        type="number"
        hasError={false}
        value={
          rhf.value === undefined || rhf.value === null ? '' : String(rhf.value)
        }
        onChange={(e) =>
          rhf.onChange(e.target.value === '' ? undefined : Number(e.target.value))
        }
      />
    );
  }

  return (
    <Input
      value={(rhf.value as string) ?? ''}
      onChange={(e) => rhf.onChange(e.target.value)}
    />
  );
}

function LookupSelect({
  lookupKey,
  value,
  onChange,
}: {
  lookupKey?: string;
  value: string;
  onChange: (v: string | undefined) => void;
}) {
  const { values, loading } = useLookup(lookupKey);
  const { i18n } = useTranslation();
  return (
    <Select
      value={value || undefined}
      disabled={loading}
      onValueChange={(v) => onChange(v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? 'Loading…' : 'Select…'} />
      </SelectTrigger>
      <SelectContent>
        {values.map((v) => (
          <SelectItem key={v.id} value={v.value ?? v.label}>
            {localizedLookupLabel(v, i18n.language)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LookupChips({
  lookupKey,
  value,
  onChange,
}: {
  lookupKey?: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const { values, loading } = useLookup(lookupKey);
  const { i18n } = useTranslation();
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  if (loading) {
    return <p className="text-sm text-foreground/50">Loading options…</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => {
        const val = v.value ?? v.label;
        const active = value.includes(val);
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => toggle(val)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-input text-foreground/70 hover:bg-secondary/50'
            }`}
          >
            {localizedLookupLabel(v, i18n.language)}
          </button>
        );
      })}
    </div>
  );
}
