import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hasAccentRibbon?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hasAccentRibbon = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }[padding];

    const variantStyles = {
      default: 'festiva-card',
      elevated: 'festiva-card-elevated',
      interactive: 'festiva-card-interactive',
      outline: 'bg-transparent border border-[var(--border)] rounded-[18px]',
    }[variant];

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden ${variantStyles} ${paddingStyles} ${className}`}
        {...props}
      >
        {hasAccentRibbon && (
          <div
            className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute top-2 right-[-24px] transform rotate-45 bg-[var(--accent)] text-[var(--accent-text)] text-[9px] font-bold py-0.5 px-8 shadow-sm tracking-wider uppercase">
              ✦
            </div>
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ children, className = '' }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 flex items-center justify-between gap-3 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`font-display text-xl font-bold text-[var(--text-primary)] ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-[var(--text-secondary)] ${className}`}>{children}</p>
);

export const CardContent = ({ children, className = '' }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className}>{children}</div>
);

export const CardFooter = ({ children, className = '' }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3 ${className}`}>
    {children}
  </div>
);

export default Card;
