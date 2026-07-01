/**
 * Declarative workflow definition (DOMAIN-ARCHITECTURE.md §4).
 * One generic WorkflowEngine interprets any domain's workflow; it never knows
 * about a specific domain. `guard` / `action` strings resolve via the
 * Guard/Action registries (or the `feature.*` pseudo-guard read from the
 * domain's feature_flags).
 */

export interface Transition {
  from: string; // a state, or "*" for any state
  to: string;
  on: string; // event name
  guard?: string; // registry key, or "feature.<flag>"
  action?: string; // ActionRegistry key
}

export interface WorkflowDef {
  initial: string;
  states: string[];
  transitions: Transition[];
  required_artifacts_by_state?: Record<string, string[]>;
}
