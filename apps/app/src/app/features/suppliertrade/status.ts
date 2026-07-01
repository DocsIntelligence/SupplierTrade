import type { TFunction } from 'i18next';

export type StatusKind = 'trusted' | 'checking' | 'review' | 'notStarted';

export interface FriendlyStatus {
  kind: StatusKind;
  /** plain, localized label — e.g. "Trusted" / "भरोसेमंद" */
  label: string;
  /** one-line plain explanation */
  hint: string;
  /** tailwind bg+text classes for a badge */
  badge: string;
  /** tailwind bg for a dot / bar segment */
  dot: string;
}

const TRUSTED = ['verified', 'qc_passed', 'escrow_active', 'completed', 'pass'];
const CHECKING = ['submitted', 'verifying', 'qc_pending'];
const REVIEW = ['flagged', 'qc_failed', 'disputed', 'flag'];
// everything else (draft, insufficient, na) → notStarted

/**
 * Map any workflow / verification / signal status to a plain, localized,
 * traffic-light presentation for a low-literacy audience — a word they can read
 * plus a colour they can recognise, never raw jargon like "insufficient".
 */
export function friendlyStatus(status: string, t: TFunction): FriendlyStatus {
  const kind: StatusKind = TRUSTED.includes(status)
    ? 'trusted'
    : CHECKING.includes(status)
      ? 'checking'
      : REVIEW.includes(status)
        ? 'review'
        : 'notStarted';

  const styles: Record<StatusKind, { badge: string; dot: string }> = {
    trusted: { badge: 'bg-success/15 text-success', dot: 'bg-success' },
    checking: { badge: 'bg-primary/15 text-primary', dot: 'bg-primary' },
    review: { badge: 'bg-error/15 text-error', dot: 'bg-error' },
    notStarted: { badge: 'bg-secondary text-foreground/60', dot: 'bg-secondary' },
  };

  return {
    kind,
    label: t(`st.status.${kind}`),
    hint: t(`st.status.${kind}Hint`),
    ...styles[kind],
  };
}
