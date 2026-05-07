import type { ReactNode } from 'react';
import { cn } from '@org/utils';

export interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export const FormField = ({
  label,
  error,
  hint,
  htmlFor,
  className,
  children,
}: FormFieldProps) => (
  <label className={cn('block space-y-1.5', className)} htmlFor={htmlFor}>
    <span className="text-sm font-medium text-foreground">{label}</span>
    {children}
    {error ? (
      <span className="text-xs text-error">{error}</span>
    ) : hint ? (
      <span className="text-xs text-foreground/60">{hint}</span>
    ) : null}
  </label>
);
