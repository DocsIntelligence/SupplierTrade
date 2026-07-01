'use client';

import { useEffect, useState } from 'react';
import { LanguageSwitcher } from '@org/ui';

/**
 * Client wrapper so the Next.js server-component layout can render the shared
 * LanguageSwitcher without pulling the @org/ui barrel into the server graph
 * (the barrel includes client-only components like DataTable). Mount-gated so
 * it never runs during SSR/prerender, where the i18n context isn't initialized.
 * See docs/UI-STANDARDS.md.
 */
export function LangSwitcher() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <LanguageSwitcher />;
}
