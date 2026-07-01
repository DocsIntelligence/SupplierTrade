'use client';

/**
 * Custom global error boundary. Renders its own <html>/<body> and pulls in no
 * app providers, so static generation of the built-in global-error page doesn't
 * evaluate the client Redux provider (which crashed the production build).
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ color: '#666', maxWidth: '24rem' }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: '0.5rem',
            background: '#111',
            color: '#fff',
            padding: '0.625rem 1.25rem',
            fontWeight: 500,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
