import { useState } from 'react';
import { Settings, User, Coins, Sun, Moon, Bell, Shield, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Button, Input, useToast } from '../ui';

interface SettingsViewProps {
  onReloadDemoData: () => void;
}

export default function SettingsView({ onReloadDemoData }: SettingsViewProps) {
  const { user, isDemoMode } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { success } = useToast();

  const [currency, setCurrency] = useState(
    localStorage.getItem('festiva_default_currency') || 'INR'
  );
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('festiva_default_currency', currency);
    success('Studio settings & currency defaults saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
              Studio Workspace Settings
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Account parameters, default currencies, and notification alerts
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Profile Card */}
        <Card variant="default" padding="md" className="space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--primary)]" /> Planner Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={user?.full_name || 'Festiva Planner'} disabled />
            <Input label="Email Address" value={user?.email || 'demo@festiva.ai'} disabled />
          </div>
        </Card>

        {/* Currency & Locale Preferences */}
        <Card variant="default" padding="md" className="space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Coins className="w-4 h-4 text-[var(--accent)]" /> Currency &amp; Regional Defaults
          </h3>

          <div>
            <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
              Default Calculation Currency *
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full sm:w-72 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="INR">INR (₹) — Indian Rupee (Default)</option>
              <option value="USD">USD ($) — United States Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="CAD">CAD (C$) — Canadian Dollar</option>
            </select>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              Festiva AI defaults to INR for the Indian celebration ecosystem while supporting multi-currency calculations.
            </p>
          </div>
        </Card>

        {/* Notifications */}
        <Card variant="default" padding="md" className="space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--warning)]" /> Notifications &amp; Reminders
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="rounded accent-[var(--primary)] w-4 h-4"
              />
              <span className="text-xs text-[var(--text-primary)]">
                Email digest for upcoming celebration milestones
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={taskReminders}
                onChange={(e) => setTaskReminders(e.target.checked)}
                className="rounded accent-[var(--primary)] w-4 h-4"
              />
              <span className="text-xs text-[var(--text-primary)]">
                Browser notifications for due vendor payments
              </span>
            </label>
          </div>
        </Card>

        {/* Theming & Display */}
        <Card variant="default" padding="md" className="space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4 text-[var(--primary)]" /> : <Sun className="w-4 h-4 text-[var(--accent)]" />}
            Interface Appearance
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">
                Active Theme: {isDark ? 'Dark Studio' : 'Light Celebration'}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Toggles between warm celebration light and modern dark studio palettes.
              </span>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={toggleTheme}>
              Switch to {isDark ? 'Light' : 'Dark'}
            </Button>
          </div>
        </Card>

        {/* Demo Mode Management */}
        {isDemoMode && (
          <Card variant="default" padding="md" className="space-y-3 border-[var(--accent)]/30">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent)]" /> Demo Studio Environment
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Operating in demo simulation. All plans, tasks, and budgets are maintained in memory.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReloadDemoData}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Sample Blueprints
            </Button>
          </Card>
        )}

        <div className="flex items-center justify-end">
          <Button type="submit" variant="primary" size="md">
            Save Studio Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
