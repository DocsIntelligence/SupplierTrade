import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
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
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
