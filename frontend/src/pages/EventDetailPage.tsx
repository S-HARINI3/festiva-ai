import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Calendar, MapPin, Users, DollarSign,
  Clock, CheckCircle, Palette, Lightbulb, ArrowLeft, Save,
  ChevronDown, ChevronUp, Loader2, Check, RefreshCw,
  AlertTriangle, ShieldAlert, Utensils, Music, CheckCircle2,
  Copy, HelpCircle, Info, Edit2, Sliders, Coins
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import type { EventPlan } from '../types/events';
import { EVENT_TYPE_EMOJIS, EVENT_TYPE_LABELS } from '../types/events';
import { formatDate, daysUntilEvent } from '../utils/helpers';
import {
  saveEventPlan, getEvent,
  generatePlanForEvent, regenerateSection
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Card,
  Button,
  Badge,
  useToast,
  EmptyState,
  Dialog,
} from '../components/ui';

// Tailored Chart Palettes
const LIGHT_CHART_COLORS = [
  '#713B70',
  '#D8B477',
  '#23856D',
  '#C18432',
  '#9B639A',
  '#588399',
  '#D65F68',
  '#B692C4',
];

const DARK_CHART_COLORS = [
  '#C8A8F0',
  '#E2C18C',
  '#70D5B0',
  '#E6A9C4',
  '#F0C477',
  '#7AC5EB',
  '#FF929C',
  '#DBBCFA',
];

const FRIENDLY_LOADING_STEPS = [
  'Synthesizing event concept and design direction...',
  'Curating color swatches, decor guidance, and atmosphere...',
  'Calculating mathematically consistent category allocations...',
  'Sequencing preparation milestones & run-of-show schedule...',
  'Analyzing supplier procurement lead times & questions...',
  'Structuring guest capacity and dietary breakdown matrix...',
  'Formulating culinary highlights and entertainment lineup...',
  'Assessing planning risks & practical contingencies...',
  'Polishing bespoke personalized celebration ideas...',
];

// ── Sub-Components ─────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  sectionKey,
  onRegenerate,
  children,
  defaultOpen = true,
  badgeText,
}: {
  title: string;
  icon: React.ElementType;
  sectionKey?: string;
  onRegenerate?: (sectionKey: string) => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badgeText?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card variant="default" padding="none" className="overflow-hidden border-[var(--border)] shadow-xs">
      <div className="w-full flex items-center justify-between p-5 hover:bg-[var(--surface-elevated)] transition-colors">
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center gap-3 text-left select-none cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/15 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">{title}</h3>
            {badgeText && (
              <Badge variant="secondary" size="sm">
                {badgeText}
              </Badge>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          {sectionKey && onRegenerate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate(sectionKey);
              }}
              title={`Regenerate ${title} with AI`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[11px] font-semibold text-[var(--text-secondary)] transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {open && <div className="px-5 pb-6 border-t border-[var(--border)] pt-5">{children}</div>}
    </Card>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { success, error: toastError, info: toastInfo } = useToast();

  const [plan, setPlan] = useState<EventPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Full blueprint re-generation state
  const [isGeneratingFull, setIsGeneratingFull] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  // Section regeneration modal state
  const [activeRegenSection, setActiveRegenSection] = useState<string | null>(null);
  const [regenInstructions, setRegenInstructions] = useState('');
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);

  // Editable Budget Category state
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editAmountVal, setEditAmountVal] = useState<string>('');

  // Initial Data Load
  useEffect(() => {
    const statePlan = (location.state as any)?.plan as EventPlan | undefined;
    if (statePlan) {
      setPlan(statePlan);
      setLoading(false);
      return;
    }

    const stored = sessionStorage.getItem('festiva_latest_plan');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!id || parsed.event_id === id) {
          setPlan(parsed);
          setLoading(false);
          return;
        }
      } catch {}
    }

    if (id) {
      const targetUser = user?.id || 'demo-user-001';
      setLoading(true);
      getEvent(id, targetUser)
        .then((evt) => {
          if (evt?.plan_data) {
            setPlan(evt.plan_data);
            setSaved(true);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, user]);

  // Loading steps cycling for friendly generation feedback
  useEffect(() => {
    if (!isGeneratingFull) return;
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % FRIENDLY_LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isGeneratingFull]);

  // Handle Full Plan Generation
  const handleRegenerateFullPlan = async () => {
    if (!id || isGeneratingFull) return;
    setIsGeneratingFull(true);
    setLoadingStepIdx(0);
    const targetUser = user?.id || 'demo-user-001';

    try {
      const freshPlan = await generatePlanForEvent(id, targetUser);
      setPlan(freshPlan);
      sessionStorage.setItem('festiva_latest_plan', JSON.stringify(freshPlan));
      setSaved(true);
      success('Complete AI celebration blueprint refreshed and mathematically balanced!');
    } catch (e: any) {
      toastError(e.message || 'Generation failed. Please try again.');
    } finally {
      setIsGeneratingFull(false);
    }
  };

  // Handle Targeted Section Regeneration
  const handleOpenRegenModal = (sectionKey: string) => {
    setActiveRegenSection(sectionKey);
    setRegenInstructions('');
  };

  const handleExecuteSectionRegen = async () => {
    if (!id || !activeRegenSection || !plan) return;
    setIsRegeneratingSection(true);
    const targetUser = user?.id || 'demo-user-001';

    try {
      const res = await regenerateSection(id, activeRegenSection, regenInstructions, targetUser);
      if (res && res.data) {
        setPlan((prev) => {
          if (!prev) return null;
          const updated = { ...prev };
          const sec = activeRegenSection;

          if (sec === 'concept') {
            updated.event_concept = res.data;
            updated.concept = res.data;
            if (res.data.title) updated.event_name = res.data.title;
          } else if (sec === 'theme') {
            updated.theme_details = res.data;
          } else if (sec === 'budget') {
            updated.budget_plan = res.data;
            updated.budget = res.data;
            if (res.data.categories) updated.budget_breakdown = res.data.categories;
          } else if (sec === 'timeline') {
            updated.timeline_plan = res.data;
            if (res.data.day_of_schedule) updated.timeline = res.data.day_of_schedule;
          } else if (sec === 'vendors') {
            updated.vendor_checklist_detailed = res.data;
            updated.vendor_checklist = res.data;
          } else if (sec === 'guest_plan') {
            updated.guest_management_plan = res.data;
            updated.guest_plan = res.data;
          } else if (sec === 'food_and_entertainment') {
            updated.food_and_entertainment = res.data;
          } else if (sec === 'risks') {
            updated.risks_and_contingencies = res.data;
          } else if (sec === 'personalized_ideas') {
            updated.personalized_ideas = res.data;
          } else if (sec === 'next_actions') {
            updated.next_actions = res.data;
          }

          sessionStorage.setItem('festiva_latest_plan', JSON.stringify(updated));
          return updated;
        });

        setSaved(false);
        success(`Successfully updated ${activeRegenSection.replace(/_/g, ' ')}!`);
        setActiveRegenSection(null);
      }
    } catch (e: any) {
      toastError(e.message || 'Section regeneration failed.');
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  // Handle Save to Portfolio
  const handleSave = async () => {
    if (!plan || saving) return;
    setSaving(true);
    const targetUser = user?.id || 'demo-user-001';
    try {
      await saveEventPlan(targetUser, plan);
      setSaved(true);
      success(`"${plan.event_name}" saved to your studio portfolio!`);
    } catch (e: any) {
      toastError(e.message || 'Failed to save event plan');
    } finally {
      setSaving(false);
    }
  };

  // Toggle milestone completed state
  const handleToggleMilestone = (milestoneId: string) => {
    setPlan((prev) => {
      if (!prev || !prev.timeline_plan?.preparation_milestones) return prev;
      const updatedMilestones = prev.timeline_plan.preparation_milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const updated = {
        ...prev,
        timeline_plan: {
          ...prev.timeline_plan,
          preparation_milestones: updatedMilestones,
        },
      };
      setSaved(false);
      return updated;
    });
  };

  // Toggle Personalized Idea Accepted/Rejected
  const handleToggleIdea = (ideaId: string, accept: boolean) => {
    setPlan((prev) => {
      if (!prev || !prev.personalized_ideas) return prev;
      const updatedIdeas = prev.personalized_ideas.map((idea) =>
        idea.id === ideaId ? { ...idea, accepted: accept } : idea
      );
      setSaved(false);
      return { ...prev, personalized_ideas: updatedIdeas };
    });
  };

  // Toggle Next Action Completed/Accepted
  const handleToggleAction = (stepNumber: number) => {
    setPlan((prev) => {
      if (!prev || !prev.next_actions) return prev;
      const updated = prev.next_actions.map((act) =>
        act.step_number === stepNumber ? { ...act, accepted: !act.accepted } : act
      );
      setSaved(false);
      return { ...prev, next_actions: updated };
    });
  };

  // Editable Budget Category: save edit and deterministically adjust contingency
  const handleSaveCategoryEdit = (idx: number) => {
    if (!plan) return;
    const newAmt = parseFloat(editAmountVal);
    if (isNaN(newAmt) || newAmt < 0) {
      toastError('Please enter a valid non-negative amount');
      return;
    }

    const currentCats = plan.budget_plan?.categories || plan.budget_breakdown || [];
    const totalBudget = plan.total_estimated_budget;

    const updatedCats = currentCats.map((cat, i) =>
      i === idx ? { ...cat, estimated_amount: newAmt, allocated_amount: newAmt } : cat
    );

    const totalAllocated = updatedCats.reduce((sum, c) => sum + c.estimated_amount, 0);
    const newContingency = Math.max(0, Math.round((totalBudget - totalAllocated) * 100) / 100);

    // Recalculate percentages
    const finalCats = updatedCats.map((cat) => ({
      ...cat,
      percentage: totalBudget > 0 ? Math.round((cat.estimated_amount / totalBudget) * 1000) / 10 : 0,
    }));

    setPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        budget_breakdown: finalCats,
        budget_plan: prev.budget_plan
          ? {
              ...prev.budget_plan,
              categories: finalCats,
              contingency_amount: newContingency,
            }
          : undefined,
        budget: prev.budget
          ? {
              ...prev.budget,
              categories: finalCats,
              contingency_amount: newContingency,
            }
          : undefined,
      };
    });

    setEditingCategoryIdx(null);
    setSaved(false);
    success('Budget allocation updated with deterministic contingency balancing!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Rendering Celebration Blueprint...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <EmptyState
          title="Event Blueprint Not Found"
          description="We couldn't locate this celebration plan. It may have expired or been removed."
          action={
            <Link to="/events/new">
              <Button variant="primary">Plan a New Event</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const daysLeft = daysUntilEvent(plan.event_date);
  const chartColors = isDark ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;

  const budgetPlan = plan.budget_plan || plan.budget;
  const categories = budgetPlan?.categories || plan.budget_breakdown || [];
  const feasibility = budgetPlan?.feasibility;
  const concept = plan.event_concept || plan.concept;
  const theme = plan.theme_details;
  const timelinePlan = plan.timeline_plan;
  const milestones = timelinePlan?.preparation_milestones || [];
  const daySchedule = timelinePlan?.day_of_schedule || plan.timeline || [];
  const detailedVendors = plan.vendor_checklist_detailed || [];
  const guestMgmt = plan.guest_management_plan;
  const foodAndEnt = plan.food_and_entertainment;
  const risks = plan.risks_and_contingencies || [];
  const ideas = plan.personalized_ideas || [];
  const nextActions = plan.next_actions || [];

  return (
    <div className="py-10 px-4 sm:px-6 bg-[var(--background)] min-h-screen transition-colors duration-250">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top return link & Engine Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Studio Dashboard
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {plan.demo ? (
              <Badge variant="accent" size="sm" className="gap-1.5 py-1 px-2.5">
                <Sparkles className="w-3 h-3 text-[var(--accent-text)]" />
                Festiva Demo Engine (Regional Models)
              </Badge>
            ) : (
              <Badge variant="success" size="sm" className="gap-1.5 py-1 px-2.5">
                <Sparkles className="w-3 h-3" />
                Gemini 2.0 Flash AI Active
              </Badge>
            )}

            <Badge variant="secondary" size="sm" className="gap-1 py-1 px-2">
              <Info className="w-3 h-3" /> Estimates Only
            </Badge>
          </div>
        </div>

        {/* Header Hero Card */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="default" padding="lg" className="border-[var(--border)] shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl p-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                    {EVENT_TYPE_EMOJIS[plan.event_type] || '🎉'}
                  </span>
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                      {concept?.title || plan.event_name}
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                        {EVENT_TYPE_LABELS[plan.event_type] || plan.event_type}
                      </span>
                      {concept?.concept && (
                        <span className="text-xs text-[var(--text-secondary)]">
                          • {concept.concept}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl mt-2">
                  {concept?.description || plan.summary}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRegenerateFullPlan}
                  isLoading={isGeneratingFull}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[var(--primary)]" />}
                >
                  Regenerate Blueprint
                </Button>

                <Button
                  variant={saved ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={handleSave}
                  isLoading={saving}
                  disabled={saved}
                  leftIcon={saved ? <CheckCircle className="w-4 h-4 text-[var(--success)]" /> : <Save className="w-4 h-4" />}
                >
                  {saved ? 'Saved to Portfolio' : 'Save Plan'}
                </Button>
              </div>
            </div>

            {/* Metadata strip */}
            <div className="flex flex-wrap gap-4 mt-6 pt-5 border-t border-[var(--border)]">
              {[
                { icon: Calendar, label: formatDate(plan.event_date) },
                { icon: MapPin, label: plan.location },
                { icon: Users, label: `${plan.guest_count} Guests` },
                { icon: DollarSign, label: `${plan.currency || 'INR'} ${plan.total_estimated_budget.toLocaleString()}` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <Icon className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
              {daysLeft > 0 && (
                <Badge variant="accent" size="sm" className="ml-auto">
                  <Clock className="w-3 h-3" /> {daysLeft} days away
                </Badge>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── SECTION 1: EVENT CONCEPT ────────────────────────────────────────── */}
        <SectionCard
          title="1. Event Concept & Creative Direction"
          icon={Sparkles}
          sectionKey="concept"
          onRegenerate={handleOpenRegenModal}
          badgeText="Vision"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
              <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">
                Personalized Concept Statement
              </span>
              <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
                {concept?.concept_statement || concept?.concept || 'Bespoke Celebration Blueprint'}
              </p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1">
                {concept?.description || plan.summary}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/15 space-y-2">
              <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3 h-3" /> Spatial & Design Direction
              </span>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                {concept?.design_direction || 'Warm lighting, authentic textures, intuitive guest zones, and celebratory focal points.'}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── SECTION 2: THEME & ATMOSPHERE ───────────────────────────────────── */}
        <SectionCard
          title="2. Theme, Decor & Atmosphere"
          icon={Palette}
          sectionKey="theme"
          onRegenerate={handleOpenRegenModal}
          badgeText={theme?.theme_name || 'Curated'}
        >
          <div className="space-y-5">
            {/* Color Palette Swatches */}
            <div>
              <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">
                Curated Color Palette (Click swatch to copy hex code)
              </span>
              <div className="flex flex-wrap gap-2.5">
                {(theme?.color_palette || theme?.palette || ['#713B70', '#D8B477', '#23856D', '#C18432', '#E9DDF3']).map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(hex);
                      toastInfo(`Copied color ${hex} to clipboard!`);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] transition-all cursor-pointer shadow-2xs group"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-inner"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs font-mono font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                      {hex}
                    </span>
                    <Copy className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            {/* Atmosphere, Dress Code & Lighting Grid */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Atmosphere
                </span>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {theme?.atmosphere || 'Warm, regal, and welcoming'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Dress Code
                </span>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {theme?.dress_code || 'Smart Festive Formal'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Lighting Direction
                </span>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {theme?.lighting || '2700K warm ambient wash'}
                </p>
              </div>
            </div>

            {/* Decor Elements */}
            <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider block mb-1">
                Floral & Scenic Installations
              </span>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                {theme?.decorations || 'Traditional marigold garlands, brass urli with floating candles, and woven floral arches.'}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── SECTION 3: BUDGET INTELLIGENCE & FEASIBILITY ────────────────────── */}
        <SectionCard
          title="3. Budget Allocation & Feasibility Intelligence"
          icon={DollarSign}
          sectionKey="budget"
          onRegenerate={handleOpenRegenModal}
          badgeText="Deterministic Math"
        >
          <div className="space-y-6">
            {/* Feasibility Indicator */}
            {feasibility && (
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  feasibility.is_feasible
                    ? 'bg-[var(--success)]/10 border-[var(--success)]/25 text-[var(--text-primary)]'
                    : 'bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--text-primary)]'
                }`}
              >
                {feasibility.is_feasible ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {feasibility.is_feasible ? 'Feasible & Balanced Allocation' : 'Budget Feasibility Alert'}
                    </span>
                    <Badge variant={feasibility.is_feasible ? 'success' : 'warning'} size="sm">
                      Score: {feasibility.feasibility_score}/100
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {feasibility.feasibility_analysis || feasibility.feasibility_verdict}
                  </p>

                  {/* Cost-saving recommendations if tight */}
                  {feasibility.cost_saving_alternatives && feasibility.cost_saving_alternatives.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold block mb-1">
                        Recommended Cost-Saving Alternatives:
                      </span>
                      <ul className="space-y-1">
                        {feasibility.cost_saving_alternatives.map((alt, i) => (
                          <li key={i} className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pie Chart & Interactive Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="estimated_amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categories.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors[index % chartColors.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        `${plan.currency || 'INR'} ${Number(val).toLocaleString()}`,
                        'Estimated Allocation',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Editable Category Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] pb-1 border-b border-[var(--border)]">
                  <span>Category</span>
                  <span>Allocation & Percentage</span>
                </div>
                {categories.map((cat, idx) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between py-2 border-b border-[var(--border)]/50 text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                      />
                      <span className="text-[var(--text-primary)] font-medium truncate">
                        {cat.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {editingCategoryIdx === idx ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editAmountVal}
                            onChange={(e) => setEditAmountVal(e.target.value)}
                            className="w-24 px-2 py-0.5 text-xs rounded border border-[var(--primary)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCategoryEdit(idx)}
                            className="p-1 rounded bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-primary)]">
                            {plan.currency || 'INR'} {cat.estimated_amount.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] w-10 text-right">
                            {cat.percentage}%
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryIdx(idx);
                              setEditAmountVal(cat.estimated_amount.toString());
                            }}
                            title="Edit allocation amount"
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {budgetPlan?.contingency_amount !== undefined && (
                  <div className="flex justify-between items-center py-2 text-xs font-semibold text-[var(--accent-text)] pt-2">
                    <span>Reserve Contingency (Buffer)</span>
                    <span>
                      {plan.currency || 'INR'} {budgetPlan.contingency_amount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Budget Studio & Rescue Banner Link */}
            <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[var(--primary)]" />
                  <span className="font-display font-bold text-xs text-[var(--text-primary)]">
                    Smart Budget Studio &amp; Budget Rescue Feature
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Record actual expenses, compare planned vs. actual allocations, or launch the AI Rescue Engine.
                </p>
              </div>

              <Link
                to="/dashboard?tab=budget"
                className="px-3.5 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs"
              >
                <span>Launch Budget Studio</span>
              </Link>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] italic">
              * Pricing Transparency Notice: All vendor and category allocations are regional market estimates for feasibility planning and do not represent binding supplier contracts.
            </p>
          </div>
        </SectionCard>

        {/* ── SECTION 4: TIMELINE & PREPARATION MILESTONES ────────────────────── */}
        <SectionCard
          title="4. Timeline & Preparation Milestones"
          icon={Clock}
          sectionKey="timeline"
          onRegenerate={handleOpenRegenModal}
          badgeText={`${milestones.length} Milestones`}
        >
          <div className="space-y-6">
            {/* Preparation Countdown Milestones */}
            <div>
              <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider block mb-3">
                Countdown Milestones & Preparation Tasks
              </span>
              <div className="space-y-2.5">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMilestone(m.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      m.completed
                        ? 'bg-[var(--success)]/5 border-[var(--success)]/20 text-[var(--text-muted)]'
                        : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    <div className="mt-0.5">
                      {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[var(--text-muted)]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${m.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                          {m.milestone}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant={m.priority === 'high' ? 'danger' : m.priority === 'medium' ? 'warning' : 'secondary'} size="sm">
                            {m.priority}
                          </Badge>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {m.timeframe}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {m.action_required}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day-of Schedule */}
            <div>
              <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider block mb-3">
                Day-of Celebration Run of Show
              </span>
              <div className="relative pl-6 border-l-2 border-[var(--border)] space-y-4">
                {daySchedule.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[var(--primary)] ring-4 ring-[var(--surface)]" />
                    <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold font-mono text-[var(--primary)]">
                          {item.time} ({item.duration_minutes}m)
                        </span>
                        {item.responsible_party && (
                          <Badge variant="secondary" size="sm">
                            {item.responsible_party}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[var(--text-primary)] mt-1">
                        {item.activity}
                      </p>
                      {item.notes && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Link to Full Interactive Timeline Module */}
            <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--primary)]" />
                  <span className="font-display font-bold text-xs text-[var(--text-primary)]">
                    Interactive Timeline &amp; Task Checklist
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  7-stage task management, deadline tracking, calendar view, and stage-by-stage regeneration.
                </p>
              </div>

              <Link
                to="/dashboard?tab=timeline"
                className="px-3.5 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs"
              >
                <span>Open Task Studio</span>
              </Link>
            </div>
          </div>
        </SectionCard>

        {/* ── SECTION 5: VENDOR ROADMAP & CHECKLIST ───────────────────────────── */}
        <SectionCard
          title="5. Vendor Checklist & Procurement Lead Times"
          icon={CheckCircle}
          sectionKey="vendors"
          onRegenerate={handleOpenRegenModal}
          badgeText="Transparent Estimates"
        >
          <div className="space-y-3">
            {(detailedVendors.length > 0 ? detailedVendors : plan.vendor_checklist).map((v: any, idx: number) => (
              <div
                key={v.id || idx}
                className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--primary)]">
                      {v.category}
                    </span>
                    <span className="text-xs text-[var(--text-primary)] font-medium">
                      • {v.vendor_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" size="sm">
                      {v.lead_time_days ? `Book ${v.lead_time_days} days prior` : 'Book in advance'}
                    </Badge>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      ~ {plan.currency || 'INR'} {v.estimated_cost?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {v.selection_criteria && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">Selection Criteria: </span>
                    {v.selection_criteria}
                  </p>
                )}

                {v.questions_to_ask && v.questions_to_ask.length > 0 && (
                  <div className="pt-1.5 border-t border-[var(--border)]/50">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                      Key Questions to Ask Supplier:
                    </span>
                    <ul className="grid sm:grid-cols-2 gap-1">
                      {v.questions_to_ask.map((q: string, qIdx: number) => (
                        <li key={qIdx} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                          <HelpCircle className="w-3 h-3 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── SECTION 6: GUEST PLAN & ACCESSIBILITY ───────────────────────────── */}
        <SectionCard
          title="6. Guest Experience & Accessibility Matrix"
          icon={Users}
          sectionKey="guest_plan"
          onRegenerate={handleOpenRegenModal}
          badgeText={`${plan.guest_count} Capacity`}
        >
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-0.5">
                  Expected Headcount
                </span>
                <span className="text-lg font-bold font-display text-[var(--text-primary)]">
                  {guestMgmt?.total_guests || plan.guest_plan.total_guests}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-0.5">
                  VIP Family & Dignitaries
                </span>
                <span className="text-lg font-bold font-display text-[var(--primary)]">
                  {guestMgmt?.vip_guests || plan.guest_plan.vip_guests}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-0.5">
                  General Guest Matrix
                </span>
                <span className="text-lg font-bold font-display text-[var(--text-primary)]">
                  {guestMgmt?.regular_guests || plan.guest_plan.regular_guests}
                </span>
              </div>
            </div>

            {/* Dietary Matrix */}
            {guestMgmt?.dietary_matrix && Object.keys(guestMgmt.dietary_matrix).length > 0 && (
              <div>
                <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">
                  Dietary Requirements Distribution
                </span>
                <div className="grid sm:grid-cols-3 gap-2">
                  {Object.entries(guestMgmt.dietary_matrix).map(([diet, count]) => (
                    <div key={diet} className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex justify-between items-center text-xs">
                      <span className="font-medium text-[var(--text-primary)]">{diet}</span>
                      <Badge variant="secondary" size="sm">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accessibility Accommodations */}
            {guestMgmt?.accessibility_accommodations && (
              <div>
                <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                  Accessibility & Inclusivity Accommodations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {guestMgmt.accessibility_accommodations.map((acc, i) => (
                    <Badge key={i} variant="primary" size="sm">
                      {acc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── SECTION 7: FOOD AND ENTERTAINMENT ───────────────────────────────── */}
        <SectionCard
          title="7. Food & Entertainment Experience"
          icon={Utensils}
          sectionKey="food_and_entertainment"
          onRegenerate={handleOpenRegenModal}
          badgeText="Hospitality"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider block mb-1">
                Dining Style & Service Model
              </span>
              <p className="text-xs text-[var(--text-primary)] font-medium">
                {foodAndEnt?.dining_style || 'Multi-course culinary experience with live interactive stations.'}
              </p>
            </div>

            {/* Menu Highlights */}
            <div>
              <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">
                Curated Signature Menu Highlights
              </span>
              <div className="grid sm:grid-cols-2 gap-2">
                {(foodAndEnt?.curated_menu_highlights || foodAndEnt?.menu_recommendations || []).map((dish, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center gap-2 text-xs">
                    <Utensils className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
                    <span className="font-medium text-[var(--text-primary)]">{dish}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entertainment Lineup */}
            <div>
              <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">
                Music & Entertainment Lineup
              </span>
              <div className="space-y-2">
                {(foodAndEnt?.entertainment_lineup || foodAndEnt?.entertainment_options || []).map((act, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/15 flex items-center gap-2 text-xs">
                    <Music className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
                    <span className="text-[var(--text-primary)] font-medium">{act}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acoustic Guidelines */}
            {foodAndEnt?.sound_and_lighting_notes && (
              <p className="text-xs text-[var(--text-muted)] italic">
                * Acoustics: {foodAndEnt.sound_and_lighting_notes}
              </p>
            )}
          </div>
        </SectionCard>

        {/* ── SECTION 8: RISKS AND CONTINGENCIES ─────────────────────────────── */}
        <SectionCard
          title="8. Risks & Contingency Planning"
          icon={ShieldAlert}
          sectionKey="risks"
          onRegenerate={handleOpenRegenModal}
          badgeText={`${risks.length} Scenarios`}
        >
          <div className="space-y-3">
            {risks.map((r, i) => (
              <div key={r.id || i} className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {r.risk_factor || r.risk}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={r.impact === 'high' ? 'danger' : 'warning'} size="sm">
                      Impact: {r.impact}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Preventive Mitigation: </strong>
                  {r.mitigation_strategy}
                </p>
                <p className="text-xs text-[var(--primary)]">
                  <strong className="text-[var(--text-primary)]">Day-of Contingency Plan: </strong>
                  {r.contingency_action || r.contingency_plan}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── SECTION 9: PERSONALIZED IDEAS (ACCEPT / REJECT) ────────────────── */}
        <SectionCard
          title="9. Personalized Creative Touches"
          icon={Lightbulb}
          sectionKey="personalized_ideas"
          onRegenerate={handleOpenRegenModal}
          badgeText="Accept / Reject"
        >
          <div className="grid md:grid-cols-2 gap-3.5">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  idea.accepted
                    ? 'bg-[var(--primary-light)] border-[var(--primary)]/30'
                    : 'bg-[var(--surface-elevated)] border-[var(--border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {idea.title}
                    </span>
                    {idea.estimated_additional_cost > 0 && (
                      <span className="text-[11px] font-semibold text-[var(--accent-text)]">
                        + {plan.currency || 'INR'} {idea.estimated_additional_cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {idea.description}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border)]/40">
                  <button
                    type="button"
                    onClick={() => handleToggleIdea(idea.id, false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      !idea.accepted
                        ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--danger)]'
                    }`}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleIdea(idea.id, true)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      idea.accepted
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-[var(--surface)] border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary-light)]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {idea.accepted ? 'Accepted' : 'Accept Idea'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── SECTION 10: NEXT ACTIONS (TOP 5 IMMEDIATE ACTIONS) ─────────────── */}
        <SectionCard
          title="10. Immediate Next Actions"
          icon={CheckCircle2}
          sectionKey="next_actions"
          onRegenerate={handleOpenRegenModal}
          badgeText="Top 5 Directives"
        >
          <div className="space-y-2.5">
            {nextActions.map((act) => (
              <div
                key={act.step_number}
                onClick={() => handleToggleAction(act.step_number)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  act.accepted
                    ? 'bg-[var(--success)]/5 border-[var(--success)]/20 text-[var(--text-muted)]'
                    : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--primary)]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)]">
                    {act.step_number}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${act.accepted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                      {act.action}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {act.category} • {act.timeframe}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={act.priority === 'high' ? 'danger' : act.priority === 'medium' ? 'warning' : 'secondary'} size="sm">
                    {act.priority}
                  </Badge>
                  {act.accepted ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[var(--text-muted)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Footer CTAs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-8">
          <Link to="/events/new">
            <Button variant="secondary" size="md">
              Plan Another Celebration
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={saving}
            disabled={saved}
            leftIcon={saved ? <CheckCircle className="w-4 h-4 text-[var(--success)]" /> : <Save className="w-4 h-4" />}
          >
            {saved ? 'Saved to Portfolio' : 'Save Celebration Plan'}
          </Button>
        </div>
      </div>

      {/* ── SECTION REGENERATION DIALOG ─────────────────────────────────────── */}
      <Dialog
        isOpen={Boolean(activeRegenSection)}
        onClose={() => setActiveRegenSection(null)}
        title={`Regenerate ${activeRegenSection?.replace(/_/g, ' ').toUpperCase()}`}
        description="Provide custom instructions to guide the AI synthesis for this section, or leave blank for a fresh creative perspective."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1.5">
              Custom Prompt Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={regenInstructions}
              onChange={(e) => setRegenInstructions(e.target.value)}
              placeholder="e.g. Focus on outdoor acoustic music and mocktail stations, or shift 10% from decor to photography..."
              className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveRegenSection(null)}
              disabled={isRegeneratingSection}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteSectionRegen}
              isLoading={isRegeneratingSection}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Regenerate Section
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── FULL BLUEPRINT GENERATION OVERLAY ───────────────────────────────── */}
      <AnimatePresence>
        {isGeneratingFull && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl text-center space-y-4"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  Synthesizing Celebration Masterplan
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Festiva AI is composing your customized 10-section event blueprint.
                </p>
              </div>

              {/* Cycling friendly message */}
              <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] min-h-[44px] flex items-center justify-center">
                <motion.p
                  key={loadingStepIdx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs font-medium text-[var(--primary)] font-mono"
                >
                  {FRIENDLY_LOADING_STEPS[loadingStepIdx]}
                </motion.p>
              </div>

              <div className="w-full bg-[var(--surface-elevated)] h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--primary)]"
                  animate={{
                    width: ['15%', '45%', '75%', '92%'],
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
