import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback(
    (msg: string, title?: string) => showToast('success', msg, title),
    [showToast]
  );
  const error = useCallback(
    (msg: string, title?: string) => showToast('error', msg, title),
    [showToast]
  );
  const warning = useCallback(
    (msg: string, title?: string) => showToast('warning', msg, title),
    [showToast]
  );
  const info = useCallback(
    (msg: string, title?: string) => showToast('info', msg, title),
    [showToast]
  );

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismissToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-dropdown"
            >
              {getIcon(toast.type)}
              <div className="flex-1 min-w-0 pr-2">
                {toast.title && (
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
