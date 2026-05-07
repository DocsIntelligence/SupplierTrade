import { cn } from '@org/utils';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

type ProgressProps = {
  indicatorClassName?: string;
  value: number;
} & React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>;

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, indicatorClassName, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'size-full flex-1 bg-primary transition-all',
        indicatorClassName,
      )}
      style={{ transform: `translateX(-${100 - value}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;
