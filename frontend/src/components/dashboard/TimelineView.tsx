import { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  User,
  DollarSign,
  RefreshCw,
  X,
  List,
  Calendar,
  Link as LinkIcon,
} from 'lucide-react';
import type {
  SavedEvent,
  TimelineTask,
  TaskStatus,
  TaskStage,
  TaskPriority,
} from '../../types/events';
import { STAGE_LABELS, STAGE_DESCRIPTIONS } from '../../types/events';
import { formatDate, formatCurrency, daysUntilEvent } from '../../utils/helpers';
import { Card, Button, Badge } from '../ui';
import {
  getTimelineTasks,
  createTimelineTask,
  updateTimelineTask,
  deleteTimelineTask,
  generateTimelineTasks,
  regenerateTimelineStage,
} from '../../services/api';

interface TimelineViewProps {
  events: SavedEvent[];
  userId?: string;
  onRefreshEvents?: () => void;
}

const ALL_STAGES: TaskStage[] = [
  'initial_planning',
  'budget_venue',
  'vendor_selection',
  'invitations',
  'final_arrangements',
  'event_day',
  'post_event',
];

export default function TimelineView({
  events,
  userId = 'demo-user-001',
  onRefreshEvents,
}: TimelineViewProps) {

  // Active event selection
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return events.length > 0 ? events[0].id : '';
  });

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  const currency = activeEvent?.plan_data?.currency || 'INR';

  // Tasks state
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [loading, setLoading] = useState(false);

  // View Mode: List vs Calendar
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'overdue' | 'due_this_week'>('all');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'priority' | 'title'>('date_asc');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStage, setTaskStage] = useState<TaskStage>('initial_planning');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('not_started');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDependencies, setTaskDependencies] = useState<string[]>([]);
  const [taskEstimatedCost, setTaskEstimatedCost] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskSaving, setTaskSaving] = useState(false);

  // Delete modal
  const [taskToDelete, setTaskToDelete] = useState<TimelineTask | null>(null);
  const [taskDeleting, setTaskDeleting] = useState(false);

  // Stage & Category regeneration modal
  const [isRegenStageOpen, setIsRegenStageOpen] = useState(false);
  const [regenMode, setRegenMode] = useState<'stage' | 'category'>('stage');
  const [regenStage, setRegenStage] = useState<TaskStage>('vendor_selection');
  const [regenCategory, setRegenCategory] = useState<string>('Catering');
  const [regenCustomCategory, setRegenCustomCategory] = useState<string>('');
  const [regenInstructions, setRegenInstructions] = useState('');
  const [stageRegenerating, setStageRegenerating] = useState(false);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    if (activeEvent?.event_date) {
      return new Date(activeEvent.event_date);
    }
    return new Date();
  });

  // Unique categories discovered across event tasks
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    if (set.size === 0) {
      ['Creative Direction', 'Venue', 'Catering', 'Photography', 'Decor', 'Entertainment', 'Invitations', 'Floorplan', 'Logistics', 'Finance'].forEach(c => set.add(c));
    }
    return Array.from(set).sort();
  }, [tasks]);

  // Normalized dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const sevenDaysLater = useMemo(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], []);

  // Fetch tasks when active event changes
  const loadTasks = async () => {
    if (!activeEvent) return;
    setLoading(true);
    try {
      const res = await getTimelineTasks(activeEvent.id, userId);
      setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load timeline tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [activeEvent?.id]);

  // Update calendar month when event date changes
  useEffect(() => {
    if (activeEvent?.event_date) {
      setCalendarMonth(new Date(activeEvent.event_date));
    }
  }, [activeEvent?.event_date]);

  // Compute Task Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const blocked = tasks.filter((t) => t.status === 'blocked').length;

    const overdue = tasks.filter((t) => {
      if (t.status === 'completed') return false;
      return t.is_overdue || t.due_date < todayStr;
    }).length;

    const dueThisWeek = tasks.filter((t) => {
      if (t.status === 'completed') return false;
      return t.due_date >= todayStr && t.due_date <= sevenDaysLater;
    }).length;

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, blocked, overdue, dueThisWeek, percent };
  }, [tasks, todayStr, sevenDaysLater]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Quick Overdue Filter
        if (quickFilter === 'overdue') {
          if (task.status === 'completed' || (!task.is_overdue && task.due_date >= todayStr)) {
            return false;
          }
        }

        // Quick Due This Week Filter
        if (quickFilter === 'due_this_week') {
          if (task.status === 'completed' || task.due_date < todayStr || task.due_date > sevenDaysLater) {
            return false;
          }
        }

        // Stage filter
        if (stageFilter !== 'all' && task.stage !== stageFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && (task.category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;

        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = task.description?.toLowerCase().includes(q);
          const matchesAssignee = task.assignee?.toLowerCase().includes(q);
          const matchesNotes = task.notes?.toLowerCase().includes(q);
          const matchesCategory = task.category?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesAssignee && !matchesNotes && !matchesCategory) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') {
          return a.due_date.localeCompare(b.due_date);
        }
        if (sortBy === 'date_desc') {
          return b.due_date.localeCompare(a.due_date);
        }
        if (sortBy === 'priority') {
          const pOrder = { high: 1, medium: 2, low: 3 };
          return pOrder[a.priority] - pOrder[b.priority];
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [tasks, stageFilter, categoryFilter, statusFilter, priorityFilter, quickFilter, searchQuery, sortBy, todayStr, sevenDaysLater]);

  // Tasks grouped by Stage for List View
  const tasksByStage = useMemo(() => {
    const map: Record<TaskStage, TimelineTask[]> = {
      initial_planning: [],
      budget_venue: [],
      vendor_selection: [],
      invitations: [],
      final_arrangements: [],
      event_day: [],
      post_event: [],
    };

    filteredTasks.forEach((t) => {
      if (map[t.stage]) {
        map[t.stage].push(t);
      } else {
        map.initial_planning.push(t);
      }
    });

    return map;
  }, [filteredTasks]);

  // ── Task Actions ────────────────────────────────────────────────────────────

  const handleToggleComplete = async (task: TimelineTask) => {
    if (!activeEvent) return;
    const newStatus: TaskStatus = task.status === 'completed' ? 'not_started' : 'completed';
    try {
      await updateTimelineTask(activeEvent.id, task.id, { status: newStatus }, userId);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to toggle task status', err);
    }
  };

  const handleStatusChange = async (task: TimelineTask, nextStatus: TaskStatus) => {
    if (!activeEvent) return;
    try {
      await updateTimelineTask(activeEvent.id, task.id, { status: nextStatus }, userId);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleOpenAddTask = (presetStage?: TaskStage) => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskStage(presetStage || 'initial_planning');
    setTaskCategory('General');
    setTaskPriority('medium');
    setTaskDueDate(activeEvent?.event_date || new Date().toISOString().split('T')[0]);
    setTaskStatus('not_started');
    setTaskAssignee('');
    setTaskDependencies([]);
    setTaskEstimatedCost('');
    setTaskNotes('');
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: TimelineTask) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskStage(task.stage);
    setTaskCategory(task.category || 'General');
    setTaskPriority(task.priority);
    setTaskDueDate(task.due_date);
    setTaskStatus(task.status);
    setTaskAssignee(task.assignee || '');
    setTaskDependencies(task.dependencies || []);
    setTaskEstimatedCost(task.estimated_cost !== undefined && task.estimated_cost !== null ? task.estimated_cost.toString() : '');
    setTaskNotes(task.notes || '');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !taskTitle.trim()) return;

    setTaskSaving(true);
    try {
      const parsedCost = taskEstimatedCost ? parseFloat(taskEstimatedCost) : undefined;
      if (parsedCost !== undefined && (isNaN(parsedCost) || parsedCost < 0)) {
        alert('Please specify a valid non-negative estimated cost.');
        setTaskSaving(false);
        return;
      }

      if (editingTask) {
        const res = await updateTimelineTask(
          activeEvent.id,
          editingTask.id,
          {
            title: taskTitle.trim(),
            description: taskDescription.trim(),
            stage: taskStage,
            category: taskCategory.trim() || undefined,
            priority: taskPriority,
            due_date: taskDueDate,
            status: taskStatus,
            assignee: taskAssignee.trim() || undefined,
            dependencies: taskDependencies,
            estimated_cost: parsedCost,
            notes: taskNotes.trim() || undefined,
          },
          userId
        );
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? res.task : t))
        );
      } else {
        const res = await createTimelineTask(
          activeEvent.id,
          {
            title: taskTitle.trim(),
            description: taskDescription.trim(),
            stage: taskStage,
            category: taskCategory.trim() || undefined,
            priority: taskPriority,
            due_date: taskDueDate,
            status: taskStatus,
            assignee: taskAssignee.trim() || undefined,
            dependencies: taskDependencies,
            estimated_cost: parsedCost,
            notes: taskNotes.trim() || undefined,
          },
          userId
        );
        setTasks((prev) => [...prev, res.task]);
      }

      setIsTaskModalOpen(false);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to save task', err);
    } finally {
      setTaskSaving(false);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!activeEvent || !taskToDelete) return;
    setTaskDeleting(true);
    try {
      await deleteTimelineTask(activeEvent.id, taskToDelete.id, userId);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to delete task', err);
    } finally {
      setTaskDeleting(false);
    }
  };

  const handleGenerateAllTasks = async () => {
    if (!activeEvent) return;
    if (
      tasks.length > 0 &&
      !confirm('Re-generating the full checklist will recalculate all task deadlines relative to your event date. Continue?')
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await generateTimelineTasks(activeEvent.id, userId);
      setTasks(res.tasks || []);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to generate tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateConfirm = async () => {
    if (!activeEvent) return;
    setStageRegenerating(true);
    try {
      const targetCat =
        regenCategory === '__custom__'
          ? regenCustomCategory.trim()
          : regenCategory.trim();

      const res = await regenerateTimelineStage(
        activeEvent.id,
        regenMode === 'stage'
          ? { stage: regenStage, instructions: regenInstructions.trim() || undefined }
          : { category: targetCat || 'Catering', instructions: regenInstructions.trim() || undefined },
        undefined,
        userId
      );
      setTasks(res.tasks || []);
      setIsRegenStageOpen(false);
      setRegenInstructions('');
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error('Failed to regenerate stage or category', err);
    } finally {
      setStageRegenerating(false);
    }
  };

  // ── Calendar Calculations ──────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: prevDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const currDate = new Date(year, month, d);
      days.push({
        dateStr: currDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill grid
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        dateStr: nextDate.toISOString().split('T')[0],
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarMonth]);

  const daysUntilActiveEvent = activeEvent?.event_date ? daysUntilEvent(activeEvent.event_date) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Top Bar: Event Selector & Quick Action Bar ─────────────────────── */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                Timeline &amp; Task Checklist
              </h2>
              {metrics.overdue > 0 && (
                <Badge variant="danger" size="sm" className="animate-pulse">
                  {metrics.overdue} Overdue
                </Badge>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Chronological milestones, dependency tracking, stage checklists &amp; calendar schedules
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {events.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] font-semibold hidden sm:inline">
                Celebration:
              </span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.event_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          {/* AI Generate Checklist */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateAllTasks}
            isLoading={loading}
            className="cursor-pointer flex items-center gap-1.5"
            title="Generate AI Checklist based on event date"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">AI Generate Checklist</span>
          </Button>

          {/* Regenerate Stage / Category */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setRegenMode('stage');
              setRegenStage('vendor_selection');
              setIsRegenStageOpen(true);
            }}
            className="cursor-pointer flex items-center gap-1.5"
            title="Regenerate tasks for a specific stage or category without replacing unrelated tasks"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="hidden sm:inline">Regenerate Stage / Category</span>
          </Button>

          {/* Add Task */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddTask()}
            className="cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* ── Active Event Banner & Progress Overview ───────────────────────── */}
      {activeEvent && (
        <Card variant="default" padding="md" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-display font-bold text-base text-[var(--text-primary)]">
                  {activeEvent.event_name}
                </span>
                <Badge variant="accent" size="sm">
                  {daysUntilActiveEvent > 0
                    ? `${daysUntilActiveEvent} Days Remaining`
                    : daysUntilActiveEvent === 0
                    ? 'Celebration is Today! 🎉'
                    : 'Event Completed'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
                  {formatDate(activeEvent.event_date)}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {activeEvent.plan_data?.location || 'Venue'}
                </span>
                <span>·</span>
                <span>{activeEvent.plan_data?.guest_count || 100} Expected Guests</span>
              </div>
            </div>

            {/* Overall Progress Meter */}
            <div className="md:w-64 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-semibold">Checklist Readiness</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {metrics.completed} / {metrics.total} ({metrics.percent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                  style={{ width: `${metrics.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 5 Quick Metrics Tiles (Clickable Quick Filters) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => {
                setQuickFilter('all');
                setStatusFilter('all');
              }}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                quickFilter === 'all' && statusFilter === 'all'
                  ? 'bg-[var(--primary)]/10 border-[var(--primary)] ring-1 ring-[var(--primary)]'
                  : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--primary)]/50'
              }`}
              title="Show all tasks"
            >
              <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Total Tasks</span>
              <span className="font-display font-bold text-lg text-[var(--text-primary)]">{metrics.total}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickFilter('all');
                setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed');
              }}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-emerald-500/50'
              }`}
              title="Filter completed tasks"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Completed</span>
                {statusFilter === 'completed' && <span className="text-[9px] text-emerald-600 font-bold">Active</span>}
              </div>
              <span className="font-display font-bold text-lg text-emerald-600 dark:text-emerald-400">{metrics.completed}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickFilter('all');
                setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress');
              }}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                statusFilter === 'in_progress'
                  ? 'bg-[var(--primary)]/15 border-[var(--primary)] ring-1 ring-[var(--primary)]'
                  : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--primary)]/50'
              }`}
              title="Filter in-progress tasks"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[var(--primary)] block">In Progress</span>
                {statusFilter === 'in_progress' && <span className="text-[9px] text-[var(--primary)] font-bold">Active</span>}
              </div>
              <span className="font-display font-bold text-lg text-[var(--primary)]">{metrics.inProgress}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setQuickFilter(quickFilter === 'overdue' ? 'all' : 'overdue');
              }}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                quickFilter === 'overdue'
                  ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500'
                  : metrics.overdue > 0
                  ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60'
                  : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-rose-500/40'
              }`}
              title="Filter overdue tasks"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Overdue</span>
                {quickFilter === 'overdue' && <span className="text-[9px] text-rose-600 font-bold">Active</span>}
              </div>
              <span className="font-display font-bold text-lg text-rose-600 dark:text-rose-400">{metrics.overdue}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setQuickFilter(quickFilter === 'due_this_week' ? 'all' : 'due_this_week');
              }}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                quickFilter === 'due_this_week'
                  ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500'
                  : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-amber-500/50'
              }`}
              title="Filter upcoming deadlines due this week"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Due This Week</span>
                {quickFilter === 'due_this_week' && <span className="text-[9px] text-amber-600 font-bold">Active</span>}
              </div>
              <span className="font-display font-bold text-lg text-amber-600 dark:text-amber-400">{metrics.dueThisWeek}</span>
            </button>
          </div>
        </Card>
      )}

      {/* ── Filters & Search Control Bar ──────────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search tasks, assignees, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/50 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold outline-none cursor-pointer"
            title="Filter by Stage"
          >
            <option value="all">All Stages (7)</option>
            {ALL_STAGES.map((st) => (
              <option key={st} value={st}>
                {STAGE_LABELS[st]}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold outline-none cursor-pointer"
            title="Filter by Category"
          >
            <option value="all">All Categories ({availableCategories.length})</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold outline-none cursor-pointer"
            title="Filter by Status"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold outline-none cursor-pointer"
            title="Filter by Priority"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Reset Filters Button */}
          {(categoryFilter !== 'all' || stageFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || quickFilter !== 'all' || searchQuery !== '') && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setStageFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
                setQuickFilter('all');
                setSearchQuery('');
              }}
              className="px-2 py-1 rounded-xl text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all cursor-pointer flex items-center gap-1"
              title="Clear all active filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="text-[var(--text-secondary)] font-semibold hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold outline-none cursor-pointer"
          >
            <option value="date_asc">Due Date (Earliest)</option>
            <option value="date_desc">Due Date (Latest)</option>
            <option value="priority">Priority (High to Low)</option>
            <option value="title">Title (A–Z)</option>
          </select>
        </div>
      </div>

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {ALL_STAGES.map((st, sIdx) => {
            const stageTasks = tasksByStage[st];
            if (stageFilter !== 'all' && stageFilter !== st) return null;
            if (stageTasks.length === 0 && (searchQuery || statusFilter !== 'all' || priorityFilter !== 'all')) {
              return null;
            }

            const stageCompleted = stageTasks.filter((t) => t.status === 'completed').length;
            const stagePercent = stageTasks.length > 0 ? Math.round((stageCompleted / stageTasks.length) * 100) : 0;

            return (
              <Card key={st} variant="default" padding="none" className="overflow-hidden space-y-0">
                {/* Stage Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface-elevated)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {sIdx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                          {STAGE_LABELS[st]}
                        </h3>
                        <Badge variant="secondary" size="sm">
                          {stageCompleted}/{stageTasks.length} Completed ({stagePercent}%)
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {STAGE_DESCRIPTIONS[st]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Stage quick add task */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddTask(st)}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface)] border border-[var(--border)] cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Task</span>
                    </button>

                    {/* Stage regenerate */}
                    <button
                      type="button"
                      onClick={() => {
                        setRegenMode('stage');
                        setRegenStage(st);
                        setIsRegenStageOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface)] border border-[var(--border)] cursor-pointer flex items-center gap-1 transition-all"
                      title="Regenerate only this stage's tasks"
                    >
                      <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                      <span>Regenerate Stage</span>
                    </button>
                  </div>
                </div>

                {/* Stage Tasks List */}
                <div className="divide-y divide-[var(--border)]">
                  {stageTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                      No tasks found in this stage matching current filters.
                    </div>
                  ) : (
                    stageTasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      const isBlocked = task.status === 'blocked';
                      const isOverdue = !isCompleted && (task.is_overdue || task.due_date < todayStr);
                      const isDueToday = !isCompleted && task.due_date === todayStr;
                      const isDueThisWeek = !isCompleted && !isOverdue && !isDueToday && task.due_date >= todayStr && task.due_date <= sevenDaysLater;

                      // Resolve predecessor tasks to show explicit prerequisite dependencies
                      const predecessorTasks = (task.dependencies || [])
                        .map((depId) => tasks.find((t) => t.id === depId))
                        .filter(Boolean) as TimelineTask[];
                      const hasUnresolvedDependency = predecessorTasks.some((p) => p.status !== 'completed');

                      return (
                        <div
                          key={task.id}
                          className={`p-4 sm:p-5 transition-colors flex items-start gap-3.5 group ${
                            isCompleted
                              ? 'bg-[var(--surface-elevated)]/20 opacity-75'
                              : isBlocked || hasUnresolvedDependency
                              ? 'border-l-4 border-l-amber-500 bg-amber-500/5'
                              : 'hover:bg-[var(--surface-elevated)]/40'
                          }`}
                        >
                          {/* Toggle Completion Circle */}
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(task)}
                            className="mt-0.5 text-[var(--text-secondary)] hover:text-emerald-500 transition-colors cursor-pointer shrink-0"
                            title={isCompleted ? 'Mark as Not Completed' : 'Mark as Completed'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          {/* Task Content */}
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <h4 className={`text-sm font-bold text-[var(--text-primary)] ${
                                  isCompleted ? 'line-through text-[var(--text-secondary)]' : ''
                                }`}>
                                  {task.title}
                                </h4>

                                {/* Priority Badge */}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  task.priority === 'high'
                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                    : task.priority === 'medium'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                    : 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/20'
                                }`}>
                                  {task.priority.toUpperCase()}
                                </span>

                                {/* Status Badge */}
                                <select
                                  value={task.status}
                                  onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border outline-none cursor-pointer ${
                                    task.status === 'completed'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                      : task.status === 'in_progress'
                                      ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20'
                                      : task.status === 'blocked'
                                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20'
                                      : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]'
                                  }`}
                                >
                                  <option value="not_started">Not Started</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="blocked">Blocked</option>
                                </select>
                              </div>

                              {/* Due Date & Deadlines Badges */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-xs font-mono font-semibold flex items-center gap-1 ${
                                  isOverdue
                                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                                    : isDueToday
                                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                                    : 'text-[var(--text-secondary)]'
                                }`}>
                                  <CalendarIcon className="w-3.5 h-3.5" />
                                  {formatDate(task.due_date)}
                                </span>
                                {isOverdue && (
                                  <Badge variant="danger" size="sm" className="font-bold">
                                    Overdue
                                  </Badge>
                                )}
                                {isDueToday && (
                                  <Badge variant="warning" size="sm" className="font-bold">
                                    Due Today
                                  </Badge>
                                )}
                                {isDueThisWeek && (
                                  <Badge variant="warning" size="sm">
                                    Due Soon
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            {task.description && (
                              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            {/* Overdue AI Alternative Banner */}
                            {isOverdue && (
                              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200">
                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Overdue Deadline Notice:</span>{' '}
                                  {task.overdue_alternative ||
                                    'This milestone passed relative to the event date. Expedited completion recommended within 48-72 hours.'}
                                </div>
                              </div>
                            )}

                            {/* Unresolved Predecessor Warning Banner */}
                            {hasUnresolvedDependency && (
                              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>
                                  <strong className="font-bold">Dependency Warning:</strong> One or more preceding tasks must be completed before executing this milestone.
                                </span>
                              </div>
                            )}

                            {/* Meta Tags: Category, Assignee, Cost, Notes */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[var(--text-secondary)]">
                              {task.category && (
                                <button
                                  type="button"
                                  onClick={() => setCategoryFilter(task.category || 'all')}
                                  className="px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] hover:border-[var(--primary)] border border-[var(--border)] font-medium cursor-pointer transition-colors"
                                  title={`Filter by category "${task.category}"`}
                                >
                                  {task.category}
                                </button>
                              )}

                              {task.assignee && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] font-medium">
                                  <User className="w-3 h-3 text-[var(--primary)]" />
                                  {task.assignee}
                                </span>
                              )}

                              {task.estimated_cost !== undefined && task.estimated_cost !== null && task.estimated_cost > 0 && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] font-mono font-medium">
                                  <DollarSign className="w-3 h-3 text-[var(--accent)]" />
                                  Est. {formatCurrency(task.estimated_cost, currency)}
                                </span>
                              )}

                              {task.notes && (
                                <span className="italic truncate max-w-xs text-[var(--text-secondary)]/80">
                                  &quot;{task.notes}&quot;
                                </span>
                              )}
                            </div>

                            {/* Explicit Predecessor Tasks Display */}
                            {predecessorTasks.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] flex items-center gap-1">
                                  <LinkIcon className="w-3 h-3 text-[var(--primary)]" />
                                  Preceding Milestones:
                                </span>
                                {predecessorTasks.map((pred) => {
                                  const predDone = pred.status === 'completed';
                                  return (
                                    <span
                                      key={pred.id}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                        predDone
                                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                      }`}
                                      title={`Predecessor task: ${pred.title} (${pred.status})`}
                                    >
                                      <span>&ldquo;{pred.title}&rdquo;</span>
                                      <span className="font-bold">[{predDone ? '✓ Done' : '⚠️ Pending'}]</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: Edit, Delete */}
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTask(task)}
                              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] cursor-pointer transition-colors"
                              title="Edit Task Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaskToDelete(task)}
                              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--surface-elevated)] cursor-pointer transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── CALENDAR VIEW ─────────────────────────────────────────────────── */}
      {viewMode === 'calendar' && (
        <Card variant="default" padding="md" className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
                }}
                className="p-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeEvent?.event_date) {
                    setCalendarMonth(new Date(activeEvent.event_date));
                  } else {
                    setCalendarMonth(new Date());
                  }
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] cursor-pointer"
              >
                Event Month
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
                }}
                className="p-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Day Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] pb-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const dayTasks = tasks.filter((t) => t.due_date === cell.dateStr);
              const isEventDay = activeEvent?.event_date === cell.dateStr;
              const isToday = todayStr === cell.dateStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-1.5 rounded-xl border transition-all flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? 'bg-[var(--surface)] border-[var(--border)]'
                      : 'bg-[var(--surface-elevated)]/30 border-[var(--border)]/40 opacity-40'
                  } ${isToday ? 'ring-2 ring-[var(--primary)]' : ''} ${
                    isEventDay ? 'bg-[var(--primary-light)]/20 border-[var(--primary)]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-mono font-bold ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[11px]'
                        : 'text-[var(--text-secondary)]'
                    }`}>
                      {cell.dayNum}
                    </span>

                    {isEventDay && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--primary)] text-white shadow-xs">
                        Event Day 🎉
                      </span>
                    )}
                  </div>

                  {/* Tasks on this day */}
                  <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-24">
                    {dayTasks.map((t) => {
                      const isCompleted = t.status === 'completed';
                      const isOverdue = !isCompleted && t.due_date < todayStr;
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleOpenEditTask(t)}
                          className={`p-1 rounded text-[10px] truncate font-medium border cursor-pointer hover:shadow-xs transition-all ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 line-through'
                              : isOverdue
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold'
                              : 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border-[var(--border)]'
                          }`}
                          title={`${t.title} (${t.status})`}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Add / Edit Task Modal ─────────────────────────────────────────── */}
      {isTaskModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-modal p-6 space-y-5 text-[var(--text-primary)] my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                {editingTask ? 'Edit Timeline Task' : 'Add New Timeline Task'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule rehearsal walkthrough with sound crew"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Description / Actionable Steps
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed instructions or specifications for this task"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Timeline Stage *
                  </label>
                  <select
                    value={taskStage}
                    onChange={(e) => setTaskStage(e.target.value as TaskStage)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] cursor-pointer"
                  >
                    {ALL_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {STAGE_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Venue, Catering, Decor"
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Priority *
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] cursor-pointer"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Status *
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] cursor-pointer"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Assignee (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Planner, Sophia (Host)"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Estimated Cost ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={taskEstimatedCost}
                    onChange={(e) => setTaskEstimatedCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] font-mono"
                  />
                </div>
              </div>

              {/* Predecessor Dependencies */}
              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Predecessor Task Dependencies (Must precede this task)
                </label>
                <div className="max-h-28 overflow-y-auto p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-1">
                  {tasks.filter((t) => !editingTask || t.id !== editingTask.id).length === 0 ? (
                    <span className="text-[11px] text-[var(--text-secondary)]">No other tasks to link.</span>
                  ) : (
                    tasks
                      .filter((t) => !editingTask || t.id !== editingTask.id)
                      .map((otherTask) => {
                        const isChecked = taskDependencies.includes(otherTask.id);
                        return (
                          <label
                            key={otherTask.id}
                            className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer hover:bg-[var(--surface)] p-1 rounded-lg"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTaskDependencies([...taskDependencies, otherTask.id]);
                                } else {
                                  setTaskDependencies(taskDependencies.filter((id) => id !== otherTask.id));
                                }
                              }}
                              className="rounded border-[var(--border)] text-[var(--primary)]"
                            />
                            <span className="truncate">{otherTask.title}</span>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Notes / Vendor Reference
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Contract signed ref #104"
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={taskSaving}
                  className="cursor-pointer"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Task Confirmation Modal ───────────────────────────────── */}
      {taskToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-modal p-6 space-y-4 text-[var(--text-primary)]">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                Delete Timeline Task?
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Are you sure you want to remove &quot;{taskToDelete.title}&quot;? This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTaskToDelete(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteTask}
                isLoading={taskDeleting}
                className="cursor-pointer"
              >
                Delete Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Regenerate Stage or Category Modal ─────────────────────────────── */}
      {isRegenStageOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-modal p-6 space-y-5 text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Regenerate Stage or Category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegenStageOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-xs text-[var(--text-secondary)]">
                Festiva AI will regenerate tasks for your selected {regenMode} based on your celebration date and preferences. <strong>All tasks and progress in unrelated {regenMode === 'stage' ? 'stages' : 'categories'} will remain completely untouched.</strong>
              </p>

              {/* Toggle Mode: By Stage vs By Category */}
              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">
                  Regeneration Scope *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setRegenMode('stage')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      regenMode === 'stage'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    By Timeline Stage
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegenMode('category')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      regenMode === 'category'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    By Task Category
                  </button>
                </div>
              </div>

              {regenMode === 'stage' ? (
                <div>
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Select Stage to Regenerate *
                  </label>
                  <select
                    value={regenStage}
                    onChange={(e) => setRegenStage(e.target.value as TaskStage)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] cursor-pointer"
                  >
                    {ALL_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {STAGE_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                    Select Category to Regenerate *
                  </label>
                  <select
                    value={regenCategory}
                    onChange={(e) => setRegenCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] cursor-pointer"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Enter Custom Category...</option>
                  </select>

                  {regenCategory === '__custom__' && (
                    <input
                      type="text"
                      placeholder="e.g. Cocktail Bar, Transportation, Lighting"
                      value={regenCustomCategory}
                      onChange={(e) => setRegenCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Custom AI Focus / Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Prioritize organic floral installations, live cocktail bar, and expedited invitation delivery"
                  value={regenInstructions}
                  onChange={(e) => setRegenInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRegenStageOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleRegenerateConfirm}
                  isLoading={stageRegenerating}
                  className="cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Regenerate {regenMode === 'stage' ? 'Stage' : 'Category'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
