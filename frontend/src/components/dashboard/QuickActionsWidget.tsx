import {
  PlusCircle,
  Store,
  Users,
  CheckSquare,
  Coins,
  Bot,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardTab } from '../../types/dashboard';

interface QuickActionsWidgetProps {
  onOpenAddVendor: () => void;
  onOpenAddGuest: () => void;
  onOpenCreateTask: () => void;
  onNavigateTab: (tab: DashboardTab) => void;
}

export default function QuickActionsWidget({
  onOpenAddVendor,
  onOpenAddGuest,
  onOpenCreateTask,
  onNavigateTab,
}: QuickActionsWidgetProps) {
  const actions = [
    {
      label: 'Plan New Event',
      desc: 'AI Blueprint Generator',
      icon: PlusCircle,
      link: '/events/new',
      primary: true,
    },
    {
      label: 'Add a Vendor',
      desc: 'Checklist & Contracts',
      icon: Store,
      onClick: onOpenAddVendor,
    },
    {
      label: 'Add a Guest',
      desc: 'Headcounts & Dietary',
      icon: Users,
      onClick: onOpenAddGuest,
    },
    {
      label: 'Create a Task',
      desc: 'Milestones & Deadlines',
      icon: CheckSquare,
      onClick: onOpenCreateTask,
    },
    {
      label: 'Review Budget',
      desc: 'Allocations & Reserves',
      icon: Coins,
      onClick: () => onNavigateTab('budget'),
    },
    {
      label: 'Open AI Copilot',
      desc: 'Etiquette & Creative Advice',
      icon: Bot,
      onClick: () => onNavigateTab('copilot'),
    },
  ];

  return (
    <div className="festiva-card p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-card space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
          <Zap className="w-4 h-4" />
        </div>
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
          Quick Studio Actions
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;

          if (act.link) {
            return (
              <Link
                key={act.label}
                to={act.link}
                className="p-3 rounded-xl border border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all flex flex-col items-center text-center shadow-xs cursor-pointer group"
              >
                <Icon className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold leading-tight block">{act.label}</span>
                <span className="text-[10px] opacity-80 mt-0.5 hidden sm:block">{act.desc}</span>
              </Link>
            );
          }

          return (
            <button
              key={act.label}
              type="button"
              onClick={act.onClick}
              className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--surface)] hover:border-[var(--primary)] text-[var(--text-primary)] transition-all flex flex-col items-center text-center cursor-pointer group"
            >
              <Icon className="w-5 h-5 mb-1.5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold leading-tight block truncate max-w-full">
                {act.label}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 hidden sm:block truncate max-w-full">
                {act.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
