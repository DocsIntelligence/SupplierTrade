import { cookies } from 'next/headers';
import Link from 'next/link';
import { AuthenticatedHome } from './authenticated-home';

export const metadata = {
  title: 'Welcome — @org',
  description: 'Full-stack starter with cross-subdomain auth',
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has('access_token');

  if (hasSession) {
    return <AuthenticatedHome />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          @org/starter
        </h1>
        <p className="text-foreground/60 max-w-lg mx-auto text-lg leading-relaxed">
          Full-stack monorepo with NestJS API, Next.js landing, and React
          dashboard — sharing auth across subdomains via cookies.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/login"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-center shadow-sm"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 bg-background border border-border text-foreground rounded-lg font-medium hover:bg-secondary/30 transition-colors text-center shadow-sm"
        >
          Create account
        </Link>
      </div>

      <footer className="mt-8 text-sm text-foreground/40">
        <p>
          API docs at{' '}
          <a
            href="/docs"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            /docs
          </a>
        </p>
      </footer>
    </main>
  );
}
