import { cn } from '@org/utils';
import * as React from 'react';

export type TextareaProps = {
  hasError?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, onChange, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex w-full rounded-md border border-secondary bg-background px-3 py-2 text-sm ring-offset-background placeholder:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          hasError ? 'border-error' : 'border-border',
          className,
        )}
        onChange={onChange}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
