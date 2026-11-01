import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckSquare,
  Sparkles,
  PlusCircle,
  Grid,
  List,
  Filter,
  ArrowUpDown,
  Trash2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserEvents, deleteEvent, saveEventPlan, updateEvent, resetDemoData } from '../services/api';
import type { SavedEvent } from '../types/events';
import type { DashboardTab, DashboardTask, DashboardGuest, DashboardVendor } from '../types/dashboard';
import {
  calculateDashboardMetrics,
  deriveInitialTasks,
  generateAiInsight,
} from '../utils/dashboardHelpers';
import { daysUntilEvent } from '../utils/helpers';

// Subcomponents & UI
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import EventCard from '../components/dashboard/EventCard';
import BudgetSnapshot from '../components/dashboard/BudgetSnapshot';
import TasksWidget from '../components/dashboard/TasksWidget';
import AIInsightWidget from '../components/dashboard/AIInsightWidget';
import QuickActionsWidget from '../components/dashboard/QuickActionsWidget';
import EventReadinessWidget from '../components/dashboard/EventReadinessWidget';

// Views
import AICopilotView from '../components/dashboard/AICopilotView';
import BudgetStudioView from '../components/dashboard/BudgetStudioView';
import TimelineView from '../components/dashboard/TimelineView';
import GuestsView from '../components/dashboard/GuestsView';
import VendorsView from '../components/dashboard/VendorsView';
import MoodboardsView from '../components/dashboard/MoodboardsView';
import SettingsView from '../components/dashboard/SettingsView';

// Modals
import AddVendorModal from '../components/dashboard/AddVendorModal';
import AddGuestModal from '../components/dashboard/AddGuestModal';
import CreateTaskModal from '../components/dashboard/CreateTaskModal';
import EditEventModal from '../components/dashboard/EditEventModal';
import { Card, Button, Dialog, SkeletonCard, EmptyState, useToast, CelebrationRibbon } from '../components/ui';

export default function DashboardPage() {
  const { user, isDemoMode } = useAuth();
  const { success, error: toastError } = useToast();

  // Navigation & Layout State
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const fromParam = searchParams.get('tab');
    if (fromParam && ['overview', 'events', 'copilot', 'budget', 'timeline', 'guests', 'vendors', 'moodboards', 'settings'].includes(fromParam)) {
      return fromParam as DashboardTab;
    }
    const fromStorage = sessionStorage.getItem('festiva_active_tab');
    if (fromStorage && ['overview', 'events', 'copilot', 'budget', 'timeline', 'guests', 'vendors', 'moodboards', 'settings'].includes(fromStorage)) {
      sessionStorage.removeItem('festiva_active_tab');
      return fromStorage as DashboardTab;
    }
    return 'overview';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data State
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [guests, setGuests] = useState<DashboardGuest[]>([]);
  const [vendors, setVendors] = useState<DashboardVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter & Search State
  const [selectedEventId, setSelectedEventId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'past' | 'archived'>('active');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'budget_desc' | 'name_asc'>('date_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<SavedEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<SavedEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  const handleResetDemo = async () => {
    setIsResettingDemo(true);
    try {
      await resetDemoData();
      localStorage.removeItem('festiva_dashboard_tasks');
      await fetchEvents();
      success('Demo data restored to pristine state with sample wedding and summit plans!');
      setIsResetModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to reset demo data.');
    } finally {
      setIsResettingDemo(false);
    }
  };

  // ── Load Events & Seed Tasks ───────────────────────────────────────────────
  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getUserEvents(user.id);
      const fetchedEvents = (data.events || []).map((e) => ({
        ...e,
        archived: e.archived || false,
        demo: e.demo || isDemoMode,
      }));
      setEvents(fetchedEvents);

      // Hydrate or initialize tasks
      const savedTasksStr = localStorage.getItem('festiva_dashboard_tasks');
      if (savedTasksStr) {
        try {
          setTasks(JSON.parse(savedTasksStr));
        } catch {
          const initial = deriveInitialTasks(fetchedEvents);
          setTasks(initial);
          localStorage.setItem('festiva_dashboard_tasks', JSON.stringify(initial));
        }
      } else {
        const initial = deriveInitialTasks(fetchedEvents);
        setTasks(initial);
        localStorage.setItem('festiva_dashboard_tasks', JSON.stringify(initial));
      }

      // Hydrate or derive vendors
      const derivedVendors: DashboardVendor[] = [];
      fetchedEvents.forEach((ev) => {
        (ev.plan_data?.vendor_checklist || []).forEach((v, vIdx) => {
          derivedVendors.push({
            id: `vendor-${ev.id}-${vIdx}`,
            eventId: ev.id,
            eventName: ev.event_name,
            category: v.category,
            vendorName: v.vendor_name,
            estimatedCost: v.estimated_cost,
            status: v.status,
            notes: v.notes,
          });
        });
      });
      setVendors(derivedVendors);

      // Seed initial sample guests if empty
      const savedGuestsStr = localStorage.getItem('festiva_dashboard_guests');
      if (savedGuestsStr) {
        try {
          setGuests(JSON.parse(savedGuestsStr));
        } catch {
          setGuests([]);
        }
      } else if (fetchedEvents.length > 0) {
        const initialGuests: DashboardGuest[] = [
          {
            id: 'guest-1',
            eventId: fetchedEvents[0].id,
            eventName: fetchedEvents[0].event_name,
            name: 'Ananya & Kabir Malhotra',
            adults: 2,
            children: 1,
            dietary: ['Pure Vegetarian', 'Jain Friendly'],
            accessibility: ['Step-Free Access Throughout'],
            isVip: true,
            rsvpStatus: 'confirmed',
          },
          {
            id: 'guest-2',
            eventId: fetchedEvents[0].id,
            eventName: fetchedEvents[0].event_name,
            name: 'Dr. Rajesh & Sunita Verma',
            adults: 2,
            children: 0,
            dietary: ['Pure Vegetarian'],
            accessibility: ['Senior Assistance'],
            isVip: true,
            rsvpStatus: 'confirmed',
          },
          {
            id: 'guest-3',
            eventId: fetchedEvents[0].id,
            eventName: fetchedEvents[0].event_name,
            name: 'The Kapoor Family',
            adults: 4,
            children: 2,
            dietary: ['Nut Allergy'],
            accessibility: [],
            isVip: false,
            rsvpStatus: 'tentative',
          },
        ];
        setGuests(initialGuests);
        localStorage.setItem('festiva_dashboard_guests', JSON.stringify(initialGuests));
      }
    } catch (err: any) {
      setLoadError(err.message || 'Could not connect to celebration store.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  // Derived Metrics
  const metrics = useMemo(() => calculateDashboardMetrics(events, tasks), [events, tasks]);
  const aiInsight = useMemo(() => generateAiInsight(events, tasks), [events, tasks]);


  // ── Event Operations (Edit, Duplicate, Archive, Delete) ───────────────────
  const handleEditSave = async (updated: {
    eventId: string;
    eventName: string;
    eventDate: string;
    location: string;
    guestCount: number;
  }) => {
    if (!user) return;
    const target = events.find((e) => e.id === updated.eventId);
    if (!target) return;

    const updatedPlan = {
      ...target.plan_data,
      event_name: updated.eventName,
      event_date: updated.eventDate,
      location: updated.location,
      guest_count: updated.guestCount,
    };

    await updateEvent(updated.eventId, user.id, {
      event_name: updated.eventName,
      event_date: updated.eventDate,
      plan_data: updatedPlan,
    });

    setEvents((prev) =>
      prev.map((e) =>
        e.id === updated.eventId
          ? {
              ...e,
              event_name: updated.eventName,
              event_date: updated.eventDate,
              plan_data: updatedPlan,
            }
          : e
      )
    );
    success(`Updated details for "${updated.eventName}".`);
  };

  const handleDuplicate = async (event: SavedEvent) => {
    if (!user) return;
    const newId = `dup-${Date.now()}`;
    const duplicatedPlan = {
      ...event.plan_data,
      event_id: newId,
      event_name: `${event.event_name} (Copy)`,
    };

    try {
      const res = await saveEventPlan(user.id, duplicatedPlan as any);
      if (res && res.event) {
        setEvents((prev) => [res.event, ...prev]);
        success(`Duplicated "${event.event_name}" successfully.`);
      }
    } catch {
      toastError('Could not duplicate event plan.');
    }
  };

  const handleArchiveToggle = async (event: SavedEvent) => {
    if (!user) return;
    const nextArchived = !event.archived;
    try {
      await updateEvent(event.id, user.id, { archived: nextArchived });
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, archived: nextArchived } : e))
      );
      success(
        nextArchived
          ? `Archived "${event.event_name}". You can view it in the Archived tab.`
          : `Restored "${event.event_name}" to active celebrations.`
      );
    } catch {
      toastError('Could not update archive status.');
    }
  };

  const confirmDelete = async () => {
    if (!user || !eventToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEvent(eventToDelete.id, user.id);
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setTasks((prev) => prev.filter((t) => t.eventId !== eventToDelete.id));
      success(`"${eventToDelete.event_name}" was successfully removed.`);
      setEventToDelete(null);
    } catch {
      toastError('Could not delete the celebration plan.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Task, Vendor, and Guest Operations ────────────────────────────────────
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    localStorage.setItem('festiva_dashboard_tasks', JSON.stringify(updated));
  };

  const handleCreateTask = (taskData: {
    eventId: string;
    title: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    category?: string;
  }) => {
    const ev = events.find((e) => e.id === taskData.eventId);
    const newTask: DashboardTask = {
      id: `task-${Date.now()}`,
      eventId: taskData.eventId,
      eventName: ev?.event_name || 'Celebration',
      title: taskData.title,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      completed: false,
      category: taskData.category,
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    localStorage.setItem('festiva_dashboard_tasks', JSON.stringify(updated));
    success('Milestone created and added to priority checklist!');
  };

  const handleAddVendor = (vendorData: {
    eventId: string;
    category: string;
    vendorName: string;
    estimatedCost: number;
    status: 'pending' | 'contacted' | 'booked' | 'confirmed';
    notes?: string;
  }) => {
    const ev = events.find((e) => e.id === vendorData.eventId);
    const newVendor: DashboardVendor = {
      id: `vendor-${Date.now()}`,
      eventId: vendorData.eventId,
      eventName: ev?.event_name || 'Celebration',
      category: vendorData.category,
      vendorName: vendorData.vendorName,
      estimatedCost: vendorData.estimatedCost,
      status: vendorData.status,
      notes: vendorData.notes,
    };
    setVendors((prev) => [newVendor, ...prev]);
    success(`Added vendor "${vendorData.vendorName}" to ${ev?.event_name || 'celebration'}!`);
  };

  const handleAddGuest = (guestData: {
    eventId: string;
    name: string;
    adults: number;
    children: number;
    dietary: string[];
    accessibility: string[];
    isVip: boolean;
    rsvpStatus: 'confirmed' | 'tentative' | 'declined';
  }) => {
    const ev = events.find((e) => e.id === guestData.eventId);
    const newGuest: DashboardGuest = {
      id: `guest-${Date.now()}`,
      eventId: guestData.eventId,
      eventName: ev?.event_name || 'Celebration',
      name: guestData.name,
      adults: guestData.adults,
      children: guestData.children,
      dietary: guestData.dietary,
      accessibility: guestData.accessibility,
      isVip: guestData.isVip,
      rsvpStatus: guestData.rsvpStatus,
    };
    const updated = [newGuest, ...guests];
    setGuests(updated);
    localStorage.setItem('festiva_dashboard_guests', JSON.stringify(updated));
    success(`Registered guest party "${guestData.name}"!`);
  };

  const handleUpdateVendorStatus = (vendorId: string, status: DashboardVendor['status']) => {
    setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, status } : v)));
    success('Updated vendor booking pipeline status.');
  };

  // ── Filtered and Sorted Events for Overview & My Events ───────────────────
  const displayedEvents = useMemo(() => {
    let list = [...events];

    // Status filter
    if (statusFilter === 'active') {
      list = list.filter((e) => !e.archived);
    } else if (statusFilter === 'upcoming') {
      list = list.filter((e) => !e.archived && daysUntilEvent(e.event_date) >= 0);
    } else if (statusFilter === 'past') {
      list = list.filter((e) => !e.archived && daysUntilEvent(e.event_date) < 0);
    } else if (statusFilter === 'archived') {
      list = list.filter((e) => e.archived);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((e) => e.event_type === categoryFilter);
    }

    // Global selected event switcher
    if (selectedEventId !== 'all') {
      list = list.filter((e) => e.id === selectedEventId);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.event_name.toLowerCase().includes(q) ||
          e.event_type.toLowerCase().includes(q) ||
          (e.plan_data?.location || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      if (sortBy === 'date_desc') return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      if (sortBy === 'budget_desc') {
        return (b.plan_data?.total_estimated_budget || 0) - (a.plan_data?.total_estimated_budget || 0);
      }
      return a.event_name.localeCompare(b.event_name);
    });

    return list;
  }, [events, statusFilter, categoryFilter, selectedEventId, searchQuery, sortBy]);

  // Friendly Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = user?.full_name ? user.full_name.split(' ')[0] : 'Celebration Planner';
    return `${timeGreeting}, ${name}`;
  }, [user]);

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-250 flex">
      {/* ── Collapsible Left Sidebar ── */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        eventCount={metrics.totalActiveEvents}
        upcomingCount={metrics.upcomingEvents}
      />

      {/* ── Main Content Area ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-250 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Compact Top Navigation */}
        <TopNav
          activeTab={activeTab}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          collapsed={sidebarCollapsed}
          events={events}
          selectedEventId={selectedEventId}
          onSelectEventId={setSelectedEventId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenResetDemo={() => setIsResetModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {loadError && (
            <div className="p-4 rounded-2xl bg-[var(--danger-light)] border border-[var(--danger)]/30 text-[var(--danger)] text-xs flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loadError}
              </span>
              <Button size="sm" variant="danger" onClick={fetchEvents}>
                Retry
              </Button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              1. OVERVIEW VIEW
              ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* SECTION A: WELCOME SECTION */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-soft"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                      {greeting}
                    </h2>
                    <CelebrationRibbon variant="accent" />
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                    {metrics.totalActiveEvents > 0
                      ? `You have ${metrics.totalActiveEvents} celebrations in active production, with ${metrics.upcomingEvents} upcoming gathering${metrics.upcomingEvents === 1 ? '' : 's'}.`
                      : 'Welcome to your digital celebration studio. Plan your first event with AI in 2 minutes.'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link to="/events/new">
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={<PlusCircle className="w-4 h-4" />}
                      className="shadow-card"
                    >
                      Create New Event
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* SECTION B: EVENT SUMMARY (Derived Metrics) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
              >
                {/* 1. Total Active Events */}
                <Card variant="default" padding="sm" className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Total Active Events
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="font-display font-bold text-2xl text-[var(--text-primary)]">
                    {metrics.totalActiveEvents}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    {isDemoMode ? 'Sample records in demo mode' : 'Active user portfolio'}
                  </span>
                </Card>

                {/* 2. Upcoming Events */}
                <Card variant="default" padding="sm" className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Upcoming Events
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="font-display font-bold text-2xl text-[var(--text-primary)]">
                    {metrics.upcomingEvents}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    Future celebration dates
                  </span>
                </Card>

                {/* 3. Outstanding Tasks */}
                <Card variant="default" padding="sm" className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Outstanding Tasks
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[var(--warning-light)] text-[var(--warning)] flex items-center justify-center">
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="font-display font-bold text-2xl text-[var(--text-primary)]">
                    {metrics.outstandingTasks}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    Pending planning milestones
                  </span>
                </Card>

                {/* 4. Average Readiness Score */}
                <Card variant="default" padding="sm" className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Average Readiness
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[var(--success-light)] text-[var(--success)] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="font-display font-bold text-2xl text-[var(--success)]">
                    {metrics.averageReadinessScore}%
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden mt-1">
                    <div
                      className="h-full bg-[var(--success)] rounded-full transition-all duration-700"
                      style={{ width: `${metrics.averageReadinessScore}%` }}
                    />
                  </div>
                </Card>
              </motion.div>

              {/* SECTION: TRANSPARENT EVENT READINESS & NEXT BEST MOVE */}
              <EventReadinessWidget
                events={displayedEvents}
                selectedEventId={selectedEventId}
                userId={user?.id || 'demo-user-001'}
                onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
                onSelectEvent={setSelectedEventId}
              />

              {/* SECTION F: AI INSIGHT */}
              <AIInsightWidget
                headline={aiInsight.headline}
                recommendation={aiInsight.recommendation}
                actionText={aiInsight.actionText}
                actionTab={aiInsight.actionTab}
                onNavigateTab={setActiveTab}
              />

              {/* SECTION G: QUICK ACTIONS */}
              <QuickActionsWidget
                onOpenAddVendor={() => setIsAddVendorOpen(true)}
                onOpenAddGuest={() => setIsAddGuestOpen(true)}
                onOpenCreateTask={() => setIsCreateTaskOpen(true)}
                onNavigateTab={setActiveTab}
              />

              {/* SECTION C & D & E: 2-COLUMN GRID (Events & Widgets) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: SECTION C - UPCOMING EVENTS */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                        Upcoming Celebrations
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] font-semibold text-[var(--text-secondary)]">
                        {displayedEvents.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] cursor-pointer"
                        aria-label="Toggle view mode"
                      >
                        {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                      </button>

                      <Link
                        to="/events/new"
                        className="text-xs font-semibold text-[var(--primary)] hover:underline"
                      >
                        + New Plan
                      </Link>
                    </div>
                  </div>

                  {/* Events Grid or Empty State */}
                  {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[1, 2].map((i) => (
                        <SkeletonCard key={i} />
                      ))}
                    </div>
                  ) : displayedEvents.length > 0 ? (
                    <div
                      className={`grid gap-4 ${
                        viewMode === 'grid' ? 'sm:grid-cols-2' : 'grid-cols-1'
                      }`}
                    >
                      {displayedEvents.slice(0, 4).map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          tasks={tasks}
                          viewMode={viewMode}
                          onEdit={(e) => setEventToEdit(e)}
                          onDuplicate={handleDuplicate}
                          onArchive={handleArchiveToggle}
                          onDelete={(e) => setEventToDelete(e)}
                        />
                      ))}
                    </div>
                  ) : (
                    /* EMPTY STATE */
                    <Card variant="default" padding="lg" className="text-center py-12">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto shadow-glow-purple">
                          <Sparkles className="w-7 h-7" />
                        </div>
                        <h4 className="font-display font-bold text-lg text-[var(--text-primary)]">
                          Create Your First Celebration
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          Whether it is a dreamy wedding, milestone birthday, or gala summit, Festiva AI will craft an actionable budget, run-of-show schedule, and vendor plan.
                        </p>
                        <Link to="/events/new" className="inline-block pt-2">
                          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                            Create My First Event
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Right 1 Col: SECTION D & E - TASKS & BUDGET SNAPSHOT */}
                <div className="space-y-6">
                  {/* SECTION D: UPCOMING TASKS */}
                  <TasksWidget
                    tasks={tasks}
                    onToggleTask={handleToggleTask}
                    onOpenCreateTask={() => setIsCreateTaskOpen(true)}
                  />

                  {/* SECTION E: BUDGET SNAPSHOT */}
                  <BudgetSnapshot
                    events={events}
                    metrics={metrics}
                    onOpenBudgetStudio={() => setActiveTab('budget')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              2. MY EVENTS VIEW
              ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Header and Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
                <div>
                  <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                    All Celebrations ({events.length})
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Browse, search, edit, duplicate, and archive your master blueprints
                  </p>
                </div>

                <Link to="/events/new">
                  <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Plan New Event
                  </Button>
                </Link>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'active', label: 'Active Plans' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'past', label: 'Past Celebrations' },
                  { id: 'archived', label: 'Archived' },
                  { id: 'all', label: 'All Records' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === tab.id
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-elevated)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Category & Sorting Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="wedding">Weddings</option>
                    <option value="birthday">Birthdays</option>
                    <option value="anniversary">Anniversaries</option>
                    <option value="college">College Events</option>
                    <option value="community">Community</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Sort By:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                    >
                      <option value="date_asc">Nearest Date First</option>
                      <option value="date_desc">Latest Date First</option>
                      <option value="budget_desc">Highest Budget</option>
                      <option value="name_asc">Event Name (A-Z)</option>
                    </select>
                  </div>

                  <div className="flex items-center border border-[var(--border)] rounded-lg p-0.5 bg-[var(--surface-elevated)]">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid view"
                      className={`p-1 rounded cursor-pointer ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-[var(--text-secondary)]'}`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      aria-label="List view"
                      className={`p-1 rounded cursor-pointer ${viewMode === 'list' ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-[var(--text-secondary)]'}`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Events Grid / List */}
              {displayedEvents.length > 0 ? (
                <div
                  className={`grid gap-4 ${
                    viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                  }`}
                >
                  {displayedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      tasks={tasks}
                      viewMode={viewMode}
                      onEdit={(e) => setEventToEdit(e)}
                      onDuplicate={handleDuplicate}
                      onArchive={handleArchiveToggle}
                      onDelete={(e) => setEventToDelete(e)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Celebrations Found"
                  description={
                    searchQuery
                      ? 'No events match your search filters. Try adjusting keywords.'
                      : 'No events found in this category. Click below to craft a new celebration.'
                  }
                  action={
                    <Link to="/events/new">
                      <Button variant="primary">Plan a Celebration</Button>
                    </Link>
                  }
                />
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              3. AI EVENT COPILOT VIEW
              ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'copilot' && (
            <AICopilotView
              events={events}
              userId={user?.id || 'demo-user-001'}
              onRefreshEvents={fetchEvents}
              selectedEventId={selectedEventId}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────────
              4. BUDGET STUDIO VIEW
              ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'budget' && (
            <BudgetStudioView
              events={events}
              userId={user?.id || 'demo-user-001'}
              onRefreshEvents={fetchEvents}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────────
              5. TIMELINE VIEW
              ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'timeline' && (
            <TimelineView
              events={events}
              userId={user?.id || 'demo-user-001'}
              onRefreshEvents={fetchEvents}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────────
              6. GUESTS & RSVPS VIEW
              ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'guests' && (
            <GuestsView
              events={events}
              userId={user?.id || 'demo-user-001'}
              onRefreshEvents={fetchEvents}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────────
              7. VENDORS VIEW
              ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'vendors' && (
            <VendorsView
              events={events}
              vendors={vendors}
              onUpdateVendorStatus={handleUpdateVendorStatus}
              userId={user?.id || 'demo-user-001'}
              onRefreshEvents={fetchEvents}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────────
              8. MOODBOARDS VIEW
              ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'moodboards' && (
            <MoodboardsView
              events={events}
              selectedEventId={selectedEventId}
              onEventUpdated={fetchEvents}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────────
              9. SETTINGS VIEW
              ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'settings' && <SettingsView onReloadDemoData={handleResetDemo} />}
        </main>
      </div>

      {/* ── MODALS ── */}

      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        events={events}
        onAddVendor={handleAddVendor}
      />

      {/* Add Guest Modal */}
      <AddGuestModal
        isOpen={isAddGuestOpen}
        onClose={() => setIsAddGuestOpen(false)}
        events={events}
        onAddGuest={handleAddGuest}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        events={events}
        onAddTask={handleCreateTask}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={Boolean(eventToEdit)}
        onClose={() => setEventToEdit(null)}
        event={eventToEdit}
        onSave={handleEditSave}
      />

      {/* Delete Event Confirmation Modal */}
      <Dialog
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
        title="Delete Celebration Plan?"
        description={`Are you sure you want to remove "${eventToDelete?.event_name}"? All associated budget allocations and timelines will be deleted.`}
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEventToDelete(null)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={confirmDelete}
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Celebration
          </Button>
        </div>
      </Dialog>

      {/* Reset Demo Data Confirmation Modal */}
      <Dialog
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Demo Environment?"
        description="This will restore all celebration plans, budget items, timelines, vendor records, and guest lists to their clean initial demo state. Any temporary modifications will be reset."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsResetModalOpen(false)}
            disabled={isResettingDemo}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={handleResetDemo}
            isLoading={isResettingDemo}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Demo Data
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
