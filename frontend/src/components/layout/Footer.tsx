import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import CelebrationRibbon from '../ui/CelebrationRibbon';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-auto transition-colors duration-200">
      <div className="container-app pt-10 pb-12">
        <CelebrationRibbon variant="divider" className="mb-10" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <CelebrationRibbon variant="logo" className="w-7 h-7" />
              <span className="font-display font-bold text-xl text-[var(--text-primary)] tracking-tight">
                Festiva AI
              </span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-sm mb-4">
              Your moments deserve a master plan. An intelligent celebration studio combining creative event design, realistic budgets, vendor matchboards, and timeline orchestration.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
              <span>Independent Planning Guidance • Not a Booking Broker</span>
            </div>
          </div>

          {/* Product Capabilities */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Capabilities
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'AI Event Blueprint', to: '#features' },
                { label: 'Smart Budget Studio', to: '#features' },
                { label: 'Moodboard Creator', to: '#features' },
                { label: 'Timeline Generator', to: '#features' },
                { label: 'Budget Rescue Engine', to: '#budget-rescue' },
                { label: 'Readiness Score', to: '#features' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <a
                    href={to}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Event Celebrations */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Celebrations
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Weddings', to: '/events/new?type=wedding' },
                { label: 'Birthdays', to: '/events/new?type=birthday' },
                { label: 'Anniversaries', to: '/events/new?type=anniversary' },
                { label: 'Corporate Events', to: '/events/new?type=corporate' },
                { label: 'College Events', to: '/events/new?type=college' },
                { label: 'Community Gatherings', to: '/events/new?type=community' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Trust */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Trust &amp; Legal
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Privacy Policy', to: '#trust-transparency' },
                { label: 'Terms of Service', to: '#trust-transparency' },
                { label: 'AI Transparency Notice', to: '#trust-transparency' },
                { label: 'Vendor Verification Guide', to: '#trust-transparency' },
                { label: 'Studio Security', to: '#trust-transparency' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <a
                    href={to}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            Festiva AI &copy; {new Date().getFullYear()} • Big moments. Beautifully planned.
          </p>
          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              Empowering Memorable Celebrations
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
