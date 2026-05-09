'use client';

import '../i18n';

/**
 * Client-only i18n initializer.
 * Import this component in the layout to ensure i18n is loaded on the client.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
