"""
Festiva AI — Transparent Event Readiness Score Engine
Calculates an objective, deterministic preparedness score from 0 to 100
using measurable indicators across 5 structured pillars:
1. Task Completion (35%)
2. Budget Preparedness (20%)
3. Vendor Preparedness (20%)
4. Guest Planning (15%)
5. Timeline Preparedness (10%)

Features:
- Deterministic formula with exact criteria
- Clear separation between 'Insufficient Data' and genuine low readiness
- Accessible grade labeling independent of color
- Positive indicators, missing information, overdue tasks, and budget risks
- Prioritized 'Next Best Move' decision tree
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import math

from app.schemas.events import (
    ReadinessCategoryScore, NextBestMove, EventReadinessResponse
)

FORMULA_DOCUMENTATION = """FESTIVA READINESS FORMULA SPECIFICATION:
Overall Score S = S_task (35 max) + S_budget (20 max) + S_vendor (20 max) + S_guest (15 max) + S_timeline (10 max)
• Task Completion (35 pts): (Completed / Total) * 35 with deductions of -3 pts per overdue task and -2 pts per blocked task.
• Budget Preparedness (20 pts): Defined budget & categories (5 pts) + Contingency liquidity >= 5% (5 pts) + Expense tracking active (5 pts) + Budget adherence with zero category overruns (5 pts).
• Vendor Preparedness (20 pts): Venue booked (8 pts) + Caterer booked (6 pts) + Secondary creatives booked (6 pts). Evaluates category commitments, not raw record creation.
• Guest Planning (15 pts): Guest roster size (4 pts) + Invitation dispatch rate (4 pts) + RSVP response rate (4 pts) + Dietary/accessibility logged (3 pts).
• Timeline Preparedness (10 pts): Future date lead time (3 pts) + Multi-stage coverage >= 4 stages (4 pts) + Zero milestone deadline bottlenecks (3 pts).
• Insufficient Data Flag: Triggered if fewer than 2 pillars are populated, preventing deceptive low scores for brand-new events."""


def calculate_event_readiness(event_dict: Dict[str, Any]) -> EventReadinessResponse:
    """
    Computes transparent readiness score for a celebration event.
    """
    plan_data = event_dict.get("plan_data", {})
    event_id = str(event_dict.get("id") or plan_data.get("event_id") or "event-01")
    event_name = str(event_dict.get("event_name") or plan_data.get("event_name", "Celebration"))
    event_type = str(event_dict.get("event_type") or plan_data.get("event_type", "wedding")).lower()
    event_date_str = str(event_dict.get("event_date") or plan_data.get("event_date", "2026-12-15"))
    currency = str(plan_data.get("currency", "INR"))
    setting = str(plan_data.get("setting", "indoor")).lower()

    # Parse date and compute lead time
    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    try:
        event_date = datetime.strptime(event_date_str, "%Y-%m-%d")
        days_until = (event_date - today).days
    except Exception:
        event_date = today + timedelta(days=60)
        days_until = 60

    # Collect sub-records
    tasks = plan_data.get("tasks") or []
    budget_categories = plan_data.get("budget_categories") or plan_data.get("budget_plan", {}).get("categories") or []
    expenses = plan_data.get("expenses") or []
    vendors = plan_data.get("vendors") or []
    guests = plan_data.get("guests") or []

    # Financial totals
    total_budget = float(plan_data.get("total_budget") or plan_data.get("total_estimated_budget") or 0.0)
    total_spent = sum(
        float(e.get("amount", 0.0)) for e in expenses
        if e.get("status") in ["logged_expense", "paid", "confirmed"]
    )
    budget_plan = plan_data.get("budget_plan", {})
    contingency_reserve = float(budget_plan.get("contingency_reserve") or round(total_budget * 0.1, 2))
    remaining_budget = max(0.0, total_budget - total_spent)

    # Global tracking accumulators
    positive_indicators: List[str] = []
    missing_information: List[str] = []
    overdue_tasks_list: List[Dict[str, Any]] = []
    budget_risks: List[str] = []
    next_recommended_actions: List[str] = []

    # ─────────────────────────────────────────────────────────────────────────
    # PILLAR 1: TASK COMPLETION (Max: 35 Points)
    # ─────────────────────────────────────────────────────────────────────────
    task_criteria_met: List[str] = []
    task_criteria_unmet: List[str] = []
    total_tasks_count = len(tasks)
    completed_tasks = [t for t in tasks if t.get("status") == "completed"]
    in_progress_tasks = [t for t in tasks if t.get("status") == "in_progress"]
    blocked_tasks = [t for t in tasks if t.get("status") == "blocked"]
    
    overdue_tasks = [
        t for t in tasks
        if t.get("due_date") and t.get("due_date") < today_str and t.get("status") != "completed"
    ]
    for ot in overdue_tasks:
        overdue_tasks_list.append({
            "id": ot.get("id"),
            "title": ot.get("title", "Task"),
            "due_date": ot.get("due_date"),
            "priority": ot.get("priority", "medium"),
            "stage": ot.get("stage", "general"),
        })

    if total_tasks_count == 0:
        task_score = 0.0
        task_criteria_unmet.append("No preparation tasks defined yet")
        missing_information.append("Task schedule empty — timeline milestones needed")
    else:
        # Base completion ratio (up to 35)
        completion_ratio = len(completed_tasks) / total_tasks_count
        base_task_pts = completion_ratio * 35.0
        
        # Penalties and bonuses
        overdue_penalty = min(15.0, len(overdue_tasks) * 3.0)
        blocked_penalty = min(8.0, len(blocked_tasks) * 2.0)
        momentum_bonus = min(4.0, len(in_progress_tasks) * 1.0) if len(overdue_tasks) == 0 else 0.0

        task_score = max(0.0, min(35.0, round(base_task_pts - overdue_penalty - blocked_penalty + momentum_bonus, 1)))

        task_criteria_met.append(f"Completed {len(completed_tasks)} of {total_tasks_count} tasks ({round(completion_ratio * 100)}%)")
        if len(completed_tasks) > 0:
            positive_indicators.append(f"Task momentum active: {len(completed_tasks)} planning milestones accomplished")

        if len(overdue_tasks) == 0:
            task_criteria_met.append("Zero overdue milestones")
            positive_indicators.append("All scheduled preparation tasks are currently on-time")
        else:
            task_criteria_unmet.append(f"{len(overdue_tasks)} task(s) past due date (-{overdue_penalty:.0f} pts)")

        if len(blocked_tasks) == 0:
            task_criteria_met.append("No blocked dependencies")
        else:
            task_criteria_unmet.append(f"{len(blocked_tasks)} task(s) marked blocked (-{blocked_penalty:.0f} pts)")

    task_pct = (task_score / 35.0) * 100
    task_category = ReadinessCategoryScore(
        category_name="Task Completion",
        score=task_score,
        max_score=35.0,
        percentage=round(task_pct, 1),
        status_label="Optimal" if task_pct >= 80 else "Good" if task_pct >= 60 else "Needs Attention" if task_pct >= 40 else "Critical",
        criteria_met=task_criteria_met,
        criteria_unmet=task_criteria_unmet,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # PILLAR 2: BUDGET PREPAREDNESS (Max: 20 Points)
    # ─────────────────────────────────────────────────────────────────────────
    budget_criteria_met: List[str] = []
    budget_criteria_unmet: List[str] = []
    b_pts = 0.0

    # 1. Budget defined with categories (5 pts)
    if total_budget > 0 and len(budget_categories) >= 3:
        b_pts += 5.0
        budget_criteria_met.append(f"Master budget ({currency} {total_budget:,.0f}) structured across {len(budget_categories)} categories")
        positive_indicators.append(f"Financial structure established: {currency} {total_budget:,.0f} distributed across categories")
    elif total_budget > 0:
        b_pts += 2.5
        budget_criteria_unmet.append("Budget amount defined but requires multi-category distribution")
    else:
        budget_criteria_unmet.append("Total budget amount undefined (0 pts)")
        missing_information.append("Event budget ceiling has not been set")

    # 2. Contingency safety margin (5 pts)
    contingency_margin_ratio = (contingency_reserve / max(total_budget, 1.0))
    if contingency_reserve > 0 and contingency_margin_ratio >= 0.05:
        b_pts += 5.0
        budget_criteria_met.append(f"Contingency reserve healthy ({currency} {contingency_reserve:,.0f} / {round(contingency_margin_ratio * 100)}%)")
        positive_indicators.append(f"Prudent financial buffer: {currency} {contingency_reserve:,.0f} contingency preserved")
    elif contingency_reserve > 0:
        b_pts += 2.5
        budget_criteria_unmet.append(f"Contingency reserve is lean ({round(contingency_margin_ratio * 100)}% vs 10% benchmark)")
        budget_risks.append("Contingency buffer is under 5% of total budget")
    else:
        budget_criteria_unmet.append("No contingency reserve set aside")
        budget_risks.append("No dedicated financial buffer for unexpected overtime or weather changes")

    # 3. Expense tracking fidelity (5 pts)
    if len(expenses) >= 2 or total_spent > 0:
        b_pts += 5.0
        budget_criteria_met.append(f"Live cost tracking active ({len(expenses)} expenses / commitments logged)")
        positive_indicators.append(f"Expenditures actively logged: {currency} {total_spent:,.0f} accounted for")
    elif len(expenses) == 1:
        b_pts += 2.5
        budget_criteria_met.append("Initial expense item logged")
    else:
        budget_criteria_unmet.append("No expenses or vendor deposits logged yet")
        missing_information.append("No actual expenses or vendor contracts recorded")

    # 4. Budget adherence & deficit checks (5 pts)
    over_budget_cats = []
    for bc in budget_categories:
        alloc = float(bc.get("allocated_amount", 0.0))
        c_name = bc.get("name", "")
        c_spent = sum(float(e.get("amount", 0.0)) for e in expenses if (e.get("category") or "").lower() == c_name.lower())
        if alloc > 0 and c_spent > alloc:
            over_budget_cats.append((c_name, c_spent - alloc))

    if total_spent <= total_budget and len(over_budget_cats) == 0:
        b_pts += 5.0
        budget_criteria_met.append("Zero category overruns; spending within approved bounds")
    elif total_spent > total_budget:
        deficit = total_spent - total_budget
        b_pts = max(0.0, b_pts - 4.0)
        budget_criteria_unmet.append(f"Total spending exceeds planned budget by {currency} {deficit:,.0f}")
        budget_risks.append(f"Overall budget overrun of {currency} {deficit:,.0f}")
    elif len(over_budget_cats) > 0:
        b_pts = max(0.0, b_pts - (len(over_budget_cats) * 2.0))
        names_str = ", ".join([f"{name} (+{currency} {diff:,.0f})" for name, diff in over_budget_cats])
        budget_criteria_unmet.append(f"Category overruns detected: {names_str}")
        budget_risks.append(f"Category budget overrun in: {names_str}")

    budget_score = max(0.0, min(20.0, round(b_pts, 1)))
    budget_pct = (budget_score / 20.0) * 100
    budget_category = ReadinessCategoryScore(
        category_name="Budget Preparedness",
        score=budget_score,
        max_score=20.0,
        percentage=round(budget_pct, 1),
        status_label="Optimal" if budget_pct >= 80 else "Good" if budget_pct >= 60 else "Needs Attention" if budget_pct >= 40 else "Critical",
        criteria_met=budget_criteria_met,
        criteria_unmet=budget_criteria_unmet,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # PILLAR 3: VENDOR PREPAREDNESS (Max: 20 Points)
    # (Evaluates required categories and booking states, not raw record creation)
    # ─────────────────────────────────────────────────────────────────────────
    vendor_criteria_met: List[str] = []
    vendor_criteria_unmet: List[str] = []
    v_pts = 0.0

    venues = [v for v in vendors if (v.get("category") or "").lower() in ["venue", "venues"]]
    caterers = [v for v in vendors if (v.get("category") or "").lower() in ["caterer", "caterers", "catering"]]
    creatives = [
        v for v in vendors
        if (v.get("category") or "").lower() in [
            "photographer", "photographers", "decorator", "decorators",
            "dj_entertainment", "entertainment", "florist", "florists"
        ]
    ]

    # 1. Venue Anchor (8 pts)
    venue_booked = any(v.get("selection_status") in ["selected", "booked"] for v in venues)
    venue_contacted = any(v.get("selection_status") in ["contacted", "shortlisted"] and float(v.get("quoted_price", 0.0)) > 0 for v in venues)
    
    if venue_booked:
        v_pts += 8.0
        vendor_criteria_met.append("Venue contract secured and booked (8 pts)")
        positive_indicators.append("Venue booked: primary celebration space locked in")
    elif venue_contacted:
        v_pts += 4.0
        vendor_criteria_met.append("Venue shortlisted with formal quotation (4 pts)")
    else:
        vendor_criteria_unmet.append("Venue unbooked — spatial anchor required (0/8 pts)")
        missing_information.append("Primary venue has not been selected or booked")

    # 2. Catering Anchor (6 pts)
    caterer_booked = any(c.get("selection_status") in ["selected", "booked"] for c in caterers)
    caterer_contacted = any(c.get("selection_status") in ["contacted", "shortlisted"] and float(c.get("quoted_price", 0.0)) > 0 for c in caterers)

    if caterer_booked:
        v_pts += 6.0
        vendor_criteria_met.append("Catering banquet vendor selected/booked (6 pts)")
        positive_indicators.append("Catering locked: banquet service secured")
    elif caterer_contacted:
        v_pts += 3.0
        vendor_criteria_met.append("Catering options shortlisted with price quotation (3 pts)")
    else:
        vendor_criteria_unmet.append("Caterer unaddressed (0/6 pts)")
        missing_information.append("Catering vendor has not been contacted or chosen")

    # 3. Creative Anchors (Photography, Decor, DJ) (6 pts)
    booked_creatives = [c for c in creatives if c.get("selection_status") in ["selected", "booked"]]
    contacted_creatives = [c for c in creatives if c.get("selection_status") in ["contacted", "shortlisted"]]

    if len(booked_creatives) >= 2:
        v_pts += 6.0
        vendor_criteria_met.append(f"{len(booked_creatives)} key creative vendors booked (Photography/Decor/DJ)")
        positive_indicators.append(f"Creative production anchors secured: {len(booked_creatives)} creative partners booked")
    elif len(booked_creatives) == 1:
        v_pts += 3.5
        vendor_criteria_met.append(f"1 creative anchor booked ({booked_creatives[0].get('business_name')})")
    elif len(contacted_creatives) >= 2:
        v_pts += 2.0
        vendor_criteria_met.append("Multiple creative vendors shortlisted with active quotes")
    else:
        vendor_criteria_unmet.append("Secondary essentials (photo/decor/DJ) not yet evaluated (0/6 pts)")
        missing_information.append("Photographer, decorator, and entertainment vendors unselected")

    vendor_score = max(0.0, min(20.0, round(v_pts, 1)))
    vendor_pct = (vendor_score / 20.0) * 100
    vendor_category = ReadinessCategoryScore(
        category_name="Vendor Preparedness",
        score=vendor_score,
        max_score=20.0,
        percentage=round(vendor_pct, 1),
        status_label="Optimal" if vendor_pct >= 80 else "Good" if vendor_pct >= 60 else "Needs Attention" if vendor_pct >= 40 else "Critical",
        criteria_met=vendor_criteria_met,
        criteria_unmet=vendor_criteria_unmet,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # PILLAR 4: GUEST PLANNING (Max: 15 Points)
    # ─────────────────────────────────────────────────────────────────────────
    guest_criteria_met: List[str] = []
    guest_criteria_unmet: List[str] = []
    g_pts = 0.0

    target_guest_count = int(plan_data.get("guest_count") or event_dict.get("guest_count", 50))
    guest_records_count = len(guests)
    dispatched_invites = [g for g in guests if g.get("invitation_status") in ["sent_manual", "delivered_external", "viewed"]]
    confirmed_rsvps = [g for g in guests if g.get("rsvp_status") in ["attending", "confirmed"]]
    confirmed_headcount = sum(int(g.get("party_size", 1)) for g in confirmed_rsvps)
    dietary_logged = [g for g in guests if g.get("dietary_preference") and g.get("dietary_preference").lower() not in ["standard", "none", ""]]

    # 1. Guest Roster Size (4 pts)
    if guest_records_count >= 10 or (target_guest_count > 0 and guest_records_count >= target_guest_count * 0.5):
        g_pts += 4.0
        guest_criteria_met.append(f"Guest list populated with {guest_records_count} parties")
        positive_indicators.append(f"Guest roster established: {guest_records_count} guest parties registered")
    elif guest_records_count > 0:
        g_pts += 2.0
        guest_criteria_met.append(f"Initial guest parties added ({guest_records_count} records)")
    else:
        guest_criteria_unmet.append("No guest records added to guest manager (0/4 pts)")
        missing_information.append("Guest list is empty — attendee names and contacts needed")

    # 2. Invitation Dispatch Rate (4 pts)
    dispatch_ratio = len(dispatched_invites) / max(guest_records_count, 1)
    if guest_records_count > 0 and dispatch_ratio >= 0.75:
        g_pts += 4.0
        guest_criteria_met.append(f"Invitations dispatched to {round(dispatch_ratio * 100)}% of guest roster")
        positive_indicators.append(f"Invitations sent: {round(dispatch_ratio * 100)}% of guest parties dispatched")
    elif guest_records_count > 0 and dispatch_ratio >= 0.35:
        g_pts += 2.0
        guest_criteria_met.append(f"Invitations partially dispatched ({round(dispatch_ratio * 100)}%)")
    elif guest_records_count > 0:
        guest_criteria_unmet.append(f"Invitations sent to only {len(dispatched_invites)} of {guest_records_count} guests")
    else:
        guest_criteria_unmet.append("Invitation dispatch not started")

    # 3. RSVP Response Rate (4 pts)
    rsvp_ratio = len(confirmed_rsvps) / max(guest_records_count, 1)
    if guest_records_count > 0 and rsvp_ratio >= 0.5:
        g_pts += 4.0
        guest_criteria_met.append(f"RSVP confirmations received from {round(rsvp_ratio * 100)}% ({confirmed_headcount} guests)")
        positive_indicators.append(f"RSVP confirmations: {confirmed_headcount} guests confirmed attending")
    elif guest_records_count > 0 and rsvp_ratio >= 0.2:
        g_pts += 2.5
        guest_criteria_met.append(f"RSVP responses underway ({round(rsvp_ratio * 100)}% confirmed)")
    elif guest_records_count > 0:
        g_pts += 1.0
        guest_criteria_unmet.append("Low RSVP confirmation rate (<20%)")
    else:
        guest_criteria_unmet.append("Zero RSVP confirmations received")

    # 4. Dietary & Accessibility logged (3 pts)
    if len(dietary_logged) > 0:
        g_pts += 3.0
        guest_criteria_met.append(f"Special dietary & allergen requests logged for {len(dietary_logged)} guests")
        positive_indicators.append(f"Inclusive care: {len(dietary_logged)} dietary / accessibility requirements captured")
    else:
        guest_criteria_unmet.append("No dietary restrictions or accessibility requests recorded")

    guest_score = max(0.0, min(15.0, round(g_pts, 1)))
    guest_pct = (guest_score / 15.0) * 100
    guest_category = ReadinessCategoryScore(
        category_name="Guest Planning",
        score=guest_score,
        max_score=15.0,
        percentage=round(guest_pct, 1),
        status_label="Optimal" if guest_pct >= 80 else "Good" if guest_pct >= 60 else "Needs Attention" if guest_pct >= 40 else "Critical",
        criteria_met=guest_criteria_met,
        criteria_unmet=guest_criteria_unmet,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # PILLAR 5: TIMELINE PREPAREDNESS (Max: 10 Points)
    # ─────────────────────────────────────────────────────────────────────────
    timeline_criteria_met: List[str] = []
    timeline_criteria_unmet: List[str] = []
    t_pts = 0.0

    # 1. Future Date & Lead Time (3 pts)
    if days_until > 0:
        t_pts += 3.0
        timeline_criteria_met.append(f"Celebration schedule active ({days_until} days until event date)")
        positive_indicators.append(f"Schedule lead time: {days_until} days available for orderly execution")
    elif days_until == 0:
        t_pts += 1.5
        timeline_criteria_met.append("Event is scheduled for today")
    else:
        timeline_criteria_unmet.append("Event date is set in the past")

    # 2. Multi-Stage Timeline Coverage (4 pts)
    stages_covered = set(t.get("stage") for t in tasks if t.get("stage"))
    if len(stages_covered) >= 4:
        t_pts += 4.0
        timeline_criteria_met.append(f"Timeline spans {len(stages_covered)} chronological preparation stages")
        positive_indicators.append(f"Holistic timeline: milestones span {len(stages_covered)} distinct planning stages")
    elif len(stages_covered) >= 2:
        t_pts += 2.5
        timeline_criteria_met.append(f"Timeline spans {len(stages_covered)} stages")
    elif len(stages_covered) == 1:
        t_pts += 1.0
        timeline_criteria_unmet.append("Timeline tasks clustered in only 1 planning stage")
    else:
        timeline_criteria_unmet.append("No chronological timeline stages established")

    # 3. Milestone Deadline Health (3 pts)
    if len(overdue_tasks) == 0 and total_tasks_count > 0:
        t_pts += 3.0
        timeline_criteria_met.append("All scheduled preparation deadlines are on track")
    elif len(overdue_tasks) == 1:
        t_pts += 1.5
        timeline_criteria_unmet.append("1 milestone deadline requires resolution")
    elif len(overdue_tasks) >= 2:
        t_pts += 0.0
        timeline_criteria_unmet.append(f"{len(overdue_tasks)} timeline milestones are currently overdue")

    timeline_score = max(0.0, min(10.0, round(t_pts, 1)))
    timeline_pct = (timeline_score / 10.0) * 100
    timeline_category = ReadinessCategoryScore(
        category_name="Timeline Preparedness",
        score=timeline_score,
        max_score=10.0,
        percentage=round(timeline_pct, 1),
        status_label="Optimal" if timeline_pct >= 80 else "Good" if timeline_pct >= 60 else "Needs Attention" if timeline_pct >= 40 else "Critical",
        criteria_met=timeline_criteria_met,
        criteria_unmet=timeline_criteria_unmet,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # OVERALL SCORE & INSUFFICIENT DATA DETECTION
    # ─────────────────────────────────────────────────────────────────────────
    raw_total_score = round(task_score + budget_score + vendor_score + guest_score + timeline_score)
    overall_score = max(0, min(100, int(raw_total_score)))

    # Count populated pillars to detect "Not Enough Information"
    pillars_present = 0
    if total_tasks_count >= 2:
        pillars_present += 1
    if total_budget > 0:
        pillars_present += 1
    if len(vendors) >= 1:
        pillars_present += 1
    if len(guests) >= 1:
        pillars_present += 1

    data_sufficiency_pct = int(round((pillars_present / 4.0) * 100))
    is_insufficient_data = pillars_present < 2

    if is_insufficient_data:
        score_grade = "Insufficient Data"
    elif overall_score >= 85:
        score_grade = "Celebration Ready"
    elif overall_score >= 70:
        score_grade = "Well Prepared"
    elif overall_score >= 50:
        score_grade = "Needs Attention"
    else:
        score_grade = "Critical Attention"

    # ─────────────────────────────────────────────────────────────────────────
    # NEXT BEST MOVE PRIORITIZED DECISION TREE
    # ─────────────────────────────────────────────────────────────────────────
    # P1: Urgent Overdue Tasks
    if len(overdue_tasks) > 0:
        first_overdue = overdue_tasks[0]
        next_best_move = NextBestMove(
            title=f"Complete Overdue Task: {first_overdue.get('title')}",
            description=f"You have {len(overdue_tasks)} task(s) past their scheduled deadline. Resolving overdue items prevents compounding delays across your preparation timeline.",
            priority="critical",
            target_module="timeline",
            action_label="Open Timeline",
            expected_impact=f"+{min(15, len(overdue_tasks) * 3):.0f} pts to Task Readiness & eliminates timeline bottlenecks",
        )
    # P2: Venue Missing or Unbooked
    elif not venue_booked:
        next_best_move = NextBestMove(
            title="Confirm the Venue Before Finalizing Decoration Plans",
            description="The venue's spatial architecture, ceiling rigging limits, and curfew guidelines dictate all decoration, acoustic, and floral decisions. Finalize the venue contract first.",
            priority="critical",
            target_module="vendors",
            action_label="Review Venues",
            expected_impact="+8 pts to Vendor Preparedness & unlocks stage decor blueprint",
        )
    # P3: Budget Overrun
    elif total_spent > total_budget or len(over_budget_cats) > 0:
        over_cat_name = over_budget_cats[0][0] if over_budget_cats else "General"
        next_best_move = NextBestMove(
            title=f"Resolve Over-Budget Variance in {over_cat_name}",
            description=f"Logged commitments exceed your planned allocation. Apply Budget Rescue or adjust non-essential decor elements to restore contingency balance.",
            priority="high",
            target_module="budget",
            action_label="Open Budget Studio",
            expected_impact="+4 pts to Budget Preparedness & protects contingency reserves",
        )
    # P4: Outdoor Weather Plan
    elif (setting in ["outdoor", "hybrid"] or "outdoor" in event_name.lower()) and not any("weather" in t.get("title", "").lower() or "rain" in t.get("title", "").lower() for t in tasks):
        next_best_move = NextBestMove(
            title="Prepare a Weather Backup Plan for Your Outdoor Event",
            description="Outdoor celebrations in open-air settings are vulnerable to unseasonable weather. Reserve a waterproof marquee canopy option and verify electrical drainage.",
            priority="high",
            target_module="copilot",
            action_label="Ask Copilot for Backup Plan",
            expected_impact="Eliminates weather cancellation risks & secures guest comfort",
        )
    # P5: Outstanding Invitations
    elif guest_records_count > 0 and len(dispatched_invites) < guest_records_count and days_until <= 60:
        unsent_count = guest_records_count - len(dispatched_invites)
        next_best_move = NextBestMove(
            title=f"Send Outstanding Invitations ({unsent_count} Pending)",
            description=f"With {days_until} days until {event_date_str}, {unsent_count} invited parties have not received their invitations. Sending invitations now ensures accurate headcount forecasting.",
            priority="high",
            target_module="guests",
            action_label="Review Guest List",
            expected_impact="+4 pts to Guest Planning & unlocks accurate catering numbers",
        )
    # P6: Pending RSVPs Follow-up
    elif guest_records_count > 0 and len(confirmed_rsvps) < guest_records_count * 0.5 and days_until <= 35:
        pending_count = guest_records_count - len(confirmed_rsvps)
        next_best_move = NextBestMove(
            title=f"Follow Up on Pending RSVPs ({pending_count} Awaiting Response)",
            description=f"Over 50% of your guest list has not yet confirmed attendance. Issue WhatsApp reminder notes to lock in dietary preferences and banquet seat planning.",
            priority="recommended",
            target_module="guests",
            action_label="Open Guest Manager",
            expected_impact="+3 pts to Guest Planning & prevents food waste surcharges",
        )
    # P7: Catering Anchor Missing
    elif not caterer_booked:
        next_best_move = NextBestMove(
            title="Finalize Catering Tasting & Sign Banquet Agreement",
            description="Culinary satisfaction is a primary driver of celebration memory. Confirm menu tasting and lock in per-plate rates with your preferred caterer.",
            priority="recommended",
            target_module="vendors",
            action_label="Compare Caterers",
            expected_impact="+6 pts to Vendor Preparedness & locks banquet kitchen team",
        )
    # P8: Final Production Walkthrough
    else:
        next_best_move = NextBestMove(
            title="Schedule Final Rehearsal & Vendor Arrival Sequence",
            description="All core foundations are locked. Conduct an end-to-end event day walkthrough with your lead coordinator and verify vendor loading bay access.",
            priority="recommended",
            target_module="timeline",
            action_label="View Timeline",
            expected_impact="Ensures flawless event-day logistics and coordination",
        )

    # General recommended actions
    if not venue_booked:
        next_recommended_actions.append("Shortlist and lock in primary event venue")
    if not caterer_booked:
        next_recommended_actions.append("Schedule banquet food tasting with caterer")
    if len(overdue_tasks) > 0:
        next_recommended_actions.append(f"Resolve {len(overdue_tasks)} overdue preparation tasks")
    if len(dispatched_invites) < guest_records_count and guest_records_count > 0:
        next_recommended_actions.append("Dispatch remaining invitations to guest roster")
    if len(dietary_logged) == 0 and guest_records_count > 0:
        next_recommended_actions.append("Collect dietary preferences (Jain, vegetarian, gluten-free)")

    return EventReadinessResponse(
        event_id=event_id,
        event_name=event_name,
        overall_score=overall_score,
        score_grade=score_grade,
        is_insufficient_data=is_insufficient_data,
        data_sufficiency_pct=data_sufficiency_pct,
        category_scores={
            "task_completion": task_category,
            "budget_preparedness": budget_category,
            "vendor_preparedness": vendor_category,
            "guest_planning": guest_category,
            "timeline_preparedness": timeline_category,
        },
        positive_indicators=positive_indicators[:8],
        missing_information=missing_information[:8],
        overdue_tasks=overdue_tasks_list[:10],
        budget_risks=budget_risks[:6],
        next_recommended_actions=next_recommended_actions[:6],
        next_best_move=next_best_move,
        formula_documentation=FORMULA_DOCUMENTATION,
    )

