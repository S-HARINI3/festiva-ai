import { Menu, Search, PlusCircle, User, Calendar, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { SavedEvent } from '../../types/events';
import type { DashboardTab } from '../../types/dashboard';

interface TopNavProps {
  activeTab: DashboardTab;
  onOpenMobileSidebar: () => void;
  collapsed: boolean;
  events: SavedEvent[];
  selectedEventId: string | 'all';
  onSelectEventId: (id: string | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenResetDemo?: () => void;
}

const TAB_TITLES: Record<DashboardTab, { title: string; subtitle: string }> = {
  overview: { title: 'Celebration Overview', subtitle: 'Portfolio health, countdowns, and priorities' },
  events: { title: 'My Celebrations', subtitle: 'Comprehensive event portfolio & archives' },
  copilot: { title: 'AI Event Copilot', subtitle: 'Creative ideation, etiquette advice & guidance' },
  budget: { title: 'Budget Studio', subtitle: 'Allocations, actual expenditures & reserve fund' },
  timeline: { title: 'Master Timeline', subtitle: 'Synchronized run-of-show across celebrations' },
  guests: { title: 'Guests & RSVPs', subtitle: 'Headcounts, VIP protocols & dietary care' },
  vendors: { title: 'Vendor Matrix', subtitle: 'Checklists, booking pipelines & quotes' },
  moodboards: { title: 'Themes & Aesthetics', subtitle: 'Color swatches, sensory moods & decor palettes' },
  settings: { title: 'Studio Settings', subtitle: 'Preferences, currency defaults & cloud sync' },
};

export default function TopNav({
  activeTab,
  onOpenMobileSidebar,
  collapsed,
  events,
  selectedEventId,
  onSelectEventId,
  searchQuery,
  onSearchChange,
  onOpenResetDemo,
}: TopNavProps) {
  const { user, isDemoMode } = useAuth();
  const meta = TAB_TITLES[activeTab] || TAB_TITLES.overview;

  return (
    <header
      className={`sticky top-0 z-20 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 py-3 transition-all duration-250 ${
        collapsed ? 'md:pl-24' : 'md:pl-68'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--surface)] cursor-pointer"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)] leading-tight truncate">
              {meta.title}
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] hidden sm:block truncate">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Controls: Search, Event Switcher, and Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Event Quick Switcher */}
          {events.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs">
              <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
              <select
                value={selectedEventId}
                onChange={(e) => onSelectEventId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all" className="bg-[var(--surface)] text-[var(--text-primary)]">
                  All Celebrations ({events.length})
                </option>
                {events.map((e) => (
                  <option key={e.id} value={e.id} className="bg-[var(--surface)] text-[var(--text-primary)]">
                    {e.event_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Search */}
          <div className="relative w-36 sm:w-48 lg:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--border-hover)] focus:border-[var(--primary)] text-xs text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Demo Reset Button */}
          {isDemoMode && onOpenResetDemo && (
            <button
              type="button"
              onClick={onOpenResetDemo}
              className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Reset sample events, budget, timeline, vendors, and guests"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Demo</span>
            </button>
          )}

          {/* Plan Event Primary Button */}
          <Link to="/events/new" className="hidden sm:inline-flex">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Event</span>
            </button>
          </Link>

          {/* User Profile Mini Badge */}
          <div className="flex items-center gap-2 pl-1 border-l border-[var(--border)]">
            <div
              className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center font-bold text-xs select-none"
              title={user?.email || 'Festiva Planner'}
            >
              {user?.full_name ? user.full_name[0].toUpperCase() : <User className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
