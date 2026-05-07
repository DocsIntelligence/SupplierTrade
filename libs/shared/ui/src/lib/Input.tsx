import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className = '', ...rest }, ref) => (
    <input
      ref={ref}
      className={`block w-full h-10 rounded-md border px-3 text-sm outline-none focus:ring-2 ${
        invalid
          ? 'border-red-500 focus:ring-red-200'
          : 'border-gray-300 focus:ring-blue-200'
      } ${className}`}
      {...rest}
    />
  ),
);

Input.displayName = 'Input';
