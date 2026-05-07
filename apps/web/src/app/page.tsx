import Link from 'next/link';

export default function Index() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">@org/web</h1>
      <p className="text-gray-600 max-w-prose text-center">
        Next.js (App Router) boilerplate with Redux, auth, and a typed API client.
      </p>
      <nav className="flex gap-4">
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
        <Link href="/register" className="text-blue-600 hover:underline">
          Create account
        </Link>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Dashboard
        </Link>
      </nav>
    </main>
  );
}
