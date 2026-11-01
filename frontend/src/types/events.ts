// Event types and related TypeScript interfaces for Festiva AI

export type EventType =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'college'
  | 'community'
  | 'corporate'
  | 'other';

export type BudgetRange = 'budget' | 'moderate' | 'premium' | 'luxury';

export type EventSetting = 'indoor' | 'outdoor' | 'hybrid';
export type BudgetFlexibility = 'fixed' | 'moderate' | 'flexible';
export type EventStyle = 'formal' | 'casual' | 'traditional' | 'modern' | 'rustic' | 'minimalist' | 'luxury';

export interface EventFormData {
  // Step 1: Event Basics
  event_name: string;
  event_type: EventType;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location: string;
  setting?: EventSetting;

  // Step 2: People
  guest_count: number;
  adults_count?: number;
  children_count?: number;
  guest_preferences?: string;
  accessibility_requirements?: string[];
  dietary_requirements?: string[];

  // Step 3: Budget
  total_budget: number;
  currency: string; // 'INR', 'USD', 'EUR', 'GBP', 'AED', 'CAD'
  budget_range?: BudgetRange;
  budget_flexibility?: BudgetFlexibility;
  contingency_amount?: number;
  spending_priorities?: string[];

  // Step 4: Style and Personalization
  preferred_theme?: string;
  color_palette?: string;
  style?: EventStyle;
  cultural_preferences?: string;
  food_preferences?: string;
  entertainment_preferences?: string;
  must_have_elements?: string;
  things_to_avoid?: string;

  // Step 5: Planning Priorities
  planning_priorities?: Record<string, string>; // category -> 'high' | 'medium' | 'low' | 'not_needed'
  custom_requirements?: string;

  // Legacy compatibility
  theme_preferences?: string;
  special_requirements?: string;
}

export type ExpenseStatus = 'logged_expense' | 'vendor_commitment' | 'estimate';

export interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  status: ExpenseStatus;
  notes?: string;
  date: string;
  vendor_name?: string;
  receipt_url?: string;
  is_verified_payment: boolean; // always false unless real gateway integration confirms it
}

export interface BudgetCategory {
  category: string;
  estimated_amount: number;
  allocated_amount?: number;
  actual_amount?: number;
  difference?: number;
  percentage: number;
  percentage_of_total?: number;
  items: string[];
  is_estimate?: boolean;
  cost_notes?: string;
  notes?: string;
}

export interface BudgetRescueOption {
  strategy_id: string;
  strategy_name: string;
  tier: 'minimal' | 'balanced' | 'maximum';
  estimated_savings: number;
  revised_total_budget: number;
  quality_impact_score: number;
  quality_impact_description: string;
  trade_offs: string[];
  alternative_choices: string[];
  category_adjustments: Record<string, number>;
  revised_categories: BudgetCategory[];
  revised_contingency: number;
}

export interface BudgetRescueResponse {
  event_id: string;
  target_budget: number;
  actual_spending: number;
  overrun_amount: number;
  is_over_budget: boolean;
  overrun_categories: string[];
  options: BudgetRescueOption[];
  prompt_version?: string;
  demo?: boolean;
}

export interface ApplyBudgetRescueRequest {
  tier: string;
  revised_categories: BudgetCategory[];
  revised_contingency: number;
}

export interface CategoryBudgetUpdateRequest {
  categories: BudgetCategory[];
  contingency_amount?: number;
  total_budget?: number;
}

export interface BudgetFeasibility {
  is_feasible: boolean;
  feasibility_score: number;
  feasibility_analysis: string;
  feasibility_verdict?: string;
  cost_per_guest: number;
  cost_saving_alternatives: string[];
}

export interface BudgetPlan {
  total_budget: number;
  currency: string;
  contingency_amount: number;
  categories: BudgetCategory[];
  feasibility: BudgetFeasibility;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export type TaskStage =
  | 'initial_planning'
  | 'budget_venue'
  | 'vendor_selection'
  | 'invitations'
  | 'final_arrangements'
  | 'event_day'
  | 'post_event';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface TimelineTask {
  id: string;
  title: string;
  description?: string;
  stage: TaskStage;
  category?: string;
  priority: TaskPriority;
  due_date: string; // YYYY-MM-DD
  status: TaskStatus;
  assignee?: string;
  dependencies: string[];
  estimated_cost?: number;
  notes?: string;
  is_overdue?: boolean;
  overdue_alternative?: string;
}

export const STAGE_LABELS: Record<TaskStage, string> = {
  initial_planning: 'Initial Planning',
  budget_venue: 'Budget & Venue',
  vendor_selection: 'Vendor Selection',
  invitations: 'Invitations & RSVPs',
  final_arrangements: 'Final Arrangements',
  event_day: 'Event Day',
  post_event: 'Post-Event Activities',
};

export const STAGE_DESCRIPTIONS: Record<TaskStage, string> = {
  initial_planning: 'Concept, vision, moodboard, and baseline scope',
  budget_venue: 'Budget lock, site visits, walkthroughs, and venue booking',
  vendor_selection: 'Catering, photography, decor, and entertainment contracts',
  invitations: 'Stationery design, digital RSVP dispatch, and headcount tracking',
  final_arrangements: 'Seating charts, vendor run-sheets, and final rehearsal',
  event_day: 'Day-of load-in, decor check, program cues, and celebration',
  post_event: 'Vendor settlements, rental returns, and photo thank-yous',
};

export interface TimelineItem {
  time: string;
  activity: string;
  duration_minutes: number;
  responsible_party?: string;
  notes?: string;
}

export interface PreparationMilestone {
  id: string;
  timeframe: string;
  target_date?: string;
  milestone: string;
  priority: 'high' | 'medium' | 'low';
  action_required: string;
  completed: boolean;
}

export interface TimelinePlan {
  preparation_milestones: PreparationMilestone[];
  day_of_schedule: TimelineItem[];
  tasks?: TimelineTask[];
}

export interface VendorItem {
  category: string;
  vendor_name: string;
  estimated_cost: number;
  status: 'pending' | 'contacted' | 'booked' | 'confirmed';
  notes?: string;
  selection_criteria?: string;
  questions_to_ask?: string[];
  lead_time_days?: number;
  is_estimate?: boolean;
}

export interface VendorChecklistItem {
  id: string;
  category: string;
  vendor_name: string;
  estimated_cost: number;
  selection_criteria: string;
  questions_to_ask: string[];
  lead_time_days: number;
  status: 'pending' | 'contacted' | 'booked' | 'confirmed';
  is_estimate: boolean;
}

export interface GuestPlan {
  total_guests: number;
  vip_guests: number;
  regular_guests: number;
  dietary_considerations: string[];
  seating_arrangement: string;
  rsvp_deadline: string;
  invitation_style: string;
  capacity_limit?: number;
  key_management_steps?: string[];
}

export interface GuestManagementPlan {
  total_guests: number;
  vip_guests: number;
  regular_guests: number;
  seating_arrangement: string;
  rsvp_deadline: string;
  invitation_style: string;
  accessibility_accommodations: string[];
  dietary_matrix: Record<string, string>;
  capacity_limit?: number;
  key_management_steps?: string[];
}

export interface CreativeTheme {
  theme_name: string;
  color_palette: string[];
  mood: string;
  decor_ideas: string[];
  entertainment_ideas: string[];
  unique_touches: string[];
}

export interface EventConcept {
  title: string;
  concept: string;
  concept_statement?: string;
  description: string;
  design_direction: string;
}

export interface ThemeDetails {
  theme_name: string;
  color_palette: string[];
  palette?: string[];
  decorations: string;
  dress_code: string;
  lighting: string;
  atmosphere: string;
}

export interface FoodAndEntertainment {
  dining_style: string;
  curated_menu_highlights: string[];
  menu_recommendations?: string[];
  beverage_plan: string;
  entertainment_lineup: string[];
  entertainment_options?: string[];
  sound_and_lighting_notes: string;
}

export interface RiskAndContingency {
  id: string;
  risk_factor: string;
  risk?: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation_strategy: string;
  contingency_action: string;
  contingency_plan?: string;
}

export interface PersonalizedIdea {
  id: string;
  title: string;
  description: string;
  estimated_additional_cost: number;
  accepted: boolean;
}

export interface NextAction {
  step_number: number;
  action: string;
  timeframe: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  accepted: boolean;
}

export interface EventPlan {
  event_id: string;
  event_name: string;
  event_type: EventType;
  event_date: string;
  location: string;
  guest_count: number;
  budget_range: BudgetRange;
  summary: string;
  total_estimated_budget: number;
  currency?: string;
  budget_breakdown: BudgetCategory[];
  timeline: TimelineItem[];
  vendor_checklist: VendorItem[];
  guest_plan: GuestPlan;
  creative_themes: CreativeTheme[];
  actionable_recommendations: string[];
  ai_tips: string[];
  demo: boolean;
  created_at: string;
  expenses?: ExpenseItem[];
  tasks?: TimelineTask[];

  // 10 Engine Structured Sections
  event_concept?: EventConcept;
  concept?: EventConcept;
  theme_details?: ThemeDetails;
  budget_plan?: BudgetPlan;
  budget?: BudgetPlan;
  timeline_plan?: TimelinePlan;
  vendor_checklist_detailed?: VendorChecklistItem[];
  guest_management_plan?: GuestManagementPlan;
  food_and_entertainment?: FoodAndEntertainment;
  risks_and_contingencies?: RiskAndContingency[];
  personalized_ideas?: PersonalizedIdea[];
  next_actions?: NextAction[];
  vendors?: VendorRecord[];
  guests?: GuestRecord[];
  moodboards?: MoodboardRecord[];
  concept_comparisons?: EventConceptComparisonItem[];
  prompt_version?: string;
  model_version?: string;
}

// ── VENDOR MATCHBOARD TYPES ──────────────────────────────────────────────────
export type VendorCategory =
  | 'venues'
  | 'caterers'
  | 'photographers'
  | 'decorators'
  | 'florists'
  | 'entertainment'
  | 'makeup_artists'
  | 'transportation'
  | 'other';

export type VendorSelectionStatus =
  | 'shortlisted'
  | 'contacted'
  | 'selected'
  | 'rejected'
  | 'booked';

export type VendorAvailability =
  | 'available'
  | 'tentative'
  | 'unavailable'
  | 'unknown';

export interface VendorRecord {
  id: string;
  business_name: string;
  category: VendorCategory;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_info?: string;
  website?: string;
  quoted_price: number;
  currency: string;
  availability_status: VendorAvailability;
  selection_status: VendorSelectionStatus;
  rating?: number;
  notes?: string;
  follow_up_date?: string;
  quotation_details?: string;
  comparison_notes?: string;
  created_at?: string;
}

export interface VendorComparisonAnalysis {
  summary: string;
  price_comparison: string;
  key_differences: string[];
  suggested_interview_questions: string[];
  negotiation_tips: string[];
  disclaimer: string;
}

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  venues: 'Venues',
  caterers: 'Caterers',
  photographers: 'Photographers',
  decorators: 'Decorators',
  florists: 'Florists',
  entertainment: 'DJs & Entertainment',
  makeup_artists: 'Makeup Artists',
  transportation: 'Transportation',
  other: 'Other Services',
};

export const VENDOR_SELECTION_LABELS: Record<VendorSelectionStatus, string> = {
  shortlisted: 'Shortlisted',
  contacted: 'Contacted',
  selected: 'Selected',
  rejected: 'Rejected',
  booked: 'Confirmed Booking',
};

// ── GUEST & RSVP MANAGER TYPES ───────────────────────────────────────────────
export type GuestRsvpStatus =
  | 'not_invited'
  | 'invited'
  | 'confirmed'
  | 'declined'
  | 'maybe';

export type GuestInvitationStatus =
  | 'not_sent'
  | 'sent_manual'
  | 'delivered';

export interface GuestRecord {
  id: string;
  name: string;
  group_household: string;
  invitation_status: GuestInvitationStatus;
  invitation_delivery_note?: string;
  rsvp_status: GuestRsvpStatus;
  party_size: number;
  adults_count: number;
  children_count: number;
  dietary_preference?: string;
  accessibility_requests?: string;
  table_assignment?: string;
  notes?: string;
  created_at?: string;
}

export interface BulkGuestImportRow {
  name: string;
  group_household?: string;
  party_size?: number;
  adults_count?: number;
  children_count?: number;
  rsvp_status?: string;
  dietary_preference?: string;
  accessibility_requests?: string;
  table_assignment?: string;
  notes?: string;
}

export interface BulkGuestImportResponse {
  imported_count: number;
  skipped_duplicate_count: number;
  errors: string[];
  duplicates_detected: string[];
  guests: GuestRecord[];
}

export interface CateringEstimateResponse {
  total_confirmed_guests: number;
  total_confirmed_parties: number;
  total_maybe_guests: number;
  total_declined_guests: number;
  total_invited_headcount: number;
  expected_attendance_low: number;
  expected_attendance_high: number;
  expected_attendance_estimated: number;
  dietary_breakdown: Record<string, number>;
  accessibility_summary: string[];
  table_seating_summary: Record<string, number>;
  unassigned_count: number;
}

export const RSVP_STATUS_LABELS: Record<GuestRsvpStatus, string> = {
  not_invited: 'Not Invited',
  invited: 'Invited',
  confirmed: 'Confirmed Attending',
  declined: 'Declined',
  maybe: 'Tentative / Maybe',
};

export interface DashboardTask {
  id: string;
  eventId: string;
  eventName: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  category?: string;
}

export interface SavedEvent {
  id: string;
  user_id: string;
  event_name: string;
  event_type: EventType;
  event_date: string;
  plan_data: EventPlan;
  created_at: string;
  archived?: boolean;
  demo?: boolean;
  tasks?: DashboardTask[];
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  birthday: 'Birthday Party',
  anniversary: 'Anniversary Dinner',
  college: 'College Gathering / Fest',
  community: 'Community Gathering',
  corporate: 'Corporate Event / Summit',
  other: 'Celebration',
};

export const EVENT_TYPE_EMOJIS: Record<EventType, string> = {
  wedding: '💍',
  birthday: '🎂',
  anniversary: '🥂',
  college: '🎓',
  community: '🎪',
  corporate: '🏛️',
  other: '✨',
};

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  budget: 'Essential (< ₹3L / $5k)',
  moderate: 'Moderate (₹3L–₹15L / $5k–$20k)',
  premium: 'Premium (₹15L–₹50L / $20k–$100k)',
  luxury: 'Grand Luxury (> ₹50L / $100k+)',
};

// ── MOODBOARD STUDIO TYPES ───────────────────────────────────────────────────
export interface MoodboardItem {
  id: string;
  section: string;
  title?: string;
  content: string;
  description?: string;
  category?: string;
  image_url?: string;
  color_tag?: string;
  sort_order?: number;
  order?: number;
}

export interface MoodboardRecord {
  id: string;
  name: string;
  theme: string;
  color_palette: string[];
  dress_code?: string;
  invitation_direction?: string;
  decoration_ideas: string[];
  venue_styling: string[];
  lighting: string[];
  floral_arrangements: string[];
  table_styling: string[];
  food_presentation: string[];
  inspiration_notes: string[];
  images: string[];
  items: MoodboardItem[];
  created_at: string;
  updated_at: string;
}

// ── EVENT CONCEPT COMPARISON TYPES ───────────────────────────────────────────
export interface EventConceptComparisonItem {
  id: string;
  concept_name: string;
  theme: string;
  estimated_budget: number;
  currency: string;
  budget_fit: string;
  overrun_amount: number;
  is_within_budget: boolean;
  guest_experience: string;
  decoration_direction: string;
  catering_direction: string;
  planning_complexity: 'Low' | 'Medium' | 'High';
  complexity_rationale: string;
  main_advantages: string[];
  trade_offs: string[];
  estimated_cost_savings: string[];
  cost_saving_opportunities?: string[];
  recommended_color_palette: string[];
}

export interface EventConceptComparisonResponse {
  success?: boolean;
  event_id: string;
  target_budget: number;
  currency: string;
  concepts: EventConceptComparisonItem[];
}

// ── AI EVENT COPILOT TYPES ───────────────────────────────────────────────────
export type CopilotActionType =
  | 'update_budget_allocation'
  | 'add_timeline_task'
  | 'update_task_status'
  | 'add_budget_expense'
  | 'update_theme'
  | 'add_moodboard_note';

export interface CopilotProposedAction {
  id: string;
  action_type: CopilotActionType;
  title: string;
  description: string;
  affected_records: string[];
  expected_impact: string;
  parameters: Record<string, any>;
  status: 'pending' | 'confirmed' | 'applied' | 'declined';
}

export interface CopilotMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  proposed_action?: CopilotProposedAction;
  timestamp?: string;
}

export interface CopilotChatResponse {
  event_id: string;
  reply: string;
  proposed_action?: CopilotProposedAction;
  context_summary: Record<string, any>;
  readiness_score: number;
  readiness_breakdown: Record<string, any>;
  is_demo: boolean;
  model_version: string;
}

export interface CopilotApplyActionResponse {
  success: boolean;
  message: string;
  action_type: CopilotActionType;
  action_id: string;
  updated_record?: Record<string, any>;
  event_id: string;
}

// ── TRANSPARENT EVENT READINESS SCORE TYPES ──────────────────────────────────
export interface ReadinessCategoryScore {
  category_name: string;
  score: number;
  max_score: number;
  percentage: number;
  status_label: 'Optimal' | 'Good' | 'Needs Attention' | 'Critical';
  criteria_met: string[];
  criteria_unmet: string[];
}

export interface NextBestMove {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'recommended';
  target_module: 'vendors' | 'budget' | 'timeline' | 'guests' | 'copilot';
  action_label: string;
  expected_impact: string;
}

export interface EventReadinessResponse {
  event_id: string;
  event_name: string;
  overall_score: number;
  score_grade: 'Celebration Ready' | 'Well Prepared' | 'Needs Attention' | 'Critical Attention' | 'Insufficient Data';
  is_insufficient_data: boolean;
  data_sufficiency_pct: number;
  category_scores: {
    task_completion: ReadinessCategoryScore;
    budget_preparedness: ReadinessCategoryScore;
    vendor_preparedness: ReadinessCategoryScore;
    guest_planning: ReadinessCategoryScore;
    timeline_preparedness: ReadinessCategoryScore;
  };
  positive_indicators: string[];
  missing_information: string[];
  overdue_tasks: Array<{
    id: string;
    title: string;
    due_date?: string;
    priority?: string;
    stage?: string;
  }>;
  budget_risks: string[];
  next_recommended_actions: string[];
  next_best_move: NextBestMove;
  formula_documentation: string;
}

