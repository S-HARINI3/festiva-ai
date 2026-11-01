import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Menu, X, LogOut, User, LayoutDashboard, PlusCircle,
  Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import CelebrationRibbon from '../ui/CelebrationRibbon';

interface NavItem {
  label: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Product', href: '#sample-plan' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Event Ideas', href: '#event-ideas' },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isLanding = location.pathname === '/';

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (isLanding) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    navigate(`/${href}`);
  };

  const handleSignOut = async () => {
    await signOut();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-200">
      <div className="container-app flex items-center justify-between h-[70px]">
        {/* Logo with Celebration Ribbon */}
        <Link to="/" className="flex items-center gap-2.5 group select-none">
          <CelebrationRibbon variant="logo" className="group-hover:rotate-6 transition-transform duration-300" />
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl text-[var(--text-primary)] tracking-tight flex items-center gap-1.5">
              Festiva AI
              <span className="text-[var(--accent)] text-xs font-normal">✦</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links: Product, Features, How It Works, Event Ideas */}
        <div className="hidden lg:flex items-center gap-1">
          {mainNavItems.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => handleNavClick(href)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all cursor-pointer"
            >
              {label}
            </button>
          ))}
          {user && (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-xl text-xs font-semibold text-[var(--primary)] bg-[var(--primary-light)] border border-[var(--primary)]/20 hover:bg-[var(--primary)] hover:text-white transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Studio
            </Link>
          )}
          <Link
            to="/presentation"
            className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-xl text-xs font-semibold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-[var(--text-primary)] transition-all"
          >
            ✦ Presentation
          </Link>
        </div>

        {/* Right Side Actions: Theme Toggle, Sign In, Get Started */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] transition-all duration-200 active:scale-95"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[var(--accent)] hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--primary)] hover:-rotate-12 transition-transform" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <Link
              to="/auth/login"
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/auth/signup"
              className="btn-primary text-sm shadow-xs"
            >
              Get Started
            </Link>
          </div>

          {user && (
            <div className="relative ml-1">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--primary-contrast)] flex items-center justify-center text-xs font-bold shadow-xs hover:ring-2 hover:ring-[var(--primary)]/30 transition-all"
                title={user.full_name || user.email}
              >
                {user.full_name?.[0] || user.email[0].toUpperCase()}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-[var(--surface)] rounded-2xl border border-[var(--border)] py-1.5 shadow-dropdown z-50"
                  >
                    <div className="px-4 py-2 border-b border-[var(--border)]">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {user.full_name || 'Festiva Host'}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-[var(--primary)]" /> Studio Dashboard
                    </Link>

                    <Link
                      to="/events/new"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <PlusCircle className="w-4 h-4 text-[var(--primary)]" /> Plan New Event
                    </Link>

                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4 text-[var(--primary)]" /> Profile Settings
                    </Link>

                    <div className="border-t border-[var(--border)] my-1" />

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile menu and theme toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)]"
          >
            {isDark ? <Sun className="w-4 h-4 text-[var(--accent)]" /> : <Moon className="w-4 h-4 text-[var(--primary)]" />}
          </button>

          <button
            className="btn-ghost p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5 text-[var(--text-primary)]" /> : <Menu className="w-5 h-5 text-[var(--text-primary)]" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[var(--surface)] border-t border-[var(--border)] shadow-dropdown"
          >
            <div className="container-app py-4 flex flex-col gap-1.5">
              {mainNavItems.map(({ label, href }) => (
                <button
                  key={label}
                  onClick={() => handleNavClick(href)}
                  className="flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all text-left"
                >
                  {label}
                </button>
              ))}

              {user && (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--primary)] bg-[var(--primary-light)]"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" /> Studio Dashboard
                </Link>
              )}

              <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-[var(--border)]">
                <Link
                  to="/auth/login"
                  className="btn-secondary w-full justify-center text-sm py-2.5"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="btn-primary w-full justify-center text-sm py-2.5"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
