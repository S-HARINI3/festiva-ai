import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Users,
  DollarSign,
  Palette,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Compass,
  FileCheck2,
  TrendingDown,
  Gauge,
  Info,
} from 'lucide-react';
import { CelebrationRibbon } from '../components/ui/CelebrationRibbon';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { EventType } from '../types/events';

// ── Event Type Definitions ──
interface EventTypeCard {
  type: EventType;
  title: string;
  emoji: string;
  description: string;
  iconBg: string;
}

const EVENT_TYPES: EventTypeCard[] = [
  {
    type: 'wedding',
    title: 'Weddings',
    emoji: '💍',
    description:
      'From intimate garden vows to grand ballroom receptions with personalized timelines, floral palettes, and vendor checklists.',
    iconBg: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  },
  {
    type: 'birthday',
    title: 'Birthdays',
    emoji: '🎂',
    description:
      'Milestone birthdays, themed parties, and surprise gatherings complete with playlist vibes, activity pacing, and cake moments.',
    iconBg: 'bg-[var(--accent)]/15 text-[var(--accent-text)]',
  },
  {
    type: 'anniversary',
    title: 'Anniversaries',
    emoji: '🥂',
    description:
      'Silver, golden, or milestone anniversary dinners and vow renewals with curated wine pairings, tributes, and seating blueprints.',
    iconBg: 'bg-[var(--secondary)]/40 text-[var(--primary)]',
  },
  {
    type: 'college',
    title: 'College Events',
    emoji: '🎓',
    description:
      'Campus festivals, student formals, alumni gatherings, and club conferences with budget-friendly vendor caps and security pacing.',
    iconBg: 'bg-[var(--success)]/10 text-[var(--success)]',
  },
  {
    type: 'community',
    title: 'Community Gatherings',
    emoji: '🎪',
    description:
      'Neighborhood festivals, cultural celebrations, charity galas, and fundraisers with volunteer coordination and safety roadmaps.',
    iconBg: 'bg-[var(--warning)]/10 text-[var(--warning)]',
  },
  {
    type: 'corporate',
    title: 'Corporate Events',
    emoji: '🏛️',
    description:
      'Leadership summits, product launch celebrations, client dinners, and team retreats with executive run-of-show precision.',
    iconBg: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  },
];

export default function LandingPage() {
  // Sample Blueprint Tab State
  const [activeSampleTab, setActiveSampleTab] = useState<'budget' | 'timeline' | 'vendors' | 'theme'>('budget');

  // Budget Rescue Toggle State
  const [isRescued, setIsRescued] = useState(false);

  const scrollToSample = () => {
    const el = document.getElementById('sample-plan');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative overflow-hidden bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-250">
      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 2: HERO
          ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-18 md:pb-28 container-app">
        {/* Subtle decorative celebration ribbons in background */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[840px] h-[380px] opacity-25 pointer-events-none select-none">
          <svg viewBox="0 0 840 380" fill="none" className="w-full h-full">
            <path
              d="M40 190C240 70 420 310 800 130"
              stroke="var(--accent)"
              strokeWidth="1.2"
              strokeDasharray="6 6"
            />
            <circle cx="210" cy="130" r="3" fill="var(--accent)" />
            <circle cx="620" cy="210" r="2.5" fill="var(--secondary)" />
          </svg>
        </div>

        <div className="text-center max-w-4xl mx-auto relative z-10">
          <div className="flex justify-center mb-5">
            <Badge variant="accent" size="md" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Intelligent Celebration Studio
            </Badge>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.1] mb-6 text-[var(--text-primary)] tracking-tight">
            Your Moments Deserve a{' '}
            <span className="italic font-normal text-[var(--primary)] font-display">
              Master Plan.
            </span>
          </h1>

          <CelebrationRibbon variant="header" className="mb-6" />

          <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            From the first idea to the final celebration, plan beautiful events with an AI assistant
            that understands your vision, budget, and people.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
            <Link to="/events/new">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Plan My Event
              </Button>
            </Link>
            <Button size="lg" variant="secondary" onClick={scrollToSample}>
              Explore a Sample Plan
            </Button>
          </div>

          {/* ── Sophisticated Event Planning Preview (Non-chatbot visual composition) ── */}
          <div className="relative mx-auto max-w-3xl text-left">
            {/* Ambient subtle glow backdrop */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/10 via-[var(--accent)]/15 to-[var(--secondary)]/20 rounded-3xl blur-2xl -z-10" />

            <div className="festiva-card p-6 md:p-8 shadow-card border-[var(--border)] relative overflow-hidden bg-[var(--surface)]">
              {/* Header preview row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
                    💍
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                        Elena &amp; Marcus Autumn Garden Wedding
                      </h3>
                      <Badge variant="accent" size="sm">
                        Sample Plan
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Napa Valley, CA • 120 Guests • Harvest Gold &amp; Amber Lighting
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant="success" size="sm">
                    Readiness: 94%
                  </Badge>
                </div>
              </div>

              {/* Composition Grid: Budget indicator + Timeline + Task completion */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-5">
                {/* Left col: Budget Progress & Allocation (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[var(--primary)]" />
                        Budget Allocation
                      </span>
                      <span className="font-mono text-[var(--text-secondary)]">
                        <strong>$32,400</strong> / $35,000 Target
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-[var(--surface)] overflow-hidden flex border border-[var(--border)]">
                      <div style={{ width: '42%' }} className="bg-[#713B70]" title="Catering 42%" />
                      <div style={{ width: '26%' }} className="bg-[#D8B477]" title="Venue 26%" />
                      <div style={{ width: '14%' }} className="bg-[#23856D]" title="Photo & Video 14%" />
                      <div style={{ width: '11%' }} className="bg-[#C18432]" title="Florals & Decor 11%" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mt-2.5 flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#713B70]" /> Catering ($13.6k)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#D8B477]" /> Venue ($8.5k)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#23856D]" /> Photo ($4.5k)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#C18432]" /> Florals ($3.6k)
                      </span>
                    </div>
                  </div>

                  {/* Task completion indicators */}
                  <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--text-primary)] block mb-2.5">
                      Key Milestone Checkpoints
                    </span>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-[var(--text-primary)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                          Vineyard ceremony permits &amp; backup canopy confirmed
                        </span>
                        <Badge variant="neutral" size="sm">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-[var(--text-primary)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                          Chef tasting menu &amp; gluten-free courses finalized
                        </span>
                        <Badge variant="neutral" size="sm">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                          Sunset acoustic duo playlist selection
                        </span>
                        <Badge variant="accent" size="sm">
                          In Progress
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right col: Miniature Run-of-Show Timeline (5 cols) */}
                <div className="md:col-span-5 p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                        Run-of-Show Timeline
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">Oct 24</span>
                    </div>

                    <div className="relative pl-4 space-y-3 border-l-2 border-[var(--border)] ml-1">
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--primary)] border-2 border-[var(--surface)]" />
                        <span className="font-mono text-[11px] text-[var(--primary)] font-semibold">14:00</span>
                        <p className="font-medium text-[var(--text-primary)]">Guest Arrival &amp; Cocktails</p>
                      </div>
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--surface)]" />
                        <span className="font-mono text-[11px] text-[var(--accent-text)] font-semibold">15:30</span>
                        <p className="font-medium text-[var(--text-primary)]">Garden Vows &amp; Exchange</p>
                      </div>
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--surface)]" />
                        <span className="font-mono text-[11px] text-[var(--success)] font-semibold">17:00</span>
                        <p className="font-medium text-[var(--text-primary)]">Sunset Vineyard Dinner</p>
                      </div>
                      <div className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--text-secondary)] border-2 border-[var(--surface)]" />
                        <span className="font-mono text-[11px] text-[var(--text-secondary)] font-semibold">19:30</span>
                        <p className="font-medium text-[var(--text-primary)]">First Dance &amp; Celebration</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
                    <span>Active Coordinator: Sarah M.</span>
                    <span className="text-[var(--primary)] font-medium">4 cues mapped</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 3: EVENT TYPE SELECTOR
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="event-ideas" className="section-padding bg-[var(--surface-elevated)] border-y border-[var(--border)] scroll-mt-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="accent" size="sm" className="mb-2">
              Curated Celebration Types
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
              Every celebration, thoughtfully orchestrated
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)]">
              Select your event style to generate personalized timelines, budget models, and bespoke creative concepts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EVENT_TYPES.map(({ type, title, emoji, description, iconBg }) => (
              <Card
                key={type}
                variant="interactive"
                padding="lg"
                className="flex flex-col justify-between group hover:border-[var(--primary)] transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${iconBg} shadow-xs group-hover:scale-105 transition-transform duration-200`}>
                      {emoji}
                    </span>
                    <Badge variant="neutral" size="sm">
                      AI Optimized
                    </Badge>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">
                    {title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                    {description}
                  </p>
                </div>

                <Link to={`/events/new?type=${type}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center group-hover:bg-[var(--primary)] group-hover:text-white group-hover:border-[var(--primary)] transition-colors"
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Plan {title}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 4: CORE FEATURES
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="section-padding scroll-mt-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="primary" size="sm" className="mb-2">
              Studio Capabilities
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-3">
              Intelligent tools designed for memorable moments
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)]">
              Eight unified capabilities replacing disjointed spreadsheets, guesswork, and planning fatigue.
            </p>
          </div>

          {/* Asymmetric composition: 2 Spotlight Wide Cards first */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Feature 1: AI Event Blueprint & Readiness Score */}
            <Card variant="default" padding="lg" className="flex flex-col justify-between border-[var(--border)]">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-4">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                    1. AI Event Blueprint &amp; Readiness Score
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  Synthesizes your vision into a cohesive master plan: executive summary, vendor requirements, run-of-show, and an interactive 0–100% celebration readiness score that increases as milestones are confirmed.
                </p>
              </div>

              {/* Visual Composition Widget */}
              <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] font-bold text-lg font-mono">
                    88%
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">Master Readiness Score</div>
                    <div className="text-[11px] text-[var(--success)] font-medium">✓ 14 of 16 key checkpoints completed</div>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  On Schedule
                </Badge>
              </div>
            </Card>

            {/* Feature 2: Smart Budget Studio & Budget Rescue */}
            <Card variant="default" padding="lg" className="flex flex-col justify-between border-[var(--border)]">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent-text)] flex items-center justify-center mb-4">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                    2. Smart Budget Studio &amp; Cost Caps
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  Intelligent cost distributions tailored to your guest size and local market benchmarks. Allocates spending across catering, venue, decor, and AV with a dedicated 8% contingency buffer.
                </p>
              </div>

              {/* Visual Composition Widget */}
              <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-primary)] font-medium">Catering &amp; Culinary Experience</span>
                  <span className="font-mono text-[var(--text-secondary)]">$14,500 (38%)</span>
                </div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                  <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: '38%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1">
                  <span>Contingency Reserve: $2,800</span>
                  <span className="text-[var(--success)] font-medium">Protected Buffer</span>
                </div>
              </div>
            </Card>
          </div>

          {/* 6 Grid Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 3: Moodboard Creator */}
            <Card variant="default" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--secondary)]/40 text-[var(--primary)] flex items-center justify-center mb-3">
                  <Palette className="w-5 h-5" />
                </div>
                <h4 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                  3. Moodboard Creator
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  Three curated celebration concepts with exact hex color palettes, lighting temperatures, floral textures, and signature decor touches.
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-3 border-t border-[var(--border)]">
                <span className="w-5 h-5 rounded-full bg-[#713B70] border border-black/10" title="#713B70" />
                <span className="w-5 h-5 rounded-full bg-[#D8B477] border border-black/10" title="#D8B477" />
                <span className="w-5 h-5 rounded-full bg-[#E9DDF3] border border-black/10" title="#E9DDF3" />
                <span className="w-5 h-5 rounded-full bg-[#23856D] border border-black/10" title="#23856D" />
                <span className="text-[11px] text-[var(--text-secondary)] ml-auto font-mono">Curated Swatches</span>
              </div>
            </Card>

            {/* Feature 4: Timeline Generator */}
            <Card variant="default" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                  4. Timeline Generator
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  Hour-by-hour run-of-show with coordinator tags, vendor load-in windows, cocktail hour transitions, and sound-check cues.
                </p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] font-mono">
                13:00 Load-in → 15:30 Ceremony → 18:00 Dinner
              </div>
            </Card>

            {/* Feature 5: Vendor Matchboard */}
            <Card variant="default" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 text-[var(--accent-text)] flex items-center justify-center mb-3">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h4 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                  5. Vendor Matchboard
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  Actionable vendor roadmaps categorized by priority with realistic cost ranges, negotiation questions, and milestone deliverables.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border)]">
                <span className="text-[var(--text-primary)] font-medium">6 Vendor Categories</span>
                <Badge variant="accent" size="sm">Checklists Included</Badge>
              </div>
            </Card>

            {/* Feature 6: Guest & RSVP Manager */}
            <Card variant="default" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                  6. Guest &amp; RSVP Manager
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  Dietary restriction tracking (vegan, gluten-free, allergies), table seating blueprints, VIP protocol tags, and RSVP deadline pacing.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
                <span className="badge badge-neutral text-[10px]">Dietary Matrix</span>
                <span className="badge badge-neutral text-[10px]">Seating Blueprint</span>
              </div>
            </Card>

            {/* Feature 7: Budget Rescue Engine */}
            <Card variant="default" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center mb-3">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h4 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                  7. Budget Rescue Engine
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  Intelligent contingency rebalancing that detects spending overruns and suggests high-impact, realistic cost reductions without sacrificing charm.
                </p>
              </div>
              <a href="#budget-rescue" className="text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1">
                Explore Budget Rescue Demo →
              </a>
            </Card>

            {/* Feature 8: Event Readiness Score */}
            <Card variant="default" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-3">
                  <Gauge className="w-5 h-5" />
                </div>
                <h4 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                  8. Event Readiness Score
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  Real-time health index tracking confirmed contracts, completed tastings, final RSVPs, and pending vendor tasks leading up to event day.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Confidence Meter</span>
                <span className="text-[var(--success)] font-semibold">Live Monitoring</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 5: HOW IT WORKS
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-padding bg-[var(--surface-elevated)] border-y border-[var(--border)] scroll-mt-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" size="sm" className="mb-2">
              Simple 4-Step Process
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-3">
              From initial spark to celebration day
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)]">
              Structured orchestration designed so you spend less time stressing and more time enjoying.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              {
                step: '01',
                title: 'Tell Us Your Vision',
                desc: 'Select your event style, date, guest count, venue location, and overall celebration mood.',
                icon: Compass,
              },
              {
                step: '02',
                title: 'Set Budget & Preferences',
                desc: 'Specify your budget tier, culinary priorities, music preferences, and any accessibility requirements.',
                icon: DollarSign,
              },
              {
                step: '03',
                title: 'Generate Your Plan',
                desc: 'Festiva AI synthesizes a personalized master blueprint: categorical budgets, timelines, and themes in seconds.',
                icon: Sparkles,
              },
              {
                step: '04',
                title: 'Track & Celebrate',
                desc: 'Monitor vendor milestones on your studio dashboard, adjust schedules, and coordinate effortlessly.',
                icon: CheckCircle2,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div
                key={step}
                className="festiva-card p-6 bg-[var(--surface)] border-[var(--border)] relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display text-3xl font-bold text-[var(--accent)]">
                      {step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)]">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 6: SAMPLE EVENT BLUEPRINT (Clear Demonstration)
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="sample-plan" className="section-padding scroll-mt-20">
        <div className="container-app">
          {/* Section Heading & Notice */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-xs font-semibold text-[var(--accent-text)] mb-3">
              <Info className="w-3.5 h-3.5" />
              SAMPLE BLUEPRINT — FOR DEMONSTRATION PURPOSES ONLY (NOT LIVE USER DATA)
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-3">
              Explore a complete event blueprint
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)]">
              Inspect how Festiva AI organizes complex events into actionable, transparent plans.
            </p>
          </div>

          {/* Master Sample Plan Card */}
          <div className="festiva-card p-6 md:p-8 bg-[var(--surface)] border-[var(--border)] shadow-card">
            {/* Sample Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">💍</span>
                  <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                    Clara &amp; Julian's Coastal Sunset Wedding
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-[var(--text-secondary)]">
                  Carmel-by-the-Sea, CA • 95 Expected Guests • Target Budget: $38,000 • Theme: Driftwood &amp; Champagne
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link to="/events/new?type=wedding">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Customize in Studio
                  </Button>
                </Link>
              </div>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex items-center gap-2 pt-6 pb-5 overflow-x-auto border-b border-[var(--border)]">
              {[
                { id: 'budget', label: 'Budget Breakdown' },
                { id: 'timeline', label: 'Run-of-Show Timeline' },
                { id: 'vendors', label: 'Vendor Roadmap' },
                { id: 'theme', label: 'Creative Theme & Swatches' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveSampleTab(id as any)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeSampleTab === id
                      ? 'bg-[var(--primary)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="pt-6">
              {activeSampleTab === 'budget' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { category: 'Catering & Fine Wine', amount: '$14,500', pct: '38%', desc: 'Plated dinner, raw oyster bar, regional Pinot Noirs' },
                      { category: 'Seaside Venue & Canopy', amount: '$9,200', pct: '24%', desc: 'Cliffside bluff lawn, weather canopy & heaters' },
                      { category: 'Photography & Cinema', amount: '$4,800', pct: '13%', desc: '8-hour primary shooter + sunset drone footage' },
                      { category: 'Florals & Coastal Decor', amount: '$3,600', pct: '9%', desc: 'Eucalyptus garland, driftwood arch, amber candles' },
                      { category: 'Acoustic Duo & Sound', amount: '$3,200', pct: '8%', desc: 'Ceremony acoustic strings, wireless lapel mics' },
                      { category: 'Contingency Reserve', amount: '$2,700', pct: '7%', desc: 'Dedicated buffer for weather shifts or overtime' },
                    ].map((item) => (
                      <div key={item.category} className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[var(--text-primary)]">{item.category}</span>
                          <span className="font-mono text-xs font-semibold text-[var(--primary)]">{item.amount}</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mb-2">{item.desc}</div>
                        <div className="text-[10px] text-[var(--accent-text)] font-semibold">{item.pct} of total budget</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/20 text-xs text-[var(--text-primary)] flex items-center justify-between">
                    <span>Total Balanced Plan Allocation: <strong>$38,000</strong></span>
                    <span className="text-[var(--success)] font-semibold">✓ 100% Accounted</span>
                  </div>
                </div>
              )}

              {activeSampleTab === 'timeline' && (
                <div className="space-y-3">
                  {[
                    { time: '13:00', title: 'Bridal Party & Groom Suite Arrivals', desc: 'Hair, makeup, and initial detail photography' },
                    { time: '14:30', title: 'Florals & Audio Sound Check', desc: 'Arch floral placement, acoustic string check' },
                    { time: '15:30', title: 'Oceanfront Vows & Ring Exchange', desc: 'Prelude strings, processional, personalized vows' },
                    { time: '16:30', title: 'Champagne & Veranda Cocktail Hour', desc: 'Raw oyster bar, passed hors d’oeuvres, guest book' },
                    { time: '18:00', title: 'Farm-to-Table Sunset Dinner & Toasts', desc: 'Three-course seasonal service, family toasts' },
                    { time: '20:00', title: 'First Dance & Starlight Reception', desc: 'Acoustic duo transition to reception playlist' },
                  ].map((event) => (
                    <div key={event.time} className="flex items-start gap-4 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--border)] flex-shrink-0">
                        {event.time}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">{event.title}</div>
                        <div className="text-[11px] text-[var(--text-secondary)]">{event.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSampleTab === 'vendors' && (
                <div className="space-y-3">
                  {[
                    { category: 'Venue', name: 'Carmel Highlands Bluff', status: 'Secured', cost: '$9,200', note: 'Deposit paid; weather canopy approved' },
                    { category: 'Catering', name: 'Pacific Coast Farm-to-Table', status: 'In Review', cost: '$14,500', note: 'Menu approved; finalize tasting on Nov 12' },
                    { category: 'Photography', name: 'Monterey Sun Light Studio', status: 'Secured', cost: '$4,800', note: 'Shot list submitted; sunset golden hour mapped' },
                    { category: 'Florals', name: 'Dune & Bloom Florals', status: 'In Review', cost: '$3,600', note: 'Palette approved; mock centerpiece pending' },
                    { category: 'Music', name: 'Coastline Acoustic Strings', status: 'Upcoming', cost: '$3,200', note: 'Repertoire selected; lapel mic equipment confirmed' },
                  ].map((v) => (
                    <div key={v.category} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)]">{v.name}</span>
                          <span className="badge badge-neutral text-[10px]">{v.category}</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{v.note}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{v.cost}</span>
                        <Badge variant={v.status === 'Secured' ? 'success' : v.status === 'In Review' ? 'accent' : 'neutral'} size="sm">
                          {v.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSampleTab === 'theme' && (
                <div className="p-6 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-6">
                  <div>
                    <span className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider block mb-1">
                      Concept Vision
                    </span>
                    <h4 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                      Carmel Driftwood &amp; Champagne Glow
                    </h4>
                    <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      Warm coastal organic minimalism. Weathered cedar banquet tables, fine Belgian linen runners, unglazed stoneware, and warm amber festoon lighting evoking the Pacific twilight.
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] block mb-3">
                      Curated Color Harmony
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { color: '#713B70', name: 'Imperial Plum', role: 'Accent Velvet & Inks' },
                        { color: '#D8B477', name: 'Champagne Gold', role: 'Cutlery & Candlelight' },
                        { color: '#E9DDF3', name: 'Lavender Mist', role: 'Linen Napkins' },
                        { color: '#23856D', name: 'Coastal Myrtle', role: 'Garlands & Foliage' },
                        { color: '#FAF8F5', name: 'Warm Canvas', role: 'Stationery & Silks' },
                      ].map((swatch) => (
                        <div key={swatch.color} className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
                          <div
                            className="w-full h-10 rounded-lg mb-2 shadow-xs border border-black/10"
                            style={{ backgroundColor: swatch.color }}
                          />
                          <div className="font-mono text-xs font-bold text-[var(--text-primary)]">{swatch.color}</div>
                          <div className="text-[11px] font-medium text-[var(--text-primary)] truncate">{swatch.name}</div>
                          <div className="text-[10px] text-[var(--text-secondary)] truncate">{swatch.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 7: DIFFERENTIATOR (Budget Rescue Demonstration)
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="budget-rescue" className="section-padding bg-[var(--surface-elevated)] border-y border-[var(--border)] scroll-mt-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="warning" size="sm" className="mb-2">
              Signature AI Innovation
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-3">
              Meet Budget Rescue
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)]">
              When real-world bids exceed your initial limits, Festiva AI pinpoints realistic, high-impact cost adjustments that protect your event's elegance.
            </p>
          </div>

          <div className="max-w-4xl mx-auto festiva-card p-6 md:p-8 bg-[var(--surface)] border-[var(--border)] shadow-card">
            {/* Toggle header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
              <div>
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Interactive Simulation
                </span>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  Over-Budget Scenario: 150-Guest Milestone Gala
                </h3>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <button
                  onClick={() => setIsRescued(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    !isRescued
                      ? 'bg-[var(--danger)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Original Draft (+$5,800 Over)
                </button>
                <button
                  onClick={() => setIsRescued(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isRescued
                      ? 'bg-[var(--success)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  After AI Budget Rescue
                </button>
              </div>
            </div>

            {/* Comparison Details */}
            <div className="pt-6">
              {!isRescued ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-xs text-[var(--danger)] flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4" />
                      Total Estimated Cost: $43,800 • Target Budget: $38,000 (+$5,800 Overspend)
                    </span>
                    <button
                      onClick={() => setIsRescued(true)}
                      className="px-3 py-1 bg-[var(--danger)] text-white rounded-lg font-semibold hover:opacity-90"
                    >
                      Run Budget Rescue
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Catering &amp; Bar</span>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">$17,200 (Plated 4-Course)</div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Full seated dinner with open premium spirits.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Florals &amp; Decor</span>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">$6,200 (Imported Blooms)</div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Large imported floral centerpieces on all tables.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Photography &amp; Video</span>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">$6,400 (Dual 10h Shooters)</div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Full 10-hour two-photographer and videographer coverage.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Lighting &amp; Rigging</span>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">$4,000 (Custom Trussing)</div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Third-party external truss lighting rig.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/30 text-xs text-[var(--success)] flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Optimized Balanced Total: $37,500 • $500 Below Target • $6,300 Total Savings!
                    </span>
                    <Badge variant="success" size="sm">
                      Budget Rescued
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--success)]/30 relative">
                      <span className="text-xs font-semibold text-[var(--success)] block mb-1">
                        💡 Catering Optimization — Saved $2,400
                      </span>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">$14,800</div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                        Swapped seated 4-course banquet for artisan chef tasting stations &amp; signature craft cocktail pairings. Guests loved the dynamic flow!
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--success)]/30 relative">
                      <span className="text-xs font-semibold text-[var(--success)] block mb-1">
                        💡 Florals Optimization — Saved $1,800
                      </span>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">$4,400</div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                        Substituted out-of-season blooms for lush local olive branches, Italian ruscus, and dramatic amber taper candle clusters.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--success)]/30 relative">
                      <span className="text-xs font-semibold text-[var(--success)] block mb-1">
                        💡 Photo &amp; Cinema Tuning — Saved $1,100
                      </span>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">$5,300</div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                        Focused coverage on prime 8 hours; converted raw footage capture into a curated 4K cinematic highlight reel.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--success)]/30 relative">
                      <span className="text-xs font-semibold text-[var(--success)] block mb-1">
                        💡 Venue Lighting Integration — Saved $1,000
                      </span>
                      <div className="font-mono text-sm font-bold text-[var(--text-primary)]">$3,000</div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                        Utilized venue architectural warm pin-spotting and festoon bistro strands instead of external truss rental.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 8: TRUST AND TRANSPARENCY
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="trust-transparency" className="section-padding scroll-mt-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="neutral" size="sm" className="mb-2">
              Responsible AI Commitment
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
              Trust &amp; Transparency First
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)]">
              Festiva AI is an intelligent planning assistant, not an automated booking broker. We hold honesty and user control as core principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card variant="default" padding="lg" className="border-[var(--border)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                Estimates Require Verification
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                All AI-generated prices, vendor estimates, and budget breakdowns reflect regional averages and models. Actual fees, availability, and taxes must always be confirmed directly with your chosen vendors before signing contracts.
              </p>
            </Card>

            <Card variant="default" padding="lg" className="border-[var(--border)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 text-[var(--accent-text)] flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                No Simulated Transactions
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Festiva AI never claims a vendor is booked, a date is held, or a payment is completed unless you have explicitly approved and executed that contract yourself. You retain full control of your celebrations.
              </p>
            </Card>

            <Card variant="default" padding="lg" className="border-[var(--border)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                Data Privacy &amp; Integrity
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Your guest rosters, budget limits, and celebratory ideas belong exclusively to you. We do not sell guest data or monetize personal event records. What you plan here stays between you and your guests.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 9: FINAL CALL TO ACTION
          ─────────────────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-[var(--surface-elevated)] border-t border-[var(--border)]">
        <div className="container-app">
          <div className="festiva-card p-8 md:p-14 text-center max-w-3xl mx-auto border-[var(--border)] shadow-soft">
            <CelebrationRibbon variant="header" className="mb-5" />

            <h2 className="font-display text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Your moments deserve a master plan.
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)] max-w-lg mx-auto mb-8 leading-relaxed">
              Join thoughtful hosts and planners organizing weddings, birthdays, galas, and gatherings with complete clarity and creative confidence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link to="/events/new">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Plan My Event
                </Button>
              </Link>
              <Button size="lg" variant="secondary" onClick={scrollToSample}>
                Explore a Sample Plan
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
