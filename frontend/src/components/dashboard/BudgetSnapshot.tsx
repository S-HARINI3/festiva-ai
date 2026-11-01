import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Coins, TrendingUp, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';
import type { SavedEvent } from '../../types/events';
import type { EventMetrics } from '../../types/dashboard';

interface BudgetSnapshotProps {
  events: SavedEvent[];
  metrics: EventMetrics;
  onOpenBudgetStudio: () => void;
}

const LIGHT_PALETTE = ['#713B70', '#D8B477', '#23856D', '#C18432', '#9B639A', '#588399'];
const DARK_PALETTE = ['#C8A8F0', '#E2C18C', '#70D5B0', '#E6A9C4', '#F0C477', '#7AC5EB'];

export default function BudgetSnapshot({
  events,
  metrics,
  onOpenBudgetStudio,
}: BudgetSnapshotProps) {
  const { isDark } = useTheme();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

  // Build aggregate category spending data across events
  const categoryMap: Record<string, { category: string; planned: number; committed: number }> = {};

  events
    .filter((e) => !e.archived)
    .forEach((event) => {
      const breakdown = event.plan_data?.budget_breakdown || [];
      breakdown.forEach((b) => {
        const cat = b.category.length > 12 ? b.category.slice(0, 11) + '..' : b.category;
        if (!categoryMap[cat]) {
          categoryMap[cat] = { category: cat, planned: 0, committed: 0 };
        }
        categoryMap[cat].planned += b.estimated_amount || 0;
        categoryMap[cat].committed += Math.round((b.estimated_amount || 0) * 0.45);
      });
    });

  const chartData = Object.values(categoryMap).slice(0, 6);

  const tooltipStyle = isDark
    ? { background: '#292333', border: '1px solid #41364B', borderRadius: 12, color: '#F7F2FA' }
    : { background: '#FFFFFF', border: '1px solid #E9E3E8', borderRadius: 12, color: '#26232B' };

  return (
    <div className="festiva-card p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Budget Snapshot
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Portfolio allocations &amp; committed reserves
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenBudgetStudio}
          className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
        >
          Open Studio
        </button>
      </div>

      {/* 3 Metric Cards: Planned, Actual Spent, Remaining */}
      <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
        <div>
          <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
            Planned Total
          </span>
          <span className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] truncate block mt-0.5">
            {formatCurrency(metrics.totalPlannedBudget)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-[var(--warning)] uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Committed
          </span>
          <span className="font-display font-bold text-sm sm:text-base text-[var(--warning)] truncate block mt-0.5">
            {formatCurrency(metrics.totalCommittedSpend)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-[var(--success)] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Remaining
          </span>
          <span className="font-display font-bold text-sm sm:text-base text-[var(--success)] truncate block mt-0.5">
            {formatCurrency(metrics.totalRemainingBudget)}
          </span>
        </div>
      </div>

      {/* Recharts BarChart Visualization */}
      <div className="h-44 w-full pt-1">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#41364B' : '#E9E3E8'} opacity={0.5} />
              <XAxis
                dataKey="category"
                tick={{ fill: isDark ? '#B7AFBF' : '#77717D', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: isDark ? '#B7AFBF' : '#77717D', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${(v / 1000).toFixed(0)}k`)}
              />
              <Tooltip
                formatter={(v: any) => [formatCurrency(Number(v)), 'Allocation']}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="planned" radius={[6, 6, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={palette[index % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
            Create an event to view visual budget allocations.
          </div>
        )}
      </div>
    </div>
  );
}
