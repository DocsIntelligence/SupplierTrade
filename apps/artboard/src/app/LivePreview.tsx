import { useEffect, useRef, useState } from 'react';
import { DocumentPage, isPageSize, type PageSizeKey } from './DocumentPage';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const clampZoom = (z: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

/**
 * Live-preview screen, embedded in the app as an iframe. The host posts
 * `{ type: 'doc:update', payload: { html, pageSize, fontFamily } }` whenever
 * the editor changes; this renders it in a page-sized sheet with zoom.
 *
 * Generic: it only renders the HTML the host sends — never fetches from the
 * API. Pair it with the @org/ui rich-text editor (which emits HTML).
 */

interface PreviewState {
  html: string;
  pageSize: PageSizeKey;
  fontFamily?: string;
}

const DEFAULT_STATE: PreviewState = {
  html: '<p style="color:#9ca3af">Live preview — start editing to see your document here.</p>',
  pageSize: 'a4',
};

export function LivePreview() {
  const [state, setState] = useState<PreviewState>(DEFAULT_STATE);
  const [zoom, setZoom] = useState(0.85);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const applyZoom = (next: number) => {
    const z = clampZoom(next);
    setZoom(z);
    window.parent?.postMessage({ type: 'artboard:zoom', payload: { zoom: z } }, '*');
  };

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'doc:zoom') {
        if (typeof msg.payload?.zoom === 'number')
          setZoom(clampZoom(msg.payload.zoom));
        return;
      }
      if (msg.type !== 'doc:update') return;
      const { html, pageSize, fontFamily } = msg.payload ?? {};
      if (typeof html !== 'string') return;
      setState({
        html,
        pageSize: isPageSize(pageSize) ? pageSize : 'a4',
        fontFamily: typeof fontFamily === 'string' ? fontFamily : undefined,
      });
    }
    window.addEventListener('message', onMessage);
    window.parent?.postMessage({ type: 'artboard:ready' }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Pinch / ctrl+wheel zoom.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      applyZoom(zoomRef.current - e.deltaY * 0.01);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const base = pinch.current;
      if (!base) {
        pinch.current = { dist, zoom: zoomRef.current };
        return;
      }
      e.preventDefault();
      applyZoom(base.zoom * (dist / base.dist));
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch.current = null;
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div style={{ zoom, padding: '1rem', background: '#f3f4f6', minHeight: '100vh' }}>
      <DocumentPage
        html={state.html}
        pageSize={state.pageSize}
        fontFamily={state.fontFamily}
      />
    </div>
  );
}
