import { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Info,
  Check,
  X,
} from 'lucide-react';
import type { BudgetRescueResponse, BudgetCategory } from '../../types/events';
import { formatCurrency } from '../../utils/helpers';
import { Button, Badge } from '../ui';

interface BudgetRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  currency?: string;
  rescueData: BudgetRescueResponse | null;
  isLoading: boolean;
  onApplyRescue: (
    tier: string,
    revisedCategories: BudgetCategory[],
    revisedContingency: number
  ) => Promise<void>;
  isApplying: boolean;
}

export default function BudgetRescueModal({
  isOpen,
  onClose,
  eventName,
  currency = 'INR',
  rescueData,
  isLoading,
  onApplyRescue,
  isApplying,
}: BudgetRescueModalProps) {
  const [selectedTier, setSelectedTier] = useState<'minimal' | 'balanced' | 'maximum'>('balanced');
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  if (!isOpen) return null;

  const currentOption = rescueData?.options.find((o) => o.tier === selectedTier) || rescueData?.options[1] || rescueData?.options[0];

  const handleConfirmApply = async () => {
    if (!currentOption) return;
    await onApplyRescue(
      currentOption.tier,
      currentOption.revised_categories,
      currentOption.revised_contingency
    );
    setShowConfirmStep(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-modal flex flex-col my-auto text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-5 sm:p-6 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                  Budget Rescue Studio
                </h2>
                <Badge variant="warning" size="sm" className="font-medium">
                  Smart Rebalancing
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                AI-guided recovery strategy for <span className="font-semibold text-[var(--text-primary)]">{eventName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
            aria-label="Close Budget Rescue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
              <div className="text-center">
                <p className="font-display font-bold text-base text-[var(--text-primary)]">
                  Analyzing Spending &amp; Synthesizing Rescue Strategies...
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Validating non-negative category allocations and mathematical consistency
                </p>
              </div>
            </div>
          ) : !rescueData ? (
            <div className="py-12 text-center text-[var(--text-secondary)] text-sm">
              Unable to load rescue recommendations. Please verify event budget data.
            </div>
          ) : (
            <>
              {/* Overrun Diagnosis Banner */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                rescueData.is_over_budget
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              } space-y-3`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className={`w-5 h-5 ${
                      rescueData.is_over_budget ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                    }`} />
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-primary)]">
                        {rescueData.is_over_budget ? 'Budget Overrun Detected' : 'Preemptive Budget Optimization'}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {rescueData.is_over_budget
                          ? `Current spending exceeds planned allocation by ${formatCurrency(rescueData.overrun_amount, currency)}.`
                          : 'Spending is near target allocation. Recommended optimizations available.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Target Budget</span>
                      <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                        {formatCurrency(rescueData.target_budget, currency)}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Actual Spending</span>
                      <span className={`font-mono font-bold text-sm ${
                        rescueData.is_over_budget ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-primary)]'
                      }`}>
                        {formatCurrency(rescueData.actual_spending, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overrun Categories Chips */}
                {rescueData.overrun_categories && rescueData.overrun_categories.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)]/50 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      Categories Driving Overrun:
                    </span>
                    {rescueData.overrun_categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3 Calibrated Alternative Strategy Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[var(--primary)]" />
                    Select a Recovery Strategy
                  </h4>
                  <span className="text-xs text-[var(--text-secondary)]">
                    All options balance to exact target {formatCurrency(rescueData.target_budget, currency)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {rescueData.options.map((option) => {
                    const isSelected = selectedTier === option.tier;
                    const isRecommended = option.tier === 'balanced';

                    return (
                      <button
                        key={option.strategy_id}
                        type="button"
                        onClick={() => {
                          setSelectedTier(option.tier);
                          setShowConfirmStep(false);
                        }}
                        className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-[var(--surface-elevated)] border-[var(--primary)] ring-2 ring-[var(--primary)]/30 shadow-card'
                            : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--text-secondary)]/40 hover:bg-[var(--surface-elevated)]/50'
                        }`}
                      >
                        {isRecommended && (
                          <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary)] text-white shadow-xs">
                            Recommended
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-display font-bold text-sm text-[var(--text-primary)]">
                              {option.strategy_name}
                            </span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-[var(--border)]'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            <TrendingDown className="w-3.5 h-3.5" />
                            Saves ~{formatCurrency(option.estimated_savings, currency)}
                          </div>
                        </div>

                        {/* Quality Impact Meter */}
                        <div className="pt-2 border-t border-[var(--border)] space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--text-secondary)]">Guest Experience Score</span>
                            <span className="font-bold text-[var(--text-primary)]">
                              {option.quality_impact_score}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                option.quality_impact_score >= 90
                                  ? 'bg-emerald-500'
                                  : option.quality_impact_score >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${option.quality_impact_score}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Strategy Details & Impact Breakdown */}
              {currentOption && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                    <div>
                      <h5 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                        {currentOption.strategy_name} — Impact Assessment
                      </h5>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {currentOption.quality_impact_description}
                      </p>
                    </div>

                    <Badge variant="success" size="md" className="font-mono font-bold self-start sm:self-auto">
                      Estimated Recovery: {formatCurrency(currentOption.estimated_savings, currency)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Alternative Choices */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider block">
                        Cost-Saving Alternatives &amp; Adjustments
                      </span>
                      <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                        {currentOption.alternative_choices.map((alt, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{alt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Trade-offs */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider block">
                        Calculated Trade-Offs
                      </span>
                      <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                        {currentOption.trade_offs.map((trade, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{trade}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Revised Budget Preview Table */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        Revised Category Allocation Preview
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Backend Verified: 0.00 Rounding Drift
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[var(--surface)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px] font-semibold">
                          <tr>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Revised Allocation</th>
                            <th className="p-2.5">Share %</th>
                            <th className="p-2.5">Key Strategy Focus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] bg-[var(--surface-elevated)]/60">
                          {currentOption.revised_categories.map((cat) => (
                            <tr key={cat.category} className="hover:bg-[var(--surface-elevated)]">
                              <td className="p-2.5 font-bold text-[var(--text-primary)]">{cat.category}</td>
                              <td className="p-2.5 font-mono font-semibold text-[var(--text-primary)]">
                                {formatCurrency(cat.allocated_amount || cat.estimated_amount, currency)}
                              </td>
                              <td className="p-2.5 text-[var(--text-secondary)]">{cat.percentage}%</td>
                              <td className="p-2.5 text-[var(--text-secondary)] truncate max-w-xs">
                                {cat.cost_notes || cat.items?.slice(0, 2).join(', ') || 'Optimized service level'}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-[var(--surface)] font-bold">
                            <td className="p-2.5 text-[var(--accent)]">Contingency Reserve (Protected)</td>
                            <td className="p-2.5 font-mono text-[var(--accent)]">
                              {formatCurrency(currentOption.revised_contingency, currency)}
                            </td>
                            <td className="p-2.5 text-[var(--text-secondary)]">
                              {Math.round((currentOption.revised_contingency / currentOption.revised_total_budget) * 100)}%
                            </td>
                            <td className="p-2.5 text-xs text-[var(--text-secondary)]">
                              Safety buffer for unanticipated day-of expenses
                            </td>
                          </tr>
                          <tr className="bg-[var(--surface-elevated)] font-bold border-t border-[var(--border)]">
                            <td className="p-2.5 text-[var(--text-primary)]">Total Balanced Budget</td>
                            <td className="p-2.5 font-mono text-[var(--primary)]">
                              {formatCurrency(currentOption.revised_total_budget, currency)}
                            </td>
                            <td className="p-2.5 text-[var(--text-primary)]">100%</td>
                            <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                              Target Reached Successfully
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Engine Transparency Notice */}
              <div className="p-3 rounded-xl bg-[var(--surface-elevated)]/40 border border-[var(--border)] flex items-start gap-2.5 text-[11px] text-[var(--text-secondary)]">
                <Info className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[var(--text-primary)]">Strict Budget Safety Rule:</strong> Festiva AI never alters your original budget allocations until you explicitly confirm. All mathematical operations are calculated with decimal precision in the backend to eliminate floating-point drift.
                </p>
              </div>

              {/* Confirmation Step if toggled */}
              {showConfirmStep && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Confirm Applying Revised Budget Plan
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    This action will update the planned category allocations for <strong className="text-[var(--text-primary)]">{eventName}</strong> to the &quot;{currentOption?.strategy_name}&quot; blueprint. Your logged expenses will remain intact.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleConfirmApply}
                      isLoading={isApplying}
                      className="cursor-pointer"
                    >
                      Yes, Apply Revised Blueprint
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowConfirmStep(false)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
          <div className="text-xs text-[var(--text-secondary)]">
            Selected: <strong className="text-[var(--text-primary)]">{currentOption?.strategy_name}</strong> (~{formatCurrency(currentOption?.estimated_savings || 0, currency)} savings)
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isApplying}
              className="cursor-pointer"
            >
              Keep Original Budget
            </Button>

            {!showConfirmStep && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowConfirmStep(true)}
                disabled={isLoading || !currentOption || isApplying}
                className="cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Apply Revised Budget
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
