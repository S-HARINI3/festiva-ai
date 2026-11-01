import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/helpers';
import { Card, Badge, CelebrationRibbon } from '../components/ui';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen py-10 px-4 bg-[var(--background)] transition-colors duration-250">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
              Host Profile
            </h1>
            <CelebrationRibbon variant="accent" />
          </div>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            Manage your celebration studio preferences and credentials.
          </p>

          <Card variant="default" padding="lg" className="mb-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] text-[var(--primary-contrast)] flex items-center justify-center text-2xl font-bold shadow-xs">
                {user.full_name?.[0] || user.email[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {user.full_name || 'Festiva Host'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{user.email}</p>
                <Badge variant="success" size="sm" className="mt-2">
                  Verified Host Profile
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: User, label: 'Full Name', value: user.full_name || 'Not configured' },
                { icon: Mail, label: 'Primary Email', value: user.email },
                { icon: Calendar, label: 'Member Since', value: formatDate(user.created_at) },
                { icon: Shield, label: 'Environment', value: 'Cloud Synchronized (Supabase PostgreSQL)' },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {label}
                    </div>
                    <div className="text-xs font-medium text-[var(--text-primary)]">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
