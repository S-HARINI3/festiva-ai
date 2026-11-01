import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  MoreVertical,
  Eye,
  Edit2,
  Copy,
  Archive,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SavedEvent } from '../../types/events';
import type { DashboardTask } from '../../types/dashboard';
import { EVENT_TYPE_EMOJIS, EVENT_TYPE_LABELS } from '../../types/events';
import { formatCurrency, formatDate, daysUntilEvent } from '../../utils/helpers';
import { calculateEventReadiness } from '../../utils/dashboardHelpers';

interface EventCardProps {
  event: SavedEvent;
  tasks: DashboardTask[];
  viewMode?: 'grid' | 'list';
  onEdit: (event: SavedEvent) => void;
  onDuplicate: (event: SavedEvent) => void;
  onArchive: (event: SavedEvent) => void;
  onDelete: (event: SavedEvent) => void;
}

export default function EventCard({
  event,
  tasks,
  viewMode = 'grid',
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: EventCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const days = daysUntilEvent(event.event_date);
  const isPast = days < 0;
  const isToday = days === 0;

  // Derive metrics
  const readiness = calculateEventReadiness(event, tasks);
  const eventTasks = tasks.filter((t) => t.eventId === event.id);
  const completedTasks = eventTasks.filter((t) => t.completed).length;
  const totalTasks = Math.max(eventTasks.length, 6); // at least 6 standard milestone tasks

  const totalBudget = event.plan_data?.total_estimated_budget || 0;
  const currency = event.plan_data?.currency || 'INR';

  // Readiness color
  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-[var(--success)] bg-[var(--success-light)] border-[var(--success)]/30';
    if (score >= 50) return 'text-[var(--warning)] bg-[var(--warning-light)] border-[var(--warning)]/30';
    return 'text-[var(--danger)] bg-[var(--danger-light)] border-[var(--danger)]/30';
  };

  return (
    <div
      className={`festiva-card relative flex flex-col justify-between p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-card hover:border-[var(--primary)]/40 transition-all group ${
        event.archived ? 'opacity-70 grayscale-[20%]' : ''
      } ${viewMode === 'list' ? 'sm:flex-row sm:items-center gap-4' : 'gap-4'}`}
    >
      {/* Top Banner / Event Meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl p-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex-shrink-0">
              {EVENT_TYPE_EMOJIS[event.event_type] || '🎉'}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)] leading-tight truncate">
                  {event.event_name}
                </h3>
                {event.demo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--accent)]/20 text-[var(--accent-text)] border border-[var(--accent)]/40 flex-shrink-0">
                    Sample Blueprint
                  </span>
                )}
                {event.archived && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--text-muted)]/15 text-[var(--text-secondary)] border border-[var(--border)] flex-shrink-0">
                    Archived
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider block mt-0.5">
                {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
              </span>
            </div>
          </div>

          {/* Countdown & Readiness Badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getReadinessColor(
                readiness
              )}`}
              title="Celebration Readiness Score based on tasks, vendor confirmations & budget"
            >
              {readiness}% Ready
            </span>

            {/* Overflow Action Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
                aria-label="Event options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-dialog py-1 z-50 text-xs">
                    <Link
                      to={`/events/${event.id}`}
                      state={{ plan: event.plan_data }}
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>View Blueprint</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(event);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors text-left"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDuplicate(event);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors text-left"
                    >
                      <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      <span>Duplicate Plan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onArchive(event);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors text-left"
                    >
                      <Archive className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      <span>{event.archived ? 'Unarchive' : 'Archive Plan'}</span>
                    </button>

                    <div className="border-t border-[var(--border)] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(event);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Plan</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] my-3">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
            <span className="truncate">{formatDate(event.event_date)}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
            <span className="truncate">{event.plan_data?.location || 'Location set'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
            <span>{event.plan_data?.guest_count || 0} guests</span>
          </div>

          <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            <DollarSign className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
            <span>{formatCurrency(totalBudget, currency)}</span>
          </div>
        </div>

        {/* Progress Bars: Tasks & Budget */}
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          {/* Task Completion Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />
                Task Milestones
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {completedTasks}/{totalTasks}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[var(--success)] transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (completedTasks / totalTasks) * 100)}%` }}
              />
            </div>
          </div>

          {/* Countdown Tag */}
          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[var(--primary)]" />
              {isToday ? (
                <strong className="text-[var(--accent)]">Happening Today!</strong>
              ) : isPast ? (
                <span>Completed celebration</span>
              ) : (
                <span><strong>{days}</strong> days until celebration</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Open Action */}
      <div
        className={`pt-3 border-t border-[var(--border)] flex items-center gap-2 ${
          viewMode === 'list' ? 'sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4 sm:flex-col sm:w-40' : ''
        }`}
      >
        <Link
          to={`/events/${event.id}`}
          state={{ plan: event.plan_data }}
          className="flex-1 w-full"
        >
          <button
            type="button"
            className="w-full py-2 px-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Blueprint</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
