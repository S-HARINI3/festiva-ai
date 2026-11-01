import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
  AlertTriangle,
  ExternalLink,
  Coins,
  Server,
  Workflow,
  Compass,
  Zap,
  Lock,
  FileSpreadsheet,
  Lightbulb,
} from 'lucide-react';
import { Card, Button, CelebrationRibbon } from '../components/ui';

type SectionTab = 'overview' | 'architecture' | 'features' | 'security' | 'deployment' | 'demo' | 'roadmap';

export default function PresentationPage() {
  const [activeTab, setActiveTab] = useState<SectionTab>('overview');

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-soft overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <CelebrationRibbon variant="logo" className="w-64 h-64" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-accent text-xs">
                ✦ PromptWars Virtual Challenge 5
              </span>
              <span className="badge badge-primary text-xs">
                Celebration &amp; Event Planner
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                v1.0.0 Production Architecture
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Festiva AI — Project Presentation &amp; Architecture Brief
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-3xl leading-relaxed">
              An enterprise-grade, autonomous celebration intelligence platform transforming high-level event concepts into mathematical, budget-conscious, multi-stage blueprints powered by Google Gemini AI, FastAPI, React 18, and Supabase PostgreSQL with Row Level Security.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/dashboard">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Open Interactive Studio
                </Button>
              </Link>
              <Link to="/events/new">
                <Button variant="outline" size="md" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Create Sample Celebration
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: '1. Problem & Solution', icon: Lightbulb },
            { id: 'features', label: '2. Core Innovations', icon: Zap },
            { id: 'architecture', label: '3. Architecture & Stack', icon: Layers },
            { id: 'security', label: '4. Security & Persistence', icon: ShieldCheck },
            { id: 'deployment', label: '5. Deployment & Costs', icon: Server },
            { id: 'demo', label: '6. Walkthrough Checklist', icon: Workflow },
            { id: 'roadmap', label: '7. Limitations & Roadmap', icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SectionTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs border border-[var(--border)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--primary)]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card variant="default" padding="lg" className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[var(--accent)]" /> Problem Statement
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Event planning is traditionally chaotic, fragmented across disjointed spreadsheets, instant messaging threads, and mental notes. Hosts face three critical failure points:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                    <span className="text-xs font-bold text-[var(--danger)] block">1. Unrealistic Budgets</span>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Couples and organizers underestimate vendor expenses, lack contingency reserves, and encounter severe budget blowouts midway through planning.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                    <span className="text-xs font-bold text-[var(--warning)] block">2. Timeline &amp; Task Disarray</span>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Critical path dependencies (e.g., booking venue before decorator) are overlooked, creating costly emergency re-bookings.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                    <span className="text-xs font-bold text-[var(--primary)] block">3. Decision Paralysis</span>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Synthesizing quotes, dietary requirements, table seating, and aesthetic themes across dozens of vendors causes cognitive overload.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-6">
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--primary)]" /> Proposed Solution: Festiva AI
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Festiva AI is an autonomous, full-stack event intelligence suite. In under 10 seconds, it synthesizes high-level user ideas into a mathematically validated 10-section blueprint. Unlike simplistic chat prompts, Festiva models <strong>Infeasibility Economics</strong>, provides an algorithmic <strong>Budget Rescue Engine</strong>, delivers a transparent <strong>100-Point Event Readiness Score</strong>, and executes safely through an authorized <strong>Event Copilot</strong>.
                </p>
              </div>

              <div className="border-t border-[var(--border)] pt-6">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-3">
                  Target User Personas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Couples & Families', role: 'Milestone Weddings & Anniversaries', desc: 'Need cultural styling, multi-day timelines, and strict per-plate budgeting.' },
                    { title: 'Corporate Coordinators', role: 'Conferences & Summits', desc: 'Need AV requirements, keynote scheduling, and verified vendor quotes.' },
                    { title: 'Community Leaders', role: 'Galas & College Fests', desc: 'Need volunteer assignment, crowd safety contingencies, and sponsor budgeting.' },
                    { title: 'Independent Planners', role: 'Boutique Event Studios', desc: 'Need rapid blueprint generation, client proposal comparisons, and PDF exports.' },
                  ].map((p, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <span className="font-bold text-xs text-[var(--text-primary)] block">{p.title}</span>
                      <span className="text-[11px] font-medium text-[var(--primary)] block mb-1.5">{p.role}</span>
                      <p className="text-[11px] text-[var(--text-secondary)]">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 2: CORE INNOVATIONS ── */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card variant="default" padding="md" className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Infeasibility Economics Engine
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Detects physically impossible ratios (e.g. 200 guests on ₹25,000 budget in a 5-star venue). Rather than hallucinating cheap costs, it flags infeasibility and calculates concrete tradeoffs: reducing headcount, switching catering style, or adjusting budget.
                </p>
              </Card>

              <Card variant="default" padding="md" className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--warning-light)] text-[var(--warning)] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Algorithmic Budget Rescue
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  When unplanned costs cause category deficits, Budget Rescue audits discretionary buckets (florals, favors) and formulates a balanced clawback strategy with 1-click safe adoption.
                </p>
              </Card>

              <Card variant="default" padding="md" className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    100-Point Transparent Readiness Score
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Mathematically grounded: Tasks (35%), Budget (20%), Vendors (20%), Guests (15%), Timeline (10%). Distinguishes brand-new empty events from failing plans, and drives a P1-P8 "Next Best Move" decision engine.
                </p>
              </Card>

              <Card variant="default" padding="md" className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Allowlisted Event Copilot Safe Actions
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  The conversational Copilot accesses live event data. Proposed budget changes or task additions are isolated in structured Action Cards requiring explicit 2-step confirmation (`confirmed: true`) before applying.
                </p>
              </Card>

              <Card variant="default" padding="md" className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Vendor Matchboard &amp; Quotation AI
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Organizes 9 vendor types. AI analyzes user-supplied quotes and synthesizes tailored interview questions and negotiation tips without fabricating fictional vendor identities.
                </p>
              </Card>

              <Card variant="default" padding="md" className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    6
                  </div>
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Catering Dietary Matrix &amp; CSV Shield
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Bulk CSV guest import with duplicate detection. Auto-computes headcount for 11 dietary preferences and mobility requests, while sanitizing CSV injection formulas (`=`, `+`, `-`, `@`).
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 3: ARCHITECTURE & STACK ── */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <Card variant="default" padding="lg" className="space-y-6">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--primary)]" /> System Architecture
              </h2>

              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] font-mono text-xs text-[var(--text-secondary)] space-y-2 overflow-x-auto">
                <p className="text-[var(--primary)] font-bold">// High-Level Architecture Flow</p>
                <p>Browser (React 18 / Vite / TS / Tailwind) ──[HTTPS JSON / Bearer JWT]──▶ FastAPI Backend</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;├── Security Middleware (10MB body cap, security headers, rate limiting)</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;├── AI Intelligence Router (Google Gemini 2.0 Flash with deterministic fallback)</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;├── Domain Services (Readiness Engine, Budget Economics, Timeline Scheduler)</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;└── Persistence Layer (Dual-Mode: Supabase PostgreSQL + RLS / In-Memory Demo Store)</p>
              </div>

              <div className="border-t border-[var(--border)] pt-6">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-3">
                  Technology Stack Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                    <span className="text-xs font-bold text-[var(--primary)] block">Frontend</span>
                    <span className="text-xs text-[var(--text-primary)] font-semibold block">React 18 + Vite + TS</span>
                    <p className="text-[11px] text-[var(--text-secondary)]">Tailwind CSS v3, Framer Motion, Recharts, Lucide Icons</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                    <span className="text-xs font-bold text-[var(--accent)] block">Backend API</span>
                    <span className="text-xs text-[var(--text-primary)] font-semibold block">FastAPI + Python 3.11</span>
                    <p className="text-[11px] text-[var(--text-secondary)]">Pydantic v2, Uvicorn ASGI, sliding-window rate limiters</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                    <span className="text-xs font-bold text-purple-600 block">AI Engine</span>
                    <span className="text-xs text-[var(--text-primary)] font-semibold block">Google Gemini 2.0 Flash</span>
                    <p className="text-[11px] text-[var(--text-secondary)]">`google-genai` SDK with strict JSON schema parsing</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                    <span className="text-xs font-bold text-emerald-600 block">Database &amp; Auth</span>
                    <span className="text-xs text-[var(--text-primary)] font-semibold block">Supabase PostgreSQL 15</span>
                    <p className="text-[11px] text-[var(--text-secondary)]">Row Level Security (RLS), Supabase Auth, UUID primary keys</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 4: SECURITY ── */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card variant="default" padding="lg" className="space-y-6">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Security, Privacy &amp; Data Integrity
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" /> PostgreSQL Row Level Security (RLS)
                  </span>
                  <p className="text-xs text-[var(--text-secondary)]">
                    All 10 database tables enforce PostgreSQL RLS policies (`auth.uid() = user_id`). Users can never query, read, or modify celebrations belonging to other accounts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-[var(--accent)]" /> CSV Formula Injection Shield
                  </span>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Cells starting with formula symbols (`=`, `+`, `-`, `@`, `\t`, `\r`) are automatically prepended with a single quote (`'`), eliminating Excel/Calc DDE remote execution vulnerabilities.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[var(--primary)]" /> Zero Hardcoded Secrets
                  </span>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Automated regex audit confirms 0 hardcoded API keys or passwords. All sensitive parameters read exclusively from environment variables (`.env`).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                  <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[var(--warning)]" /> DoS Defense &amp; Rate Limiting
                  </span>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Sliding-window IP rate limiters guard authentication endpoints (10 req/min) and general endpoints (120 req/min). Middleware limits requests to 10MB max body payload.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 5: DEPLOYMENT & COSTS ── */}
        {activeTab === 'deployment' && (
          <div className="space-y-6">
            <Card variant="default" padding="lg" className="space-y-6">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] flex items-center gap-2">
                <Server className="w-5 h-5 text-[var(--primary)]" /> Deployment Strategy &amp; Cost Analysis
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                  <span className="text-xs font-bold text-[var(--primary)] block">Frontend (Vercel)</span>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Configured via `vercel.json` and `_redirects`. Instant global CDN edge delivery with automated preview deployments.
                  </p>
                  <span className="text-[11px] text-[var(--text-muted)] block">Cost: Free Hobby Tier (100GB bandwidth)</span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                  <span className="text-xs font-bold text-[var(--accent)] block">Backend (Render / Railway)</span>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Configured with `Procfile`, `render.yaml`, and multi-stage `Dockerfile`. Runs Uvicorn ASGI server with `/api/health` probes.
                  </p>
                  <span className="text-[11px] text-[var(--text-muted)] block">Cost: Free / Starter ($5/mo for 24/7 uptime)</span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                  <span className="text-xs font-bold text-emerald-600 block">Database (Supabase)</span>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Applied via SQL migration script `001_initial_schema.sql` or `apply_migrations.py`. Full managed PostgreSQL.
                  </p>
                  <span className="text-[11px] text-[var(--text-muted)] block">Cost: Free Tier (500MB DB, 50k MAU)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[var(--accent)]" /> Google Gemini API Tier &amp; Cost Transparency
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Google Gemini 2.0 Flash offers a generous <strong>Free Tier</strong> (up to 15 requests/minute, 1,500 requests/day at zero cost). For production scale, pay-as-you-go pricing applies at ~$0.10 per 1M input tokens and ~$0.40 per 1M output tokens. If credentials expire or are omitted, Festiva's <strong>Zero-Config Fallback Engine</strong> automatically guarantees flawless operation.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 6: 12-STEP WALKTHROUGH ── */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <Card variant="default" padding="lg" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-xl text-[var(--text-primary)] flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-[var(--primary)]" /> 12-Step Demonstration Walkthrough
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Reliable script for evaluating judges and challenge reviewers.
                  </p>
                </div>
                <Link to="/dashboard">
                  <Button variant="accent" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Start Demo in Studio
                  </Button>
                </Link>
              </div>

              <div className="space-y-2.5">
                {[
                  { step: 1, action: 'Open Landing Page', target: '/', desc: 'Review hero, celebration ribbon branding, and feature grid.' },
                  { step: 2, action: 'Create a Sample Event', target: '/events/new', desc: '4-step wizard with real-time validation (Wedding, 120 guests, ₹15,00,000).' },
                  { step: 3, action: 'Generate AI Event Plan', target: '/dashboard', desc: 'Synthesizes complete 10-section blueprint in ~10 seconds.' },
                  { step: 4, action: 'Review Budget Allocation', target: '/dashboard?tab=budget', desc: 'Examine Recharts pie chart breakdown and logged expense records.' },
                  { step: 5, action: 'Run Budget Rescue', target: '/dashboard?tab=budget', desc: 'Trigger rescue analysis on overruns to view algorithmic clawback tradeoffs.' },
                  { step: 6, action: 'Review Generated Timeline', target: '/dashboard?tab=timeline', desc: 'Inspect 7 preparation stages with priority flags, costs, and dependencies.' },
                  { step: 7, action: 'Compare Vendors', target: '/dashboard?tab=vendors', desc: 'Select 2 caterers or venues and run AI quotation comparison.' },
                  { step: 8, action: 'Update a Guest RSVP', target: '/dashboard?tab=guests', desc: 'Change RSVP from Invited to Confirmed; check updated catering headcount.' },
                  { step: 9, action: 'Ask AI Copilot a Question', target: '/dashboard?tab=copilot', desc: 'Ask "What tasks should I finish this week?" and view Action Preview Card.' },
                  { step: 10, action: 'Switch to Dark Mode & Refresh', target: '/dashboard', desc: 'Click moon icon in navbar; refresh page to verify theme persistence.' },
                  { step: 11, action: 'Inspect Event Readiness Score', target: '/dashboard', desc: 'Review 100-point formula breakdown and the prioritized Next Best Move.' },
                  { step: 12, action: 'Return to Light Mode', target: '/dashboard', desc: 'Click sun icon to return to warm celebration theme.' },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all"
                  >
                    <span className="w-6 h-6 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-[var(--text-primary)]">{item.action}</span>
                        <Link to={item.target} className="text-[11px] font-semibold text-[var(--primary)] hover:underline flex items-center gap-1">
                          Jump to view <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 7: LIMITATIONS & ROADMAP ── */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <Card variant="default" padding="lg" className="space-y-6">
              <div>
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[var(--warning)]" /> Known Honest Limitations
                </h2>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
                    <span className="font-bold text-[var(--text-primary)] block">No Real Financial Processing Gateway</span>
                    <p>Payments are logged as financial tracking milestones and records rather than real banking/card debits.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
                    <span className="font-bold text-[var(--text-primary)] block">Simulated WhatsApp/SMS Gateway</span>
                    <p>Invitation tracking uses manual status tracking tags rather than live telecommunications SMS gateways.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
                    <span className="font-bold text-[var(--text-primary)] block">Free-Tier Cloud Cold Starts</span>
                    <p>Free instances on hosting platforms (like Render or Railway) may incur a 30-second cold-start delay if inactive.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-6">
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[var(--primary)]" /> Production Roadmap
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                    <span className="font-bold text-xs text-[var(--primary)] block">Phase 1: Real Payment Rails</span>
                    <p className="text-xs text-[var(--text-secondary)]">Stripe / Razorpay milestone escrow contracts for vendor booking advances.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                    <span className="font-bold text-xs text-[var(--primary)] block">Phase 2: Live WhatsApp Business API</span>
                    <p className="text-xs text-[var(--text-secondary)]">Direct interactive WhatsApp RSVPs with automatic dietary capture.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                    <span className="font-bold text-xs text-[var(--accent)] block">Phase 3: 2D Spatial Floor Planner</span>
                    <p className="text-xs text-[var(--text-secondary)]">Interactive drag-and-drop table arrangements, stage placement, and acoustic zones.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-1">
                    <span className="font-bold text-xs text-[var(--accent)] block">Phase 4: Multi-Planner Real-Time Sync</span>
                    <p className="text-xs text-[var(--text-secondary)]">WebSockets for collaborative co-planning between family members and wedding planners.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
