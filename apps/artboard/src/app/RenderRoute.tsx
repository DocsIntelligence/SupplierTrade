import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DocumentPage, isPageSize, type PageSizeKey } from './DocumentPage';

/**
 * Headless render target. A Puppeteer worker navigates to
 *   /render?pageSize=a4
 * and either injects `window.__ARTBOARD_DATA__ = { html, fontFamily }` via
 * `page.evaluateOnNewDocument` (no URL size limit) or passes `?data=` (URL-
 * encoded JSON). The worker waits for `window.__ARTBOARD_READY__ === true`
 * before calling `page.pdf()`.
 *
 * Generic: it renders whatever HTML it's handed. No API call, no auth.
 *
 * (The boilerplate's `render` API module renders via `page.setContent` and
 * doesn't need this route — it's here for projects that prefer a live URL.)
 */

interface RenderData {
  html: string;
  fontFamily?: string;
}

declare global {
  interface Window {
    __ARTBOARD_READY__?: boolean;
    __ARTBOARD_ERROR__?: string;
    __ARTBOARD_DATA__?: RenderData;
  }
}

export function RenderRoute() {
  const [search] = useSearchParams();
  const [data, setData] = useState<RenderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageSizeParam = search.get('pageSize');
  const pageSize: PageSizeKey = isPageSize(pageSizeParam) ? pageSizeParam : 'a4';

  useEffect(() => {
    try {
      if (window.__ARTBOARD_DATA__ !== undefined) {
        setData(window.__ARTBOARD_DATA__);
        return;
      }
      const dataParam = search.get('data');
      if (dataParam) {
        setData(JSON.parse(decodeURIComponent(dataParam)) as RenderData);
        return;
      }
      throw new Error('No render data (set window.__ARTBOARD_DATA__ or ?data=)');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      window.__ARTBOARD_ERROR__ = msg;
    }
  }, [search]);

  useEffect(() => {
    if (!data) return;
    // Let webfonts settle, then signal the worker (two rAFs flush layout).
    const fontsReady =
      (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts
        ?.ready ?? Promise.resolve();
    void fontsReady.then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.__ARTBOARD_READY__ = true;
        });
      });
    });
  }, [data]);

  if (error) {
    return (
      <div role="alert" style={{ padding: 24, fontFamily: 'system-ui', color: '#991b1b' }}>
        Render failed: {error}
      </div>
    );
  }
  if (!data) return null;
  return (
    <DocumentPage html={data.html} pageSize={pageSize} fontFamily={data.fontFamily} />
  );
}
