import Link from 'next/link';

export const metadata = {
  title: 'Welcome — @org',
  description: 'Full-stack starter with cross-subdomain auth',
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8 bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
          @org/starter
        </h1>
        <p className="text-gray-600 max-w-lg mx-auto text-lg leading-relaxed">
          Full-stack monorepo with NestJS API, Next.js landing, and React
          dashboard — sharing auth across subdomains via cookies.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center shadow-sm"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center shadow-sm"
        >
          Create account
        </Link>
      </div>

      <footer className="mt-8 text-sm text-gray-400">
        <p>
          API docs available at{' '}
          <a
            href="/api/docs"
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            /api/docs
          </a>
        </p>
      </footer>
    </main>
  );
}
