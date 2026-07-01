import { Injectable } from '@nestjs/common';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import type { FormFieldMeta, FormWidget } from '@org/dto';

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * One JSON-Schema validation + dynamic-form layer for every domain
 * (DOMAIN-ARCHITECTURE.md §3). Entity `attributes` are validated server-side
 * against the domain's schema on write; the same schema drives the frontend
 * form renderer via `formMetadata`.
 */
@Injectable()
export class JsonSchemaService {
  private readonly ajv: Ajv;
  private readonly cache = new Map<string, ValidateFunction>();

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false, coerceTypes: false });
    addFormats(this.ajv);
  }

  /** Validate `data` against `schema`. `cacheKey` reuses a compiled validator. */
  validate(
    schema: Record<string, unknown> | undefined,
    data: unknown,
    cacheKey?: string,
  ): SchemaValidationResult {
    if (!schema) return { valid: true, errors: [] };
    const validator = this.getValidator(schema, cacheKey);
    const valid = validator(data) as boolean;
    if (valid) return { valid: true, errors: [] };
    const errors = (validator.errors ?? []).map(
      (e) => `${e.instancePath || '(root)'} ${e.message ?? 'is invalid'}`,
    );
    return { valid: false, errors };
  }

  /**
   * Derive flat form-field metadata from a (shallow) object schema, including
   * the `x-widget` / `x-lookup` extension keywords that drive lookup-backed
   * selects (DOMAIN-ARCHITECTURE.md §3). Widget is inferred when not explicit.
   */
  formMetadata(schema: Record<string, unknown> | undefined): FormFieldMeta[] {
    if (!schema) return [];
    const props = (schema['properties'] ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const required = new Set((schema['required'] as string[]) ?? []);

    return Object.entries(props).map(([key, def]) => {
      const type = (def['type'] as string) ?? 'string';
      const lookup = (def['x-lookup'] as string) || undefined;
      const items = def['items'] as Record<string, unknown> | undefined;
      const enumVals =
        (def['enum'] as (string | number)[] | undefined) ??
        (items?.['enum'] as (string | number)[] | undefined);
      const widget =
        (def['x-widget'] as FormWidget | undefined) ??
        this.inferWidget(type, Boolean(lookup), Boolean(enumVals?.length));

      return {
        key,
        label: (def['title'] as string) ?? this.humanize(key),
        type,
        widget,
        required: required.has(key),
        lookup,
        enum: lookup ? undefined : enumVals,
        min: (def['minimum'] as number) ?? (def['min'] as number) ?? undefined,
        max: (def['maximum'] as number) ?? (def['max'] as number) ?? undefined,
        description: def['description'] as string | undefined,
      };
    });
  }

  private inferWidget(
    type: string,
    hasLookup: boolean,
    hasEnum: boolean,
  ): FormWidget {
    if (type === 'boolean') return 'checkbox';
    if (type === 'array') return 'multiselect';
    if (type === 'number' || type === 'integer') return 'number';
    if (hasLookup || hasEnum) return 'select';
    return 'text';
  }

  private humanize(key: string): string {
    const s = key.replace(/_/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private getValidator(
    schema: Record<string, unknown>,
    cacheKey?: string,
  ): ValidateFunction {
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
      const compiled = this.ajv.compile(schema);
      this.cache.set(cacheKey, compiled);
      return compiled;
    }
    return this.ajv.compile(schema);
  }
}
