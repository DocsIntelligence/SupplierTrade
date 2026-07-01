import { Injectable } from '@nestjs/common';

/**
 * Safe evaluator for `required_if` conditions used across domain configs
 * (DOMAIN-ARCHITECTURE.md §2b). NO JS `eval` — a tiny hand-rolled matcher for
 * the small grammar the configs actually use:
 *
 *   <field> in [a, b, c]            e.g. "supplier_type in [trader, processor]"
 *   <field> includes 'value'       e.g. "deals_in includes 'seeds'"
 *   <field>                        bare truthy flag, e.g. "qc_requested"
 *   <left> && <right>              conjunction of any of the above
 *
 * Unknown syntax evaluates to `false` (fail-closed: a requirement we cannot
 * understand is not silently treated as satisfied).
 */

export type ExprContext = Record<string, unknown>;

@Injectable()
export class ExprEvaluator {
  evaluate(expr: string | undefined, ctx: ExprContext): boolean {
    if (!expr || !expr.trim()) return true; // no condition → always applies
    return expr
      .split('&&')
      .every((clause) => this.evalClause(clause.trim(), ctx));
  }

  private evalClause(clause: string, ctx: ExprContext): boolean {
    // <field> in [a, b]
    const inMatch = clause.match(/^(\w+)\s+in\s+\[(.*)\]$/);
    if (inMatch) {
      const value = this.str(ctx[inMatch[1]]);
      const options = inMatch[2]
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
      return value !== undefined && options.includes(value);
    }

    // <field> includes 'value'
    const incMatch = clause.match(/^(\w+)\s+includes\s+['"](.+)['"]$/);
    if (incMatch) {
      const arr = ctx[incMatch[1]];
      return Array.isArray(arr) && arr.map(String).includes(incMatch[2]);
    }

    // bare flag
    const flagMatch = clause.match(/^(\w+)$/);
    if (flagMatch) return Boolean(ctx[flagMatch[1]]);

    return false; // unknown syntax → fail-closed
  }

  private str(v: unknown): string | undefined {
    return v === undefined || v === null ? undefined : String(v);
  }
}
