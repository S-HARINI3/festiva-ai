import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import type { DashboardTab } from '../../types/dashboard';

interface AIInsightWidgetProps {
  headline: string;
  recommendation: string;
  actionText: string;
  actionTab: DashboardTab;
  onNavigateTab: (tab: DashboardTab) => void;
}

export default function AIInsightWidget({
  headline,
  recommendation,
  actionText,
  actionTab,
  onNavigateTab,
}: AIInsightWidgetProps) {
  return (
    <div className="festiva-card relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[var(--surface)] via-[var(--surface-elevated)] to-[var(--surface)] border border-[var(--primary)]/30 shadow-card">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-light)] rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none opacity-60" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Lightbulb className="w-5 h-5 text-[var(--accent)]" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Festiva AI Copilot
              </span>
            </div>
            <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
              {headline}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              {recommendation}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab(actionTab)}
          className="self-start sm:self-center inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer flex-shrink-0"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
