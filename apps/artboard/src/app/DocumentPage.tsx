/**
 * Generic paged HTML renderer. The artboard knows nothing about any document
 * schema — it just paints the HTML it's handed (e.g. the output of the
 * @org/ui rich-text editor) inside a page-sized sheet. Swap in a real
 * template renderer here if a project needs structured/component documents.
 */

export type PageSizeKey = 'a4' | 'letter' | 'legal';

/** Page dimensions in CSS inches (width × height). */
export const PAGE_DIMENSIONS: Record<PageSizeKey, { w: number; h: number }> = {
  a4: { w: 8.27, h: 11.69 },
  letter: { w: 8.5, h: 11 },
  legal: { w: 8.5, h: 14 },
};

export function isPageSize(v: string | null | undefined): v is PageSizeKey {
  return v === 'a4' || v === 'letter' || v === 'legal';
}

export function DocumentPage({
  html,
  pageSize = 'a4',
  fontFamily,
}: {
  html: string;
  pageSize?: PageSizeKey;
  fontFamily?: string;
}) {
  const { w } = PAGE_DIMENSIONS[pageSize];
  return (
    <div
      style={{
        width: `${w}in`,
        minHeight: `${PAGE_DIMENSIONS[pageSize].h}in`,
        margin: '0 auto',
        padding: '0.6in',
        background: '#fff',
        color: '#111',
        boxShadow: '0 1px 8px rgba(0,0,0,0.12)',
        fontFamily: fontFamily ? `'${fontFamily}', serif` : 'Inter, system-ui, sans-serif',
        lineHeight: 1.5,
        boxSizing: 'border-box',
      }}
      // The host owns the HTML it sends; this app only renders it.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
