import { useState, useEffect } from 'react';
import {
  Sparkles, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw,
  Compass, ArrowRight, ShieldCheck, HelpCircle, Calendar,
  DollarSign, Users, Briefcase, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import type { SavedEvent, EventReadinessResponse } from '../../types/events';
import { getEventReadiness } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface EventReadinessWidgetProps {
  events: SavedEvent[];
  selectedEventId?: string;
  userId?: string;
  onNavigateTab: (tab: string) => void;
  onSelectEvent?: (eventId: string) => void;
}

export default function EventReadinessWidget({
  events,
  selectedEventId,
  userId = 'demo-user-001',
  onNavigateTab,
  onSelectEvent,
}: EventReadinessWidgetProps) {
  const [activeEventId, setActiveEventId] = useState<string>(
    selectedEventId || events[0]?.id || ''
  );
  const [readiness, setReadiness] = useState<EventReadinessResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    task_completion: false,
    budget_preparedness: false,
    vendor_preparedness: false,
    guest_planning: false,
    timeline_preparedness: false,
  });

  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];

  useEffect(() => {
    if (selectedEventId && selectedEventId !== activeEventId) {
      setActiveEventId(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchReadiness = async (eventId: string) => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEventReadiness(eventId, userId);
      setReadiness(data);
    } catch (err: any) {
      setError(err.message || 'Unable to calculate readiness score.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeEvent?.id) {
      fetchReadiness(activeEvent.id);
    }
  }, [activeEventId]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!activeEvent) {
    return (
      <Card variant="default" padding="md" className="text-center py-8">
        <p className="text-xs text-[var(--text-secondary)]">No active celebrations found to evaluate readiness.</p>
      </Card>
    );
  }

  // Accessible Grade helpers independent of color
  const getGradeBadge = (grade: string, isInsufficient: boolean) => {
    if (isInsufficient) {
      return {
        label: 'Setup Incomplete',
        subLabel: 'Needs Setup Data',
        icon: <HelpCircle className="w-4 h-4 text-amber-600" />,
        className: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
      };
    }
    switch (grade) {
      case 'Celebration Ready':
        return {
          label: 'Grade A+ — Celebration Ready',
          subLabel: 'Flawlessly Prepared',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
        };
      case 'Well Prepared':
        return {
          label: 'Grade B — Well Prepared',
          subLabel: 'On Track',
          icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
          className: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400',
        };
      case 'Needs Attention':
        return {
          label: 'Grade C — Needs Attention',
          subLabel: 'Action Required',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          className: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
        };
      default:
        return {
          label: 'Grade D — Critical Attention',
          subLabel: 'Major Planning Gaps',
          icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
          className: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400',
        };
    }
  };

  const gradeInfo = getGradeBadge(readiness?.score_grade || '', readiness?.is_insufficient_data || false);

  return (
    <div className="space-y-5">
      {/* ── TOP HEADER: EVENT SELECTOR & REFRESH ─────────────────────────── */}
      <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
              Event Readiness Intelligence
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold uppercase tracking-wider">
              Deterministic 0–100 Engine
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Objective preparation audit evaluating 5 weighted planning pillars.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {events.length > 1 && (
            <select
              value={activeEventId}
              onChange={(e) => {
                setActiveEventId(e.target.value);
                if (onSelectEvent) onSelectEvent(e.target.value);
              }}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] font-medium outline-none focus:border-[var(--primary)] cursor-pointer flex-1 sm:flex-initial"
              aria-label="Select celebration for readiness evaluation"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.event_name}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReadiness(activeEvent.id)}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs"
            aria-label="Recalculate readiness score"
          >
            Refresh Score
          </Button>

          <button
            type="button"
            onClick={() => setShowFormula(!showFormula)}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            title="View Scoring Criteria & Formula Specification"
            aria-label="View scoring formula specification"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── FORMULA SPECIFICATION DISCLOSURE MODAL/ACCORDION ──────────────── */}
      {showFormula && readiness && (
        <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
              Festiva Mathematical Readiness Specification
            </span>
            <button
              onClick={() => setShowFormula(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-sm"
              aria-label="Close formula specification"
            >
              ✕
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-[var(--text-primary)] overflow-x-auto">
            {readiness.formula_documentation}
          </pre>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── HERO SECTION: OVERALL SCORE & NEXT BEST MOVE ──────────────────── */}
      {readiness && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Overall Gauge Card (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-soft flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Overall Preparedness
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                Weight: 100%
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className="font-display font-black text-5xl text-[var(--text-primary)] tracking-tight"
                aria-label={`Overall Readiness Score: ${readiness.overall_score} out of 100`}
              >
                {readiness.overall_score}
              </span>
              <span className="text-xl text-[var(--text-muted)] font-semibold">/ 100</span>
            </div>

            {/* Accessible Grade Badge */}
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${gradeInfo.className}`}>
              {gradeInfo.icon}
              <div className="min-w-0">
                <p className="leading-tight">{gradeInfo.label}</p>
                <p className="text-[10px] font-normal opacity-85">{gradeInfo.subLabel}</p>
              </div>
            </div>

            {/* Score Meter (ARIA Accessible) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>0 (Unprepared)</span>
                <span>50 (Fair)</span>
                <span>100 (Flawless)</span>
              </div>
              <div
                className="w-full h-2.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden p-0.5 border border-[var(--border)]"
                role="progressbar"
                aria-valuenow={readiness.overall_score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall readiness progress"
              >
                <div
                  className="h-full rounded-full transition-all duration-700 bg-[var(--primary)]"
                  style={{ width: `${Math.max(4, readiness.overall_score)}%` }}
                />
              </div>
            </div>

            {readiness.is_insufficient_data && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
                ⚠️ <strong>Insufficient Data:</strong> Only {readiness.data_sufficiency_pct}% of core event pillars are populated. Add milestones, vendors, or guest estimates to unlock a verified score.
              </div>
            )}
          </div>

          {/* Hero Feature: NEXT BEST MOVE (8 cols) */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-elevated)] border border-[var(--primary)]/30 shadow-card flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shadow-xs">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                    Next Best Move
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    Highest-leverage planning recommendation right now
                  </span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                readiness.next_best_move.priority === 'critical'
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                  : readiness.next_best_move.priority === 'high'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30'
              }`}>
                {readiness.next_best_move.priority} Priority
              </span>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)]">
                {readiness.next_best_move.title}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {readiness.next_best_move.description}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)] font-medium">Expected Gain:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {readiness.next_best_move.expected_impact}
                </span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateTab(readiness.next_best_move.target_module)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="font-medium text-xs shadow-xs"
              >
                {readiness.next_best_move.action_label}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5 CATEGORY PILLARS BREAKDOWN ──────────────────────────────────── */}
      {readiness && (
        <div className="space-y-3">
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider">
            Weighted Pillar Breakdown
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.entries(readiness.category_scores).map(([key, cat]) => {
              const isExpanded = expandedCategories[key];
              const getIcon = (k: string) => {
                switch (k) {
                  case 'task_completion':
                    return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
                  case 'budget_preparedness':
                    return <DollarSign className="w-4 h-4 text-emerald-500" />;
                  case 'vendor_preparedness':
                    return <Briefcase className="w-4 h-4 text-purple-500" />;
                  case 'guest_planning':
                    return <Users className="w-4 h-4 text-amber-500" />;
                  default:
                    return <Calendar className="w-4 h-4 text-rose-500" />;
                }
              };

              return (
                <div
                  key={key}
                  className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/40 transition-all space-y-3 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {getIcon(key)}
                        <span className="font-semibold text-xs text-[var(--text-primary)]">
                          {cat.category_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {cat.max_score} pts max
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="font-display font-bold text-xl text-[var(--text-primary)]">
                        {cat.score}
                        <span className="text-xs text-[var(--text-muted)] font-normal"> / {cat.max_score}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        cat.status_label === 'Optimal'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : cat.status_label === 'Good'
                          ? 'bg-indigo-500/10 text-indigo-600'
                          : cat.status_label === 'Needs Attention'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {cat.status_label}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="w-full h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden mt-1"
                      role="progressbar"
                      aria-valuenow={cat.score}
                      aria-valuemin={0}
                      aria-valuemax={cat.max_score}
                      aria-label={`${cat.category_name} score`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-[var(--primary)]"
                        style={{ width: `${Math.max(3, cat.percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Expand Criteria Details Toggle */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => toggleCategory(key)}
                      className="w-full flex items-center justify-between text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span>Criteria ({cat.criteria_met.length} met)</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 text-[10px] leading-tight animate-fadeIn">
                        {cat.criteria_met.map((m, idx) => (
                          <div key={idx} className="flex items-start gap-1 text-emerald-600 dark:text-emerald-400">
                            <span className="flex-shrink-0">✓</span>
                            <span>{m}</span>
                          </div>
                        ))}
                        {cat.criteria_unmet.map((u, idx) => (
                          <div key={idx} className="flex items-start gap-1 text-amber-600 dark:text-amber-400">
                            <span className="flex-shrink-0">✕</span>
                            <span>{u}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── POSITIVE INDICATORS & MISSING INFORMATION GRID ────────────────── */}
      {readiness && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Positive Indicators */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                Positive Indicators ({readiness.positive_indicators.length})
              </h4>
            </div>
            {readiness.positive_indicators.length > 0 ? (
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                {readiness.positive_indicators.map((ind, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>
                    <span className="leading-relaxed">{ind}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No confirmed indicators logged yet.</p>
            )}
          </Card>

          {/* Missing Information & Vulnerabilities */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                Missing Information &amp; Attention Items ({readiness.missing_information.length})
              </h4>
            </div>
            {readiness.missing_information.length > 0 ? (
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                {readiness.missing_information.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold flex-shrink-0">!</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-600 italic">No critical missing information detected!</p>
            )}
          </Card>
        </div>
      )}

      {/* ── OVERDUE TASKS & BUDGET RISKS (IF PRESENT) ──────────────────────── */}
      {readiness && (readiness.overdue_tasks.length > 0 || readiness.budget_risks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overdue Tasks */}
          {readiness.overdue_tasks.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/25 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Overdue Milestones ({readiness.overdue_tasks.length})
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('timeline')}
                  className="text-[11px] text-[var(--primary)] hover:underline font-medium cursor-pointer"
                >
                  Resolve in Timeline →
                </button>
              </div>
              <div className="space-y-1.5">
                {readiness.overdue_tasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs flex items-center justify-between">
                    <span className="font-medium text-[var(--text-primary)] truncate max-w-[220px]">
                      {t.title}
                    </span>
                    <span className="text-[10px] font-mono text-rose-600">
                      Due: {t.due_date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Risks */}
          {readiness.budget_risks.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Financial Risk Alerts ({readiness.budget_risks.length})
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('budget')}
                  className="text-[11px] text-[var(--primary)] hover:underline font-medium cursor-pointer"
                >
                  Open Budget Studio →
                </button>
              </div>
              <div className="space-y-1.5">
                {readiness.budget_risks.map((risk, i) => (
                  <div key={i} className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)]">
                    • {risk}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
