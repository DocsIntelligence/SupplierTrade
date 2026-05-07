import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-300',
  secondary:
    'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-300 disabled:bg-gray-50',
  ghost:
    'bg-transparent hover:bg-gray-100 text-gray-900 focus:ring-gray-300 disabled:opacity-50',
  danger:
    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-300',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <span aria-hidden className="animate-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
};
