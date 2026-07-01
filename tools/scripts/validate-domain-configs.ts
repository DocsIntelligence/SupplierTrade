import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type {
  DomainConfig,
  SignalRef,
} from '../../apps/api/src/app/platform/domains/domain.types';
import type { WorkflowDef } from '../../apps/api/src/app/platform/workflow/workflow.types';

const registeredVerificationAdapters = new Set(['gst', 'litigation']);
const registeredQcScorers = new Set(['grain_grade']);
const registeredGuards = new Set([
  'required_fields_present',
  'signals_meet_threshold',
  'signals_below_threshold',
  'qc_score_pass',
  'qc_score_fail',
]);
const registeredActions = new Set([
  'create_escrow_order',
  'release_milestone',
  'open_dispute_case',
]);

const baseDir = process.env['DOMAIN_CONFIG_DIR']
  ? resolve(process.env['DOMAIN_CONFIG_DIR'])
  : resolve(process.cwd(), 'config', 'domains');

const ajv = new Ajv({ allErrors: true, strict: false, coerceTypes: false });
addFormats(ajv);

function loadAll(): DomainConfig[] {
  if (!existsSync(baseDir)) return [];
  return readdirSync(baseDir)
    .map((name) => join(baseDir, name))
    .filter((path) => statSync(path).isDirectory())
    .filter((path) => existsSync(join(path, 'domain.yaml')))
    .map(loadDir);
}

function loadDir(dir: string): DomainConfig {
  const raw = parseYaml(readFileSync(join(dir, 'domain.yaml'), 'utf8')) as
    | { domain?: DomainConfig }
    | DomainConfig;
  const domain = (
    'domain' in raw && raw.domain ? raw.domain : raw
  ) as DomainConfig;

  if (domain.entity_schemas) {
    domain.entity_schemas = {
      supplier: resolveRef(dir, domain.entity_schemas.supplier),
      listing: resolveRef(dir, domain.entity_schemas.listing),
    };
  }
  if (domain.workflow) domain.workflow = resolveWorkflow(dir, domain.workflow);
  return domain;
}

function resolveRef(
  dir: string,
  value: unknown,
): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const ref = (value as { $ref?: string }).$ref;
  if (!ref) return value as Record<string, unknown>;
  return JSON.parse(readFileSync(join(dir, ref), 'utf8'));
}

function resolveWorkflow(dir: string, value: unknown): WorkflowDef {
  const ref = (value as { $ref?: string }).$ref;
  if (!ref) return value as WorkflowDef;
  const parsed = parseYaml(readFileSync(join(dir, ref), 'utf8')) as
    | { workflow?: WorkflowDef }
    | WorkflowDef;
  return (
    'workflow' in parsed && parsed.workflow ? parsed.workflow : parsed
  ) as WorkflowDef;
}

function collectErrors(domain: DomainConfig): string[] {
  const errors: string[] = [];
  const metaSchema = loadMetaSchema();
  if (metaSchema) {
    const validate = ajv.compile(metaSchema);
    if (!validate(domain)) {
      errors.push(
        ...(validate.errors ?? []).map(
          (error) =>
            `meta-schema: ${error.instancePath || '(root)'} ${error.message ?? 'is invalid'}`,
        ),
      );
    }
  }

  for (const signal of allSignals(domain)) {
    if (!registeredVerificationAdapters.has(signal.key)) {
      errors.push(`verification adapter "${signal.key}" is not registered`);
    }
  }

  const scorer = domain.qc_profile?.scorer;
  if (scorer && !registeredQcScorers.has(scorer)) {
    errors.push(`QC scorer "${scorer}" is not registered`);
  }

  errors.push(
    ...validateWorkflow(domain.workflow).map((error) => `workflow: ${error}`),
  );
  return errors;
}

function allSignals(domain: DomainConfig): SignalRef[] {
  return [
    ...(domain.verification_profile?.required_signals ?? []),
    ...(domain.supplier_types ?? []).flatMap(
      (type) => type.verification_signals ?? [],
    ),
  ];
}

function loadMetaSchema(): Record<string, unknown> | undefined {
  const path = join(baseDir, '..', 'domain.meta.schema.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;
}

function validateWorkflow(def: WorkflowDef | undefined): string[] {
  if (!def) return ['workflow is missing'];
  const errors: string[] = [];
  const states = new Set(def.states);

  if (!states.has(def.initial)) {
    errors.push(`initial state "${def.initial}" is not in states[]`);
  }

  for (const transition of def.transitions) {
    if (transition.from !== '*' && !states.has(transition.from)) {
      errors.push(`transition.from "${transition.from}" is not a known state`);
    }
    if (!states.has(transition.to)) {
      errors.push(`transition.to "${transition.to}" is not a known state`);
    }
    if (
      transition.guard &&
      !transition.guard.startsWith('feature.') &&
      !registeredGuards.has(transition.guard)
    ) {
      errors.push(
        `transition references unregistered guard "${transition.guard}"`,
      );
    }
    if (transition.action && !registeredActions.has(transition.action)) {
      errors.push(
        `transition references unregistered action "${transition.action}"`,
      );
    }
  }

  return errors;
}

const configs = loadAll();
const errors = configs.flatMap((config) =>
  collectErrors(config).map((error) => `${config.key}: ${error}`),
);

if (!configs.length) {
  console.error(`No domain configs found in ${baseDir}`);
  process.exit(1);
}

if (errors.length) {
  console.error('Domain config validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Validated ${configs.length} domain config(s): ${configs.map((config) => config.key).join(', ')}`,
);
