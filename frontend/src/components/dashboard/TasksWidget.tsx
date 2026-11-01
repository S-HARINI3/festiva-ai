import { useState } from 'react';
import { CheckSquare, Square, Plus, Calendar, Flag, Sparkles } from 'lucide-react';
import type { DashboardTask } from '../../types/dashboard';
import { formatDate } from '../../utils/helpers';

interface TasksWidgetProps {
  tasks: DashboardTask[];
  onToggleTask: (taskId: string) => void;
  onOpenCreateTask: () => void;
}

export default function TasksWidget({
  tasks,
  onToggleTask,
  onOpenCreateTask,
}: TasksWidgetProps) {
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-[var(--danger)] bg-[var(--danger-light)] border-[var(--danger)]/30';
      case 'medium':
        return 'text-[var(--warning)] bg-[var(--warning-light)] border-[var(--warning)]/30';
      case 'low':
        return 'text-[var(--text-secondary)] bg-[var(--surface-elevated)] border-[var(--border)]';
    }
  };

  return (
    <div className="festiva-card p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Prioritized Milestones
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {tasks.filter((t) => !t.completed).length} outstanding actions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateTask}
          className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-xs font-semibold text-[var(--primary)] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs">
        {(['pending', 'completed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1 rounded-lg text-center font-semibold capitalize transition-all cursor-pointer ${
              filter === tab
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task Items List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {filteredTasks.length > 0 ? (
          filteredTasks.slice(0, 6).map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                task.completed
                  ? 'bg-[var(--surface-elevated)]/50 border-[var(--border)] opacity-60'
                  : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--primary)]/40'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                className="mt-0.5 text-[var(--primary)] flex-shrink-0 cursor-pointer"
                aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {task.completed ? (
                  <CheckSquare className="w-4 h-4 text-[var(--success)]" />
                ) : (
                  <Square className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--primary)]" />
                )}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-xs font-medium block leading-snug truncate ${
                    task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {task.title}
                </span>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--primary)]" />
                    Due {formatDate(task.dueDate)}
                  </span>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize flex items-center gap-1 ${getPriorityBadge(
                      task.priority
                    )}`}
                  >
                    <Flag className="w-2.5 h-2.5" />
                    {task.priority}
                  </span>

                  <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
                    {task.eventName}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--accent)] opacity-60" />
            <span>
              {filter === 'completed'
                ? 'No completed tasks yet. Mark items off as you plan!'
                : 'All caught up! No pending tasks remaining.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
