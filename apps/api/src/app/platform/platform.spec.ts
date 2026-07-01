import { join } from 'node:path';
import { DomainConfigLoader } from './domains/domain-config.loader';
import { DomainConfigValidator } from './domains/domain-config.validator';
import { JsonSchemaService } from './schema/json-schema.service';
import { VerificationAdapterRegistry } from './registries/verification-adapter.registry';
import { QcScorerRegistry } from './registries/qc-scorer.registry';
import { WorkflowEngine } from './workflow/workflow.engine';
import { GuardRegistry } from './workflow/guard.registry';
import { ActionRegistry } from './workflow/action.registry';
import { ExprEvaluator } from './expression/expr.evaluator';
import { GstAdapter } from '../adapters/verification/gst.adapter';
import { LitigationAdapter } from '../adapters/verification/litigation.adapter';
import { GrainGradeScorer } from '../adapters/qc/grain-grade.scorer';

// jest runs with cwd = apps/api; derive the workspace root from __dirname
// (.../apps/api/src/app/platform → up 5 levels).
const ROOT = join(__dirname, '..', '..', '..', '..', '..');
const CONFIG_DOMAINS = join(ROOT, 'config', 'domains');
const AGRI_DIR = join(CONFIG_DOMAINS, 'agriculture');
// point the validator's meta-schema lookup at the right place too.
process.env['DOMAIN_CONFIG_DIR'] = CONFIG_DOMAINS;

function buildValidator() {
  const verification = new VerificationAdapterRegistry([
    new GstAdapter(),
    new LitigationAdapter(),
  ]);
  const qc = new QcScorerRegistry([new GrainGradeScorer()]);
  const engine = new WorkflowEngine(
    {} as never,
    {} as never,
    new GuardRegistry(),
    new ActionRegistry(),
  );
  const validator = new DomainConfigValidator(
    new JsonSchemaService(),
    verification,
    qc,
    engine,
  );
  return { validator, engine };
}

describe('SupplierTrade platform — agriculture config', () => {
  const loader = new DomainConfigLoader();

  it('loads + ref-inlines the agriculture domain config', () => {
    const config = loader.loadDir(AGRI_DIR);
    expect(config.key).toBe('agriculture');
    expect(config.status).toBe('active');
    // workflow $ref inlined
    expect(config.workflow?.initial).toBe('draft');
    // entity schema $ref inlined
    expect(config.entity_schemas?.supplier).toHaveProperty('properties');
  });

  it('passes the fail-fast validator (every plugin key is registered)', () => {
    const { validator } = buildValidator();
    const config = loader.loadDir(AGRI_DIR);
    expect(validator.collectErrors(config)).toEqual([]);
  });

  it('fails fast when a config references an unregistered adapter', () => {
    const { validator } = buildValidator();
    const config = loader.loadDir(AGRI_DIR);
    config.verification_profile!.required_signals.push({
      key: 'not_registered',
      required: true,
    });
    expect(validator.collectErrors(config)).toContain(
      'verification adapter "not_registered" is not registered',
    );
  });

  it('validates the workflow structurally (all guards/actions registered)', () => {
    const { engine } = buildValidator();
    const config = loader.loadDir(AGRI_DIR);
    expect(engine.validateWorkflow(config.workflow)).toEqual([]);
  });
});

describe('GrainGradeScorer', () => {
  const scorer = new GrainGradeScorer();
  const profile = {
    scorer: 'grain_grade',
    grading_scale: ['FAQ', 'Grade A', 'Grade B', 'Reject'],
    criteria: [
      { key: 'moisture_pct', type: 'number', max: 14 },
      { key: 'foreign_matter_pct', type: 'number', max: 2 },
      { key: 'broken_pct', type: 'number', max: 3 },
      { key: 'admixture_pct', type: 'number', max: 1 },
    ],
  };

  it('grades clean produce as a non-reject grade', () => {
    const res = scorer.score({
      criteria: {
        moisture_pct: 2,
        foreign_matter_pct: 0.1,
        broken_pct: 0.2,
        admixture_pct: 0.05,
      },
      profile,
    });
    expect(res.passed).toBe(true);
    expect(res.grade).not.toBe('Reject');
  });

  it('rejects produce that breaches a limit', () => {
    const res = scorer.score({
      criteria: {
        moisture_pct: 20, // > 14
        foreign_matter_pct: 0.1,
        broken_pct: 0.2,
        admixture_pct: 0.05,
      },
      profile,
    });
    expect(res.passed).toBe(false);
    expect(res.grade).toBe('Reject');
  });
});

describe('ExprEvaluator', () => {
  const expr = new ExprEvaluator();

  it('evaluates "in [...]"', () => {
    expect(
      expr.evaluate('supplier_type in [trader, processor]', {
        supplier_type: 'trader',
      }),
    ).toBe(true);
    expect(
      expr.evaluate('supplier_type in [trader, processor]', {
        supplier_type: 'fpo',
      }),
    ).toBe(false);
  });

  it('evaluates "includes"', () => {
    expect(
      expr.evaluate("deals_in includes 'seeds'", {
        deals_in: ['seeds', 'grains'],
      }),
    ).toBe(true);
  });

  it('fails closed on unknown syntax', () => {
    expect(expr.evaluate('weird ~~ syntax', {})).toBe(false);
  });
});
