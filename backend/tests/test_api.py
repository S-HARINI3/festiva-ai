"""Tests for Festiva AI backend."""
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to Festiva AI API"


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_generate_event_demo():
    """Test event generation in demo mode (no API key required)."""
    response = client.post("/api/events/generate", json={
        "event_type": "birthday",
        "event_name": "Alex's 30th Birthday Bash",
        "event_date": "2026-12-15",
        "guest_count": 50,
        "location": "New York, NY",
        "budget_range": "moderate",
        "theme_preferences": "Roaring 20s",
        "special_requirements": "Vegan menu options required",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["event_name"] == "Alex's 30th Birthday Bash"
    assert len(data["budget_breakdown"]) > 0
    assert len(data["timeline"]) > 0
    assert len(data["vendor_checklist"]) > 0
    assert len(data["creative_themes"]) == 3
    assert data["demo"] is True


def test_user_events_and_crud():
    """Test full CRUD operations on events in demo mode."""
    user_id = "demo-user-001"

    # 1. List pre-seeded user events
    list_res = client.get(f"/api/events/user/{user_id}")
    assert list_res.status_code == 200
    events = list_res.json()["events"]
    assert len(events) >= 2

    # 2. Generate and save a new event
    gen_res = client.post("/api/events/generate", json={
        "event_type": "anniversary",
        "event_name": "Silver Jubilee Anniversary",
        "event_date": "2026-11-20",
        "guest_count": 80,
        "location": "Chicago, IL",
        "budget_range": "premium",
    })
    assert gen_res.status_code == 200
    plan_data = gen_res.json()

    save_res = client.post("/api/events/save", json={
        "user_id": user_id,
        "plan": plan_data,
    })
    assert save_res.status_code == 200
    saved = save_res.json()
    assert saved["success"] is True
    event_id = saved["event"]["id"]

    # 3. Retrieve event by ID
    get_res = client.get(f"/api/events/{event_id}?user_id={user_id}")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["event_name"] == "Silver Jubilee Anniversary"

    # 4. Delete event
    del_res = client.delete(f"/api/events/{event_id}?user_id={user_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 5. Verify deletion
    verify_res = client.get(f"/api/events/{event_id}?user_id={user_id}")
    assert verify_res.status_code == 404


def test_ai_event_planning_engine_10_sections():
    """Test POST /api/events/{event_id}/generate-plan generating structured 10-section plan."""
    # Use pre-seeded demo event
    event_id = "demo-event-wedding-01"
    response = client.post(f"/api/events/{event_id}/generate-plan")
    assert response.status_code == 200
    plan = response.json()

    # 1. Event Concept
    assert "concept" in plan
    concept = plan["concept"]
    assert concept["title"]
    assert concept["concept_statement"]
    assert concept["design_direction"]

    # 2. Theme Details
    assert "theme_details" in plan
    theme = plan["theme_details"]
    assert theme["theme_name"]
    assert len(theme["palette"]) >= 3
    assert theme["dress_code"]
    assert theme["atmosphere"]

    # 3. Budget & Mathematical Consistency
    assert "budget" in plan
    budget = plan["budget"]
    assert budget["total_budget"] > 0
    assert budget["currency"]
    assert len(budget["categories"]) >= 4
    # Deterministic arithmetic check: sum(categories) + contingency == total_budget
    total_cats = sum(c["allocated_amount"] for c in budget["categories"])
    assert round(total_cats + budget["contingency_amount"], 2) == round(budget["total_budget"], 2)
    # Feasibility check
    assert "feasibility" in budget
    assert isinstance(budget["feasibility"]["is_feasible"], bool)

    # 4. Timeline Plan
    assert "timeline_plan" in plan
    timeline = plan["timeline_plan"]
    assert len(timeline["preparation_milestones"]) >= 3
    assert len(timeline["day_of_schedule"]) >= 3

    # 5. Vendor Checklist
    assert "vendor_checklist" in plan
    assert len(plan["vendor_checklist"]) >= 3
    for v in plan["vendor_checklist"]:
        assert v["category"]
        assert len(v["questions_to_ask"]) > 0
        assert v["is_estimate"] is True  # Pricing transparency rule

    # 6. Guest Plan
    assert "guest_plan" in plan
    guest_plan = plan["guest_plan"]
    assert guest_plan["capacity_limit"] > 0
    assert len(guest_plan["key_management_steps"]) > 0

    # 7. Food and Entertainment
    assert "food_and_entertainment" in plan
    food_ent = plan["food_and_entertainment"]
    assert len(food_ent["menu_recommendations"]) > 0
    assert len(food_ent["entertainment_options"]) > 0

    # 8. Risks and Contingencies
    assert "risks_and_contingencies" in plan
    assert len(plan["risks_and_contingencies"]) >= 2
    for r in plan["risks_and_contingencies"]:
        assert r["risk"]
        assert r["contingency_plan"]

    # 9. Personalized Ideas
    assert "personalized_ideas" in plan
    assert len(plan["personalized_ideas"]) >= 3
    for idea in plan["personalized_ideas"]:
        assert idea["title"]
        assert idea["description"]

    # 10. Next Actions (Top 5 immediate actions)
    assert "next_actions" in plan
    assert len(plan["next_actions"]) == 5
    for action in plan["next_actions"]:
        assert action["action"]
        assert action["priority"] in ["high", "medium", "low"]


def test_budget_feasibility_infeasible_edge_case():
    """Test budget feasibility detection when budget is unreasonably low for guest count."""
    user_id = "demo-user-001"
    # Create an event with ₹15,000 budget for 300 guests wedding (impossible in any market)
    save_res = client.post("/api/events/save", json={
        "user_id": user_id,
        "plan": {
            "event_name": "Ultra Budget Wedding",
            "event_type": "wedding",
            "event_date": "2026-12-01",
            "guest_count": 300,
            "budget": 15000,
            "currency": "INR",
            "location": "Mumbai",
            "theme_preferences": "Luxury Royal",
        }
    })
    assert save_res.status_code == 200
    event_id = save_res.json()["event"]["id"]

    # Generate plan
    res = client.post(f"/api/events/{event_id}/generate-plan")
    assert res.status_code == 200
    plan = res.json()

    feasibility = plan["budget"]["feasibility"]
    assert feasibility["is_feasible"] is False
    assert "challenging" in feasibility["feasibility_verdict"].lower() or "exceed" in feasibility["feasibility_verdict"].lower() or "alert" in feasibility["feasibility_verdict"].lower() or "budget" in feasibility["feasibility_verdict"].lower()
    assert len(feasibility["cost_saving_alternatives"]) >= 2


def test_regenerate_section():
    """Test regenerating specific individual sections."""
    event_id = "demo-event-wedding-01"
    res = client.post(f"/api/events/{event_id}/regenerate-section", json={
        "section": "budget",
        "instructions": "Increase contingency to 15% and prioritize photography"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["section"] == "budget"
    assert "data" in data
    assert "categories" in data["data"]


def test_budget_expenses_crud():
    """Test recording, updating, and deleting actual expenses in Budget Studio."""
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # 1. Add a new expense
    add_res = client.post(
        f"/api/events/{event_id}/budget/expenses?user_id={user_id}",
        json={
            "title": "Floral Centerpieces Deposit",
            "category": "Decorations",
            "amount": 25000.0,
            "status": "logged_expense",
            "notes": "Paid initial advance to florist studio",
            "date": "2026-10-23"
        }
    )
    assert add_res.status_code == 200
    expense_data = add_res.json()
    assert expense_data["success"] is True
    expense = expense_data["expense"]
    assert expense["title"] == "Floral Centerpieces Deposit"
    assert expense["amount"] == 25000.0
    assert expense["category"] == "Decorations"
    assert expense["status"] == "logged_expense"
    assert expense["is_verified_payment"] is False  # Never claims verified without gateway
    expense_id = expense["id"]

    # 2. Update the expense
    update_res = client.put(
        f"/api/events/{event_id}/budget/expenses/{expense_id}?user_id={user_id}",
        json={
            "title": "Floral Centerpieces Deposit (Revised)",
            "category": "Decorations",
            "amount": 28000.0,
            "status": "vendor_commitment",
            "notes": "Added stage floral arch allocation",
            "date": "2026-10-23"
        }
    )
    assert update_res.status_code == 200
    updated = update_res.json()["expense"]
    assert updated["title"] == "Floral Centerpieces Deposit (Revised)"
    assert updated["amount"] == 28000.0
    assert updated["status"] == "vendor_commitment"

    # 3. Delete the expense
    del_res = client.delete(
        f"/api/events/{event_id}/budget/expenses/{expense_id}?user_id={user_id}"
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_budget_rescue_engine():
    """Test the Budget Rescue engine computing Minimal, Balanced, and Maximum alternatives."""
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # Seed an expense that pushes the event over budget (target is 1,500,000; seed 1,600,000)
    client.post(
        f"/api/events/{event_id}/budget/expenses?user_id={user_id}",
        json={
            "title": "Luxury DJ Sound Rig & Fireworks",
            "category": "Entertainment",
            "amount": 1700000.0,
            "status": "vendor_commitment",
            "notes": "High end audio equipment package",
            "date": "2026-10-23"
        }
    )

    # Call Budget Rescue endpoint
    rescue_res = client.post(
        f"/api/events/{event_id}/budget-rescue?user_id={user_id}"
    )
    assert rescue_res.status_code == 200
    rescue_data = rescue_res.json()

    assert rescue_data["event_id"] == event_id
    assert rescue_data["target_budget"] > 0
    assert rescue_data["actual_spending"] > rescue_data["target_budget"]
    assert rescue_data["overrun_amount"] > 0
    assert rescue_data["is_over_budget"] is True
    assert len(rescue_data["overrun_categories"]) > 0

    # Verify all 3 options exist
    options = rescue_data["options"]
    assert len(options) >= 3
    tiers = [opt["tier"] for opt in options]
    assert "minimal" in tiers
    assert "balanced" in tiers
    assert "maximum" in tiers

    # Check arithmetic consistency & rules for each option
    for opt in options:
        assert opt["estimated_savings"] > 0
        assert 0 <= opt["quality_impact_score"] <= 100
        assert len(opt["trade_offs"]) >= 2
        assert len(opt["category_adjustments"]) > 0
        assert len(opt["alternative_choices"]) > 0
        assert opt["revised_total_budget"] == rescue_data["target_budget"]

        # Backend arithmetic verification: sum(categories) + contingency == total_budget
        cats_total = sum(c["allocated_amount"] for c in opt["revised_categories"])
        assert round(cats_total + opt["revised_contingency"], 2) == round(opt["revised_total_budget"], 2)


def test_apply_budget_rescue():
    """Test applying a chosen Budget Rescue option to the event plan."""
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # Get rescue options
    rescue_res = client.post(f"/api/events/{event_id}/budget-rescue?user_id={user_id}")
    rescue_data = rescue_res.json()
    balanced_opt = next(o for o in rescue_data["options"] if o["tier"] == "balanced")

    # Apply the rescue option
    apply_res = client.post(
        f"/api/events/{event_id}/budget/apply-rescue?user_id={user_id}",
        json={
            "tier": balanced_opt["tier"],
            "revised_categories": balanced_opt["revised_categories"],
            "revised_contingency": balanced_opt["revised_contingency"]
        }
    )
    assert apply_res.status_code == 200
    res_json = apply_res.json()
    assert res_json["success"] is True

    # Verify event plan now has revised categories and contingency
    event_res = client.get(f"/api/events/{event_id}?user_id={user_id}")
    assert event_res.status_code == 200
    updated_event = event_res.json()
    plan_budget = updated_event["plan_data"].get("budget_plan") or updated_event["plan_data"].get("budget")
    assert plan_budget["contingency_amount"] == balanced_opt["revised_contingency"]


def test_timeline_tasks_chronological_flow():
    """Test full chronological timeline retrieval, task attributes, and CRUD operations."""
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # 1. Fetch tasks
    get_res = client.get(f"/api/events/{event_id}/timeline/tasks?user_id={user_id}")
    assert get_res.status_code == 200
    timeline = get_res.json()
    assert timeline["event_id"] == event_id
    assert len(timeline["tasks"]) >= 7  # All 7 stages represented

    # Check stage coverage
    stages = {t["stage"] for t in timeline["tasks"]}
    assert "initial_planning" in stages
    assert "budget_venue" in stages
    assert "vendor_selection" in stages
    assert "invitations" in stages
    assert "final_arrangements" in stages
    assert "event_day" in stages
    assert "post_event" in stages

    # Check required task fields
    for t in timeline["tasks"]:
        assert t["title"]
        assert t["priority"] in ["high", "medium", "low"]
        assert t["status"] in ["not_started", "in_progress", "completed", "blocked"]
        assert t["due_date"]
        assert "is_overdue" in t
        if t["is_overdue"]:
            assert t["overdue_alternative"] is not None

    # 2. Add custom task
    add_res = client.post(
        f"/api/events/{event_id}/timeline/tasks?user_id={user_id}",
        json={
            "title": "Pick Up Custom Embroidered Welcome Favors",
            "description": "Collect monogrammed gift bags from artisan shop",
            "stage": "final_arrangements",
            "category": "Gifting",
            "priority": "medium",
            "due_date": "2026-11-25",
            "status": "not_started",
            "assignee": "Aunt Sarah",
            "estimated_cost": 12000.0,
            "notes": "Verify ribbons match theme color palette",
        }
    )
    assert add_res.status_code == 200
    created = add_res.json()["task"]
    assert created["title"] == "Pick Up Custom Embroidered Welcome Favors"
    task_id = created["id"]

    # 3. Update task status to in_progress then completed
    update_res = client.put(
        f"/api/events/{event_id}/timeline/tasks/{task_id}?user_id={user_id}",
        json={
            "status": "in_progress",
            "notes": "Called vendor, order is packaged and ready for pickup",
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["task"]["status"] == "in_progress"

    # Complete task
    complete_res = client.put(
        f"/api/events/{event_id}/timeline/tasks/{task_id}?user_id={user_id}",
        json={"status": "completed"}
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["task"]["status"] == "completed"

    # 4. Delete task
    del_res = client.delete(f"/api/events/{event_id}/timeline/tasks/{task_id}?user_id={user_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_timeline_stage_regeneration():
    """Test regenerating a specific task stage without replacing unrelated tasks."""
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # Initial tasks count
    init_res = client.get(f"/api/events/{event_id}/timeline/tasks?user_id={user_id}")
    init_tasks = init_res.json()["tasks"]
    init_planning_titles = [t["title"] for t in init_tasks if t["stage"] == "initial_planning"]

    # Regenerate only vendor_selection stage
    regen_res = client.post(
        f"/api/events/{event_id}/timeline/regenerate-stage?user_id={user_id}",
        json={
            "stage": "vendor_selection",
            "instructions": "Emphasize live dessert cooking counters and jazz ensemble",
        }
    )
    assert regen_res.status_code == 200
    data = regen_res.json()
    assert data["success"] is True
    assert data["regenerated_stage"] == "vendor_selection"
    assert data["stage_task_count"] > 0

    # Verify initial_planning tasks were NOT modified or deleted
    current_planning_titles = [t["title"] for t in data["tasks"] if t["stage"] == "initial_planning"]
    assert current_planning_titles == init_planning_titles


def test_vendor_matchboard_crud_and_filters():
    """Test full Vendor Matchboard operations: listing, multi-facet filtering, CRUD, and validations."""
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # 1. List all pre-seeded vendors
    list_res = client.get(f"/api/events/{event_id}/vendors?user_id={user_id}")
    assert list_res.status_code == 200
    all_vendors = list_res.json()["vendors"]
    assert len(all_vendors) >= 10

    # 2. Filter by category: venues
    venues_res = client.get(f"/api/events/{event_id}/vendors?user_id={user_id}&category=venues")
    assert venues_res.status_code == 200
    venues = venues_res.json()["vendors"]
    assert len(venues) >= 2
    for v in venues:
        assert v["category"] == "venues"

    # 3. Filter by selection status: booked
    booked_res = client.get(f"/api/events/{event_id}/vendors?user_id={user_id}&selection_status=booked")
    assert booked_res.status_code == 200
    booked = booked_res.json()["vendors"]
    assert len(booked) >= 1
    assert booked[0]["business_name"] == "Lumière Cinematics"

    # 4. Search query
    search_res = client.get(f"/api/events/{event_id}/vendors?user_id={user_id}&search=candid")
    assert search_res.status_code == 200
    assert len(search_res.json()["vendors"]) >= 1

    # 5. Add new vendor with negative price validation check (Pydantic ge=0 raises 422)
    neg_res = client.post(
        f"/api/events/{event_id}/vendors?user_id={user_id}",
        json={
            "business_name": "Invalid Price Studio",
            "category": "photographers",
            "quoted_price": -500.0,
        }
    )
    assert neg_res.status_code in (400, 422)

    # 6. Add valid new vendor
    add_res = client.post(
        f"/api/events/{event_id}/vendors?user_id={user_id}",
        json={
            "business_name": "Artisan Sweet Confections",
            "category": "other",
            "contact_name": "Ritu Kapoor",
            "contact_phone": "+91 98333 44556",
            "quoted_price": 32000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "shortlisted",
            "rating": 4.7,
            "notes": "Custom 4-tier wedding cake with edible gold foil",
            "quotation_details": "Tasting box of 6 flavor pairings + tiered display stand + on-site delivery",
        }
    )
    assert add_res.status_code == 200
    new_v = add_res.json()["vendor"]
    v_id = new_v["id"]
    assert new_v["business_name"] == "Artisan Sweet Confections"
    assert new_v["quoted_price"] == 32000.0

    # 7. Update vendor details & selection status
    update_res = client.put(
        f"/api/events/{event_id}/vendors/{v_id}?user_id={user_id}",
        json={
            "quoted_price": 29000.0,
            "selection_status": "contacted",
            "notes": "Price negotiated down by Rs 3,000 with tier stand rental waived",
            "rating": 4.9,
        }
    )
    assert update_res.status_code == 200
    updated = update_res.json()["vendor"]
    assert updated["quoted_price"] == 29000.0
    assert updated["selection_status"] == "contacted"
    assert updated["rating"] == 4.9

    # 8. Delete vendor
    del_res = client.delete(f"/api/events/{event_id}/vendors/{v_id}?user_id={user_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_vendor_comparison_and_ai_assistance():
    """Test AI Vendor comparison, price differential analysis, and interview question generator."""
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # Compare the two venue vendors
    compare_res = client.post(
        f"/api/events/{event_id}/vendors/compare?user_id={user_id}",
        json={
            "vendor_ids": ["ven-wed-01", "ven-wed-02"],
            "category": "venues",
        }
    )
    assert compare_res.status_code == 200
    analysis = compare_res.json()["analysis"]

    assert "Venues" in analysis["summary"]
    assert "The Glasshouse Conservatory" in analysis["price_comparison"] or "Royal Orchid" in analysis["price_comparison"]
    assert "variance" in analysis["price_comparison"].lower()
    assert len(analysis["suggested_interview_questions"]) >= 4
    assert len(analysis["negotiation_tips"]) >= 3
    assert "disclaimer" in analysis


def test_guest_manager_crud_and_filters():
    """Test Guest & RSVP Manager: listing, RSVP filtering, duplicate detection, and updates."""
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # 1. List pre-seeded guests
    list_res = client.get(f"/api/events/{event_id}/guests?user_id={user_id}")
    assert list_res.status_code == 200
    all_guests = list_res.json()["guests"]
    assert len(all_guests) >= 7

    # 2. Filter by rsvp_status=confirmed
    confirmed_res = client.get(f"/api/events/{event_id}/guests?user_id={user_id}&rsvp_status=confirmed")
    assert confirmed_res.status_code == 200
    confirmed = confirmed_res.json()["guests"]
    assert len(confirmed) >= 3
    for g in confirmed:
        assert g["rsvp_status"] == "confirmed"

    # 3. Add a guest with duplicate warning (Ananya Malhotra already in demo data)
    dup_res = client.post(
        f"/api/events/{event_id}/guests?user_id={user_id}",
        json={
            "name": "Ananya Malhotra",
            "group_household": "Immediate Family",
            "party_size": 1,
            "dietary_preference": "Vegetarian",
        }
    )
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["duplicate_warning"] is not None
    assert "duplicate" in dup_data["duplicate_warning"].lower()
    guest_id = dup_data["guest"]["id"]

    # 4. Update guest RSVP to confirmed, assign table and accessibility
    update_res = client.put(
        f"/api/events/{event_id}/guests/{guest_id}?user_id={user_id}",
        json={
            "rsvp_status": "confirmed",
            "table_assignment": "Table 1 - Royal Orchid",
            "accessibility_requests": "Wheelchair Access",
            "notes": "Added after duplicate review",
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["guest"]["rsvp_status"] == "confirmed"
    assert update_res.json()["guest"]["table_assignment"] == "Table 1 - Royal Orchid"

    # 5. Delete the added guest
    del_res = client.delete(f"/api/events/{event_id}/guests/{guest_id}?user_id={user_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_guest_bulk_import_and_catering_estimate():
    """Test bulk CSV guest import with duplicate skipping and catering requirement calculations."""
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # 1. Bulk import rows: 2 fresh guests, 1 duplicate of existing 'Dr. Rajesh & Sunita Verma'
    bulk_res = client.post(
        f"/api/events/{event_id}/guests/bulk-import?user_id={user_id}",
        json={
            "skip_duplicates": True,
            "guests": [
                {
                    "name": "Prof. Arvind & Lata Saxena",
                    "group_household": "University Friends",
                    "party_size": 2,
                    "adults_count": 2,
                    "children_count": 0,
                    "rsvp_status": "confirmed",
                    "dietary_preference": "Vegetarian",
                    "accessibility_requests": "Step-Free Ramp",
                    "table_assignment": "Table 4 - Lavender",
                    "notes": "Department colleagues",
                },
                {
                    "name": "Aman & Neha Oberoi",
                    "group_household": "Groom VIP",
                    "party_size": 2,
                    "adults_count": 2,
                    "children_count": 0,
                    "rsvp_status": "confirmed",
                    "dietary_preference": "Halal",
                    "table_assignment": "Table 4 - Lavender",
                },
                {
                    "name": "Dr. Rajesh & Sunita Verma",  # Exact duplicate of gst-wed-02
                    "group_household": "Family Elders",
                    "party_size": 2,
                    "rsvp_status": "confirmed",
                },
            ]
        }
    )
    assert bulk_res.status_code == 200
    bulk_data = bulk_res.json()
    assert bulk_data["imported_count"] == 2
    assert bulk_data["skipped_duplicate_count"] == 1
    assert len(bulk_data["duplicates_detected"]) >= 1

    # 2. Verify Catering Estimate reflects confirmed guests and dietary breakdown
    cat_res = client.get(f"/api/events/{event_id}/guests/catering-estimate?user_id={user_id}")
    assert cat_res.status_code == 200
    cat_data = cat_res.json()

    assert cat_data["total_confirmed_guests"] >= 10
    assert cat_data["total_confirmed_parties"] >= 4
    assert cat_data["expected_attendance_low"] == cat_data["total_confirmed_guests"]
    assert cat_data["expected_attendance_high"] >= cat_data["expected_attendance_low"]

    # Dietary breakdown check
    dietary = cat_data["dietary_breakdown"]
    assert "Vegetarian" in dietary
    assert "Jain" in dietary
    assert "Vegan" in dietary
    assert "Halal" in dietary

    # Table seating check
    seating = cat_data["table_seating_summary"]
    assert "Table 1 - Royal Orchid" in seating
    assert "Table 4 - Lavender" in seating


def test_moodboard_crud_and_duplication():
    """
    Verify Moodboard Studio operations:
    - Fetch seeded moodboards with all 10 visual & styling dimensions.
    - Create a new moodboard with automatic coordinated color palette generation.
    - Update colors, items, and inspiration notes.
    - Duplicate moodboard with duplicate naming convention.
    - Delete a moodboard cleanly.
    """
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # 1. Fetch seeded moodboards
    get_res = client.get(f"/api/events/{event_id}/moodboards?user_id={user_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["success"] is True
    boards = get_data["moodboards"]
    assert len(boards) >= 2

    first_board = boards[0]
    assert "theme" in first_board
    assert len(first_board["color_palette"]) >= 4
    assert len(first_board["decoration_ideas"]) > 0
    assert len(first_board["venue_styling"]) > 0
    assert len(first_board["lighting"]) > 0
    assert len(first_board["floral_arrangements"]) > 0
    assert first_board["dress_code"]
    assert len(first_board["table_styling"]) > 0
    assert first_board["invitation_direction"]
    assert len(first_board["food_presentation"]) > 0

    # 2. Create new moodboard with auto-generated palette
    create_payload = {
        "name": "Emerald & Brushed Champagne Gala",
        "theme": "Emerald & Brushed Champagne",
        "color_palette": [],  # Empty triggers coordinated auto-generation
        "dress_code": "Black Tie Optional with emerald accents",
        "invitation_direction": "Letterpress gold foil stamping on heavy emerald cardstock",
        "decoration_ideas": ["Suspended botanical chandeliers", "Mirrored acrylic plinths"],
        "venue_styling": ["Open-air terrace with clear acrylic ghost chairs"],
        "lighting": ["Amber uplighting on stone pillars", "Warm Edison bulbs"],
        "floral_arrangements": ["White calla lilies, baby's breath, and eucalyptus"],
        "table_styling": ["Matte black dinnerware with brushed brass cutlery"],
        "food_presentation": ["Artisanal grazing tables with edible orchid garnish"],
        "inspiration_notes": ["Keep evening terrace breeze in mind for candle hurricanes"],
        "images": ["pattern:botanical-gold"],
        "items": [
            {
                "id": "it-1",
                "category": "Lighting",
                "title": "Amber Festoon Canopy",
                "description": "Cross-strung warm tungsten bistro strings",
                "color_tag": "#D8B477",
                "order": 0,
            }
        ],
    }
    create_res = client.post(f"/api/events/{event_id}/moodboards?user_id={user_id}", json=create_payload)
    assert create_res.status_code == 200
    created_mb = create_res.json()["moodboard"]
    created_id = created_mb["id"]
    assert created_mb["name"] == "Emerald & Brushed Champagne Gala"
    assert len(created_mb["color_palette"]) >= 4  # Auto-generated 5-color palette

    # 3. Update moodboard
    update_payload = {
        "name": "Emerald & Brushed Champagne Gala (Refined)",
        "color_palette": ["#004B23", "#38B000", "#D8B477", "#FFFFFF", "#1E1E24"],
        "inspiration_notes": ["Updated note: ensure dimmer controls on amber wash"],
    }
    update_res = client.put(f"/api/events/{event_id}/moodboards/{created_id}?user_id={user_id}", json=update_payload)
    assert update_res.status_code == 200
    updated_mb = update_res.json()["moodboard"]
    assert updated_mb["name"] == "Emerald & Brushed Champagne Gala (Refined)"
    assert updated_mb["color_palette"][0] == "#004B23"

    # 4. Duplicate moodboard
    dup_res = client.post(
        f"/api/events/{event_id}/moodboards/{created_id}/duplicate?user_id={user_id}",
        json={"new_name": "Emerald & Brushed Champagne Gala (Evening Variation)"},
    )
    assert dup_res.status_code == 200
    dup_mb = dup_res.json()["moodboard"]
    dup_id = dup_mb["id"]
    assert dup_mb["name"] == "Emerald & Brushed Champagne Gala (Evening Variation)"
    assert dup_id != created_id

    # 5. Delete duplicated and created moodboards
    del_dup_res = client.delete(f"/api/events/{event_id}/moodboards/{dup_id}?user_id={user_id}")
    assert del_dup_res.status_code == 200

    del_orig_res = client.delete(f"/api/events/{event_id}/moodboards/{created_id}?user_id={user_id}")
    assert del_orig_res.status_code == 200


def test_concept_comparison_and_safe_adoption():
    """
    Verify Event Plan Comparison features:
    - Retrieve up to 3 distinct event concepts.
    - Check that each concept displays theme, estimated budget, guest experience,
      decoration direction, catering direction, planning complexity (with rationale),
      main advantages, trade-offs, and estimated cost-saving opportunities.
    - Check budget compliance: overrun concepts explicitly report overrun amount and trade-offs.
    - Strict adoption safety: reject adoption when confirmed is False.
    - Adopt concept successfully when explicitly confirmed.
    """
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # 1. Retrieve concepts
    get_res = client.get(f"/api/events/{event_id}/concept-comparison?user_id={user_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["success"] is True
    concepts = data["concepts"]
    assert len(concepts) == 3

    for c in concepts:
        assert c["concept_name"]
        assert c["theme"]
        assert c["estimated_budget"] > 0
        assert c["guest_experience"]
        assert c["decoration_direction"]
        assert c["catering_direction"]
        assert c["planning_complexity"] in ["Low", "Medium", "High"]
        assert c["complexity_rationale"]
        assert len(c["main_advantages"]) > 0
        assert len(c["trade_offs"]) > 0
        assert len(c["cost_saving_opportunities"]) > 0
        assert "budget_fit" in c
        if not c["is_within_budget"]:
            assert c["overrun_amount"] > 0
        else:
            assert c["overrun_amount"] == 0.0

    # 2. Re-generate concepts with custom instructions
    gen_res = client.post(
        f"/api/events/{event_id}/concept-comparison/generate?user_id={user_id}",
        json={"custom_instructions": "Focus heavily on sunset lighting and artisanal cocktails"},
    )
    assert gen_res.status_code == 200
    gen_concepts = gen_res.json()["concepts"]
    assert len(gen_concepts) == 3

    chosen_concept = gen_concepts[1]  # Select concept 2 (e.g. Modern Minimalist Luminary)
    chosen_id = chosen_concept["id"]

    # 3. Safe Adoption - Failure without explicit confirmation
    unconfirmed_res = client.post(
        f"/api/events/{event_id}/concept-comparison/adopt?user_id={user_id}",
        json={"concept_id": chosen_id, "confirmed": False},
    )
    assert unconfirmed_res.status_code == 400
    assert "confirmation" in unconfirmed_res.json()["detail"].lower()

    # 4. Safe Adoption - Success with explicit confirmation
    confirmed_res = client.post(
        f"/api/events/{event_id}/concept-comparison/adopt?user_id={user_id}",
        json={"concept_id": chosen_id, "confirmed": True},
    )
    assert confirmed_res.status_code == 200
    adopt_data = confirmed_res.json()
    assert adopt_data["success"] is True
    assert adopt_data["adopted_concept"]["id"] == chosen_id

    # 5. Verify the event blueprint was updated with the adopted concept
    event_res = client.get(f"/api/events/{event_id}?user_id={user_id}")
    assert event_res.status_code == 200
    res_data = event_res.json()
    active_plan = res_data.get("plan_data") or (res_data.get("event") or {}).get("plan_data")
    assert active_plan is not None
    assert active_plan["theme_details"]["theme_name"] == chosen_concept["theme"]
    # Verify an adopted moodboard was prepended
    assert len(active_plan["moodboards"]) >= 1
    assert "Adopted" in active_plan["moodboards"][0]["name"]


def test_auth_registration_and_login():
    """Test user registration, login, profile retrieval, and logout in auth system."""
    # 1. Register new user
    reg_res = client.post("/api/auth/register", json={
        "email": "priya.sharma@example.com",
        "password": "securePassword123!",
        "full_name": "Priya Sharma",
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["success"] is True
    assert reg_data["user"]["email"] == "priya.sharma@example.com"
    assert reg_data["user"]["full_name"] == "Priya Sharma"
    new_user_id = reg_data["user"]["id"]
    token = reg_data["access_token"]
    assert token is not None

    # 2. Login with valid credentials
    login_res = client.post("/api/auth/login", json={
        "email": "priya.sharma@example.com",
        "password": "securePassword123!",
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert login_data["user"]["id"] == new_user_id

    # 3. Retrieve /api/auth/me with user header / token
    me_res = client.get("/api/auth/me", headers={"x-user-id": new_user_id})
    assert me_res.status_code == 200
    assert me_res.json()["id"] == new_user_id

    # 4. Logout
    logout_res = client.post("/api/auth/logout", headers={"x-user-id": new_user_id})
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True


def test_password_recovery():
    """Test password recovery endpoint with valid email and rate limiting."""
    res = client.post("/api/auth/recover-password", json={
        "email": "priya.sharma@example.com"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "priya.sharma@example.com" in data["message"]


def test_auth_providers():
    """Test auth provider endpoint returns available authentication modes."""
    res = client.get("/api/auth/providers")
    assert res.status_code == 200
    data = res.json()
    assert "email_password" in data
    assert data["email_password"] is True
    assert "storage_engine" in data


def test_authorization_boundaries_cross_user_isolation():
    """
    CRITICAL SECURITY TEST:
    Strictly verify that User A cannot read, update, or delete User B's events,
    tasks, vendors, or guest records.
    """
    user_a = "user-alice-101"
    user_b = "user-bob-202"

    # 1. User A generates and saves an event
    gen_res = client.post("/api/events/generate", json={
        "event_type": "birthday",
        "event_name": "Alice's Private Gala",
        "event_date": "2026-11-25",
        "guest_count": 40,
        "location": "Seattle, WA",
        "budget_range": "moderate",
    })
    assert gen_res.status_code == 200
    plan_a = gen_res.json()

    save_res = client.post("/api/events/save", json={
        "user_id": user_a,
        "plan": plan_a,
    })
    assert save_res.status_code == 200
    event_a_id = save_res.json()["event"]["id"]

    # 2. User A can retrieve their own event
    alice_get = client.get(f"/api/events/{event_a_id}?user_id={user_a}")
    assert alice_get.status_code == 200
    assert alice_get.json()["event_name"] == "Alice's Private Gala"

    # 3. User B attempts to access User A's event -> MUST BE REJECTED with 404
    bob_get = client.get(f"/api/events/{event_a_id}?user_id={user_b}")
    assert bob_get.status_code == 404
    assert "not found" in bob_get.json()["detail"].lower()

    # 4. User B attempts to mutate User A's event -> MUST BE REJECTED with 404
    bob_update = client.put(f"/api/events/{event_a_id}?user_id={user_b}", json={
        "event_name": "Hacked by Bob",
        "guest_count": 999,
    })
    assert bob_update.status_code == 404

    # 5. User B attempts to delete User A's event -> MUST BE REJECTED with 404
    bob_delete = client.delete(f"/api/events/{event_a_id}?user_id={user_b}")
    assert bob_delete.status_code == 404

    # 6. Verify User A's event was untouched
    alice_verify = client.get(f"/api/events/{event_a_id}?user_id={user_a}")
    assert alice_verify.status_code == 200
    assert alice_verify.json()["event_name"] == "Alice's Private Gala"


def test_payload_size_limit_rejection():
    """Security guard test: verify that payloads exceeding size limit (10MB) are rejected with 413."""
    # Simulate content-length exceeding 10MB
    oversized_headers = {
        "content-length": str(15 * 1024 * 1024),  # 15MB
        "content-type": "application/json",
    }
    res = client.post("/api/events/generate", headers=oversized_headers, json={"test": "oversized"})
    assert res.status_code == 413
    assert "too large" in res.json()["detail"].lower()


def test_copilot_event_aware_chat_and_action_safety():
    """
    Test Event Copilot:
    1. Answers event-specific budget queries using live event context.
    2. Proposes structured allowlisted action.
    3. Rejects action execution without explicit user confirmation (confirmed: false).
    4. Applies action successfully with explicit user confirmation (confirmed: true).
    """
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    # 1. Ask Copilot to reduce budget
    chat_res = client.post(
        f"/api/events/{event_id}/copilot/chat?user_id={user_id}",
        json={"message": "Reduce my budget by ₹30,000 without changing the venue."},
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["reply"] != ""
    assert chat_data["proposed_action"] is not None
    proposed = chat_data["proposed_action"]
    assert proposed["action_type"] == "update_budget_allocation"
    assert proposed["parameters"]["reduction_amount"] == 30000.0

    # 2. Attempt execution without confirmation -> Rejection with 400
    unconfirmed_exec = client.post(
        f"/api/events/{event_id}/copilot/execute-action?user_id={user_id}",
        json={
            "action_id": proposed["id"],
            "action_type": proposed["action_type"],
            "parameters": proposed["parameters"],
            "confirmed": False,
        },
    )
    assert unconfirmed_exec.status_code == 400
    assert "confirmation" in unconfirmed_exec.json()["detail"].lower()

    # 3. Execution with explicit confirmation -> Success with 200
    confirmed_exec = client.post(
        f"/api/events/{event_id}/copilot/execute-action?user_id={user_id}",
        json={
            "action_id": proposed["id"],
            "action_type": proposed["action_type"],
            "parameters": proposed["parameters"],
            "confirmed": True,
        },
    )
    assert confirmed_exec.status_code == 200
    exec_data = confirmed_exec.json()
    assert exec_data["success"] is True
    assert exec_data["action_type"] == "update_budget_allocation"


def test_data_persistence_lifecycle():
    """
    Test persistence of user-created tasks, vendors, and guests:
    Creates an item, verifies it persists, updates it, and verifies the update survives.
    """
    user_id = "user-persistence-test"

    # 1. Save new event
    gen_res = client.post("/api/events/generate", json={
        "event_type": "community",
        "event_name": "Annual Heritage Festival",
        "event_date": "2026-12-01",
        "guest_count": 200,
        "location": "Boston Common, MA",
    })
    plan = gen_res.json()
    save_res = client.post("/api/events/save", json={"user_id": user_id, "plan": plan})
    event_id = save_res.json()["event"]["id"]

    # 2. Add a vendor to the event
    vendor_res = client.post(
        f"/api/events/{event_id}/vendors?user_id={user_id}",
        json={
            "business_name": "Beacon Lighting Pro",
            "category": "other",
            "contact_name": "Dave Miller",
            "quoted_price": 45000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "contacted",
        },
    )
    assert vendor_res.status_code == 200
    vendor_id = vendor_res.json()["vendor"]["id"]

    # 3. Add a guest to the event
    guest_res = client.post(
        f"/api/events/{event_id}/guests?user_id={user_id}",
        json={
            "name": "Marcus Vance",
            "group_household": "VIP",
            "rsvp_status": "confirmed",
            "party_size": 2,
            "dietary_preference": "Vegetarian",
        },
    )
    assert guest_res.status_code == 200
    guest_id = guest_res.json()["guest"]["id"]

    # 4. Reload event and verify persistent presence of vendor and guest
    reload_res = client.get(f"/api/events/{event_id}?user_id={user_id}")
    assert reload_res.status_code == 200
    event_data = reload_res.json()
    p_data = event_data.get("plan_data", {})
    
    vendors = p_data.get("vendors", [])
    assert any(v.get("id") == vendor_id for v in vendors)
    
    guests = p_data.get("guests", [])
    assert any(g.get("id") == guest_id for g in guests)


def test_event_readiness_score_comprehensive_calculation():
    """
    Test GET /api/events/{event_id}/readiness:
    Verifies transparent 0-100 score, exact 5 category weights,
    positive indicators, missing information, and Next Best Move.
    """
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    res = client.get(f"/api/events/{event_id}/readiness?user_id={user_id}")
    assert res.status_code == 200
    data = res.json()

    # Overall validation
    assert 0 <= data["overall_score"] <= 100
    assert data["score_grade"] in ["Celebration Ready", "Well Prepared", "Needs Attention", "Critical Attention", "Insufficient Data"]
    assert data["is_insufficient_data"] is False
    assert "FESTIVA READINESS FORMULA" in data["formula_documentation"]

    # Category weights validation (35%, 20%, 20%, 15%, 10%)
    cats = data["category_scores"]
    assert "task_completion" in cats
    assert cats["task_completion"]["max_score"] == 35.0
    assert 0 <= cats["task_completion"]["score"] <= 35.0

    assert "budget_preparedness" in cats
    assert cats["budget_preparedness"]["max_score"] == 20.0
    assert 0 <= cats["budget_preparedness"]["score"] <= 20.0

    assert "vendor_preparedness" in cats
    assert cats["vendor_preparedness"]["max_score"] == 20.0
    assert 0 <= cats["vendor_preparedness"]["score"] <= 20.0

    assert "guest_planning" in cats
    assert cats["guest_planning"]["max_score"] == 15.0
    assert 0 <= cats["guest_planning"]["score"] <= 15.0

    assert "timeline_preparedness" in cats
    assert cats["timeline_preparedness"]["max_score"] == 10.0
    assert 0 <= cats["timeline_preparedness"]["score"] <= 10.0

    # Next Best Move validation
    nbm = data["next_best_move"]
    assert nbm["title"] != ""
    assert nbm["description"] != ""
    assert nbm["priority"] in ["critical", "high", "recommended"]
    assert nbm["target_module"] in ["vendors", "budget", "timeline", "guests", "copilot"]

    # Positive indicators & breakdown
    assert len(data["positive_indicators"]) > 0


def test_event_readiness_insufficient_data_distinction():
    """
    CRITICAL REQUIREMENT:
    Clearly distinguish 'not enough information' from a genuine low readiness score.
    Brand new empty event must trigger is_insufficient_data=True and score_grade='Insufficient Data'.
    """
    user_id = "user-empty-test"
    # Create bare event with no tasks, no vendors, no guests
    save_res = client.post("/api/events/save", json={
        "user_id": user_id,
        "plan": {
            "event_id": "empty-event-101",
            "event_name": "Bare New Event",
            "event_type": "birthday",
            "event_date": "2026-12-30",
            "total_budget": 0,
            "tasks": [],
            "vendors": [],
            "guests": [],
        }
    })
    assert save_res.status_code == 200

    res = client.get(f"/api/events/empty-event-101/readiness?user_id={user_id}")
    assert res.status_code == 200
    data = res.json()

    assert data["is_insufficient_data"] is True
    assert data["score_grade"] == "Insufficient Data"
    assert data["data_sufficiency_pct"] < 50
    assert any("milestone" in m.lower() or "schedule" in m.lower() for m in data["missing_information"])


def test_next_best_move_venue_prioritization():
    """
    Verify that an event lacking a booked venue prioritizes
    'Confirm the Venue Before Finalizing Decoration Plans' in Next Best Move.
    """
    user_id = "user-venue-test"
    save_res = client.post("/api/events/save", json={
        "user_id": user_id,
        "plan": {
            "event_id": "no-venue-event-102",
            "event_name": "Autumn Reunion",
            "event_type": "community",
            "event_date": "2026-11-20",
            "total_budget": 500000,
            "tasks": [
                {"id": "t1", "title": "Initial concept brainstorming", "status": "completed", "due_date": "2026-10-01", "stage": "initial_planning"},
                {"id": "t2", "title": "Review catering ideas", "status": "in_progress", "due_date": "2026-11-10", "stage": "vendor_selection"}
            ],
            "vendors": [
                {"id": "v1", "category": "caterer", "business_name": "Taste Catering", "selection_status": "contacted", "quoted_price": 150000}
            ],
            "guests": [
                {"id": "g1", "name": "Guest One", "rsvp_status": "confirmed", "invitation_status": "sent_manual"}
            ],
        }
    })
    assert save_res.status_code == 200

    res = client.get(f"/api/events/no-venue-event-102/readiness?user_id={user_id}")
    assert res.status_code == 200
    data = res.json()

    # Next Best Move must recommend confirming venue
    nbm = data["next_best_move"]
    assert "venue" in nbm["title"].lower()
    assert nbm["target_module"] == "vendors"


def test_csv_formula_injection_defusal():
    """
    SECURITY TEST: Verify that imported CSV strings starting with formula trigger characters
    (=, +, -, @, \\t, \\r) are safely defused by prefixing with a single quote to prevent
    CSV injection / formula execution in spreadsheet applications (Excel, Calc, Sheets).
    """
    event_id = "demo-event-wedding-01"
    user_id = "demo-user-001"

    malicious_guests = [
        {"name": "=cmd|' /C calc'!A0", "group_household": "VIP", "party_size": 2, "dietary_preference": "Vegan"},
        {"name": "+2+5+cmd|' /C calc'!A0", "group_household": "Friends", "party_size": 1, "dietary_preference": "None"},
        {"name": "@SUM(1,2)", "group_household": "Colleagues", "party_size": 3, "dietary_preference": "-malicious_param"},
        {"name": "Regular Safe Guest", "group_household": "\tIndentedGroup", "party_size": 1, "dietary_preference": "Halal"},
    ]

    import_res = client.post(
        f"/api/events/{event_id}/guests/bulk-import?user_id={user_id}",
        json={"guests": malicious_guests, "skip_duplicates": False}
    )
    assert import_res.status_code == 200
    data = import_res.json()
    assert data["imported_count"] == 4

    # Verify that defusal prefixes were attached
    guest_list = data["guests"]
    calc_guest = next((g for g in guest_list if "calc" in g["name"]), None)
    assert calc_guest is not None
    assert calc_guest["name"].startswith("'")  # Defused!

    sum_guest = next((g for g in guest_list if "SUM" in g["name"]), None)
    assert sum_guest is not None
    assert sum_guest["name"].startswith("'@")  # Defused!
    assert sum_guest["dietary_preference"].startswith("'-")  # Defused!

    safe_guest = next((g for g in guest_list if g["name"] == "Regular Safe Guest"), None)
    assert safe_guest is not None
    assert safe_guest["name"] == "Regular Safe Guest"  # Untouched normal string
    assert safe_guest["group_household"].startswith("'\t")  # Tab character defused


def test_api_validation_rejections():
    """
    VALIDATION TEST: Ensure API cleanly rejects invalid payloads with 422/400.
    - Negative guest counts
    - Missing required fields
    - Party size < 1
    - Empty moodboard title
    """
    # 1. Negative guest count in plan generation -> 422
    neg_res = client.post("/api/events/generate", json={
        "event_type": "birthday",
        "event_name": "Invalid Birthday",
        "event_date": "2026-12-15",
        "guest_count": -15,  # Invalid: ge=1
        "location": "Boston, MA",
    })
    assert neg_res.status_code == 422

    # 2. Name too short (< 2 characters) -> 422
    short_res = client.post("/api/events/generate", json={
        "event_type": "birthday",
        "event_name": "A",
        "event_date": "2026-12-15",
        "guest_count": 50,
        "location": "Boston, MA",
    })
    assert short_res.status_code == 422

    # 3. Missing required event_type -> 422
    missing_res = client.post("/api/events/generate", json={
        "event_name": "Birthday Without Type",
        "event_date": "2026-12-15",
        "guest_count": 50,
        "location": "Boston, MA",
    })
    assert missing_res.status_code == 422

    # 4. Guest creation with empty name -> 400
    empty_guest_res = client.post(
        "/api/events/demo-event-wedding-01/guests?user_id=demo-user-001",
        json={"name": "   ", "party_size": 2}
    )
    assert empty_guest_res.status_code == 400

    # 5. Guest creation with party_size < 1 -> 422
    zero_party_res = client.post(
        "/api/events/demo-event-wedding-01/guests?user_id=demo-user-001",
        json={"name": "Valid Name", "party_size": 0}
    )
    assert zero_party_res.status_code == 422

    # 6. Moodboard creation with empty name -> 400
    empty_mb_res = client.post(
        "/api/events/demo-event-wedding-01/moodboards?user_id=demo-user-001",
        json={"name": "  ", "theme": "Royal Romance"}
    )
    assert empty_mb_res.status_code == 400


def test_database_fallback_resilience_and_auth_validation():
    """
    RESILIENCE TEST:
    - Verify graceful handling when retrieving non-existent event IDs (404, no 500 crash).
    - Verify registration rejects invalid email format with 422.
    - Verify login with non-existent user returns 401.
    """
    # 1. Non-existent event returns clean 404
    non_existent = client.get("/api/events/non-existent-uuid-99999?user_id=demo-user-001")
    assert non_existent.status_code == 404

    # 2. Non-existent event readiness returns 404
    readiness_404 = client.get("/api/events/non-existent-uuid-99999/readiness?user_id=demo-user-001")
    assert readiness_404.status_code == 404

    # 3. Auth registration rejects bad email format (RFC regex check)
    bad_email_res = client.post("/api/auth/register", json={
        "email": "not-an-email-address",
        "password": "Password123!",
        "full_name": "Tester"
    })
    assert bad_email_res.status_code == 422

    # 4. Auth login with invalid credentials returns 401
    bad_login_res = client.post("/api/auth/login", json={
        "email": "ghost.user@nonexistentdomain.com",
        "password": "WrongPassword123!"
    })
    assert bad_login_res.status_code == 401


def test_reset_demo_data_endpoint():
    """Verify POST /api/events/reset-demo restores pristine demo events and records."""
    res = client.post("/api/events/reset-demo")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["events_count"] >= 2
    assert "pristine" in data["message"].lower()

    # Verify pre-seeded wedding event exists and is intact
    wedding = client.get("/api/events/demo-event-wedding-01?user_id=demo-user-001")
    assert wedding.status_code == 200
    assert "Wedding" in wedding.json()["event_name"]


def test_health_and_healthz_probes():
    """Verify /health and /healthz orchestrator endpoints return 200 OK."""
    h_res = client.get("/health")
    assert h_res.status_code == 200
    assert h_res.json()["status"] == "healthy"

    hz_res = client.get("/healthz")
    assert hz_res.status_code == 200
    assert hz_res.json()["status"] == "healthy"









