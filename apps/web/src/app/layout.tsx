import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { I18nProvider } from '../lib/i18n-provider';
import { Providers } from '../lib/providers';
import './global.css';

export const metadata = {
  title: '@org/web',
  description: 'Next.js boilerplate',
};

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
