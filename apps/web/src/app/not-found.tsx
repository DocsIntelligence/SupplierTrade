import Link from 'next/link';

/**
 * Custom 404. Self-contained (no app providers) so static generation of the
 * built-in not-found page doesn't evaluate the client Redux provider.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <p className="text-sm font-semibold uppercase tracking-wider text-foreground/40">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-foreground/60">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground"
      >
        Back to home
      </Link>
    </div>
  );
}
