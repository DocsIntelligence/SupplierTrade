import { cn } from '@org/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export const Spinner = ({ size = 'md', className }: SpinnerProps) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn(
      'inline-block animate-spin rounded-full border-primary border-t-transparent',
      sizeClass[size],
      className,
    )}
  />
);
