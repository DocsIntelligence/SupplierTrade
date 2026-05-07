import { cn } from '@org/utils';
import { Slot } from '@radix-ui/react-slot';
import type { VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

import { buttonVariants } from '../variants/button';

export type ButtonProps = {
  asChild?: boolean;
  isLoading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';

    return (
      <Component
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </span>
        ) : (
          children
        )}
      </Component>
    );
  },
);

Button.displayName = 'Button';
