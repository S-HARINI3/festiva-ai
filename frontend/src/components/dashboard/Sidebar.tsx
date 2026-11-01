import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Bot,
  Coins,
  Clock,
  Users,
  Store,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Sparkles,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import type { DashboardTab } from '../../types/dashboard';

interface SidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  eventCount: number;
  upcomingCount: number;
}

export const SIDEBAR_ITEMS: {
  id: DashboardTab;
  label: string;
  icon: React.ElementType;
  badge?: (counts: { eventCount: number; upcomingCount: number }) => string | number | null;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  {
    id: 'events',
    label: 'My Events',
    icon: CalendarDays,
    badge: ({ eventCount }) => (eventCount > 0 ? eventCount : null),
  },
  { id: 'copilot', label: 'AI Event Copilot', icon: Bot },
  { id: 'budget', label: 'Budget Studio', icon: Coins },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: Clock,
    badge: ({ upcomingCount }) => (upcomingCount > 0 ? `${upcomingCount} near` : null),
  },
  { id: 'guests', label: 'Guests & RSVPs', icon: Users },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'moodboards', label: 'Moodboards', icon: Palette },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  eventCount,
  upcomingCount,
}: SidebarProps) {
  const { isDark, toggleTheme } = useTheme();

  const handleNavClick = (tabId: DashboardTab) => {
    onSelectTab(tabId);
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Branding & Plan Event CTA */}
      <div>
        {/* Studio Branding */}
        <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-display font-bold text-base tracking-tight text-[var(--text-primary)] block leading-none truncate">
                  Festiva AI
                </span>
                <span className="text-[10px] font-medium text-[var(--primary)] uppercase tracking-wider block mt-0.5">
                  Studio Workspace
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Plan CTA */}
        <div className="p-3">
          <Link to="/events/new">
            <button
              type="button"
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs transition-all shadow-xs cursor-pointer ${
                collapsed ? 'p-2' : ''
              }`}
              title="Create New Celebration Plan"
            >
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">Plan New Event</span>}
            </button>
          </Link>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="px-2 py-2 space-y-1" aria-label="Dashboard views">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeVal = item.badge ? item.badge({ eventCount, upcomingCount }) : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none text-left ${
                  isActive
                    ? 'bg-[var(--primary)] text-white shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!collapsed && badgeVal !== null && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20'
                    }`}
                  >
                    {badgeVal}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Controls */}
      <div className="p-3 border-t border-[var(--border)] space-y-2">
        {/* Presentation Brief Link */}
        <Link
          to="/presentation"
          className={`w-full flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all ${
            collapsed ? 'p-2' : ''
          }`}
          title="PromptWars Project Presentation & Architecture Brief"
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Project Brief ✦</span>}
        </Link>

        {/* Theme Toggle & Collapse Switch */}
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-[var(--accent)]" /> : <Moon className="w-4 h-4 text-[var(--primary)]" />}
            {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex items-center justify-center p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Collapsible Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 left-0 bottom-0 z-30 bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-250 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-[var(--surface)] border-r border-[var(--border)] shadow-dialog flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
