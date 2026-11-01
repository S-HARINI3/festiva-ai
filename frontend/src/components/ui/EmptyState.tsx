import React from 'react';
import CelebrationRibbon from './CelebrationRibbon';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`festiva-card text-center p-10 md:p-14 flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      {/* Decorative Celebration Illustration */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-5 border border-[var(--border)]">
        {icon || (
          <svg
            className="w-8 h-8 text-[var(--accent)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        )}
      </div>

      <CelebrationRibbon variant="header" className="mb-2" />

      <h3 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

export default EmptyState;
