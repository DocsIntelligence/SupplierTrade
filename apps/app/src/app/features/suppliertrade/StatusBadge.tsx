import { useTranslation } from 'react-i18next';
import { friendlyStatus } from './status';

/**
 * Traffic-light status badge for a low-literacy audience: a plain localized word
 * plus a recognisable colour, with an optional one-line explanation. Never shows
 * raw jargon like "insufficient" or "qc_pending".
 */
export function StatusBadge({
  status,
  size = 'md',
  showHint = false,
}: {
  status: string;
  size?: 'sm' | 'md';
  showHint?: boolean;
}) {
  const { t } = useTranslation();
  const s = friendlyStatus(status, t);
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad} ${s.badge}`}
      >
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        {s.label}
      </span>
      {showHint && (
        <span className="text-[11px] text-foreground/50">{s.hint}</span>
      )}
    </span>
  );
}
