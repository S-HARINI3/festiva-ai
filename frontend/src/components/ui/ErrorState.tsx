import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  actionText?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something unexpected occurred',
  message = 'We encountered an issue while processing your celebration request. Please try again or refresh the page.',
  onRetry,
  actionText = 'Try Again',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`festiva-card border-[var(--danger)]/30 text-center p-8 md:p-12 flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--danger-light)] text-[var(--danger)] flex items-center justify-center mb-4 border border-[var(--danger)]/20">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="secondary"
          size="md"
          leftIcon={<RotateCcw className="w-4 h-4" />}
          onClick={onRetry}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
