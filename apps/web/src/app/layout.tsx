import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { I18nProvider } from '../lib/i18n-provider';
import { Providers } from '../lib/providers';
import './global.css';

export const metadata = {
  title: 'SupplierTrade',
  description: 'Supplier trust & quality layer for B2B supply chains',
};

/**
 * Render dynamically. The whole app sits behind cookie auth + a client Redux
 * provider, so there's nothing to statically prerender — and forcing dynamic
 * avoids evaluating the client `Providers` during static generation of Next's
 * built-in pages (which crashed the production build with a null React).
 */
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <Providers>{children}</Providers>
        </I18nProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
