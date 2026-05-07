import { cn } from '@org/utils';

export const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('animate-pulse rounded-md bg-secondary', className)}
    {...props}
  />
);
