import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none';

    // Size styles
    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 h-8',
      md: 'text-sm px-4 py-2 rounded-xl gap-2 h-10',
      lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 h-12',
    }[size];

    // Variant styles
    const variantStyles = {
      primary:
        'bg-[var(--primary)] text-[var(--primary-contrast)] hover:bg-[var(--primary-hover)] shadow-sm hover:shadow active:shadow-none border border-transparent',
      secondary:
        'bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--border-hover)] shadow-sm',
      accent:
        'bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] font-semibold shadow-sm border border-transparent',
      outline:
        'bg-transparent text-[var(--primary)] hover:bg-[var(--primary-light)] border border-[var(--primary)]',
      ghost:
        'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--primary-light)] border border-transparent',
      danger:
        'bg-[var(--danger)] text-white hover:opacity-90 shadow-sm border border-transparent',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
