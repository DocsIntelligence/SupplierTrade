import type { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

export const FormField = ({
  label,
  error,
  hint,
  htmlFor,
  children,
}: FormFieldProps) => (
  <label className="block space-y-1" htmlFor={htmlFor}>
    <span className="text-sm font-medium text-gray-800">{label}</span>
    {children}
    {error ? (
      <span className="text-xs text-red-600">{error}</span>
    ) : hint ? (
      <span className="text-xs text-gray-500">{hint}</span>
    ) : null}
  </label>
);
