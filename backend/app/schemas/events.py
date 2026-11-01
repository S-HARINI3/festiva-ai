from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any, Union
from enum import Enum
import uuid
from datetime import datetime


class EventType(str, Enum):
    WEDDING = "wedding"
    BIRTHDAY = "birthday"
    ANNIVERSARY = "anniversary"
    COLLEGE = "college"
    COMMUNITY = "community"
    CORPORATE = "corporate"
    OTHER = "other"


class BudgetRange(str, Enum):
    BUDGET = "budget"        # Low tier
    MODERATE = "moderate"    # Mid tier
    PREMIUM = "premium"      # High tier
    LUXURY = "luxury"        # Luxury tier


class EventGenerateRequest(BaseModel):
    event_type: EventType
    event_name: str = Field(..., min_length=2, max_length=100)
    event_date: str  # ISO date string (YYYY-MM-DD)
    guest_count: int = Field(..., ge=1, le=10000)
    location: str = Field(..., min_length=2, max_length=200)
    budget_range: Optional[BudgetRange] = BudgetRange.MODERATE
    theme_preferences: Optional[str] = None
    special_requirements: Optional[str] = None
    user_id: Optional[str] = None

    # Step 1: Event Basics
    description: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    setting: Optional[str] = "indoor"  # indoor / outdoor / hybrid

    # Step 2: People
    adults_count: Optional[int] = None
    children_count: Optional[int] = None
    guest_preferences: Optional[str] = None
    accessibility_requirements: Optional[List[str]] = None
    dietary_requirements: Optional[List[str]] = None

    # Step 3: Budget
    total_budget: Optional[float] = None
    currency: Optional[str] = "INR"
    budget_flexibility: Optional[str] = "moderate"  # fixed / moderate / flexible
    contingency_amount: Optional[float] = None
    spending_priorities: Optional[List[str]] = None

    # Step 4: Style & Personalization
    preferred_theme: Optional[str] = None
    color_palette: Optional[str] = None
    style: Optional[str] = "traditional"  # formal, casual, traditional, modern, rustic, minimalist, luxury
    cultural_preferences: Optional[str] = None
    food_preferences: Optional[str] = None
    entertainment_preferences: Optional[str] = None
    must_have_elements: Optional[str] = None
    things_to_avoid: Optional[str] = None

    # Step 5: Planning Priorities
    planning_priorities: Optional[Dict[str, str]] = None
    custom_requirements: Optional[str] = None


# ── SECTION 1: EVENT CONCEPT ─────────────────────────────────────────────────
class EventConcept(BaseModel):
    title: str
    concept: str
    concept_statement: Optional[str] = None
    description: str
    design_direction: str


# ── SECTION 2: THEME ─────────────────────────────────────────────────────────
class ThemeDetails(BaseModel):
    theme_name: str
    color_palette: List[str] = Field(default_factory=list)  # Hex colors
    palette: Optional[List[str]] = None
    decorations: str
    dress_code: str
    lighting: str
    atmosphere: str


# ── SECTION 3: BUDGET & FEASIBILITY ──────────────────────────────────────────
class BudgetFeasibility(BaseModel):
    is_feasible: bool = True
    feasibility_score: int = Field(default=85, ge=0, le=100)
    feasibility_analysis: str
    feasibility_verdict: Optional[str] = None
    cost_per_guest: float
    cost_saving_alternatives: List[str] = Field(default_factory=list)


class BudgetCategory(BaseModel):
    category: str
    estimated_amount: float
    allocated_amount: Optional[float] = None
    percentage: float
    items: List[str] = Field(default_factory=list)
    is_estimate: bool = True
    cost_notes: Optional[str] = None


class BudgetPlan(BaseModel):
    total_budget: float
    currency: str = "INR"
    contingency_amount: float = 0.0
    categories: List[BudgetCategory] = Field(default_factory=list)
    feasibility: BudgetFeasibility


# ── SECTION 4: TIMELINE & TASK MANAGEMENT ─────────────────────────────────────
class TaskStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskStage(str, Enum):
    INITIAL_PLANNING = "initial_planning"
    BUDGET_VENUE = "budget_venue"
    VENDOR_SELECTION = "vendor_selection"
    INVITATIONS = "invitations"
    FINAL_ARRANGEMENTS = "final_arrangements"
    EVENT_DAY = "event_day"
    POST_EVENT = "post_event"


class TaskPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TimelineTask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str
    description: Optional[str] = ""
    stage: TaskStage = TaskStage.INITIAL_PLANNING
    category: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: str  # YYYY-MM-DD
    status: TaskStatus = TaskStatus.NOT_STARTED
    assignee: Optional[str] = None
    dependencies: List[str] = Field(default_factory=list)
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None
    is_overdue: bool = False
    overdue_alternative: Optional[str] = None


class PreparationMilestone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    timeframe: str  # e.g. "90 Days Before"
    target_date: Optional[str] = None
    milestone: str
    priority: str = "high"  # high / medium / low
    action_required: str
    completed: bool = False


class TimelineItem(BaseModel):
    time: str
    activity: str
    duration_minutes: int
    responsible_party: Optional[str] = None
    notes: Optional[str] = None


class TimelinePlan(BaseModel):
    preparation_milestones: List[PreparationMilestone] = Field(default_factory=list)
    day_of_schedule: List[TimelineItem] = Field(default_factory=list)
    tasks: List[TimelineTask] = Field(default_factory=list)


# ── SECTION 5: VENDOR CHECKLIST ──────────────────────────────────────────────
class VendorItem(BaseModel):
    category: str
    vendor_name: str
    estimated_cost: float
    status: str = "pending"
    notes: Optional[str] = None
    selection_criteria: Optional[str] = None
    questions_to_ask: List[str] = Field(default_factory=list)
    lead_time_days: int = 30
    is_estimate: bool = True


class VendorChecklistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    category: str
    vendor_name: str
    estimated_cost: float
    selection_criteria: str
    questions_to_ask: List[str] = Field(default_factory=list)
    lead_time_days: int = 30
    status: str = "pending"
    is_estimate: bool = True


# ── SECTION 6: GUEST PLAN ────────────────────────────────────────────────────
class GuestPlan(BaseModel):
    total_guests: int
    vip_guests: int
    regular_guests: int
    dietary_considerations: List[str] = Field(default_factory=list)
    seating_arrangement: str
    rsvp_deadline: str
    invitation_style: str
    capacity_limit: Optional[int] = None
    key_management_steps: List[str] = Field(default_factory=list)


class GuestManagementPlan(BaseModel):
    total_guests: int
    vip_guests: int
    regular_guests: int
    seating_arrangement: str
    rsvp_deadline: str
    invitation_style: str
    accessibility_accommodations: List[str] = Field(default_factory=list)
    dietary_matrix: Dict[str, str] = Field(default_factory=dict)
    capacity_limit: Optional[int] = None
    key_management_steps: List[str] = Field(default_factory=list)


# ── SECTION 7: FOOD AND ENTERTAINMENT ────────────────────────────────────────
class FoodAndEntertainment(BaseModel):
    dining_style: str
    curated_menu_highlights: List[str] = Field(default_factory=list)
    menu_recommendations: Optional[List[str]] = None
    beverage_plan: str
    entertainment_lineup: List[str] = Field(default_factory=list)
    entertainment_options: Optional[List[str]] = None
    sound_and_lighting_notes: str


# ── SECTION 8: RISKS AND CONTINGENCIES ───────────────────────────────────────
class RiskAndContingency(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    risk_factor: str
    risk: Optional[str] = None
    likelihood: str = "medium"  # low / medium / high
    impact: str = "medium"      # low / medium / high
    mitigation_strategy: str
    contingency_action: str
    contingency_plan: Optional[str] = None


# ── SECTION 9: PERSONALIZED IDEAS ────────────────────────────────────────────
class PersonalizedIdea(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str
    description: str
    estimated_additional_cost: float = 0.0
    accepted: bool = False


# ── SECTION 10: NEXT ACTIONS ─────────────────────────────────────────────────
class NextAction(BaseModel):
    step_number: int
    action: str
    timeframe: str
    category: str
    priority: str = "high"
    accepted: bool = False


# ── LEGACY & SUPPORT MODELS ─────────────────────────────────────────────────
class CreativeTheme(BaseModel):
    theme_name: str
    color_palette: List[str]
    mood: str
    decor_ideas: List[str]
    entertainment_ideas: List[str]
    unique_touches: List[str]


# ── COMPLETE MASTER EVENT PLAN ───────────────────────────────────────────────
class EventPlan(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_name: str
    event_type: EventType
    event_date: str
    location: str
    guest_count: int
    budget_range: BudgetRange
    summary: str
    total_estimated_budget: float
    currency: Optional[str] = "INR"

    # Backward-compatible baseline fields
    budget_breakdown: List[BudgetCategory] = Field(default_factory=list)
    timeline: List[TimelineItem] = Field(default_factory=list)
    vendor_checklist: List[VendorItem] = Field(default_factory=list)
    guest_plan: GuestPlan
    creative_themes: List[CreativeTheme] = Field(default_factory=list)
    actionable_recommendations: List[str] = Field(default_factory=list)
    ai_tips: List[str] = Field(default_factory=list)

    # 10 Structured Engine Sections
    event_concept: Optional[EventConcept] = None
    concept: Optional[EventConcept] = None
    theme_details: Optional[ThemeDetails] = None
    budget_plan: Optional[BudgetPlan] = None
    budget: Optional[BudgetPlan] = None
    timeline_plan: Optional[TimelinePlan] = None
    vendor_checklist_detailed: Optional[List[VendorChecklistItem]] = None
    guest_management_plan: Optional[GuestManagementPlan] = None
    food_and_entertainment: Optional[FoodAndEntertainment] = None
    risks_and_contingencies: Optional[List[RiskAndContingency]] = None
    personalized_ideas: Optional[List[PersonalizedIdea]] = None
    next_actions: Optional[List[NextAction]] = None

    # Expense Tracking Ledger
    expenses: List['ExpenseItem'] = Field(default_factory=list)

    # Timeline Tasks Checklist
    tasks: List[TimelineTask] = Field(default_factory=list)

    # Vendor Matchboard Directory
    vendors: List['VendorRecord'] = Field(default_factory=list)

    # Guest & RSVP Directory
    guests: List['GuestRecord'] = Field(default_factory=list)

    # Moodboard Studio Boards
    moodboards: List['MoodboardRecord'] = Field(default_factory=list)

    # Generated Concept Comparisons
    concept_comparisons: List['EventConceptComparisonItem'] = Field(default_factory=list)

    # Meta
    prompt_version: str = "2026.10.1"
    model_version: str = "gemini-2.5-flash"
    demo: bool = False
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ExpenseStatus(str, Enum):
    LOGGED_EXPENSE = "logged_expense"        # Self-reported actual expense
    VENDOR_COMMITMENT = "vendor_commitment"  # Signed contract / quote
    ESTIMATE = "estimate"                    # Preliminary planning figure


class ExpenseItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    category: str
    title: str
    amount: float = Field(..., ge=0)
    date: str  # YYYY-MM-DD
    status: ExpenseStatus = ExpenseStatus.LOGGED_EXPENSE
    vendor_name: Optional[str] = None
    notes: Optional[str] = None
    receipt_note: Optional[str] = None
    is_verified_payment: bool = False  # Strictly False unless external payment gateway confirms


class CategoryBudgetUpdateRequest(BaseModel):
    categories: List[BudgetCategory]
    contingency_amount: Optional[float] = None
    total_budget: Optional[float] = None


class BudgetRescueOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str
    tier: str  # "minimal" | "balanced" | "maximum"
    estimated_savings: float
    revised_total_budget: float
    quality_impact_score: int = Field(..., ge=0, le=100)
    quality_impact_description: str
    trade_offs: List[str] = Field(default_factory=list)
    alternative_choices: List[str] = Field(default_factory=list)
    category_adjustments: Dict[str, float] = Field(default_factory=dict)
    revised_categories: List[BudgetCategory] = Field(default_factory=list)
    revised_contingency: float = 0.0


class BudgetRescueResponse(BaseModel):
    event_id: str
    target_budget: float
    actual_spending: float
    overrun_amount: float
    is_over_budget: bool
    overrun_categories: List[str] = Field(default_factory=list)
    options: List[BudgetRescueOption] = Field(default_factory=list)
    prompt_version: str = "2026.10.1"
    demo: bool = True


class ApplyBudgetRescueRequest(BaseModel):
    tier: str
    revised_categories: List[BudgetCategory]
    revised_contingency: float = 0.0


class EventSaveRequest(BaseModel):
    user_id: str
    plan: Union[EventPlan, Dict[str, Any]]


class EventUpdateRequest(BaseModel):
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    notes: Optional[str] = None
    plan: Optional[Dict[str, Any]] = None
    plan_data: Optional[Dict[str, Any]] = None
    archived: Optional[bool] = None


class RegenerateSection(str, Enum):
    CONCEPT = "concept"
    THEME = "theme"
    BUDGET = "budget"
    TIMELINE = "timeline"
    VENDORS = "vendors"
    GUEST_PLAN = "guest_plan"
    FOOD_ENTERTAINMENT = "food_and_entertainment"
    RISKS = "risks"
    IDEAS = "personalized_ideas"
    NEXT_ACTIONS = "next_actions"


class RegenerateRequest(BaseModel):
    section: RegenerateSection
    additional_context: Optional[str] = None
    instructions: Optional[str] = None


class CreateTimelineTaskRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    stage: TaskStage = TaskStage.INITIAL_PLANNING
    category: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: str
    status: TaskStatus = TaskStatus.NOT_STARTED
    assignee: Optional[str] = None
    dependencies: List[str] = Field(default_factory=list)
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None


class UpdateTimelineTaskRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[TaskStage] = None
    category: Optional[str] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[str] = None
    status: Optional[TaskStatus] = None
    assignee: Optional[str] = None
    dependencies: Optional[List[str]] = None
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None


class RegenerateStageRequest(BaseModel):
    stage: Optional[TaskStage] = None
    category: Optional[str] = None
    instructions: Optional[str] = None


# ── SECTION 11: VENDOR MATCHBOARD SCHEMAS ─────────────────────────────────────
class VendorCategory(str, Enum):
    VENUES = "venues"
    CATERERS = "caterers"
    PHOTOGRAPHERS = "photographers"
    DECORATORS = "decorators"
    FLORISTS = "florists"
    ENTERTAINMENT = "entertainment"
    MAKEUP_ARTISTS = "makeup_artists"
    TRANSPORTATION = "transportation"
    OTHER = "other"


class VendorSelectionStatus(str, Enum):
    SHORTLISTED = "shortlisted"
    CONTACTED = "contacted"
    SELECTED = "selected"
    REJECTED = "rejected"
    BOOKED = "booked"  # Strictly set only by explicit user booking confirmation


class VendorAvailability(str, Enum):
    AVAILABLE = "available"
    TENTATIVE = "tentative"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"


class VendorRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    business_name: str
    category: VendorCategory = VendorCategory.OTHER
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_info: Optional[str] = None
    website: Optional[str] = None
    quoted_price: float = Field(default=0.0, ge=0)
    currency: str = "INR"
    availability_status: VendorAvailability = VendorAvailability.UNKNOWN
    selection_status: VendorSelectionStatus = VendorSelectionStatus.SHORTLISTED
    rating: Optional[float] = Field(default=None, ge=1.0, le=5.0)
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None  # YYYY-MM-DD
    quotation_details: Optional[str] = None  # Specific package inclusions / deliverables
    comparison_notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class CreateVendorRequest(BaseModel):
    business_name: str
    category: VendorCategory = VendorCategory.OTHER
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_info: Optional[str] = None
    website: Optional[str] = None
    quoted_price: float = Field(default=0.0, ge=0)
    currency: str = "INR"
    availability_status: VendorAvailability = VendorAvailability.UNKNOWN
    selection_status: VendorSelectionStatus = VendorSelectionStatus.SHORTLISTED
    rating: Optional[float] = Field(default=None, ge=1.0, le=5.0)
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    quotation_details: Optional[str] = None
    comparison_notes: Optional[str] = None


class UpdateVendorRequest(BaseModel):
    business_name: Optional[str] = None
    category: Optional[VendorCategory] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_info: Optional[str] = None
    website: Optional[str] = None
    quoted_price: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = None
    availability_status: Optional[VendorAvailability] = None
    selection_status: Optional[VendorSelectionStatus] = None
    rating: Optional[float] = Field(default=None, ge=1.0, le=5.0)
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    quotation_details: Optional[str] = None
    comparison_notes: Optional[str] = None


class VendorComparisonRequest(BaseModel):
    vendor_ids: List[str]
    category: Optional[str] = None


class VendorComparisonAnalysis(BaseModel):
    summary: str
    price_comparison: str
    key_differences: List[str] = Field(default_factory=list)
    suggested_interview_questions: List[str] = Field(default_factory=list)
    negotiation_tips: List[str] = Field(default_factory=list)
    disclaimer: str = "Analysis strictly synthesized from user-supplied quotes. No fictitious vendors, reviews, or market rates generated."


# ── SECTION 12: GUEST & RSVP MANAGER SCHEMAS ──────────────────────────────────
class GuestRsvpStatus(str, Enum):
    NOT_INVITED = "not_invited"
    INVITED = "invited"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    MAYBE = "maybe"


class GuestInvitationStatus(str, Enum):
    NOT_SENT = "not_sent"
    SENT_MANUAL = "sent_manual"
    DELIVERED = "delivered"


class GuestRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    group_household: str = "General"
    invitation_status: GuestInvitationStatus = GuestInvitationStatus.NOT_SENT
    invitation_delivery_note: str = "Manually Tracked (No automated delivery gateway configured)"
    rsvp_status: GuestRsvpStatus = GuestRsvpStatus.NOT_INVITED
    party_size: int = Field(default=1, ge=1)
    adults_count: int = Field(default=1, ge=0)
    children_count: int = Field(default=0, ge=0)
    dietary_preference: Optional[str] = "Standard"
    accessibility_requests: Optional[str] = None
    table_assignment: Optional[str] = "Unassigned"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class CreateGuestRequest(BaseModel):
    name: str
    group_household: Optional[str] = "General"
    invitation_status: Optional[GuestInvitationStatus] = GuestInvitationStatus.NOT_SENT
    rsvp_status: Optional[GuestRsvpStatus] = GuestRsvpStatus.NOT_INVITED
    party_size: Optional[int] = Field(default=1, ge=1)
    adults_count: Optional[int] = Field(default=1, ge=0)
    children_count: Optional[int] = Field(default=0, ge=0)
    dietary_preference: Optional[str] = "Standard"
    accessibility_requests: Optional[str] = None
    table_assignment: Optional[str] = "Unassigned"
    notes: Optional[str] = None


class UpdateGuestRequest(BaseModel):
    name: Optional[str] = None
    group_household: Optional[str] = None
    invitation_status: Optional[GuestInvitationStatus] = None
    rsvp_status: Optional[GuestRsvpStatus] = None
    party_size: Optional[int] = Field(default=None, ge=1)
    adults_count: Optional[int] = Field(default=None, ge=0)
    children_count: Optional[int] = Field(default=None, ge=0)
    dietary_preference: Optional[str] = None
    accessibility_requests: Optional[str] = None
    table_assignment: Optional[str] = None
    notes: Optional[str] = None


class BulkGuestImportRow(BaseModel):
    name: str
    group_household: Optional[str] = "General"
    party_size: Optional[int] = 1
    adults_count: Optional[int] = 1
    children_count: Optional[int] = 0
    rsvp_status: Optional[str] = "not_invited"
    dietary_preference: Optional[str] = "Standard"
    accessibility_requests: Optional[str] = None
    table_assignment: Optional[str] = "Unassigned"
    notes: Optional[str] = None


class BulkGuestImportRequest(BaseModel):
    guests: List[BulkGuestImportRow]
    skip_duplicates: bool = True


class BulkGuestImportResponse(BaseModel):
    imported_count: int
    skipped_duplicate_count: int
    errors: List[str] = Field(default_factory=list)
    duplicates_detected: List[str] = Field(default_factory=list)
    guests: List[GuestRecord]


class CateringEstimateResponse(BaseModel):
    total_confirmed_guests: int
    total_confirmed_parties: int
    total_maybe_guests: int
    total_declined_guests: int
    total_invited_headcount: int
    expected_attendance_low: int
    expected_attendance_high: int
    expected_attendance_estimated: int  # Confirmed + 50% of Maybe
    dietary_breakdown: Dict[str, int] = Field(default_factory=dict)
    accessibility_summary: List[str] = Field(default_factory=list)
    table_seating_summary: Dict[str, int] = Field(default_factory=dict)
    unassigned_count: int = 0


class MoodboardItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    section: str = "decoration"  # "decoration", "venue", "lighting", "floral", "table", "food", "notes", "images"
    title: Optional[str] = None
    content: str = ""
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    color_tag: Optional[str] = None
    sort_order: int = 0
    order: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "description" in data and not data.get("content"):
                data["content"] = data["description"]
            if "category" in data and not data.get("section"):
                data["section"] = data["category"].lower()
            if "order" in data and "sort_order" not in data:
                data["sort_order"] = data["order"]
        return data


class MoodboardRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    theme: str
    color_palette: List[str] = Field(default_factory=list)
    dress_code: Optional[str] = None
    invitation_direction: Optional[str] = None
    decoration_ideas: List[str] = Field(default_factory=list)
    venue_styling: List[str] = Field(default_factory=list)
    lighting: List[str] = Field(default_factory=list)
    floral_arrangements: List[str] = Field(default_factory=list)
    table_styling: List[str] = Field(default_factory=list)
    food_presentation: List[str] = Field(default_factory=list)
    inspiration_notes: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    items: List[MoodboardItem] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class CreateMoodboardRequest(BaseModel):
    name: str
    theme: str
    color_palette: Optional[List[str]] = None
    dress_code: Optional[str] = None
    invitation_direction: Optional[str] = None
    decoration_ideas: Optional[List[str]] = None
    venue_styling: Optional[List[str]] = None
    lighting: Optional[List[str]] = None
    floral_arrangements: Optional[List[str]] = None
    table_styling: Optional[List[str]] = None
    food_presentation: Optional[List[str]] = None
    inspiration_notes: Optional[List[str]] = None
    images: Optional[List[str]] = None
    items: Optional[List[MoodboardItem]] = None


class UpdateMoodboardRequest(BaseModel):
    name: Optional[str] = None
    theme: Optional[str] = None
    color_palette: Optional[List[str]] = None
    dress_code: Optional[str] = None
    invitation_direction: Optional[str] = None
    decoration_ideas: Optional[List[str]] = None
    venue_styling: Optional[List[str]] = None
    lighting: Optional[List[str]] = None
    floral_arrangements: Optional[List[str]] = None
    table_styling: Optional[List[str]] = None
    food_presentation: Optional[List[str]] = None
    inspiration_notes: Optional[List[str]] = None
    images: Optional[List[str]] = None
    items: Optional[List[MoodboardItem]] = None


class DuplicateMoodboardRequest(BaseModel):
    new_name: Optional[str] = None


# ── SECTION 14: EVENT PLAN CONCEPT COMPARISON SCHEMAS ─────────────────────────
class EventConceptComparisonItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    concept_name: str
    theme: str
    estimated_budget: float
    currency: str = "INR"
    budget_fit: str  # "Within Budget", "Budget Optimized", "Moderate Overrun"
    overrun_amount: float = 0.0
    is_within_budget: bool = True
    guest_experience: str
    decoration_direction: str
    catering_direction: str
    planning_complexity: str  # "Low", "Medium", "High"
    complexity_rationale: str
    main_advantages: List[str] = Field(default_factory=list)
    trade_offs: List[str] = Field(default_factory=list)
    estimated_cost_savings: List[str] = Field(default_factory=list)
    cost_saving_opportunities: List[str] = Field(default_factory=list)
    recommended_color_palette: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def sync_cost_savings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            savings = data.get("estimated_cost_savings") or data.get("cost_saving_opportunities") or []
            data["estimated_cost_savings"] = savings
            data["cost_saving_opportunities"] = savings
        return data


class GenerateConceptComparisonRequest(BaseModel):
    custom_instructions: Optional[str] = None
    target_concepts_count: int = 3


class EventConceptComparisonResponse(BaseModel):
    event_id: str
    target_budget: float
    currency: str
    concepts: List[EventConceptComparisonItem]


class AdoptConceptRequest(BaseModel):
    concept_id: str
    confirmed: bool = False  # Strictly requires explicit user confirmation


# ── SECTION 15: AI EVENT COPILOT & ACTION SAFETY SCHEMAS ──────────────────────
class CopilotActionType(str, Enum):
    UPDATE_BUDGET_ALLOCATION = "update_budget_allocation"
    ADD_TIMELINE_TASK = "add_timeline_task"
    UPDATE_TASK_STATUS = "update_task_status"
    ADD_BUDGET_EXPENSE = "add_budget_expense"
    UPDATE_THEME = "update_theme"
    ADD_MOODBOARD_NOTE = "add_moodboard_note"


class CopilotProposedAction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    action_type: CopilotActionType
    title: str
    description: str
    affected_records: List[str] = Field(default_factory=list)
    expected_impact: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    status: str = "pending"  # "pending", "confirmed", "applied", "declined"


class CopilotMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    role: str  # "user" | "assistant" | "system"
    content: str
    proposed_action: Optional[CopilotProposedAction] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class CopilotChatRequest(BaseModel):
    message: str
    history: List[CopilotMessage] = Field(default_factory=list)
    custom_context: Optional[str] = None


class CopilotChatResponse(BaseModel):
    event_id: str
    reply: str
    proposed_action: Optional[CopilotProposedAction] = None
    context_summary: Dict[str, Any] = Field(default_factory=dict)
    readiness_score: int = 80
    readiness_breakdown: Dict[str, Any] = Field(default_factory=dict)
    is_demo: bool = False
    model_version: str = "gemini-2.0-flash"


class CopilotApplyActionRequest(BaseModel):
    action_id: str
    action_type: CopilotActionType
    parameters: Dict[str, Any] = Field(default_factory=dict)
    confirmed: bool = False  # Strictly requires explicit user confirmation


class CopilotApplyActionResponse(BaseModel):
    success: bool
    message: str
    action_type: CopilotActionType
    action_id: str
    updated_record: Optional[Dict[str, Any]] = None
    event_id: str


# ── SECTION 17: TRANSPARENT EVENT READINESS SCORE SCHEMAS ────────────────────
class ReadinessCategoryScore(BaseModel):
    category_name: str
    score: float
    max_score: float
    percentage: float
    status_label: str  # e.g., "Optimal", "Good", "Needs Attention", "Critical"
    criteria_met: List[str] = Field(default_factory=list)
    criteria_unmet: List[str] = Field(default_factory=list)


class NextBestMove(BaseModel):
    title: str
    description: str
    priority: str  # "critical", "high", "recommended"
    target_module: str  # "vendors", "budget", "timeline", "guests", "copilot"
    action_label: str
    expected_impact: str


class EventReadinessResponse(BaseModel):
    event_id: str
    event_name: str
    overall_score: int
    score_grade: str  # "Celebration Ready", "Well Prepared", "Needs Attention", "Critical Attention", "Insufficient Data"
    is_insufficient_data: bool = False
    data_sufficiency_pct: int = 100
    category_scores: Dict[str, ReadinessCategoryScore]
    positive_indicators: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    overdue_tasks: List[Dict[str, Any]] = Field(default_factory=list)
    budget_risks: List[str] = Field(default_factory=list)
    next_recommended_actions: List[str] = Field(default_factory=list)
    next_best_move: NextBestMove
    formula_documentation: str


EventPlan.model_rebuild()



