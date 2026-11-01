import type {
  EventFormData,
  EventPlan,
  SavedEvent,
  VendorRecord,
  VendorComparisonAnalysis,
  GuestRecord,
  BulkGuestImportRow,
  BulkGuestImportResponse,
  CateringEstimateResponse,
  MoodboardRecord,
  EventConceptComparisonItem,
  EventConceptComparisonResponse,
  CopilotMessage,
  CopilotChatResponse,
  CopilotApplyActionResponse,
  CopilotActionType,
  EventReadinessResponse,
} from '../types/events';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

let _authToken: string | null = null;
let _authUserId: string | null = null;

export function setApiAuth(token: string | null, userId?: string | null) {
  _authToken = token;
  if (userId) _authUserId = userId;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }
  if (_authUserId) {
    headers['x-user-id'] = _authUserId;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(res.status, error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Events ──────────────────────────────────────────────────────────────────

export async function generateEventPlan(formData: EventFormData): Promise<EventPlan> {
  return request<EventPlan>('/api/events/generate', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

export async function generatePlanForEvent(
  eventId: string,
  userId: string = 'demo-user-001',
  formData?: Partial<EventFormData>
): Promise<EventPlan> {
  return request<EventPlan>(`/api/events/${eventId}/generate-plan?user_id=${userId}`, {
    method: 'POST',
    body: formData ? JSON.stringify(formData) : undefined,
  });
}

export async function regenerateSection(
  eventId: string,
  section: string,
  instructions?: string,
  userId: string = 'demo-user-001'
): Promise<{ section: string; data: any; demo?: boolean }> {
  return request(`/api/events/${eventId}/regenerate-section?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ section, instructions, additional_context: instructions }),
  });
}

export async function saveEventPlan(userId: string, plan: EventPlan | any): Promise<{ success: boolean; event: SavedEvent }> {
  return request('/api/events/save', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, plan }),
  });
}

export async function getUserEvents(userId: string): Promise<{ events: SavedEvent[]; count: number }> {
  return request(`/api/events/user/${userId}`);
}

export async function getEvent(eventId: string, userId: string): Promise<SavedEvent> {
  return request(`/api/events/${eventId}?user_id=${userId}`);
}

export async function updateEvent(
  eventId: string,
  userId: string,
  updates: Record<string, any>
): Promise<{ success: boolean; event: SavedEvent }> {
  return request(`/api/events/${eventId}?user_id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteEvent(eventId: string, userId: string): Promise<{ success: boolean }> {
  return request(`/api/events/${eventId}?user_id=${userId}`, { method: 'DELETE' });
}

// ── Budget Studio & Rescue ──────────────────────────────────────────────────

export async function getBudgetRescue(
  eventId: string,
  userId: string = 'demo-user-001'
): Promise<import('../types/events').BudgetRescueResponse> {
  return request(`/api/events/${eventId}/budget-rescue?user_id=${userId}`, {
    method: 'POST',
  });
}

export async function applyBudgetRescue(
  eventId: string,
  req: import('../types/events').ApplyBudgetRescueRequest,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; applied_tier: string; categories: import('../types/events').BudgetCategory[]; contingency: number }> {
  return request(`/api/events/${eventId}/budget/apply-rescue?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function addBudgetExpense(
  eventId: string,
  expense: Omit<import('../types/events').ExpenseItem, 'id'> & { id?: string },
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; expense: import('../types/events').ExpenseItem; total_expenses: number }> {
  return request(`/api/events/${eventId}/budget/expenses?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

export async function updateBudgetExpense(
  eventId: string,
  expenseId: string,
  expense: import('../types/events').ExpenseItem,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; expense: import('../types/events').ExpenseItem }> {
  return request(`/api/events/${eventId}/budget/expenses/${expenseId}?user_id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify(expense),
  });
}

export async function deleteBudgetExpense(
  eventId: string,
  expenseId: string,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; remaining_count: number }> {
  return request(`/api/events/${eventId}/budget/expenses/${expenseId}?user_id=${userId}`, {
    method: 'DELETE',
  });
}

export async function updateBudgetCategories(
  eventId: string,
  req: import('../types/events').CategoryBudgetUpdateRequest,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean }> {
  return request(`/api/events/${eventId}/budget/categories?user_id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  });
}

// ── Timeline & Task Management ──────────────────────────────────────────────

export async function getTimelineTasks(
  eventId: string,
  userId: string = 'demo-user-001'
): Promise<{
  event_id: string;
  event_date: string;
  tasks: import('../types/events').TimelineTask[];
  total_count: number;
  completed_count: number;
}> {
  return request(`/api/events/${eventId}/timeline/tasks?user_id=${userId}`);
}

export async function createTimelineTask(
  eventId: string,
  task: Omit<import('../types/events').TimelineTask, 'id'>,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; task: import('../types/events').TimelineTask; total_count: number }> {
  return request(`/api/events/${eventId}/timeline/tasks?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export async function updateTimelineTask(
  eventId: string,
  taskId: string,
  taskUpdates: Partial<import('../types/events').TimelineTask>,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; task: import('../types/events').TimelineTask }> {
  return request(`/api/events/${eventId}/timeline/tasks/${taskId}?user_id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify(taskUpdates),
  });
}

export async function deleteTimelineTask(
  eventId: string,
  taskId: string,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; remaining_count: number }> {
  return request(`/api/events/${eventId}/timeline/tasks/${taskId}?user_id=${userId}`, {
    method: 'DELETE',
  });
}

export async function generateTimelineTasks(
  eventId: string,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; tasks: import('../types/events').TimelineTask[]; count: number }> {
  return request(`/api/events/${eventId}/timeline/generate?user_id=${userId}`, {
    method: 'POST',
  });
}

export async function regenerateTimelineStage(
  eventId: string,
  params:
    | {
        stage?: import('../types/events').TaskStage;
        category?: string;
        instructions?: string;
      }
    | import('../types/events').TaskStage,
  instructions?: string,
  userId: string = 'demo-user-001'
): Promise<{
  success: boolean;
  tasks: import('../types/events').TimelineTask[];
  regenerated_target?: string;
  regenerated_stage?: string;
  regenerated_category?: string;
  total_task_count?: number;
}> {
  const body =
    typeof params === 'string'
      ? { stage: params, instructions }
      : params;

  return request(`/api/events/${eventId}/timeline/regenerate-stage?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── MODULE A: VENDOR MATCHBOARD API ──────────────────────────────────────────
export async function getEventVendors(
  eventId: string,
  params?: {
    category?: string;
    selection_status?: string;
    availability_status?: string;
    search?: string;
  },
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; event_id: string; count: number; total_unfiltered: number; vendors: VendorRecord[] }> {
  const query = new URLSearchParams({ user_id: userId });
  if (params?.category && params.category !== 'all') query.append('category', params.category);
  if (params?.selection_status && params.selection_status !== 'all') query.append('selection_status', params.selection_status);
  if (params?.availability_status && params.availability_status !== 'all') query.append('availability_status', params.availability_status);
  if (params?.search) query.append('search', params.search);

  return request(`/api/events/${eventId}/vendors?${query.toString()}`);
}

export async function addVendor(
  eventId: string,
  vendor: Partial<VendorRecord>,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; vendor: VendorRecord }> {
  return request(`/api/events/${eventId}/vendors?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(vendor),
  });
}

export async function updateVendor(
  eventId: string,
  vendorId: string,
  updates: Partial<VendorRecord>,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; vendor: VendorRecord }> {
  return request(`/api/events/${eventId}/vendors/${vendorId}?user_id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteVendor(
  eventId: string,
  vendorId: string,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; remaining_count: number }> {
  return request(`/api/events/${eventId}/vendors/${vendorId}?user_id=${userId}`, {
    method: 'DELETE',
  });
}

export async function compareVendors(
  eventId: string,
  vendorIds: string[],
  category?: string,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; analysis: VendorComparisonAnalysis }> {
  return request(`/api/events/${eventId}/vendors/compare?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ vendor_ids: vendorIds, category }),
  });
}

// ── MODULE B: GUEST AND RSVP MANAGER API ─────────────────────────────────────
export async function getEventGuests(
  eventId: string,
  params?: {
    rsvp_status?: string;
    group_household?: string;
    dietary?: string;
    search?: string;
  },
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; event_id: string; count: number; total_unfiltered: number; guests: GuestRecord[] }> {
  const query = new URLSearchParams({ user_id: userId });
  if (params?.rsvp_status && params.rsvp_status !== 'all') query.append('rsvp_status', params.rsvp_status);
  if (params?.group_household && params.group_household !== 'all') query.append('group_household', params.group_household);
  if (params?.dietary && params.dietary !== 'all') query.append('dietary', params.dietary);
  if (params?.search) query.append('search', params.search);

  return request(`/api/events/${eventId}/guests?${query.toString()}`);
}

export async function addGuest(
  eventId: string,
  guest: Partial<GuestRecord>,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; guest: GuestRecord; duplicate_warning?: string | null }> {
  return request(`/api/events/${eventId}/guests?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(guest),
  });
}

export async function updateGuest(
  eventId: string,
  guestId: string,
  updates: Partial<GuestRecord>,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; guest: GuestRecord }> {
  return request(`/api/events/${eventId}/guests/${guestId}?user_id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteGuest(
  eventId: string,
  guestId: string,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; remaining_count: number }> {
  return request(`/api/events/${eventId}/guests/${guestId}?user_id=${userId}`, {
    method: 'DELETE',
  });
}

export async function bulkImportGuests(
  eventId: string,
  guests: BulkGuestImportRow[],
  skipDuplicates: boolean = true,
  userId: string = 'demo-user-001'
): Promise<BulkGuestImportResponse> {
  return request(`/api/events/${eventId}/guests/bulk-import?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ guests, skip_duplicates: skipDuplicates }),
  });
}

export async function getCateringEstimate(
  eventId: string,
  userId: string = 'demo-user-001'
): Promise<CateringEstimateResponse> {
  return request(`/api/events/${eventId}/guests/catering-estimate?user_id=${userId}`);
}

// ── MOODBOARD STUDIO API ─────────────────────────────────────────────────────
export async function getEventMoodboards(
  eventId: string,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; event_id: string; moodboards: MoodboardRecord[] }> {
  return request(`/api/events/${eventId}/moodboards?user_id=${userId}`);
}

export async function createMoodboard(
  eventId: string,
  data: Partial<MoodboardRecord>,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; moodboard: MoodboardRecord }> {
  return request(`/api/events/${eventId}/moodboards?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMoodboard(
  eventId: string,
  moodboardId: string,
  updates: Partial<MoodboardRecord>,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; moodboard: MoodboardRecord }> {
  return request(`/api/events/${eventId}/moodboards/${moodboardId}?user_id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteMoodboard(
  eventId: string,
  moodboardId: string,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; remaining_count: number }> {
  return request(`/api/events/${eventId}/moodboards/${moodboardId}?user_id=${userId}`, {
    method: 'DELETE',
  });
}

export async function duplicateMoodboard(
  eventId: string,
  moodboardId: string,
  newName?: string,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; moodboard: MoodboardRecord }> {
  return request(`/api/events/${eventId}/moodboards/${moodboardId}/duplicate?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ new_name: newName }),
  });
}

// ── EVENT CONCEPT COMPARISON API ─────────────────────────────────────────────
export async function getConceptComparison(
  eventId: string,
  userId: string = 'demo-user-001'
): Promise<EventConceptComparisonResponse> {
  return request(`/api/events/${eventId}/concept-comparison?user_id=${userId}`);
}

export async function generateConceptComparison(
  eventId: string,
  customInstructions?: string,
  userId: string = 'demo-user-001'
): Promise<EventConceptComparisonResponse> {
  return request(`/api/events/${eventId}/concept-comparison/generate?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ custom_instructions: customInstructions, target_concepts_count: 3 }),
  });
}

export async function adoptConcept(
  eventId: string,
  conceptId: string,
  confirmed: boolean,
  userId: string = 'demo-user-001'
): Promise<{ success: boolean; message: string; adopted_concept: EventConceptComparisonItem }> {
  return request(`/api/events/${eventId}/concept-comparison/adopt?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ concept_id: conceptId, confirmed }),
  });
}

// ── AI EVENT COPILOT API ─────────────────────────────────────────────────────
export async function sendCopilotMessage(
  eventId: string,
  message: string,
  history: CopilotMessage[] = [],
  userId: string = 'demo-user-001'
): Promise<CopilotChatResponse> {
  return request<CopilotChatResponse>(`/api/events/${eventId}/copilot/chat?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
}

export async function executeCopilotAction(
  eventId: string,
  actionId: string,
  actionType: CopilotActionType,
  parameters: Record<string, any>,
  confirmed: boolean,
  userId: string = 'demo-user-001'
): Promise<CopilotApplyActionResponse> {
  return request<CopilotApplyActionResponse>(`/api/events/${eventId}/copilot/execute-action?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify({
      action_id: actionId,
      action_type: actionType,
      parameters,
      confirmed,
    }),
  });
}

// ── AUTHENTICATION API ───────────────────────────────────────────────────────
export async function getAuthProviders(): Promise<{
  email_password: boolean;
  google_oauth: boolean;
  demo_mode: boolean;
  storage_engine: string;
}> {
  return request('/api/auth/providers');
}

export async function recoverPassword(email: string): Promise<{ success: boolean; message: string; demo?: boolean }> {
  return request('/api/auth/recover-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function getEventReadiness(
  eventId: string,
  userId: string = 'demo-user-001'
): Promise<EventReadinessResponse> {
  return request<EventReadinessResponse>(`/api/events/${eventId}/readiness?user_id=${userId}`);
}

export async function checkHealth(): Promise<{
  status: string;
  demo_mode: boolean;
  gemini_configured: boolean;
  supabase_configured: boolean;
}> {
  return request('/api/health');
}

export async function resetDemoData(): Promise<{ success: boolean; message: string; events_count?: number }> {
  return request('/api/events/reset-demo', {
    method: 'POST',
  });
}

export { ApiError };


