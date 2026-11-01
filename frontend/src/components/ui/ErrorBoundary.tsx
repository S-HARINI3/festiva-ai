import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Button } from './Button';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)] text-[var(--text-primary)]">
          <Card className="max-w-md w-full border-[var(--border)] shadow-soft">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-[var(--danger)]" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">Something went wrong</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-3 leading-relaxed">
                {this.state.error?.message || 'An unexpected application error occurred.'}
              </p>
              {this.state.error?.stack && (
                <p className="text-[var(--text-secondary)] text-xs mb-6 font-mono bg-[var(--surface-elevated)] p-2.5 rounded-lg break-all border border-[var(--border)]">
                  {this.state.error.stack.split('\n')[1] || ''}
                </p>
              )}
              <Button
                variant="primary"
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="mx-auto"
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
