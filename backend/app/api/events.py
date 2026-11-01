"""
Events API router — all /api/events/* endpoints
"""
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query

from app.schemas.events import (
    EventGenerateRequest, EventPlan, EventSaveRequest,
    EventUpdateRequest, RegenerateRequest,
    ExpenseItem, CategoryBudgetUpdateRequest,
    BudgetRescueResponse, ApplyBudgetRescueRequest, BudgetCategory,
    TimelineTask, TaskStatus, TaskStage, TaskPriority,
    CreateTimelineTaskRequest, UpdateTimelineTaskRequest, RegenerateStageRequest,
    VendorCategory, VendorSelectionStatus, VendorAvailability, VendorRecord,
    CreateVendorRequest, UpdateVendorRequest, VendorComparisonRequest, VendorComparisonAnalysis,
    GuestRsvpStatus, GuestInvitationStatus, GuestRecord,
    CreateGuestRequest, UpdateGuestRequest, BulkGuestImportRequest, BulkGuestImportResponse,
    CateringEstimateResponse,
    MoodboardRecord, CreateMoodboardRequest, UpdateMoodboardRequest, DuplicateMoodboardRequest,
    EventConceptComparisonItem, GenerateConceptComparisonRequest, EventConceptComparisonResponse, AdoptConceptRequest,
    CopilotChatRequest, CopilotChatResponse, CopilotApplyActionRequest, CopilotApplyActionResponse,
    CopilotActionType, CopilotProposedAction, CopilotMessage,
    ReadinessCategoryScore, NextBestMove, EventReadinessResponse
)
from app.services.gemini_service import (
    generate_event_plan, regenerate_section, generate_budget_rescue_plan,
    generate_chronological_timeline_tasks, regenerate_timeline_stage_tasks,
    analyze_vendor_comparison, detect_duplicate_guest, calculate_catering_and_attendance,
    generate_palette_from_theme, generate_event_concept_comparison, generate_copilot_response
)
from app.services.readiness_service import calculate_event_readiness
from app.services.supabase_service import (
    save_event, get_user_events, get_event_by_id, update_event, delete_event
)

router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("/generate", response_model=EventPlan)
async def generate_event(req: EventGenerateRequest):
    """Generate a full AI-powered event plan."""
    try:
        plan = await generate_event_plan(req)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/generate-plan", response_model=EventPlan)
async def generate_plan_for_event(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
    req: Optional[EventGenerateRequest] = None
):
    """
    Generate or re-synthesize a complete 10-section AI event blueprint for a specific event.
    Persists the plan directly to the event record.
    """
    target_user = user_id or "demo-user-001"
    
    if req:
        generate_req = req
    else:
        existing = await get_event_by_id(event_id, target_user)
        if not existing:
            raise HTTPException(status_code=404, detail="Event record not found")
        plan_data = existing.get("plan_data", {})
        generate_req = EventGenerateRequest(
            event_type=existing.get("event_type") or plan_data.get("event_type") or "wedding",
            event_name=existing.get("event_name") or plan_data.get("event_name") or "Celebration",
            event_date=existing.get("event_date") or plan_data.get("event_date") or "2026-12-01",
            guest_count=plan_data.get("guest_count", 100),
            location=plan_data.get("location", "Venue"),
            total_budget=plan_data.get("total_estimated_budget") or plan_data.get("budget") or plan_data.get("total_budget"),
            currency=plan_data.get("currency", "INR"),
            description=plan_data.get("summary"),
        )
    
    try:
        plan = await generate_event_plan(generate_req)
        plan.event_id = event_id

        # Preserve existing stateful data (expenses, tasks, vendors, guests)
        existing_rec = await get_event_by_id(event_id, target_user)
        existing_plan = existing_rec.get("plan_data", {}) if existing_rec else {}
        dumped_plan = plan.model_dump()
        if existing_plan.get("expenses"):
            dumped_plan["expenses"] = existing_plan["expenses"]
        if existing_plan.get("tasks"):
            dumped_plan["tasks"] = existing_plan["tasks"]
        if existing_plan.get("vendors"):
            dumped_plan["vendors"] = existing_plan["vendors"]
        if existing_plan.get("guests"):
            dumped_plan["guests"] = existing_plan["guests"]
        if existing_plan.get("moodboards"):
            dumped_plan["moodboards"] = existing_plan["moodboards"]
        if existing_plan.get("concept_comparisons"):
            dumped_plan["concept_comparisons"] = existing_plan["concept_comparisons"]

        # Persist updated blueprint to store
        await update_event(event_id, target_user, {
            "event_name": plan.event_name,
            "event_date": plan.event_date,
            "plan_data": dumped_plan,
        })

        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-demo")
async def reset_demo_endpoint():
    """Reset demo data to initial pristine sample celebration records."""
    from app.services.supabase_service import reset_demo_store
    result = await reset_demo_store()
    return result


@router.post("/save")
async def save_event_plan(req: EventSaveRequest):
    """Persist an event plan to storage."""
    try:
        plan_dict = req.plan.model_dump() if hasattr(req.plan, "model_dump") else req.plan
        result = await save_event(req.user_id, plan_dict)
        return {"success": True, "event": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}")
async def list_user_events(user_id: str):
    """List all events for a user."""
    try:
        events = await get_user_events(user_id)
        return {"events": events, "count": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}")
async def get_event(event_id: str, user_id: str = "demo-user-001"):
    """Get a specific event plan."""
    event = await get_event_by_id(event_id, user_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/{event_id}")
async def update_event_plan(event_id: str, user_id: str, req: EventUpdateRequest):
    """Update an event plan."""
    try:
        result = await update_event(event_id, user_id, req.model_dump(exclude_none=True))
        if not result:
            raise HTTPException(status_code=404, detail="Event not found")
        return {"success": True, "event": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{event_id}")
async def delete_event_plan(event_id: str, user_id: str = "demo-user-001"):
    """Delete an event plan."""
    success = await delete_event(event_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True}


@router.post("/{event_id}/regenerate")
async def regenerate_event_section(
    event_id: str,
    req: RegenerateRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Regenerate a specific section of an event plan."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    try:
        plan_data = event.get("plan_data", {})
        try:
            plan = EventPlan(**plan_data)
        except Exception:
            plan = await generate_event_plan(
                EventGenerateRequest(
                    event_type=event.get("event_type") or "wedding",
                    event_name=event.get("event_name") or "Celebration",
                    event_date=event.get("event_date") or "2026-12-01",
                    guest_count=plan_data.get("guest_count", 100),
                    location=plan_data.get("location", "Venue"),
                )
            )
        context = req.instructions or req.additional_context
        result = await regenerate_section(plan, req.section, context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/regenerate-section")
async def regenerate_event_section_alias(
    event_id: str,
    req: RegenerateRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Alias for section regeneration."""
    return await regenerate_event_section(event_id, req, user_id)


@router.post("/{event_id}/budget-rescue", response_model=BudgetRescueResponse)
async def get_budget_rescue(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Generate proactive or emergency Budget Rescue alternatives for an event.
    Evaluates current planned budget against actual spending and formulates
    Minimal, Balanced, and Maximum savings strategies.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    plan_data = event.get("plan_data", {})
    total_budget = float(plan_data.get("total_estimated_budget") or plan_data.get("budget") or 1500000)
    currency = plan_data.get("currency", "INR")
    event_name = event.get("event_name", "Celebration")
    event_type = event.get("event_type", "wedding")

    # Categories
    raw_cats = plan_data.get("budget_plan", {}).get("categories") or plan_data.get("budget_breakdown") or []
    categories = [BudgetCategory(**c) if isinstance(c, dict) else c for c in raw_cats]

    # Expenses
    expenses = plan_data.get("expenses", [])
    actual_spending = sum(float(exp.get("amount", 0)) for exp in expenses)

    rescue_response = await generate_budget_rescue_plan(
        event_id=event_id,
        event_name=event_name,
        event_type=event_type,
        target_budget=total_budget,
        actual_spending=actual_spending,
        categories=categories,
        currency=currency,
    )
    return rescue_response


@router.post("/{event_id}/budget/apply-rescue")
async def apply_budget_rescue(
    event_id: str,
    req: ApplyBudgetRescueRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Apply a confirmed Budget Rescue option to the event record.
    Never alters budget without explicit user confirmation.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    categories_dict = [c.model_dump() for c in req.revised_categories]

    if "budget_plan" in plan_data:
        plan_data["budget_plan"]["categories"] = categories_dict
        plan_data["budget_plan"]["contingency_amount"] = req.revised_contingency
    if "budget" in plan_data:
        plan_data["budget"]["categories"] = categories_dict
        plan_data["budget"]["contingency_amount"] = req.revised_contingency
    plan_data["budget_breakdown"] = categories_dict

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "applied_tier": req.tier, "categories": categories_dict, "contingency": req.revised_contingency}


@router.post("/{event_id}/budget/expenses")
async def add_expense(
    event_id: str,
    expense: ExpenseItem,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Record an actual expense for the celebration budget ledger."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    expenses = plan_data.get("expenses", [])
    expense_dict = expense.model_dump()
    expenses.append(expense_dict)
    plan_data["expenses"] = expenses

    # Update actual_amount on category in budget_breakdown if present
    for cat in plan_data.get("budget_breakdown", []):
        if cat.get("category") == expense.category:
            cat["actual_amount"] = round(float(cat.get("actual_amount", 0)) + expense.amount, 2)

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "expense": expense_dict, "total_expenses": len(expenses)}


@router.put("/{event_id}/budget/expenses/{expense_id}")
async def update_expense_item(
    event_id: str,
    expense_id: str,
    updated_expense: ExpenseItem,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Update a recorded expense item."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    expenses = plan_data.get("expenses", [])
    found = False
    updated_dict = {}
    for i, exp in enumerate(expenses):
        if exp.get("id") == expense_id:
            updated_dict = updated_expense.model_dump()
            updated_dict["id"] = expense_id
            expenses[i] = updated_dict
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Expense item not found")

    plan_data["expenses"] = expenses
    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "expense": updated_dict}


@router.delete("/{event_id}/budget/expenses/{expense_id}")
async def delete_expense_item(
    event_id: str,
    expense_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Delete a recorded expense with confirmation."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    expenses = plan_data.get("expenses", [])
    new_expenses = [exp for exp in expenses if exp.get("id") != expense_id]
    if len(new_expenses) == len(expenses):
        raise HTTPException(status_code=404, detail="Expense item not found")

    plan_data["expenses"] = new_expenses
    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "remaining_count": len(new_expenses)}


@router.put("/{event_id}/budget/categories")
async def update_budget_categories(
    event_id: str,
    req: CategoryBudgetUpdateRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Update category allocations, add or remove categories."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    categories_dict = [c.model_dump() for c in req.categories]
    plan_data["budget_breakdown"] = categories_dict

    if "budget_plan" in plan_data:
        plan_data["budget_plan"]["categories"] = categories_dict
        if req.contingency_amount is not None:
            plan_data["budget_plan"]["contingency_amount"] = req.contingency_amount
        if req.total_budget is not None:
            plan_data["budget_plan"]["total_budget"] = req.total_budget
            plan_data["total_estimated_budget"] = req.total_budget

    if "budget" in plan_data:
        plan_data["budget"]["categories"] = categories_dict
        if req.contingency_amount is not None:
            plan_data["budget"]["contingency_amount"] = req.contingency_amount
        if req.total_budget is not None:
            plan_data["budget"]["total_budget"] = req.total_budget

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "categories": categories_dict}


# ── TIMELINE & TASK MANAGEMENT ROUTES ────────────────────────────────────────

@router.get("/{event_id}/timeline/tasks")
async def get_timeline_tasks(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Retrieve all preparation and celebration timeline tasks for the event.
    Generates initial chronological tasks if none exist yet.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    tasks_raw = plan_data.get("tasks") or plan_data.get("timeline_plan", {}).get("tasks") or []

    # If empty, generate initial chronological tasks based on event date
    if not tasks_raw:
        event_name = event.get("event_name", "Celebration")
        event_type = event.get("event_type", "wedding")
        event_date = event.get("event_date", "2026-12-15")
        guest_count = plan_data.get("guest_count", 100)
        location = plan_data.get("location", "Venue")

        generated = generate_chronological_timeline_tasks(
            event_name=event_name,
            event_type=event_type,
            event_date=event_date,
            guest_count=guest_count,
            location=location,
        )
        tasks_raw = [t.model_dump() for t in generated]
        plan_data["tasks"] = tasks_raw
        if "timeline_plan" in plan_data and isinstance(plan_data["timeline_plan"], dict):
            plan_data["timeline_plan"]["tasks"] = tasks_raw
        await update_event(event_id, target_user, {"plan_data": plan_data})

    return {
        "event_id": event_id,
        "event_date": event.get("event_date"),
        "tasks": tasks_raw,
        "total_count": len(tasks_raw),
        "completed_count": sum(1 for t in tasks_raw if t.get("status") == "completed"),
    }


@router.post("/{event_id}/timeline/tasks")
async def create_timeline_task(
    event_id: str,
    req: CreateTimelineTaskRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Add a new custom task to the event preparation timeline."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if req.estimated_cost is not None and req.estimated_cost < 0:
        raise HTTPException(status_code=400, detail="Estimated cost cannot be negative.")

    plan_data = event.get("plan_data", {})
    tasks = plan_data.get("tasks", [])

    task_obj = TimelineTask(
        title=req.title.strip(),
        description=req.description or "",
        stage=req.stage,
        category=req.category,
        priority=req.priority,
        due_date=req.due_date,
        status=req.status,
        assignee=req.assignee,
        dependencies=req.dependencies,
        estimated_cost=req.estimated_cost,
        notes=req.notes,
    )
    task_dict = task_obj.model_dump()
    tasks.append(task_dict)

    plan_data["tasks"] = tasks
    if "timeline_plan" in plan_data and isinstance(plan_data["timeline_plan"], dict):
        plan_data["timeline_plan"]["tasks"] = tasks

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "task": task_dict, "total_count": len(tasks)}


@router.put("/{event_id}/timeline/tasks/{task_id}")
async def update_timeline_task(
    event_id: str,
    task_id: str,
    req: UpdateTimelineTaskRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Update status, deadline, priority, or details of a timeline task."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    tasks = plan_data.get("tasks", [])

    found_idx = -1
    for i, t in enumerate(tasks):
        if t.get("id") == task_id:
            found_idx = i
            break

    if found_idx == -1:
        raise HTTPException(status_code=404, detail="Task not found")

    current = tasks[found_idx]
    if req.title is not None:
        current["title"] = req.title.strip()
    if req.description is not None:
        current["description"] = req.description
    if req.stage is not None:
        current["stage"] = req.stage.value
    if req.category is not None:
        current["category"] = req.category
    if req.priority is not None:
        current["priority"] = req.priority.value
    if req.due_date is not None:
        current["due_date"] = req.due_date
    if req.status is not None:
        current["status"] = req.status.value
    if req.assignee is not None:
        current["assignee"] = req.assignee
    if req.dependencies is not None:
        current["dependencies"] = req.dependencies
    if req.estimated_cost is not None:
        if req.estimated_cost < 0:
            raise HTTPException(status_code=400, detail="Estimated cost cannot be negative.")
        current["estimated_cost"] = req.estimated_cost
    if req.notes is not None:
        current["notes"] = req.notes

    tasks[found_idx] = current
    plan_data["tasks"] = tasks
    if "timeline_plan" in plan_data and isinstance(plan_data["timeline_plan"], dict):
        plan_data["timeline_plan"]["tasks"] = tasks

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "task": current}


@router.delete("/{event_id}/timeline/tasks/{task_id}")
async def delete_timeline_task(
    event_id: str,
    task_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Delete a task from the event timeline."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    tasks = plan_data.get("tasks", [])
    remaining = [t for t in tasks if t.get("id") != task_id]

    if len(remaining) == len(tasks):
        raise HTTPException(status_code=404, detail="Task not found")

    plan_data["tasks"] = remaining
    if "timeline_plan" in plan_data and isinstance(plan_data["timeline_plan"], dict):
        plan_data["timeline_plan"]["tasks"] = remaining

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "remaining_count": len(remaining)}


@router.post("/{event_id}/timeline/generate")
async def generate_timeline_tasks_endpoint(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Generate or reset complete chronological timeline checklist for an event."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    event_name = event.get("event_name", "Celebration")
    event_type = event.get("event_type", "wedding")
    event_date = event.get("event_date", "2026-12-15")
    guest_count = plan_data.get("guest_count", 100)
    location = plan_data.get("location", "Venue")

    tasks_objs = generate_chronological_timeline_tasks(
        event_name=event_name,
        event_type=event_type,
        event_date=event_date,
        guest_count=guest_count,
        location=location,
    )
    tasks_dicts = [t.model_dump() for t in tasks_objs]

    plan_data["tasks"] = tasks_dicts
    if "timeline_plan" in plan_data and isinstance(plan_data["timeline_plan"], dict):
        plan_data["timeline_plan"]["tasks"] = tasks_dicts

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "tasks": tasks_dicts, "count": len(tasks_dicts)}


@router.post("/{event_id}/timeline/regenerate-stage")
async def regenerate_stage_endpoint(
    event_id: str,
    req: RegenerateStageRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Regenerate tasks for a specific stage or category without replacing or affecting
    unrelated tasks from other stages or categories.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    existing_raw = plan_data.get("tasks", [])
    existing_objs = [TimelineTask(**t) for t in existing_raw]

    event_name = event.get("event_name", "Celebration")
    event_type = event.get("event_type", "wedding")
    event_date = event.get("event_date", "2026-12-15")
    guest_count = plan_data.get("guest_count", 100)
    location = plan_data.get("location", "Venue")

    combined = regenerate_timeline_stage_tasks(
        existing_tasks=existing_objs,
        target_stage=req.stage,
        target_category=req.category,
        event_name=event_name,
        event_type=event_type,
        event_date=event_date,
        guest_count=guest_count,
        location=location,
        instructions=req.instructions,
    )
    combined_dicts = [t.model_dump() for t in combined]

    plan_data["tasks"] = combined_dicts
    if "timeline_plan" in plan_data and isinstance(plan_data["timeline_plan"], dict):
        plan_data["timeline_plan"]["tasks"] = combined_dicts

    await update_event(event_id, target_user, {"plan_data": plan_data})
    label = req.category or (req.stage.value if req.stage else "all")
    stage_count = len([
        t for t in combined_dicts
        if (t.get("stage") == req.stage.value if req.stage else (t.get("category") or "").lower() == (req.category or "").lower())
    ])
    return {
        "success": True,
        "regenerated_target": label,
        "regenerated_stage": req.stage.value if req.stage else None,
        "regenerated_category": req.category,
        "stage_task_count": stage_count,
        "total_task_count": len(combined_dicts),
        "tasks": combined_dicts,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE A: VENDOR MATCHBOARD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{event_id}/vendors")
async def get_event_vendors(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
    category: Optional[str] = Query(default=None),
    selection_status: Optional[str] = Query(default=None),
    availability_status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
):
    """Retrieve all vendors for an event with multi-facet filtering and search."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    vendors = plan_data.get("vendors", [])

    filtered = []
    for v in vendors:
        # Category filter
        v_cat = v.get("category", "")
        if hasattr(v_cat, "value"):
            v_cat = v_cat.value
        if category and category != "all" and v_cat.lower() != category.lower():
            continue

        # Selection status filter
        v_sel = v.get("selection_status", "")
        if hasattr(v_sel, "value"):
            v_sel = v_sel.value
        if selection_status and selection_status != "all" and v_sel.lower() != selection_status.lower():
            continue

        # Availability filter
        v_avail = v.get("availability_status", "")
        if hasattr(v_avail, "value"):
            v_avail = v_avail.value
        if availability_status and availability_status != "all" and v_avail.lower() != availability_status.lower():
            continue

        # Search query
        if search:
            q = search.lower().strip()
            text_corpus = f"{v.get('business_name', '')} {v.get('notes', '')} {v.get('quotation_details', '')} {v.get('contact_info', '')}".lower()
            if q not in text_corpus:
                continue

        filtered.append(v)

    return {
        "success": True,
        "event_id": event_id,
        "count": len(filtered),
        "total_unfiltered": len(vendors),
        "vendors": filtered,
    }


@router.post("/{event_id}/vendors")
async def add_vendor_to_event(
    event_id: str,
    req: CreateVendorRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Add a new vendor record to the event's matchboard."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not req.business_name.strip():
        raise HTTPException(status_code=400, detail="Business name is required.")
    if req.quoted_price < 0:
        raise HTTPException(status_code=400, detail="Quoted price cannot be negative.")

    plan_data = event.get("plan_data", {})
    vendors = plan_data.get("vendors", [])

    # Format contact info summary if individual contact fields provided
    contact_parts = []
    if req.contact_name:
        contact_parts.append(req.contact_name.strip())
    if req.contact_phone:
        contact_parts.append(req.contact_phone.strip())
    if req.contact_email:
        contact_parts.append(req.contact_email.strip())
    combined_contact = " | ".join(contact_parts) if contact_parts else req.contact_info

    new_vendor = VendorRecord(
        id=f"ven-{str(uuid.uuid4())[:8]}",
        business_name=req.business_name.strip(),
        category=req.category,
        contact_name=req.contact_name,
        contact_phone=req.contact_phone,
        contact_email=req.contact_email,
        contact_info=combined_contact,
        website=req.website,
        quoted_price=req.quoted_price,
        currency=req.currency or "INR",
        availability_status=req.availability_status,
        selection_status=req.selection_status,
        rating=req.rating,
        notes=req.notes,
        follow_up_date=req.follow_up_date,
        quotation_details=req.quotation_details,
        comparison_notes=req.comparison_notes,
    )

    vendor_dict = new_vendor.model_dump()
    vendors.append(vendor_dict)
    plan_data["vendors"] = vendors

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "vendor": vendor_dict}


@router.put("/{event_id}/vendors/{vendor_id}")
async def update_vendor_record(
    event_id: str,
    vendor_id: str,
    req: UpdateVendorRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Update details, selection status, quotation, or user rating for a vendor."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    vendors = plan_data.get("vendors", [])

    found_idx = next((i for i, v in enumerate(vendors) if v.get("id") == vendor_id), None)
    if found_idx is None:
        raise HTTPException(status_code=404, detail="Vendor record not found")

    current = vendors[found_idx]

    if req.business_name is not None:
        if not req.business_name.strip():
            raise HTTPException(status_code=400, detail="Business name cannot be empty.")
        current["business_name"] = req.business_name.strip()
    if req.category is not None:
        current["category"] = req.category.value if hasattr(req.category, "value") else str(req.category)
    if req.contact_name is not None:
        current["contact_name"] = req.contact_name
    if req.contact_phone is not None:
        current["contact_phone"] = req.contact_phone
    if req.contact_email is not None:
        current["contact_email"] = req.contact_email
    if req.contact_info is not None:
        current["contact_info"] = req.contact_info
    if req.website is not None:
        current["website"] = req.website
    if req.quoted_price is not None:
        if req.quoted_price < 0:
            raise HTTPException(status_code=400, detail="Quoted price cannot be negative.")
        current["quoted_price"] = req.quoted_price
    if req.currency is not None:
        current["currency"] = req.currency
    if req.availability_status is not None:
        current["availability_status"] = (
            req.availability_status.value if hasattr(req.availability_status, "value") else str(req.availability_status)
        )
    if req.selection_status is not None:
        current["selection_status"] = (
            req.selection_status.value if hasattr(req.selection_status, "value") else str(req.selection_status)
        )
    if req.rating is not None:
        if req.rating < 1.0 or req.rating > 5.0:
            raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0 stars.")
        current["rating"] = req.rating
    if req.notes is not None:
        current["notes"] = req.notes
    if req.follow_up_date is not None:
        current["follow_up_date"] = req.follow_up_date
    if req.quotation_details is not None:
        current["quotation_details"] = req.quotation_details
    if req.comparison_notes is not None:
        current["comparison_notes"] = req.comparison_notes

    vendors[found_idx] = current
    plan_data["vendors"] = vendors

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "vendor": current}


@router.delete("/{event_id}/vendors/{vendor_id}")
async def delete_vendor_record(
    event_id: str,
    vendor_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Delete a vendor from the event."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    vendors = plan_data.get("vendors", [])
    remaining = [v for v in vendors if v.get("id") != vendor_id]

    if len(remaining) == len(vendors):
        raise HTTPException(status_code=404, detail="Vendor record not found")

    plan_data["vendors"] = remaining
    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "remaining_count": len(remaining)}


@router.post("/{event_id}/vendors/compare")
async def compare_vendors_endpoint(
    event_id: str,
    req: VendorComparisonRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Synthesize an AI-powered comparison and targeted interview questions
    for the selected vendor records, strictly using user-supplied quotation data.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    all_vendors = plan_data.get("vendors", [])

    matched_dicts = [v for v in all_vendors if v.get("id") in req.vendor_ids]
    if not matched_dicts:
        raise HTTPException(status_code=400, detail="No matching vendors found for comparison.")

    vendor_objs = [VendorRecord(**v) for v in matched_dicts]
    analysis = analyze_vendor_comparison(vendor_objs, category=req.category)

    return {"success": True, "analysis": analysis.model_dump()}


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE B: GUEST AND RSVP MANAGER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{event_id}/guests")
async def get_event_guests(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
    rsvp_status: Optional[str] = Query(default=None),
    group_household: Optional[str] = Query(default=None),
    dietary: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
):
    """Retrieve all guests for an event with search and multi-criteria filters."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    guests = plan_data.get("guests", [])

    filtered = []
    for g in guests:
        # RSVP status
        g_rsvp = g.get("rsvp_status", "")
        if hasattr(g_rsvp, "value"):
            g_rsvp = g_rsvp.value
        if rsvp_status and rsvp_status != "all" and g_rsvp.lower() != rsvp_status.lower():
            continue

        # Group / household
        g_grp = g.get("group_household", "")
        if group_household and group_household != "all" and g_grp.lower() != group_household.lower():
            continue

        # Dietary
        g_diet = g.get("dietary_preference", "")
        if dietary and dietary != "all" and dietary.lower() not in (g_diet or "").lower():
            continue

        # Search query
        if search:
            q = search.lower().strip()
            text_corpus = f"{g.get('name', '')} {g.get('group_household', '')} {g.get('table_assignment', '')} {g.get('notes', '')}".lower()
            if q not in text_corpus:
                continue

        filtered.append(g)

    return {
        "success": True,
        "event_id": event_id,
        "count": len(filtered),
        "total_unfiltered": len(guests),
        "guests": filtered,
    }


@router.post("/{event_id}/guests")
async def add_guest_to_event(
    event_id: str,
    req: CreateGuestRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Add a guest to the event, with automatic duplicate detection."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Guest name is required.")

    party_sz = req.party_size or max(1, (req.adults_count or 1) + (req.children_count or 0))

    plan_data = event.get("plan_data", {})
    existing_raw = plan_data.get("guests", [])
    existing_objs = [GuestRecord(**g) for g in existing_raw]

    # Check for potential duplicates
    duplicate_match = detect_duplicate_guest(existing_objs, req.name.strip())

    new_guest = GuestRecord(
        id=f"gst-{str(uuid.uuid4())[:8]}",
        name=req.name.strip(),
        group_household=req.group_household or "General",
        invitation_status=req.invitation_status or GuestInvitationStatus.NOT_SENT,
        invitation_delivery_note="Manually Tracked (No automated delivery gateway configured)",
        rsvp_status=req.rsvp_status or GuestRsvpStatus.NOT_INVITED,
        party_size=party_sz,
        adults_count=req.adults_count if req.adults_count is not None else party_sz,
        children_count=req.children_count or 0,
        dietary_preference=req.dietary_preference or "Standard",
        accessibility_requests=req.accessibility_requests,
        table_assignment=req.table_assignment or "Unassigned",
        notes=req.notes,
    )

    guest_dict = new_guest.model_dump()
    existing_raw.append(guest_dict)
    plan_data["guests"] = existing_raw

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {
        "success": True,
        "guest": guest_dict,
        "duplicate_warning": f"Likely duplicate of existing record '{duplicate_match}'" if duplicate_match else None,
    }


@router.put("/{event_id}/guests/{guest_id}")
async def update_guest_record(
    event_id: str,
    guest_id: str,
    req: UpdateGuestRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Update details, RSVP status, party size, dietary, or table seating for a guest."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    guests = plan_data.get("guests", [])

    found_idx = next((i for i, g in enumerate(guests) if g.get("id") == guest_id), None)
    if found_idx is None:
        raise HTTPException(status_code=404, detail="Guest record not found")

    current = guests[found_idx]

    if req.name is not None:
        if not req.name.strip():
            raise HTTPException(status_code=400, detail="Guest name cannot be empty.")
        current["name"] = req.name.strip()
    if req.group_household is not None:
        current["group_household"] = req.group_household
    if req.invitation_status is not None:
        current["invitation_status"] = (
            req.invitation_status.value if hasattr(req.invitation_status, "value") else str(req.invitation_status)
        )
    if req.rsvp_status is not None:
        current["rsvp_status"] = (
            req.rsvp_status.value if hasattr(req.rsvp_status, "value") else str(req.rsvp_status)
        )
    if req.party_size is not None:
        if req.party_size < 1:
            raise HTTPException(status_code=400, detail="Party size must be at least 1.")
        current["party_size"] = req.party_size
    if req.adults_count is not None:
        current["adults_count"] = max(0, req.adults_count)
    if req.children_count is not None:
        current["children_count"] = max(0, req.children_count)
    if req.dietary_preference is not None:
        current["dietary_preference"] = req.dietary_preference
    if req.accessibility_requests is not None:
        current["accessibility_requests"] = req.accessibility_requests
    if req.table_assignment is not None:
        current["table_assignment"] = req.table_assignment
    if req.notes is not None:
        current["notes"] = req.notes

    # Keep party size aligned if adults and children explicitly updated
    if req.adults_count is not None or req.children_count is not None:
        current["party_size"] = max(1, current.get("adults_count", 1) + current.get("children_count", 0))

    guests[found_idx] = current
    plan_data["guests"] = guests

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "guest": current}


@router.delete("/{event_id}/guests/{guest_id}")
async def delete_guest_record(
    event_id: str,
    guest_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Remove a guest from the event."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    guests = plan_data.get("guests", [])
    remaining = [g for g in guests if g.get("id") != guest_id]

    if len(remaining) == len(guests):
        raise HTTPException(status_code=404, detail="Guest record not found")

    plan_data["guests"] = remaining
    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "remaining_count": len(remaining)}


@router.post("/{event_id}/guests/bulk-import")
async def bulk_import_guests(
    event_id: str,
    req: BulkGuestImportRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Bulk import guests from CSV parsing with validation, duplicate detection,
    and optional duplicate skipping.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    existing_raw = plan_data.get("guests", [])
    existing_objs = [GuestRecord(**g) for g in existing_raw]

    imported_count = 0
    skipped_count = 0
    errors = []
    duplicates_detected = []
    new_records = []

    valid_rsvps = {"not_invited", "invited", "confirmed", "declined", "maybe"}

    def defuse_csv(val: Optional[str]) -> Optional[str]:
        if not val:
            return val
        if val[0] in ("=", "+", "-", "@", "\t", "\r"):
            return "'" + val  # Prevent CSV formula injection execution
        s = val.strip()
        if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
            return "'" + s  # Prevent CSV formula injection execution
        return s

    for idx, row in enumerate(req.guests):
        row_num = idx + 1
        name = defuse_csv(row.name) or ""
        if not name:
            errors.append(f"Row {row_num}: Guest name is missing.")
            continue

        party_size = row.party_size or 1
        if party_size < 1:
            errors.append(f"Row {row_num} ({name}): Party size must be at least 1.")
            continue

        # Status normalization
        raw_rsvp = (row.rsvp_status or "not_invited").strip().lower().replace(" ", "_")
        if raw_rsvp not in valid_rsvps:
            raw_rsvp = "not_invited"

        # Duplicate checking
        dup_match = detect_duplicate_guest(existing_objs + [GuestRecord(**r) for r in new_records], name)
        if dup_match:
            duplicates_detected.append(f"Row {row_num}: '{name}' matches existing guest '{dup_match}'")
            if req.skip_duplicates:
                skipped_count += 1
                continue

        new_rec = GuestRecord(
            id=f"gst-{str(uuid.uuid4())[:8]}",
            name=name,
            group_household=defuse_csv(row.group_household or "General") or "General",
            invitation_status=GuestInvitationStatus.NOT_SENT,
            invitation_delivery_note="Manually Tracked (No automated delivery gateway configured)",
            rsvp_status=GuestRsvpStatus(raw_rsvp),
            party_size=party_size,
            adults_count=row.adults_count if row.adults_count is not None else party_size,
            children_count=row.children_count or 0,
            dietary_preference=defuse_csv(row.dietary_preference or "Standard") or "Standard",
            accessibility_requests=defuse_csv(row.accessibility_requests),
            table_assignment=defuse_csv(row.table_assignment or "Unassigned") or "Unassigned",
            notes=defuse_csv(row.notes),
        )
        new_records.append(new_rec.model_dump())
        imported_count += 1

    existing_raw.extend(new_records)
    plan_data["guests"] = existing_raw

    await update_event(event_id, target_user, {"plan_data": plan_data})

    return BulkGuestImportResponse(
        imported_count=imported_count,
        skipped_duplicate_count=skipped_count,
        errors=errors,
        duplicates_detected=duplicates_detected,
        guests=[GuestRecord(**g) for g in existing_raw],
    )


@router.get("/{event_id}/guests/catering-estimate")
async def get_catering_estimate_endpoint(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Calculate catering requirements, headcount by dietary preferences,
    accessibility requests, and expected attendance based on confirmed RSVPs.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    guests_raw = plan_data.get("guests", [])
    guest_objs = [GuestRecord(**g) for g in guests_raw]

    estimate = calculate_catering_and_attendance(guest_objs)
    return estimate


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 13: MOODBOARD STUDIO ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{event_id}/moodboards")
async def get_event_moodboards(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Retrieve all saved moodboards for an event."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    moodboards = plan_data.get("moodboards", [])

    return {
        "success": True,
        "event_id": event_id,
        "count": len(moodboards),
        "moodboards": moodboards,
    }


@router.post("/{event_id}/moodboards")
async def create_moodboard_endpoint(
    event_id: str,
    req: CreateMoodboardRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Create a new moodboard. If color_palette is omitted, generates a coordinated
    harmonious palette from the selected theme.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Moodboard name is required.")
    if not req.theme.strip():
        raise HTTPException(status_code=400, detail="Theme description is required.")

    palette = req.color_palette
    if not palette or len(palette) == 0:
        palette = generate_palette_from_theme(req.theme)

    plan_data = event.get("plan_data", {})
    existing_boards = plan_data.get("moodboards", [])

    new_board = MoodboardRecord(
        id=f"mb-{str(uuid.uuid4())[:8]}",
        name=req.name.strip(),
        theme=req.theme.strip(),
        color_palette=palette,
        dress_code=req.dress_code,
        invitation_direction=req.invitation_direction,
        decoration_ideas=req.decoration_ideas or [],
        venue_styling=req.venue_styling or [],
        lighting=req.lighting or [],
        floral_arrangements=req.floral_arrangements or [],
        table_styling=req.table_styling or [],
        food_presentation=req.food_presentation or [],
        inspiration_notes=req.inspiration_notes or [],
        images=req.images or [],
        items=req.items or [],
    )

    board_dict = new_board.model_dump()
    existing_boards.append(board_dict)
    plan_data["moodboards"] = existing_boards

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "moodboard": board_dict}


@router.put("/{event_id}/moodboards/{moodboard_id}")
async def update_moodboard_endpoint(
    event_id: str,
    moodboard_id: str,
    req: UpdateMoodboardRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Update an existing moodboard's colors, themes, items, and inspiration notes."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    boards = plan_data.get("moodboards", [])

    found_idx = next((i for i, b in enumerate(boards) if b.get("id") == moodboard_id), None)
    if found_idx is None:
        raise HTTPException(status_code=404, detail="Moodboard not found")

    current = boards[found_idx]

    if req.name is not None:
        if not req.name.strip():
            raise HTTPException(status_code=400, detail="Moodboard name cannot be empty.")
        current["name"] = req.name.strip()
    if req.theme is not None:
        current["theme"] = req.theme.strip()
    if req.color_palette is not None:
        current["color_palette"] = req.color_palette
    if req.dress_code is not None:
        current["dress_code"] = req.dress_code
    if req.invitation_direction is not None:
        current["invitation_direction"] = req.invitation_direction
    if req.decoration_ideas is not None:
        current["decoration_ideas"] = req.decoration_ideas
    if req.venue_styling is not None:
        current["venue_styling"] = req.venue_styling
    if req.lighting is not None:
        current["lighting"] = req.lighting
    if req.floral_arrangements is not None:
        current["floral_arrangements"] = req.floral_arrangements
    if req.table_styling is not None:
        current["table_styling"] = req.table_styling
    if req.food_presentation is not None:
        current["food_presentation"] = req.food_presentation
    if req.inspiration_notes is not None:
        current["inspiration_notes"] = req.inspiration_notes
    if req.images is not None:
        current["images"] = req.images
    if req.items is not None:
        current["items"] = [it.model_dump() if hasattr(it, "model_dump") else it for it in req.items]

    current["updated_at"] = datetime.utcnow().isoformat()
    boards[found_idx] = current
    plan_data["moodboards"] = boards

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "moodboard": current}


@router.delete("/{event_id}/moodboards/{moodboard_id}")
async def delete_moodboard_endpoint(
    event_id: str,
    moodboard_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Delete a moodboard from the celebration."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    boards = plan_data.get("moodboards", [])
    remaining = [b for b in boards if b.get("id") != moodboard_id]

    if len(remaining) == len(boards):
        raise HTTPException(status_code=404, detail="Moodboard not found")

    plan_data["moodboards"] = remaining
    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "remaining_count": len(remaining)}


@router.post("/{event_id}/moodboards/{moodboard_id}/duplicate")
async def duplicate_moodboard_endpoint(
    event_id: str,
    moodboard_id: str,
    req: DuplicateMoodboardRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Duplicate an existing moodboard with a custom or auto-generated name."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    boards = plan_data.get("moodboards", [])

    original = next((b for b in boards if b.get("id") == moodboard_id), None)
    if not original:
        raise HTTPException(status_code=404, detail="Moodboard not found")

    cloned_name = req.new_name.strip() if req.new_name and req.new_name.strip() else f"{original.get('name', 'Moodboard')} (Copy)"

    cloned = dict(original)
    cloned["id"] = f"mb-{str(uuid.uuid4())[:8]}"
    cloned["name"] = cloned_name
    cloned["created_at"] = datetime.utcnow().isoformat()
    cloned["updated_at"] = datetime.utcnow().isoformat()

    boards.append(cloned)
    plan_data["moodboards"] = boards

    await update_event(event_id, target_user, {"plan_data": plan_data})
    return {"success": True, "moodboard": cloned}


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 14: EVENT CONCEPT COMPARISON ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{event_id}/concept-comparison")
async def get_concept_comparison_endpoint(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Retrieve existing compared concepts or synthesize up to 3 concepts."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    existing_concepts = plan_data.get("concept_comparisons", [])
    target_budget = float(plan_data.get("total_estimated_budget") or 500000.0)
    currency = plan_data.get("currency") or "INR"

    if not existing_concepts:
        # Generate initial 3 concepts
        concepts_objs = generate_event_concept_comparison(
            event_id=event_id,
            event_name=event.get("event_name", "Celebration"),
            event_type=event.get("event_type", "wedding"),
            target_budget=target_budget,
            currency=currency,
            guest_count=plan_data.get("guest_count", 100),
        )
        existing_concepts = [c.model_dump() for c in concepts_objs]
        plan_data["concept_comparisons"] = existing_concepts
        await update_event(event_id, target_user, {"plan_data": plan_data})

    return {
        "success": True,
        "event_id": event_id,
        "target_budget": target_budget,
        "currency": currency,
        "concepts": existing_concepts,
    }


@router.post("/{event_id}/concept-comparison/generate")
async def generate_concept_comparison_endpoint(
    event_id: str,
    req: GenerateConceptComparisonRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """Generate or re-synthesize 3 distinct event concepts side-by-side."""
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    target_budget = float(plan_data.get("total_estimated_budget") or 500000.0)
    currency = plan_data.get("currency") or "INR"

    concepts_objs = generate_event_concept_comparison(
        event_id=event_id,
        event_name=event.get("event_name", "Celebration"),
        event_type=event.get("event_type", "wedding"),
        target_budget=target_budget,
        currency=currency,
        guest_count=plan_data.get("guest_count", 100),
        custom_instructions=req.custom_instructions,
    )
    concepts_dicts = [c.model_dump() for c in concepts_objs]
    plan_data["concept_comparisons"] = concepts_dicts
    await update_event(event_id, target_user, {"plan_data": plan_data})

    return EventConceptComparisonResponse(
        event_id=event_id,
        target_budget=target_budget,
        currency=currency,
        concepts=concepts_objs,
    )


@router.post("/{event_id}/concept-comparison/adopt")
async def adopt_concept_endpoint(
    event_id: str,
    req: AdoptConceptRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Adopt a preferred concept into the main celebration blueprint.
    STRICT RULE: Requires explicit confirmation before replacing the current plan.
    """
    if not req.confirmed:
        raise HTTPException(
            status_code=400,
            detail="Explicit user confirmation is strictly required before replacing your active celebration blueprint."
        )

    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_data = event.get("plan_data", {})
    concepts = plan_data.get("concept_comparisons", [])
    matching = next((c for c in concepts if c.get("id") == req.concept_id), None)
    if not matching:
        raise HTTPException(status_code=404, detail="Selected concept not found in comparison pool.")

    # Apply adopted concept to active plan
    # 1. Update theme & palette
    plan_data["theme_details"] = {
        "theme_name": matching.get("theme", "Celebration Theme"),
        "color_palette": matching.get("recommended_color_palette", []),
        "decorations": matching.get("decoration_direction", ""),
        "dress_code": "Formal celebration attire aligned with adopted concept palette.",
        "lighting": "Coordinated lighting matching concept ambiance.",
        "atmosphere": matching.get("guest_experience", ""),
    }

    # 2. Update concept statement
    plan_data["concept"] = {
        "title": matching.get("concept_name", "Adopted Celebration"),
        "concept": matching.get("concept_name", "Adopted Celebration"),
        "concept_statement": matching.get("guest_experience", ""),
        "description": f"Adopted concept: {matching.get('theme', '')}. {matching.get('decoration_direction', '')}",
        "design_direction": matching.get("decoration_direction", ""),
    }

    # 3. Create or synchronize an associated moodboard
    boards = plan_data.get("moodboards", [])
    adopted_mb = MoodboardRecord(
        id=f"mb-{str(uuid.uuid4())[:8]}",
        name=f"{matching.get('concept_name', 'Concept')} (Adopted)",
        theme=matching.get("theme", ""),
        color_palette=matching.get("recommended_color_palette", []),
        dress_code="Formal celebration attire aligned with adopted concept palette.",
        invitation_direction=f"Curated invitation suite reflecting {matching.get('theme', '')}",
        decoration_ideas=[matching.get("decoration_direction", "")],
        venue_styling=["Configured per adopted concept floorplan."],
        lighting=["Coordinated ambient wash and focal illumination."],
        floral_arrangements=["Curated botanical palette matching theme hues."],
        table_styling=["Themed tablescapes matching adopted color palette."],
        food_presentation=[matching.get("catering_direction", "")],
        inspiration_notes=[
            f"Adopted on {datetime.now().strftime('%b %d, %Y')}.",
            f"Budget target: {matching.get('currency')} {matching.get('estimated_budget', 0):,}",
            f"Complexity level: {matching.get('planning_complexity')}",
        ],
        images=["pattern:botanical-gold"],
        items=[],
    )
    boards.insert(0, adopted_mb.model_dump())
    plan_data["moodboards"] = boards

    await update_event(event_id, target_user, {"plan_data": plan_data})

    return {
        "success": True,
        "message": f"Successfully adopted '{matching.get('concept_name')}' into celebration blueprint.",
        "adopted_concept": matching,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 16: AI EVENT COPILOT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{event_id}/copilot/chat", response_model=CopilotChatResponse)
async def copilot_chat(
    event_id: str,
    req: CopilotChatRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Event-aware AI Copilot dialogue endpoint.
    Synthesizes live budget, timeline, guests, vendors, and themes into actionable advice.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or unauthorized access.")

    # Generate contextual response
    response = generate_copilot_response(
        event_dict=event,
        user_message=req.message,
        history=req.history,
        custom_context=req.custom_context,
    )

    # Persist conversation session into plan_data for session restoration
    plan_data = event.get("plan_data", {})
    copilot_history = plan_data.get("copilot_history", [])
    now_iso = datetime.utcnow().isoformat()
    
    copilot_history.append({
        "id": f"msg-u-{str(uuid.uuid4())[:8]}",
        "role": "user",
        "content": req.message,
        "timestamp": now_iso,
    })
    copilot_history.append({
        "id": f"msg-a-{str(uuid.uuid4())[:8]}",
        "role": "assistant",
        "content": response.reply,
        "proposed_action": response.proposed_action.model_dump() if response.proposed_action else None,
        "timestamp": now_iso,
    })
    
    plan_data["copilot_history"] = copilot_history[-30:]  # Keep last 30 exchanges
    await update_event(event_id, target_user, {"plan_data": plan_data})

    return response


@router.post("/{event_id}/copilot/execute-action", response_model=CopilotApplyActionResponse)
async def execute_copilot_action(
    event_id: str,
    req: CopilotApplyActionRequest,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Safely executes an allowlisted AI Copilot proposed modification.
    STRICT REQUIREMENT: Explicit user confirmation (confirmed: true) is mandatory.
    """
    if not req.confirmed:
        raise HTTPException(
            status_code=400,
            detail="Explicit user confirmation is strictly required to apply proposed changes to your celebration blueprint.",
        )

    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or unauthorized access.")

    plan_data = event.get("plan_data", {})
    params = req.parameters or {}
    updated_record: Optional[Dict[str, Any]] = None
    msg = "Action applied successfully."

    # 1. Update Budget Allocation
    if req.action_type == CopilotActionType.UPDATE_BUDGET_ALLOCATION:
        cat_name = params.get("category_name", "")
        reduction = float(params.get("reduction_amount", 0.0))
        new_alloc = params.get("new_allocation")
        
        cats = plan_data.get("budget_categories") or plan_data.get("budget_plan", {}).get("categories") or []
        for c in cats:
            if cat_name.lower() in (c.get("name") or "").lower():
                current_val = float(c.get("allocated_amount", 0.0))
                if new_alloc is not None:
                    c["allocated_amount"] = float(new_alloc)
                else:
                    c["allocated_amount"] = max(0.0, current_val - reduction)
                updated_record = c
                msg = f"Updated budget allocation for '{c.get('name')}' to {c.get('allocated_amount'):,}."
                break
        
        plan_data["budget_categories"] = cats

    # 2. Add Timeline Task
    elif req.action_type == CopilotActionType.ADD_TIMELINE_TASK:
        tasks = plan_data.get("tasks", [])
        new_task = TimelineTask(
            id=f"tsk-{str(uuid.uuid4())[:8]}",
            title=params.get("title", "Celebration Milestone"),
            description=params.get("description", "Scheduled via AI Copilot"),
            stage=TaskStage(params.get("stage", "final_arrangements")),
            priority=TaskPriority(params.get("priority", "medium")),
            category=params.get("category", "General"),
            due_date=params.get("due_date", (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")),
            status=TaskStatus.NOT_STARTED,
            estimated_cost=float(params.get("estimated_cost", 0.0)),
        )
        task_dict = new_task.model_dump()
        tasks.append(task_dict)
        plan_data["tasks"] = tasks
        if "timeline_plan" in plan_data and isinstance(plan_data["timeline_plan"], dict):
            plan_data["timeline_plan"]["tasks"] = tasks
        updated_record = task_dict
        msg = f"Added task '{new_task.title}' to {new_task.stage.value}."

    # 3. Update Task Status
    elif req.action_type == CopilotActionType.UPDATE_TASK_STATUS:
        task_id = params.get("task_id")
        new_status = params.get("new_status", "completed")
        tasks = plan_data.get("tasks", [])
        for t in tasks:
            if t.get("id") == task_id or params.get("title", "").lower() in t.get("title", "").lower():
                t["status"] = new_status
                updated_record = t
                msg = f"Updated task '{t.get('title')}' status to '{new_status}'."
                break
        plan_data["tasks"] = tasks

    # 4. Add Budget Expense
    elif req.action_type == CopilotActionType.ADD_BUDGET_EXPENSE:
        expenses = plan_data.get("expenses", [])
        new_expense = {
            "id": f"exp-{str(uuid.uuid4())[:8]}",
            "category": params.get("category", "General"),
            "title": params.get("title", "New Expense"),
            "amount": float(params.get("amount", 0.0)),
            "date": params.get("date", datetime.now().strftime("%Y-%m-%d")),
            "status": params.get("status", "logged_expense"),
            "notes": params.get("notes", "Logged via AI Copilot"),
            "is_verified_payment": False,
        }
        expenses.append(new_expense)
        plan_data["expenses"] = expenses
        updated_record = new_expense
        msg = f"Logged expense '{new_expense['title']}' for {new_expense['amount']}."

    # 5. Update Theme
    elif req.action_type == CopilotActionType.UPDATE_THEME:
        theme_details = plan_data.get("theme_details", {})
        if params.get("theme_name"):
            theme_details["theme_name"] = params["theme_name"]
        if params.get("color_palette"):
            theme_details["color_palette"] = params["color_palette"]
        if params.get("decorations"):
            theme_details["decorations"] = params["decorations"]
        plan_data["theme_details"] = theme_details
        updated_record = theme_details
        msg = f"Updated celebration theme to '{theme_details.get('theme_name')}'."

    # 6. Add Moodboard Note
    elif req.action_type == CopilotActionType.ADD_MOODBOARD_NOTE:
        moodboards = plan_data.get("moodboards", [])
        if moodboards:
            target_mb = moodboards[0]
            notes = target_mb.get("inspiration_notes", [])
            notes.append(params.get("note", "Curated concept note."))
            target_mb["inspiration_notes"] = notes
            updated_record = target_mb
            msg = f"Added inspiration note to moodboard '{target_mb.get('name')}'."
        else:
            msg = "No active moodboard found to attach note."

    await update_event(event_id, target_user, {"plan_data": plan_data})

    return CopilotApplyActionResponse(
        success=True,
        message=msg,
        action_type=req.action_type,
        action_id=req.action_id,
        updated_record=updated_record,
        event_id=event_id,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 17: TRANSPARENT EVENT READINESS SCORE ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{event_id}/readiness", response_model=EventReadinessResponse)
async def get_event_readiness(
    event_id: str,
    user_id: Optional[str] = Query(default="demo-user-001"),
):
    """
    Computes a transparent, deterministic Event Readiness Score (0-100)
    with exact category scores, positive indicators, missing information,
    overdue tasks, budget risks, and prioritized 'Next Best Move'.
    """
    target_user = user_id or "demo-user-001"
    event = await get_event_by_id(event_id, target_user)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or unauthorized access.")

    readiness = calculate_event_readiness(event)
    return readiness




