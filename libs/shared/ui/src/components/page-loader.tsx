import { Spinner } from './spinner';

export interface PageLoaderProps {
  message?: string;
}

export const PageLoader = ({ message = 'Loading…' }: PageLoaderProps) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3">
    <Spinner size="lg" />
    <p className="text-sm text-foreground/60">{message}</p>
  </div>
);
