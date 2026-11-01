import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Palette,
  CheckCircle2,
  Clock,
  Save,
  X,
  AlertCircle,
  FileCheck,
  Music,
  Utensils,
  Camera,
  Home,
  Truck,
  Mail,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { generateEventPlan, saveEventPlan } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type {
  EventFormData,
  EventType,
  EventSetting,
  BudgetFlexibility,
  EventStyle,
} from '../types/events';
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_EMOJIS,
} from '../types/events';
import { formatCurrency } from '../utils/helpers';
import {
  Card,
  Button,
  Input,
  Textarea,
  CelebrationRibbon,
  Dialog,
  useToast,
} from '../components/ui';

// ── Validation Schema ────────────────────────────────────────────────────────

const todayStr = new Date().toISOString().split('T')[0];

const fullEventSchema = z.object({
  // Step 1: Basics
  event_name: z.string().min(2, 'Event name must be at least 2 characters').max(100),
  event_type: z.enum(['wedding', 'birthday', 'anniversary', 'college', 'community', 'corporate', 'other']),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().default(''),
  event_date: z.string().min(1, 'Please select a date').refine(
    (v) => !v || v >= todayStr,
    { message: 'Event date must be today or in the future' }
  ),
  start_time: z.string().optional().default('10:00'),
  end_time: z.string().optional().default('18:00'),
  location: z.string().min(2, 'Location is required (e.g. City or Venue)').max(200),
  setting: z.enum(['indoor', 'outdoor', 'hybrid']).default('indoor'),

  // Step 2: People
  guest_count: z.coerce.number().int().min(1, 'At least 1 guest required').max(10000, 'Maximum 10,000 guests'),
  adults_count: z.coerce.number().int().min(0).optional().default(0),
  children_count: z.coerce.number().int().min(0).optional().default(0),
  guest_preferences: z.string().max(400).optional().default(''),
  accessibility_requirements: z.array(z.string()).default([]),
  dietary_requirements: z.array(z.string()).default([]),

  // Step 3: Budget
  total_budget: z.coerce.number().min(1000, 'Budget must be at least ₹1,000 / $100').max(1000000000),
  currency: z.string().default('INR'),
  budget_flexibility: z.enum(['fixed', 'moderate', 'flexible']).default('moderate'),
  contingency_amount: z.coerce.number().min(0).optional().default(0),
  spending_priorities: z.array(z.string()).default([]),

  // Step 4: Style & Personalization
  preferred_theme: z.string().max(150).optional().default(''),
  color_palette: z.string().max(100).optional().default(''),
  style: z.enum(['formal', 'casual', 'traditional', 'modern', 'rustic', 'minimalist', 'luxury']).default('traditional'),
  cultural_preferences: z.string().max(300).optional().default(''),
  food_preferences: z.string().max(300).optional().default(''),
  entertainment_preferences: z.string().max(300).optional().default(''),
  must_have_elements: z.string().max(400).optional().default(''),
  things_to_avoid: z.string().max(400).optional().default(''),

  // Step 5: Priorities
  planning_priorities: z.record(z.string(), z.string()).default({}),
  custom_requirements: z.string().max(600).optional().default(''),
});

type FormValues = z.infer<typeof fullEventSchema>;

// Step-specific schemas for progressive validation
const step1Validation = fullEventSchema.pick({
  event_name: true,
  event_type: true,
  description: true,
  event_date: true,
  start_time: true,
  end_time: true,
  location: true,
  setting: true,
});

const step2Validation = fullEventSchema.pick({
  guest_count: true,
  adults_count: true,
  children_count: true,
  guest_preferences: true,
  accessibility_requirements: true,
  dietary_requirements: true,
});

const step3Validation = fullEventSchema.pick({
  total_budget: true,
  currency: true,
  budget_flexibility: true,
  contingency_amount: true,
  spending_priorities: true,
});

// ── Wizard Step Metadata ───────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: 1, title: 'Basics', label: 'Event Basics', icon: Calendar },
  { id: 2, title: 'People', label: 'Guests & Needs', icon: Users },
  { id: 3, title: 'Budget', label: 'Budget & Currencies', icon: DollarSign },
  { id: 4, title: 'Style', label: 'Style & Vibe', icon: Palette },
  { id: 5, title: 'Priorities', label: 'Vendor Priorities', icon: Sliders },
  { id: 6, title: 'Review', label: 'Review & Generate', icon: FileCheck },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) — Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) — British Pound' },
  { code: 'AED', symbol: 'AED', label: 'AED — UAE Dirham' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$) — Canadian Dollar' },
];

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair Ramps & Lifts',
  'Step-Free Access Throughout',
  'Ground Floor Accessible Restrooms',
  'Sign Language / Hearing Loop',
  'Quiet Sensory / Decompression Area',
  'Designated Senior Seating & Assistance',
  'Reserved Priority Parking',
];

const DIETARY_OPTIONS = [
  'Pure Vegetarian (No Meat/Fish)',
  'Jain Friendly (No Root Veg)',
  'Vegan (Plant-Based)',
  'Halal Certified',
  'Kosher Certified',
  'Gluten-Free',
  'Nut-Free / Severe Nut Allergy',
  'Dairy-Free / Lactose-Free',
];

const STYLE_OPTIONS: { id: EventStyle; label: string; desc: string }[] = [
  { id: 'traditional', label: 'Traditional / Cultural', desc: 'Rooted in heritage customs, ritual decor & ethnic richness' },
  { id: 'modern', label: 'Modern & Contemporary', desc: 'Sleek aesthetics, architectural lighting & minimalist flow' },
  { id: 'luxury', label: 'Grand Luxury & Regal', desc: 'Opulent textures, gold leaf accents & five-star hospitality' },
  { id: 'rustic', label: 'Rustic & Bohemian', desc: 'Organic florals, wood accents, fairy lights & natural warmth' },
  { id: 'formal', label: 'Black-Tie Formal', desc: 'Strict dress code, seated service & executive etiquette' },
  { id: 'casual', label: 'Casual & Relaxed', desc: 'Comfort-first mingling, lounge seating & laid-back vibe' },
  { id: 'minimalist', label: 'Clean Minimalist', desc: 'Curated restraint, monochromatic palette & thoughtful details' },
];

const PRIORITY_CATEGORIES = [
  { id: 'venue', label: 'Venue & Space Rental', icon: Home },
  { id: 'catering', label: 'Catering & Food Service', icon: Utensils },
  { id: 'decorations', label: 'Decorations & Florals', icon: Sparkles },
  { id: 'photography', label: 'Photography & Cinema', icon: Camera },
  { id: 'entertainment', label: 'Entertainment & Music', icon: Music },
  { id: 'invitations', label: 'Invitations & Digital RSVPs', icon: Mail },
  { id: 'transport', label: 'Guest Transport & Shuttles', icon: Truck },
  { id: 'accommodation', label: 'Guest Hotel & Accommodation', icon: Home },
];

const DRAFT_STORAGE_KEY = 'festiva_event_draft';

// ── Main Component ─────────────────────────────────────────────────────────

export default function NewEventPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Initialize form
  const defaultType = (searchParams.get('type') as EventType) || 'wedding';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(fullEventSchema),
    mode: 'onBlur',
    defaultValues: {
      event_name: '',
      event_type: defaultType,
      description: '',
      event_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      start_time: '11:00',
      end_time: '19:00',
      location: '',
      setting: 'indoor',

      guest_count: 100,
      adults_count: 85,
      children_count: 15,
      guest_preferences: '',
      accessibility_requirements: [],
      dietary_requirements: ['Pure Vegetarian (No Meat/Fish)'],

      total_budget: 500000, // Default ₹5,00,000 for INR
      currency: 'INR',
      budget_flexibility: 'moderate',
      contingency_amount: 50000,
      spending_priorities: ['Catering & Food Service', 'Venue & Space Rental'],

      preferred_theme: 'Royal Marigold & Warm Amber Glow',
      color_palette: 'Marigold Yellow, Deep Plum, Champagne Gold',
      style: 'traditional',
      cultural_preferences: '',
      food_preferences: 'Multi-cuisine banquet with live chaat counters',
      entertainment_preferences: 'Live acoustic band & evening Sangeet DJ',
      must_have_elements: 'Drone aerial photography, flower petal shower entrance',
      things_to_avoid: 'Excessive plastic disposables, loud jarring audio',

      planning_priorities: {
        venue: 'high',
        catering: 'high',
        decorations: 'high',
        photography: 'medium',
        entertainment: 'medium',
        invitations: 'low',
        transport: 'low',
        accommodation: 'medium',
      },
      custom_requirements: '',
    },
  });

  const watchedCurrency = watch('currency') || 'INR';
  const watchedEventType = watch('event_type');
  const watchedSetting = watch('setting');
  const watchedStyle = watch('style');
  const watchedAccessibility = watch('accessibility_requirements') || [];
  const watchedDietary = watch('dietary_requirements') || [];
  const watchedSpendingPriorities = watch('spending_priorities') || [];
  const watchedPriorities = watch('planning_priorities') || {};

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        if (draft && draft.event_name) {
          setHasDraft(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const restoreDraft = () => {
    try {
      const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        reset(draft);
        setHasDraft(false);
        info('Draft restored successfully.');
      }
    } catch {
      toastError('Could not restore draft.');
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    info('Saved draft discarded.');
  };

  const handleSaveDraft = () => {
    try {
      const data = getValues();
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
      success('Draft saved successfully! You can resume planning anytime.');
    } catch {
      toastError('Failed to save draft locally.');
    }
  };

  // ── Step Navigation ────────────────────────────────────────────────────────

  const goToStep = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      setCurrentStep(stepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateAndProceed = () => {
    clearErrors();
    const values = getValues();

    if (currentStep === 1) {
      const result = step1Validation.safeParse(values);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          setError(issue.path[0] as any, { message: issue.message });
        });
        toastError('Please fill in all required event details.');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      const result = step2Validation.safeParse(values);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          setError(issue.path[0] as any, { message: issue.message });
        });
        toastError('Please provide valid guest estimates.');
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      const result = step3Validation.safeParse(values);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          setError(issue.path[0] as any, { message: issue.message });
        });
        toastError('Please specify a valid budget amount.');
        return;
      }
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 4) {
      setCurrentStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 5) {
      setCurrentStep(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Final Form Submission & Plan Generation ────────────────────────────────

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setGenError(null);
    setGenerationPhase(1);

    // Dynamic phase indicators for transparency
    const phaseTimer1 = setTimeout(() => setGenerationPhase(2), 1200);
    const phaseTimer2 = setTimeout(() => setGenerationPhase(3), 2600);

    try {
      // 1. Generate plan via AI service
      const payload: EventFormData = {
        ...data,
        budget_range:
          data.total_budget < 250000
            ? 'budget'
            : data.total_budget < 1000000
            ? 'moderate'
            : data.total_budget < 3000000
            ? 'premium'
            : 'luxury',
        theme_preferences: `${data.preferred_theme || ''} • Palette: ${data.color_palette || ''}`,
        special_requirements: `${data.must_have_elements ? `Must Haves: ${data.must_have_elements}. ` : ''}${
          data.things_to_avoid ? `Avoid: ${data.things_to_avoid}. ` : ''
        }${data.custom_requirements || ''}`,
      };

      const plan = await generateEventPlan(payload);

      // 2. Persist to server/store
      const userId = user?.id || 'demo-user-001';
      const saveRes = await saveEventPlan(userId, plan);

      if (!saveRes || !saveRes.event) {
        throw new Error('Could not persist event record. Please try again.');
      }

      // Clear draft since save succeeded
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.setItem('festiva_latest_plan', JSON.stringify(plan));
      success('Master Event Blueprint successfully generated and saved!');

      // 3. Navigate to the event workspace
      navigate(`/events/${plan.event_id}`, { state: { plan, fromWizard: true } });
    } catch (err: any) {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      const msg = err.message || 'Event generation failed. Please check your connection and retry.';
      setGenError(msg);
      toastError(msg);
      setIsGenerating(false);
    }
  };

  // Helper toggle for array fields
  const toggleArrayItem = (field: 'accessibility_requirements' | 'dietary_requirements' | 'spending_priorities', item: string) => {
    const current = getValues(field) || [];
    if (current.includes(item)) {
      setValue(field, current.filter((x) => x !== item), { shouldDirty: true });
    } else {
      setValue(field, [...current, item], { shouldDirty: true });
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-250">
      <div className="max-w-3xl mx-auto">
        {/* Top return link & header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Cancel Planning
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-[var(--primary)]" /> Save Draft
          </button>
        </div>

        {/* Draft Notice if available */}
        {hasDraft && currentStep === 1 && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-text)] flex-shrink-0" />
              You have an unsaved event draft in your browser. Would you like to resume?
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="accent" onClick={restoreDraft}>
                Resume Draft
              </Button>
              <button
                type="button"
                onClick={discardDraft}
                className="text-[var(--text-secondary)] hover:text-[var(--danger)] font-semibold px-2 py-1"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Editorial Heading */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Create Your Celebration
          </h1>
          <CelebrationRibbon variant="header" className="my-1.5" />
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
            Step {currentStep} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1].label}
          </p>
        </div>

        {/* ── Progress Stepper Indicator ── */}
        <div className="mb-8 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-soft">
          <div className="grid grid-cols-6 gap-1 sm:gap-2">
            {WIZARD_STEPS.map((step) => {
              const isCurrent = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const StepIcon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all ${
                    isCurrent
                      ? 'bg-[var(--primary)] text-white shadow-xs'
                      : isCompleted
                      ? 'bg-[var(--surface-elevated)] text-[var(--primary)] hover:bg-[var(--primary-light)] cursor-pointer'
                      : 'text-[var(--text-muted)] cursor-not-allowed opacity-60'
                  }`}
                  aria-label={`Step ${step.id}: ${step.title}`}
                >
                  <div className="flex items-center justify-center w-6 h-6 mb-1">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold truncate max-w-full hidden sm:block">
                    {step.title}
                  </span>
                  <span className="text-[10px] font-bold sm:hidden">
                    {step.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Form Container ── */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-[var(--border)] shadow-card overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* ─────────────────────────────────────────────────────────────
                  STEP 1: EVENT BASICS
                  ───────────────────────────────────────────────────────────── */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-[var(--border)] pb-4 mb-4">
                    <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                      Event Basics
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Name, category, date, and venue details to anchor your plan.
                    </p>
                  </div>

                  {/* Event Name */}
                  <Input
                    label="Event Name *"
                    placeholder="e.g. Ananya &amp; Kabir's Grand Wedding or Aarav's 30th Birthday"
                    error={errors.event_name?.message}
                    {...register('event_name')}
                  />

                  {/* Event Category Chips */}
                  <div>
                    <label className="label-text block mb-2 font-medium text-xs text-[var(--text-primary)]">
                      Event Category *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => {
                        const isSelected = watchedEventType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setValue('event_type', type, { shouldDirty: true })}
                            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                                : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                            }`}
                          >
                            <span className="text-xl">{EVENT_TYPE_EMOJIS[type]}</span>
                            <span className="text-xs font-semibold truncate">
                              {EVENT_TYPE_LABELS[type]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Event Description */}
                  <Textarea
                    label="Event Description (Optional)"
                    placeholder="Describe the mood, honoring guests, or background story for your gathering..."
                    rows={3}
                    error={errors.description?.message}
                    {...register('description')}
                  />

                  {/* Date and Times Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Event Date *"
                      type="date"
                      min={todayStr}
                      leftIcon={<Calendar className="w-4 h-4" />}
                      error={errors.event_date?.message}
                      {...register('event_date')}
                    />

                    <Input
                      label="Start Time"
                      type="time"
                      leftIcon={<Clock className="w-4 h-4" />}
                      error={errors.start_time?.message}
                      {...register('start_time')}
                    />

                    <Input
                      label="End Time"
                      type="time"
                      leftIcon={<Clock className="w-4 h-4" />}
                      error={errors.end_time?.message}
                      {...register('end_time')}
                    />
                  </div>

                  {/* Location & Setting */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Location / Venue / City *"
                      placeholder="e.g. Udaipur, Rajasthan or The Taj Palace, Mumbai"
                      leftIcon={<MapPin className="w-4 h-4" />}
                      error={errors.location?.message}
                      {...register('location')}
                    />

                    <div>
                      <label className="label-text block mb-2 font-medium text-xs text-[var(--text-primary)]">
                        Setting Type *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'indoor', label: 'Indoor' },
                          { id: 'outdoor', label: 'Outdoor' },
                          { id: 'hybrid', label: 'Hybrid' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setValue('setting', opt.id as EventSetting, { shouldDirty: true })}
                            className={`py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                              watchedSetting === opt.id
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                                : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2: PEOPLE (Guests, Accessibility, Dietary)
                  ───────────────────────────────────────────────────────────── */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-[var(--border)] pb-4 mb-4">
                    <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                      People &amp; Guest Care
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Accurate headcounts, accessibility provisions, and dietary care.
                    </p>
                  </div>

                  {/* Guest Count Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                    <Input
                      label="Total Expected Guests *"
                      type="number"
                      min={1}
                      max={10000}
                      leftIcon={<Users className="w-4 h-4" />}
                      error={errors.guest_count?.message}
                      {...register('guest_count')}
                    />

                    <Input
                      label="Adults"
                      type="number"
                      min={0}
                      error={errors.adults_count?.message}
                      {...register('adults_count')}
                    />

                    <Input
                      label="Children (under 12)"
                      type="number"
                      min={0}
                      error={errors.children_count?.message}
                      {...register('children_count')}
                    />
                  </div>

                  {/* Accessibility Options */}
                  <div>
                    <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
                      Accessibility &amp; Special Accommodations
                    </label>
                    <p className="text-xs text-[var(--text-secondary)] mb-3">
                      Select all that apply so Festiva AI can map necessary ramps, ground seating, and quiet zones.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ACCESSIBILITY_OPTIONS.map((opt) => {
                        const isChecked = watchedAccessibility.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleArrayItem('accessibility_requirements', opt)}
                            className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]/40 font-semibold'
                                : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                            }`}
                          >
                            <span>{opt}</span>
                            {isChecked && <CheckCircle2 className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dietary Requirements */}
                  <div>
                    <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
                      Dietary Preferences &amp; Restrictions
                    </label>
                    <p className="text-xs text-[var(--text-secondary)] mb-3">
                      Ensure your caterer is briefed on dietary matrices from day one.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DIETARY_OPTIONS.map((opt) => {
                        const isChecked = watchedDietary.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleArrayItem('dietary_requirements', opt)}
                            className={`p-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer truncate ${
                              isChecked
                                ? 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/40 font-semibold'
                                : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guest Preferences notes */}
                  <Textarea
                    label="VIP Protocols &amp; Seating Notes (Optional)"
                    placeholder="e.g. Reserved front-row seating for grandparents, VIP gift welcome hampers..."
                    rows={2}
                    error={errors.guest_preferences?.message}
                    {...register('guest_preferences')}
                  />
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 3: BUDGET & CURRENCY
                  ───────────────────────────────────────────────────────────── */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-[var(--border)] pb-4 mb-4">
                    <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                      Budget &amp; Currencies
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Defaulted to INR (₹) for Indian celebrations, with full multi-currency and contingency support.
                    </p>
                  </div>

                  {/* Currency Selector */}
                  <div>
                    <label className="label-text block mb-2 font-medium text-xs text-[var(--text-primary)]">
                      Select Currency *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setValue('currency', c.code, { shouldDirty: true })}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            watchedCurrency === c.code
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                              : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                          }`}
                        >
                          <span className="font-mono">{c.code} ({c.symbol})</span>
                          {watchedCurrency === c.code && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total Budget Input */}
                  <div className="space-y-2">
                    <Input
                      label={`Total Planned Budget (${watchedCurrency}) *`}
                      type="number"
                      step={1000}
                      leftIcon={<DollarSign className="w-4 h-4" />}
                      error={errors.total_budget?.message}
                      {...register('total_budget')}
                    />

                    {/* Quick Budget Presets */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[11px] text-[var(--text-secondary)]">Presets:</span>
                      {[
                        watchedCurrency === 'INR' ? 300000 : 5000,
                        watchedCurrency === 'INR' ? 750000 : 15000,
                        watchedCurrency === 'INR' ? 1500000 : 35000,
                        watchedCurrency === 'INR' ? 3000000 : 75000,
                        watchedCurrency === 'INR' ? 6000000 : 150000,
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setValue('total_budget', preset, { shouldDirty: true });
                            setValue('contingency_amount', Math.round(preset * 0.1), { shouldDirty: true });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[11px] font-mono hover:border-[var(--primary)] text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          {formatCurrency(preset, watchedCurrency)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget Flexibility & Contingency Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-text block mb-2 font-medium text-xs text-[var(--text-primary)]">
                        Budget Flexibility
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'fixed', label: 'Strict Cap', desc: 'No overspend' },
                          { id: 'moderate', label: 'Moderate', desc: '±10% buffer' },
                          { id: 'flexible', label: 'Flexible', desc: 'Priority-first' },
                        ].map((flex) => (
                          <button
                            key={flex.id}
                            type="button"
                            onClick={() => setValue('budget_flexibility', flex.id as BudgetFlexibility, { shouldDirty: true })}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              watch('budget_flexibility') === flex.id
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                                : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-primary)]'
                            }`}
                          >
                            <div className="text-xs font-bold">{flex.label}</div>
                            <div className="text-[10px] opacity-80">{flex.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Input
                      label={`Optional Contingency Fund (${watchedCurrency})`}
                      type="number"
                      placeholder="Suggested: 10% of total"
                      helperText="Emergency fund allocated for overtime or last-minute needs."
                      error={errors.contingency_amount?.message}
                      {...register('contingency_amount')}
                    />
                  </div>

                  {/* Preferred Spending Priorities */}
                  <div>
                    <label className="label-text block mb-1.5 font-medium text-xs text-[var(--text-primary)]">
                      Top Spending Priorities (Where quality matters most)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        'Catering & Food Service',
                        'Venue & Space Rental',
                        'Decorations & Florals',
                        'Photography & Cinema',
                        'Entertainment & Music',
                        'Guest Experience & Gifting',
                      ].map((item) => {
                        const isSelected = watchedSpendingPriorities.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleArrayItem('spending_priorities', item)}
                            className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]/40 font-semibold'
                                : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                            }`}
                          >
                            <span>{item}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 4: STYLE AND PERSONALIZATION
                  ───────────────────────────────────────────────────────────── */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-[var(--border)] pb-4 mb-4">
                    <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                      Style &amp; Personalization
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Tailor themes, cultural elements, food styles, and must-have moments.
                    </p>
                  </div>

                  {/* Style selector */}
                  <div>
                    <label className="label-text block mb-2 font-medium text-xs text-[var(--text-primary)]">
                      Celebration Style *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {STYLE_OPTIONS.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setValue('style', st.id, { shouldDirty: true })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            watchedStyle === st.id
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                              : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                          }`}
                        >
                          <div className="text-xs font-bold mb-1">{st.label}</div>
                          <div className="text-[10px] opacity-80 leading-snug">{st.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme & Palette Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Preferred Theme / Concept"
                      placeholder="e.g. Royal Marigold, Twilight Romance, Celestial Gala"
                      error={errors.preferred_theme?.message}
                      {...register('preferred_theme')}
                    />

                    <Input
                      label="Color Palette Preferences"
                      placeholder="e.g. Marigold &amp; Gold, Pastel Sage, Lavender &amp; Ivory"
                      error={errors.color_palette?.message}
                      {...register('color_palette')}
                    />
                  </div>

                  {/* Cultural & Food Preferences */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Cultural or Seasonal Preferences"
                      placeholder="e.g. Traditional Hindu ceremonies, Punjabi Sangeet, Autumn Festive"
                      error={errors.cultural_preferences?.message}
                      {...register('cultural_preferences')}
                    />

                    <Input
                      label="Food &amp; Dining Style"
                      placeholder="e.g. Grand vegetarian buffet, Live cooking stations, High tea"
                      error={errors.food_preferences?.message}
                      {...register('food_preferences')}
                    />
                  </div>

                  {/* Entertainment Preferences */}
                  <Input
                    label="Entertainment Preferences"
                    placeholder="e.g. Live acoustic Sitar &amp; Flute, DJ with Bollywood playlist, Standup comedy"
                    error={errors.entertainment_preferences?.message}
                    {...register('entertainment_preferences')}
                  />

                  {/* Must-Haves and Things to Avoid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Textarea
                      label="Must-Have Elements"
                      placeholder="e.g. Welcome garland station, drone photography, fireworks or cold pyros..."
                      rows={2}
                      error={errors.must_have_elements?.message}
                      {...register('must_have_elements')}
                    />

                    <Textarea
                      label="Things to Avoid"
                      placeholder="e.g. Loud bass during dinner, plastic disposables, cramped seating..."
                      rows={2}
                      error={errors.things_to_avoid?.message}
                      {...register('things_to_avoid')}
                    />
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 5: PLANNING PRIORITIES
                  ───────────────────────────────────────────────────────────── */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-[var(--border)] pb-4 mb-4">
                    <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                      Vendor &amp; Planning Priorities
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Indicate how crucial each service is for your event budget allocation.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {PRIORITY_CATEGORIES.map((cat) => {
                      const currentVal = watchedPriorities[cat.id] || 'medium';
                      const CatIcon = cat.icon;

                      return (
                        <div
                          key={cat.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                              <CatIcon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-[var(--text-primary)]">
                              {cat.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {[
                              { id: 'high', label: 'High Priority', color: 'bg-[var(--primary)] text-white' },
                              { id: 'medium', label: 'Standard', color: 'bg-[var(--secondary)] text-[var(--primary)]' },
                              { id: 'low', label: 'Minimal', color: 'bg-[var(--surface)] text-[var(--text-secondary)]' },
                              { id: 'not_needed', label: 'Not Needed', color: 'bg-black/5 text-[var(--text-muted)]' },
                            ].map((lvl) => (
                              <button
                                key={lvl.id}
                                type="button"
                                onClick={() => {
                                  const updated = { ...watchedPriorities, [cat.id]: lvl.id };
                                  setValue('planning_priorities', updated, { shouldDirty: true });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                  currentVal === lvl.id
                                    ? `${lvl.color} border-transparent shadow-xs`
                                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface)]'
                                }`}
                              >
                                {lvl.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Other Custom Requirements */}
                  <Textarea
                    label="Other Custom Requirements or Vendor Notes"
                    placeholder="Specify any unique cultural rituals, power requirements, stage dimensions, or specific vendor names..."
                    rows={3}
                    error={errors.custom_requirements?.message}
                    {...register('custom_requirements')}
                  />
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 6: REVIEW & SUMMARY
                  ───────────────────────────────────────────────────────────── */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-[var(--border)] pb-4 mb-4">
                    <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                      Review Celebration Master Plan
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Confirm all parameters before synthesizing your AI blueprint. Click edit on any section to revise.
                    </p>
                  </div>

                  {/* Summary Review Cards */}
                  <div className="space-y-4">
                    {/* Step 1 Review */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                          1. Event Basics
                        </span>
                        <button
                          type="button"
                          onClick={() => goToStep(1)}
                          className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Name:</strong> {getValues('event_name')}
                        </div>
                        <div>
                          <strong>Category:</strong> {EVENT_TYPE_LABELS[getValues('event_type')]}
                        </div>
                        <div>
                          <strong>Date:</strong> {getValues('event_date')} ({getValues('start_time')} – {getValues('end_time')})
                        </div>
                        <div>
                          <strong>Location:</strong> {getValues('location')} ({getValues('setting')})
                        </div>
                      </div>
                    </div>

                    {/* Step 2 Review */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                          2. People &amp; Guests
                        </span>
                        <button
                          type="button"
                          onClick={() => goToStep(2)}
                          className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Total Guests:</strong> {getValues('guest_count')} ({getValues('adults_count') || 0} adults, {getValues('children_count') || 0} children)
                        </div>
                        <div>
                          <strong>Dietary:</strong> {watchedDietary.length > 0 ? watchedDietary.join(', ') : 'Standard'}
                        </div>
                        <div className="sm:col-span-2">
                          <strong>Accessibility:</strong> {watchedAccessibility.length > 0 ? watchedAccessibility.join(' • ') : 'Standard Access'}
                        </div>
                      </div>
                    </div>

                    {/* Step 3 Review */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                          3. Budget &amp; Currency
                        </span>
                        <button
                          type="button"
                          onClick={() => goToStep(3)}
                          className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Total Planned Budget:</strong> {formatCurrency(getValues('total_budget'), watchedCurrency)}
                        </div>
                        <div>
                          <strong>Flexibility:</strong> {getValues('budget_flexibility')}
                        </div>
                        <div>
                          <strong>Contingency Reserve:</strong> {formatCurrency(getValues('contingency_amount') || 0, watchedCurrency)}
                        </div>
                        <div>
                          <strong>Top Priorities:</strong> {watchedSpendingPriorities.join(', ') || 'Even distribution'}
                        </div>
                      </div>
                    </div>

                    {/* Step 4 Review */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                          4. Style &amp; Vibe
                        </span>
                        <button
                          type="button"
                          onClick={() => goToStep(4)}
                          className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Style:</strong> {getValues('style')}
                        </div>
                        <div>
                          <strong>Theme:</strong> {getValues('preferred_theme') || 'AI Suggested'}
                        </div>
                        <div>
                          <strong>Palette:</strong> {getValues('color_palette') || 'Harmonious celebration tones'}
                        </div>
                        <div>
                          <strong>Food Style:</strong> {getValues('food_preferences') || 'Custom Menu'}
                        </div>
                      </div>
                    </div>

                    {/* Step 5 Review */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                          5. Vendor Priorities
                        </span>
                        <button
                          type="button"
                          onClick={() => goToStep(5)}
                          className="text-xs text-[var(--primary)] font-semibold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {Object.entries(watchedPriorities).map(([k, v]) => (
                          <span key={k} className="badge badge-neutral text-[10px]">
                            {k}: <strong className="ml-1 uppercase">{v}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {genError && (
                    <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-xs flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {genError}
                      </span>
                      <Button
                        type="submit"
                        size="sm"
                        variant="danger"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        isLoading={isGenerating}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* ── Wizard Controls Bar (Back, Continue, Save Draft, Generate) ── */}
            <div className="p-4 sm:p-6 bg-[var(--surface-elevated)] border-t border-[var(--border)] flex items-center justify-between gap-3">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleBack}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    disabled={isGenerating}
                  >
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleSaveDraft}
                  leftIcon={<Save className="w-4 h-4 text-[var(--primary)]" />}
                  disabled={isGenerating}
                  className="hidden sm:inline-flex"
                >
                  Save Draft
                </Button>

                {currentStep < 6 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={validateAndProceed}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    isLoading={isGenerating}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    className="shadow-card font-bold"
                  >
                    Generate Master Blueprint
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </form>

        {/* ── Cancel Planning Modal ── */}
        <Dialog
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Leave Celebration Setup?"
          description="Your current inputs will be saved to your local draft so you can return to them later."
        >
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Keep Editing
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                handleSaveDraft();
                setShowCancelModal(false);
                navigate('/dashboard');
              }}
            >
              Save Draft &amp; Exit
            </Button>
          </div>
        </Dialog>

        {/* ── Generating Plan Celebration Overlay Modal ── */}
        {isGenerating && (
          <div className="fixed inset-0 z-50 bg-[var(--background)]/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full festiva-card p-8 text-center bg-[var(--surface)] border-[var(--border)] shadow-dialog"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-4 border border-[var(--primary)]/20 shadow-glow-purple">
                <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
              </div>

              <h3 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
                Crafting Your Master Plan
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-6">
                Festiva AI is synthesizing your vision into an actionable celebration blueprint.
              </p>

              {/* Step indicator animations */}
              <div className="space-y-2.5 text-left text-xs mb-6">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  generationPhase >= 1 ? 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/30 font-semibold' : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-muted)]'
                }`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Synthesizing run-of-show timeline &amp; cues...</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  generationPhase >= 2 ? 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/30 font-semibold' : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-muted)]'
                }`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Calculating budget allocations ({watchedCurrency})...</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  generationPhase >= 3 ? 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/30 font-semibold' : 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-muted)]'
                }`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Curating color palettes &amp; vendor milestones...</span>
                </div>
              </div>

              <div className="w-full bg-[var(--surface-elevated)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-700 ease-out"
                  style={{
                    width: generationPhase === 1 ? '35%' : generationPhase === 2 ? '70%' : '95%',
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
