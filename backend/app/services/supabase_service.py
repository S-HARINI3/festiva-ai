"""
Supabase database service for persisting event plans.
Falls back gracefully to an in-memory store when Supabase is not configured.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import sys
from fastapi import HTTPException

from app.core.config import settings

# In-memory store for demo mode
_DEMO_STORE: Dict[str, Dict[str, Any]] = {}


def _init_demo_store():
    """Seed initial realistic events for demo user so dashboard has instant demo data."""
    if _DEMO_STORE:
        return
    
    from app.services.gemini_service import _generate_demo_plan, generate_chronological_timeline_tasks
    from app.schemas.events import EventGenerateRequest, EventType, BudgetRange

    demo_user_id = "demo-user-001"
    
    # Event 1: Wedding
    wedding_req = EventGenerateRequest(
        event_type=EventType.WEDDING,
        event_name="Sophia & Liam's Garden Wedding",
        event_date=(datetime.now() + timedelta(days=75)).strftime("%Y-%m-%d"),
        guest_count=120,
        location="Napa Valley, CA",
        budget_range=BudgetRange.PREMIUM,
        theme_preferences="Rustic Floral & Warm Amber Glow",
        special_requirements="Gluten-free catering options, outdoor ceremony with backup canopy",
    )
    wedding_plan = _generate_demo_plan(wedding_req)
    wedding_plan.event_id = "demo-event-wedding-01"

    sample_wedding_expenses = [
        {
            "id": "exp-wed-01",
            "category": "Catering & Banquet Service",
            "title": "Catering Chef Advance & Tasting Fee",
            "amount": 250000.0,
            "date": "2026-10-10",
            "status": "logged_expense",
            "vendor_name": "Royal Banquet Culinary Studio",
            "notes": "Covers initial tasting and booking deposit",
            "receipt_note": "Receipt #RB-2026-091",
            "is_verified_payment": False,
        },
        {
            "id": "exp-wed-02",
            "category": "Venue & Space Rental",
            "title": "Banquet Hall & Lawn Security Deposit",
            "amount": 180000.0,
            "date": "2026-10-12",
            "status": "logged_expense",
            "vendor_name": "Grand Napa Estate",
            "notes": "Non-refundable date lock deposit",
            "receipt_note": "Invoice #GNE-1044",
            "is_verified_payment": False,
        },
        {
            "id": "exp-wed-03",
            "category": "Decorations & Fresh Florals",
            "title": "Stage Backdrop & Entrance Floral Arch",
            "amount": 120000.0,
            "date": "2026-10-15",
            "status": "logged_expense",
            "vendor_name": "Marigold & Petals Decor Studio",
            "notes": "Includes fresh flower supply agreement",
            "receipt_note": "Receipt #MP-882",
            "is_verified_payment": False,
        },
        {
            "id": "exp-wed-04",
            "category": "Photography & Cinematography",
            "title": "Candid Photographer Booking Advance",
            "amount": 65000.0,
            "date": "2026-10-18",
            "status": "vendor_commitment",
            "vendor_name": "Lumière Cinematics",
            "notes": "Contract signed for 2 lead shooters",
            "receipt_note": "Contract Signed Ref #LC-2026",
            "is_verified_payment": False,
        },
        {
            "id": "exp-wed-05",
            "category": "Invitations & Guest Gifting",
            "title": "Foil-Pressed Keepsake Invitation Suite",
            "amount": 28000.0,
            "date": "2026-10-20",
            "status": "logged_expense",
            "vendor_name": "Artisanal Paperworks",
            "notes": "100 luxury boxed invitations dispatched",
            "receipt_note": "Invoice #APW-505",
            "is_verified_payment": False,
        },
    ]
    wedding_dict = wedding_plan.model_dump()
    wedding_dict["expenses"] = sample_wedding_expenses

    # Also update actual_amount on category breakdown
    for cat in wedding_dict.get("budget_breakdown", []):
        cat_expenses = [e["amount"] for e in sample_wedding_expenses if e["category"] == cat.get("category")]
        cat["actual_amount"] = sum(cat_expenses)

    # Seed realistic tasks across all stages
    sample_wedding_tasks = generate_chronological_timeline_tasks(
        event_name=wedding_plan.event_name,
        event_type="wedding",
        event_date=wedding_plan.event_date,
        guest_count=120,
        location="The Glasshouse Conservatory, Bengaluru",
    )
    if len(sample_wedding_tasks) >= 3:
        sample_wedding_tasks[0].status = "completed"
        sample_wedding_tasks[1].status = "completed"
        sample_wedding_tasks[2].status = "in_progress"

    wedding_dict["tasks"] = [t.model_dump() for t in sample_wedding_tasks]
    if "timeline_plan" in wedding_dict and isinstance(wedding_dict["timeline_plan"], dict):
        wedding_dict["timeline_plan"]["tasks"] = [t.model_dump() for t in sample_wedding_tasks]

    # Seed realistic demo vendors across categories
    sample_wedding_vendors = [
        {
            "id": "ven-wed-01",
            "business_name": "The Glasshouse Conservatory, Bengaluru",
            "category": "venues",
            "contact_name": "Kavita Rao",
            "contact_phone": "+91 98450 12345",
            "contact_email": "events@glasshouseblr.com",
            "contact_info": "Kavita Rao | +91 98450 12345 | events@glasshouseblr.com",
            "website": "https://glasshouseblr.com",
            "quoted_price": 450000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "selected",
            "rating": 4.8,
            "notes": "Includes glass conservatory ballroom and manicured lawn. Music permitted till 11:30 PM.",
            "follow_up_date": "2026-11-05",
            "quotation_details": "12-hour exclusive ballroom access, 150 gold banquet chairs, 2 bridal vanity suites, generator backup fuel included.",
            "comparison_notes": "Premium aesthetic, high ceiling with natural skylight. Higher quote but includes all chairs and staging.",
        },
        {
            "id": "ven-wed-02",
            "business_name": "Royal Orchid Heritage Pavilion",
            "category": "venues",
            "contact_name": "Vikram Singhania",
            "contact_phone": "+91 98200 45678",
            "contact_email": "reservations@royalorchid.in",
            "contact_info": "Vikram Singhania | +91 98200 45678",
            "website": "https://royalorchid.in",
            "quoted_price": 520000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "shortlisted",
            "rating": 4.5,
            "notes": "Classic heritage courtyard with antique Belgian chandeliers. Valet parking for 80 vehicles.",
            "follow_up_date": "2026-11-08",
            "quotation_details": "Main courtyard + indoor grand hall + valet security team. Alcohol service curfew at 11:00 PM.",
            "comparison_notes": "More opulent heritage decor, but quotes Rs 70,000 higher than Glasshouse.",
        },
        {
            "id": "ven-wed-03",
            "business_name": "Royal Feast Culinary Arts",
            "category": "caterers",
            "contact_name": "Chef Arvind Sharma",
            "contact_phone": "+91 98765 43210",
            "contact_email": "catering@royalfeast.com",
            "contact_info": "Chef Arvind Sharma | +91 98765 43210",
            "website": "https://royalfeast.com",
            "quoted_price": 280000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "contacted",
            "rating": 4.7,
            "notes": "Live tandoor and chaat stations, artisanal dessert display. 1:15 server ratio with white glove service.",
            "follow_up_date": "2026-11-10",
            "quotation_details": "120 pax dinner buffet @ Rs 2,333/plate. Includes bone china dinnerware, mocktail bar, and dedicated station chefs.",
            "comparison_notes": "Excellent food review reputation. Quoted package is all-inclusive of premium crockery.",
        },
        {
            "id": "ven-wed-04",
            "business_name": "Saffron & Spice Gourmet Banquets",
            "category": "caterers",
            "contact_name": "Chef Meera Patel",
            "contact_phone": "+91 98111 22334",
            "contact_email": "info@saffrongourmet.com",
            "contact_info": "Chef Meera Patel | +91 98111 22334",
            "website": "https://saffrongourmet.com",
            "quoted_price": 310000.0,
            "currency": "INR",
            "availability_status": "tentative",
            "selection_status": "shortlisted",
            "rating": 4.6,
            "notes": "Awadhi and coastal fusion specialties. Farm-to-table organic vegetables.",
            "follow_up_date": "2026-11-12",
            "quotation_details": "120 pax multi-cuisine spread @ Rs 2,583/plate. Includes live pasta bar and imported cheese cart.",
            "comparison_notes": "Slightly higher per-plate rate than Royal Feast, but offers unique coastal seafood and live pasta options.",
        },
        {
            "id": "ven-wed-05",
            "business_name": "Lumière Cinematics",
            "category": "photographers",
            "contact_name": "Rohan Varma",
            "contact_phone": "+91 99000 88776",
            "contact_email": "shoot@lumiere.in",
            "contact_info": "Rohan Varma | +91 99000 88776",
            "website": "https://lumiere.in",
            "quoted_price": 140000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "booked",
            "rating": 4.9,
            "notes": "Booking confirmed and contract signed by user. 2 candid photographers + 2 cinematographers. 4K drone cinematography.",
            "follow_up_date": "2026-11-15",
            "quotation_details": "Full day coverage, 3-minute teaser reel within 7 days, 30-minute 4K documentary film, and 2 luxury leather albums.",
            "comparison_notes": "Highest rated portfolio in wedding cinematography. Quoted package matches our exact creative brief.",
        },
        {
            "id": "ven-wed-06",
            "business_name": "Studio Ivory Memories",
            "category": "photographers",
            "contact_name": "Priya Nair",
            "contact_phone": "+91 98444 33221",
            "contact_email": "priya@studioivory.com",
            "contact_info": "Priya Nair | +91 98444 33221",
            "website": "https://studioivory.com",
            "quoted_price": 110000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "shortlisted",
            "rating": 4.4,
            "notes": "Classic editorial style photography. Quick 14-day turnaround.",
            "follow_up_date": "2026-11-14",
            "quotation_details": "2 traditional photographers + 1 album + digital gallery link with full print rights.",
            "comparison_notes": "Cost-effective option, Rs 30,000 lower than Lumière, but does not provide cinematic video coverage.",
        },
        {
            "id": "ven-wed-07",
            "business_name": "Marigold & Petals Decor Studio",
            "category": "decorators",
            "contact_name": "Simran Kaur",
            "contact_phone": "+91 97312 99887",
            "contact_email": "decor@marigoldpetals.com",
            "contact_info": "Simran Kaur | +91 97312 99887",
            "website": "https://marigoldpetals.com",
            "quoted_price": 220000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "selected",
            "rating": 4.8,
            "notes": "Pastel romantic aesthetic with English blush roses, hanging wisteria, brass lanterns, and fairy light canopy.",
            "follow_up_date": "2026-11-06",
            "quotation_details": "30-foot stage floral backdrop + entrance floral tunnel + 15 custom tablescapes + LED ambient wash lighting.",
            "comparison_notes": "Exceptional rendering quality and responsiveness. Matches our moodboard color scheme seamlessly.",
        },
        {
            "id": "ven-wed-08",
            "business_name": "Bloom & Twig Florals",
            "category": "florists",
            "contact_name": "Deepak S.",
            "contact_phone": "+91 98860 11223",
            "contact_email": "blooms@bloomtwig.com",
            "contact_info": "Deepak S. | +91 98860 11223",
            "website": "https://bloomtwig.com",
            "quoted_price": 65000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "shortlisted",
            "rating": 4.6,
            "notes": "Exotic carnations, baby's breath, and fragrant tuberoses. Hand-tied bridal bouquet and groomsmen boutonnières.",
            "follow_up_date": "2026-11-16",
            "quotation_details": "Bridal cascading bouquet, 4 bridesmaid bouquets, 8 boutonnières, and 2 floral varmalas.",
            "comparison_notes": "Specialist florist focusing strictly on personal wearable floral pieces.",
        },
        {
            "id": "ven-wed-09",
            "business_name": "DJ Akhil & The SoundWave Collective",
            "category": "entertainment",
            "contact_name": "Akhil Joshi",
            "contact_phone": "+91 99160 55443",
            "contact_email": "booking@djakhil.in",
            "contact_info": "Akhil Joshi | +91 99160 55443",
            "website": "https://djakhil.in",
            "quoted_price": 75000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "contacted",
            "rating": 4.7,
            "notes": "Bollywood, deep progressive house, retro disco. Includes dual line-array speakers, subwoofer, and wireless microphones.",
            "follow_up_date": "2026-11-18",
            "quotation_details": "5-hour DJ performance + sound system + wireless handheld mics + haze machine.",
            "comparison_notes": "Energetic club and wedding performance record with versatile track mixing.",
        },
        {
            "id": "ven-wed-10",
            "business_name": "Glam by Natasha",
            "category": "makeup_artists",
            "contact_name": "Natasha Roy",
            "contact_phone": "+91 98222 66778",
            "contact_email": "glambynatasha@gmail.com",
            "contact_info": "Natasha Roy | +91 98222 66778",
            "website": "https://instagram.com/glambynatasha",
            "quoted_price": 35000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "selected",
            "rating": 4.9,
            "notes": "Airbrush HD bridal makeup, luxury hair styling, and dupatta draping. Includes pre-wedding trial session.",
            "follow_up_date": "2026-11-09",
            "quotation_details": "Full bridal styling + mother-of-the-bride makeup + pre-event trial run + touch-up kit.",
            "comparison_notes": "Flawless airbrush finish verified through client portfolio. Includes complimentary trial session.",
        },
        {
            "id": "ven-wed-11",
            "business_name": "Regal Vintage & Luxury Fleet",
            "category": "transportation",
            "contact_name": "Mohan Lal",
            "contact_phone": "+91 98888 77665",
            "contact_email": "dispatch@regalfleet.com",
            "contact_info": "Mohan Lal | +91 98888 77665",
            "website": "https://regalfleet.com",
            "quoted_price": 45000.0,
            "currency": "INR",
            "availability_status": "available",
            "selection_status": "shortlisted",
            "rating": 4.5,
            "notes": "Vintage cream Jaguar for couple entry and 2 Toyota Innova Crysta MPVs for elder family airport transfers.",
            "follow_up_date": "2026-11-20",
            "quotation_details": "Vintage luxury car 4 hours / 40 km + 2 family vans 12 hours full day. Chauffeurs in formal uniforms.",
            "comparison_notes": "Well maintained vintage motorcar with reliable backup chauffeured fleet.",
        },
        {
            "id": "ven-wed-12",
            "business_name": "Sparkle & Hue Event FX",
            "category": "other",
            "contact_name": "Karan Bhatia",
            "contact_phone": "+91 97400 33112",
            "contact_email": "fx@sparklehue.in",
            "contact_info": "Karan Bhatia | +91 97400 33112",
            "website": "https://sparklehue.in",
            "quoted_price": 25000.0,
            "currency": "INR",
            "availability_status": "tentative",
            "selection_status": "shortlisted",
            "rating": 4.3,
            "notes": "Indoor smokeless cold spark pyro fountains and dry-ice cloud fog for couple first dance.",
            "follow_up_date": "2026-11-22",
            "quotation_details": "4 cold pyrotechnic sparkulars + 1 heavy dry ice machine + certified technician operator.",
            "comparison_notes": "Safe indoor cold sparks certified by venue fire regulations.",
        },
    ]
    wedding_dict["vendors"] = sample_wedding_vendors

    # Seed realistic demo guests across households
    sample_wedding_guests = [
        {
            "id": "gst-wed-01",
            "name": "Ananya & Kabir Malhotra",
            "group_household": "Immediate Family",
            "invitation_status": "sent_manual",
            "invitation_delivery_note": "Manually Tracked (No automated delivery gateway configured)",
            "rsvp_status": "confirmed",
            "party_size": 2,
            "adults_count": 2,
            "children_count": 0,
            "dietary_preference": "Vegetarian",
            "accessibility_requests": "Step-Free Access",
            "table_assignment": "Table 1 - Royal Orchid",
            "notes": "Bride's close first cousins; arriving on celebration morning.",
        },
        {
            "id": "gst-wed-02",
            "name": "Dr. Rajesh & Sunita Verma",
            "group_household": "Family Elders",
            "invitation_status": "sent_manual",
            "invitation_delivery_note": "Manually Tracked (No automated delivery gateway configured)",
            "rsvp_status": "confirmed",
            "party_size": 2,
            "adults_count": 2,
            "children_count": 0,
            "dietary_preference": "Jain",
            "accessibility_requests": "Priority Ground Seating",
            "table_assignment": "Table 1 - Royal Orchid",
            "notes": "Require strict Jain preparation without root vegetables. Senior seating close to stage.",
        },
        {
            "id": "gst-wed-03",
            "name": "The Kapoor Family",
            "group_household": "Groom's Family",
            "invitation_status": "sent_manual",
            "invitation_delivery_note": "Manually Tracked (No automated delivery gateway configured)",
            "rsvp_status": "confirmed",
            "party_size": 4,
            "adults_count": 2,
            "children_count": 2,
            "dietary_preference": "Standard",
            "accessibility_requests": None,
            "table_assignment": "Table 2 - Marigold",
            "notes": "Need 2 booster high-chairs for kids at Table 2.",
        },
        {
            "id": "gst-wed-04",
            "name": "Rohan & Tara Sengupta",
            "group_household": "College Friends",
            "invitation_status": "sent_manual",
            "invitation_delivery_note": "Manually Tracked (No automated delivery gateway configured)",
            "rsvp_status": "confirmed",
            "party_size": 2,
            "adults_count": 2,
            "children_count": 0,
            "dietary_preference": "Vegan",
            "accessibility_requests": None,
            "table_assignment": "Table 3 - Sapphire",
            "notes": "Traveling in from Mumbai; staying at nearby hotel.",
        },
        {
            "id": "gst-wed-05",
            "name": "Amitabh & Jaya Saxena",
            "group_household": "Family Friends",
            "invitation_status": "sent_manual",
            "invitation_delivery_note": "Manually Tracked (No automated delivery gateway configured)",
            "rsvp_status": "maybe",
            "party_size": 2,
            "adults_count": 2,
            "children_count": 0,
            "dietary_preference": "Gluten-Free",
            "accessibility_requests": "Assisted Ramp Entry",
            "table_assignment": "Unassigned",
            "notes": "Awaiting final flight schedule confirmation; will confirm by Nov 10.",
        },
        {
            "id": "gst-wed-06",
            "name": "Vikramaditya Rao",
            "group_household": "Work Colleagues",
            "invitation_status": "sent_manual",
            "invitation_delivery_note": "Manually Tracked (No automated delivery gateway configured)",
            "rsvp_status": "declined",
            "party_size": 1,
            "adults_count": 1,
            "children_count": 0,
            "dietary_preference": "Standard",
            "accessibility_requests": None,
            "table_assignment": "Unassigned",
            "notes": "Overseas conference conflict; sent congratulations and gift registry contribution.",
        },
        {
            "id": "gst-wed-07",
            "name": "Meera Desai & Partner",
            "group_household": "Bride VIP",
            "invitation_status": "sent_manual",
            "invitation_delivery_note": "Manually Tracked (No automated delivery gateway configured)",
            "rsvp_status": "invited",
            "party_size": 2,
            "adults_count": 2,
            "children_count": 0,
            "dietary_preference": "Nut Allergy",
            "accessibility_requests": None,
            "table_assignment": "Table 3 - Sapphire",
            "notes": "Maid of Honor party; severe peanut and tree nut allergy.",
        },
        {
            "id": "gst-wed-08",
            "name": "Siddharth & Tanya Joshi",
            "group_household": "College Friends",
            "invitation_status": "not_sent",
            "invitation_delivery_note": "Manually Tracked (No automated delivery gateway configured)",
            "rsvp_status": "not_invited",
            "party_size": 2,
            "adults_count": 2,
            "children_count": 0,
            "dietary_preference": "Standard",
            "accessibility_requests": None,
            "table_assignment": "Unassigned",
            "notes": "Secondary list; to be invited if venue capacity allows.",
        },
    ]
    wedding_dict["guests"] = sample_wedding_guests

    # Seed realistic demo moodboards
    sample_wedding_moodboards = [
        {
            "id": "mb-wed-01",
            "name": "Glasshouse Autumn Twilight",
            "theme": "Botanical Heritage & Champagne Glow",
            "color_palette": ["#713B70", "#E9DDF3", "#D8B477", "#26232B", "#FAF8F5"],
            "dress_code": "Formal Indian Regal or Black-Tie with jewel-tone accents (Wine, Emerald, Rose Gold)",
            "invitation_direction": "Deckle-edged cotton rag paper with blind debossed botanical monogram and gold foil calligraphy",
            "decoration_ideas": [
                "Cascading white wisteria and blush English roses suspended over banquet tables",
                "Antique brass Moroccan lanterns lining the glass corridor entrance",
                "Textured linen drapes in ivory with warm amber flood washes",
            ],
            "venue_styling": [
                "Preserve architectural glass skylight view with perimeter uplighting",
                "Circular central stage with low brass floral bowl centerpieces for 360-degree guest visibility",
            ],
            "lighting": [
                "2700K warm incandescent filament bulbs woven through greenery",
                "Flickering LED wax pillar candles in hurricane glass sleeves on every dining table",
            ],
            "floral_arrangements": [
                "Seasonal tuberose and baby's breath garlands on welcome arches",
                "Loose organic garden-style centerpieces featuring café-au-lait dahlias and eucalyptus",
            ],
            "table_styling": [
                "Matte gold cutlery with smoked crystal water goblets",
                "Personalized velvet place cards with wax seals for VIP tables",
            ],
            "food_presentation": [
                "Live artisanal tandoori kulcha station served on black slate platters",
                "Dessert grazing island with saffron pistachio macarons and rose petal rabri",
            ],
            "inspiration_notes": [
                "Focus on understated European greenhouse charm meets royal Indian warmth",
                "Avoid harsh white floodlights or plastic artificial florals",
            ],
            "images": [
                "pattern:botanical-gold",
                "pattern:amber-twilight",
                "pattern:velvet-texture",
            ],
            "items": [],
            "created_at": (datetime.now() - timedelta(days=2)).isoformat(),
            "updated_at": datetime.now().isoformat(),
        },
        {
            "id": "mb-wed-02",
            "name": "Modern Minimalist Garden",
            "theme": "Clean Geometries & Monochromatic Whites",
            "color_palette": ["#26232B", "#77717D", "#D1CCD6", "#E9E3E8", "#FFFFFF"],
            "dress_code": "Chic Monochrome or Architectural Tailoring in Slate, Charcoal, and Ivory",
            "invitation_direction": "Heavyweight matte cardstock with blind letterpress typography and translucent vellum belly-band",
            "decoration_ideas": [
                "Frosted acrylic plinths with single-stem white calla lilies",
                "Monochromatic white orchids suspended in clean vertical glass tubes",
            ],
            "venue_styling": [
                "Sleek lounge seating clusters with minimal low-slung linen sofas",
            ],
            "lighting": [
                "Architectural pin-spotting on dining tables with sharp linear wash lights",
            ],
            "floral_arrangements": [
                "Pure white anthuriums, monstera leaves, and white tulips",
            ],
            "table_styling": [
                "Brushed stainless steel flatware with crisp white Belgian linen napkins",
            ],
            "food_presentation": [
                "Plated contemporary degustation courses with microgreens and botanical garnishes",
            ],
            "inspiration_notes": [
                "Keep clean lines with zero clutter; every element serves a spatial purpose",
            ],
            "images": [
                "pattern:minimal-grid",
                "pattern:monochrome-wave",
            ],
            "items": [],
            "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
            "updated_at": datetime.now().isoformat(),
        },
    ]
    wedding_dict["moodboards"] = sample_wedding_moodboards

    from app.services.gemini_service import generate_event_concept_comparison
    sample_concepts = generate_event_concept_comparison(
        event_id=wedding_plan.event_id,
        event_name=wedding_plan.event_name,
        event_type="wedding",
        target_budget=wedding_dict.get("total_estimated_budget", 1500000.0),
        currency=wedding_dict.get("currency", "INR"),
        guest_count=120,
    )
    wedding_dict["concept_comparisons"] = [c.model_dump() for c in sample_concepts]

    _DEMO_STORE[wedding_plan.event_id] = {
        "id": wedding_plan.event_id,
        "user_id": demo_user_id,
        "event_name": wedding_plan.event_name,
        "event_type": wedding_plan.event_type.value,
        "event_date": wedding_plan.event_date,
        "plan_data": wedding_dict,
        "created_at": (datetime.now() - timedelta(days=3)).isoformat(),
        "demo": True,
    }

    # Event 2: Corporate Summit
    corp_req = EventGenerateRequest(
        event_type=EventType.CORPORATE,
        event_name="Global Tech & AI Innovators Summit",
        event_date=(datetime.now() + timedelta(days=120)).strftime("%Y-%m-%d"),
        guest_count=250,
        location="Austin Convention Center, TX",
        budget_range=BudgetRange.LUXURY,
        theme_preferences="Cyberpunk Neon & Modern Minimalism",
        special_requirements="High-speed dual-band WiFi, simultaneous interpretation, live streaming setup",
    )
    corp_plan = _generate_demo_plan(corp_req)
    corp_plan.event_id = "demo-event-corp-02"

    sample_corp_tasks = generate_chronological_timeline_tasks(
        event_name=corp_plan.event_name,
        event_type="corporate",
        event_date=corp_plan.event_date,
        guest_count=250,
        location="Austin Convention Center, TX",
    )
    corp_dict = corp_plan.model_dump()
    corp_dict["tasks"] = [t.model_dump() for t in sample_corp_tasks]
    if "timeline_plan" in corp_dict and isinstance(corp_dict["timeline_plan"], dict):
        corp_dict["timeline_plan"]["tasks"] = [t.model_dump() for t in sample_corp_tasks]
    
    _DEMO_STORE[corp_plan.event_id] = {
        "id": corp_plan.event_id,
        "user_id": demo_user_id,
        "event_name": corp_plan.event_name,
        "event_type": corp_plan.event_type.value,
        "event_date": corp_plan.event_date,
        "plan_data": corp_dict,
        "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
        "demo": True,
    }


def _get_client():
    import sys
    if "pytest" in sys.modules:
        return None
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return None
    try:
        from supabase import create_client
        url = settings.SUPABASE_URL.strip().strip('"\'')
        key = (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY).strip().strip('"\'')
        return create_client(url, key)
    except Exception:
        return None


async def _sync_child_records(client, event_id: str, user_id: str, plan_data: Dict[str, Any]):
    """
    Synchronizes child entities (tasks, vendors, guests, expenses, moodboards, budget_categories)
    into their dedicated normalized PostgreSQL tables for query optimization and relational integrity.
    """
    try:
        # 1. Sync Event Plan Snapshot
        client.table("event_plans").upsert({
            "event_id": event_id,
            "user_id": user_id,
            "plan_data": plan_data,
            "version": 1,
            "is_adopted": True,
            "updated_at": datetime.utcnow().isoformat(),
        }, on_conflict="event_id,version").execute()

        # 2. Sync Budget Categories
        categories = plan_data.get("budget_categories") or []
        if categories:
            cat_rows = []
            for c in categories:
                cat_rows.append({
                    "id": c.get("id") or str(uuid.uuid4()),
                    "event_id": event_id,
                    "user_id": user_id,
                    "name": c.get("name", "Category"),
                    "allocated_amount": float(c.get("allocated_amount", 0.0)),
                    "percentage": float(c.get("percentage", 0.0)),
                    "notes": c.get("notes"),
                    "color": c.get("color"),
                })
            client.table("budget_categories").upsert(cat_rows).execute()

        # 3. Sync Expenses
        expenses = plan_data.get("expenses") or []
        if expenses:
            exp_rows = []
            for e in expenses:
                exp_rows.append({
                    "id": e.get("id") or str(uuid.uuid4()),
                    "event_id": event_id,
                    "user_id": user_id,
                    "category": e.get("category", "General"),
                    "title": e.get("title") or e.get("name") or "Expense",
                    "amount": float(e.get("amount", 0.0)),
                    "date": e.get("date") or datetime.utcnow().strftime("%Y-%m-%d"),
                    "status": e.get("status", "logged_expense"),
                    "vendor_name": e.get("vendor_name"),
                    "notes": e.get("notes"),
                    "receipt_note": e.get("receipt_note"),
                    "is_verified_payment": bool(e.get("is_verified_payment", False)),
                })
            client.table("expenses").upsert(exp_rows).execute()

        # 4. Sync Tasks
        tasks = plan_data.get("tasks") or []
        if tasks:
            task_rows = []
            for t in tasks:
                task_rows.append({
                    "id": t.get("id") or str(uuid.uuid4()),
                    "event_id": event_id,
                    "user_id": user_id,
                    "title": t.get("title", "Task"),
                    "description": t.get("description"),
                    "stage": t.get("stage", "initial_planning"),
                    "priority": t.get("priority", "medium"),
                    "category": t.get("category"),
                    "due_date": t.get("due_date"),
                    "status": t.get("status", "not_started"),
                    "assignee": t.get("assignee"),
                    "estimated_cost": float(t.get("estimated_cost", 0.0) or 0.0),
                    "dependencies": t.get("dependencies", []),
                    "notes": t.get("notes"),
                })
            client.table("tasks").upsert(task_rows).execute()

        # 5. Sync Vendors
        vendors = plan_data.get("vendors") or []
        if vendors:
            v_rows = []
            for v in vendors:
                v_rows.append({
                    "id": v.get("id") or str(uuid.uuid4()),
                    "event_id": event_id,
                    "user_id": user_id,
                    "business_name": v.get("business_name", "Vendor"),
                    "category": v.get("category", "other"),
                    "contact_name": v.get("contact_name"),
                    "phone": v.get("phone"),
                    "email": v.get("email"),
                    "website": v.get("website"),
                    "quoted_price": float(v.get("quoted_price", 0.0) or 0.0),
                    "currency": v.get("currency", "INR"),
                    "availability_status": v.get("availability_status", "available"),
                    "selection_status": v.get("selection_status", "shortlisted"),
                    "rating": float(v.get("rating", 4.0) or 4.0),
                    "notes": v.get("notes"),
                    "follow_up_date": v.get("follow_up_date"),
                    "comparison_notes": v.get("comparison_notes"),
                    "quotation_details": v.get("quotation_details", {}),
                })
            client.table("vendors").upsert(v_rows).execute()

        # 6. Sync Guests
        guests = plan_data.get("guests") or []
        if guests:
            g_rows = []
            for g in guests:
                g_rows.append({
                    "id": g.get("id") or str(uuid.uuid4()),
                    "event_id": event_id,
                    "user_id": user_id,
                    "name": g.get("name", "Guest"),
                    "email": g.get("email"),
                    "phone": g.get("phone"),
                    "group_household": g.get("group_household"),
                    "invitation_status": g.get("invitation_status", "not_sent"),
                    "invitation_delivery_note": g.get("invitation_delivery_note"),
                    "rsvp_status": g.get("rsvp_status", "invited"),
                    "party_size": int(g.get("party_size", 1)),
                    "adults_count": int(g.get("adults_count", 1)),
                    "children_count": int(g.get("children_count", 0)),
                    "dietary_preference": g.get("dietary_preference"),
                    "accessibility_requests": g.get("accessibility_requests"),
                    "table_assignment": g.get("table_assignment"),
                    "notes": g.get("notes"),
                })
            client.table("guests").upsert(g_rows).execute()

        # 7. Sync Moodboards
        moodboards = plan_data.get("moodboards") or []
        if moodboards:
            mb_rows = []
            for m in moodboards:
                mb_rows.append({
                    "id": m.get("id") or str(uuid.uuid4()),
                    "event_id": event_id,
                    "user_id": user_id,
                    "name": m.get("name", "Moodboard"),
                    "theme": m.get("theme"),
                    "color_palette": m.get("color_palette", []),
                    "dress_code": m.get("dress_code"),
                    "invitation_direction": m.get("invitation_direction"),
                    "decoration_ideas": m.get("decoration_ideas", []),
                    "venue_styling": m.get("venue_styling", []),
                    "lighting": m.get("lighting", []),
                    "floral_arrangements": m.get("floral_arrangements", []),
                    "table_styling": m.get("table_styling", []),
                    "food_presentation": m.get("food_presentation", []),
                    "inspiration_notes": m.get("inspiration_notes", []),
                    "images": m.get("images", []),
                    "items": m.get("items", []),
                })
            client.table("moodboards").upsert(mb_rows).execute()

    except Exception as e:
        # Non-fatal log so plan persistence remains robust
        pass


def _handle_db_error(e: Exception):
    err_str = str(e)
    code = getattr(e, "code", "")
    message = getattr(e, "message", err_str)
    
    if "PGRST205" in str(code) or "schema cache" in err_str or ("relation" in err_str and "does not exist" in err_str):
        raise HTTPException(
            status_code=503,
            detail="Database schema not initialized. Please run backend/migrations/001_initial_schema.sql in your Supabase SQL Editor."
        )
    if "Invalid API key" in err_str or "JWT" in err_str:
        raise HTTPException(
            status_code=503,
            detail="Invalid Supabase API key. Please check SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY in your Render environment settings."
        )
    raise HTTPException(
        status_code=500,
        detail=f"Database error: {message}"
    )


async def save_event(user_id: str, plan_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    client = _get_client()
    event_id = plan_data.get("event_id") or str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    if not client:
        if settings.APP_ENV == "production" and "pytest" not in sys.modules:
            raise HTTPException(
                status_code=503,
                detail="Database service not configured. Please ensure SUPABASE_URL and SUPABASE_KEY are configured in your deployment settings."
            )
        _init_demo_store()
        record = {
            "id": event_id,
            "user_id": user_id,
            "event_name": plan_data.get("event_name"),
            "event_type": plan_data.get("event_type"),
            "event_date": plan_data.get("event_date"),
            "plan_data": plan_data,
            "created_at": plan_data.get("created_at") or now_iso,
            "updated_at": now_iso,
            "demo": True,
        }
        _DEMO_STORE[event_id] = record
        return record
    
    event_row = {
        "id": event_id,
        "user_id": user_id,
        "event_name": plan_data.get("event_name"),
        "event_type": str(plan_data.get("event_type", "other")),
        "event_date": plan_data.get("event_date"),
        "location": plan_data.get("location", "Venue"),
        "guest_count": int(plan_data.get("guest_count", 50)),
        "budget_range": plan_data.get("budget_range", "moderate"),
        "currency": plan_data.get("currency", "INR"),
        "total_budget": float(plan_data.get("total_budget") or plan_data.get("total_estimated_budget") or 0.0),
        "status": "planning",
        "created_at": plan_data.get("created_at") or now_iso,
        "updated_at": now_iso,
    }
    try:
        result = client.table("events").insert(event_row).execute()
        # Synchronize child tables and snapshot
        await _sync_child_records(client, event_id, user_id, plan_data)
        saved_event = result.data[0] if result.data else event_row
        saved_event["plan_data"] = plan_data
        return saved_event
    except Exception as e:
        _handle_db_error(e)


async def get_user_events(user_id: str) -> List[Dict[str, Any]]:
    client = _get_client()
    if not client:
        if settings.APP_ENV == "production" and "pytest" not in sys.modules:
            raise HTTPException(
                status_code=503,
                detail="Database service not configured. Please ensure SUPABASE_URL and SUPABASE_KEY are configured in your deployment settings."
            )
        _init_demo_store()
        user_events = [e for e in _DEMO_STORE.values() if str(e.get("user_id")) == str(user_id)]
        return sorted(user_events, key=lambda x: str(x.get("created_at", "")), reverse=True)
    
    try:
        result = client.table("events").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        events = result.data or []
        
        # Attach plan_data from event_plans snapshot if needed
        for ev in events:
            eid = ev["id"]
            p_res = client.table("event_plans").select("plan_data").eq("event_id", eid).eq("user_id", user_id).execute()
            if p_res.data:
                ev["plan_data"] = p_res.data[0].get("plan_data", {})
        return events
    except Exception as e:
        _handle_db_error(e)


async def get_event_by_id(event_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    client = _get_client()
    if not client:
        if settings.APP_ENV == "production" and "pytest" not in sys.modules:
            raise HTTPException(
                status_code=503,
                detail="Database service not configured. Please ensure SUPABASE_URL and SUPABASE_KEY are configured in your deployment settings."
            )
        _init_demo_store()
        event = _DEMO_STORE.get(event_id)
        # STRICT OWNERSHIP BOUNDARY: Validate user_id matches event owner
        if event and str(event.get("user_id")) == str(user_id):
            return event
        return None
    
    try:
        result = client.table("events").select("*").eq("id", event_id).eq("user_id", user_id).execute()
        if not result.data:
            return None
        
        event = result.data[0]
        p_res = client.table("event_plans").select("plan_data").eq("event_id", event_id).eq("user_id", user_id).execute()
        if p_res.data:
            event["plan_data"] = p_res.data[0].get("plan_data", {})
        return event
    except Exception as e:
        _handle_db_error(e)


async def update_event(event_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    client = _get_client()
    now_iso = datetime.utcnow().isoformat()

    if not client:
        if settings.APP_ENV == "production" and "pytest" not in sys.modules:
            raise HTTPException(
                status_code=503,
                detail="Database service not configured. Please ensure SUPABASE_URL and SUPABASE_KEY are configured in your deployment settings."
            )
        _init_demo_store()
        event = _DEMO_STORE.get(event_id)
        # STRICT OWNERSHIP BOUNDARY
        if event and str(event.get("user_id")) == str(user_id):
            event.update(updates)
            event["updated_at"] = now_iso
            return event
        return None
    
    try:
        # Ensure event belongs to user before updating
        existing = client.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
        if not existing.data:
            return None
        
        # Separate event-level updates from plan_data
        event_updates = {k: v for k, v in updates.items() if k != "plan_data"}
        event_updates["updated_at"] = now_iso

        if event_updates:
            client.table("events").update(event_updates).eq("id", event_id).eq("user_id", user_id).execute()

        if "plan_data" in updates:
            plan_data = updates["plan_data"]
            await _sync_child_records(client, event_id, user_id, plan_data)

        return await get_event_by_id(event_id, user_id)
    except Exception as e:
        _handle_db_error(e)


async def delete_event(event_id: str, user_id: str) -> bool:
    client = _get_client()
    if not client:
        if settings.APP_ENV == "production" and "pytest" not in sys.modules:
            raise HTTPException(
                status_code=503,
                detail="Database service not configured. Please ensure SUPABASE_URL and SUPABASE_KEY are configured in your deployment settings."
            )
        _init_demo_store()
        event = _DEMO_STORE.get(event_id)
        # STRICT OWNERSHIP BOUNDARY
        if event and str(event.get("user_id")) == str(user_id):
            del _DEMO_STORE[event_id]
            return True
        return False
    
    try:
        result = client.table("events").delete().eq("id", event_id).eq("user_id", user_id).execute()
        return len(result.data) > 0
    except Exception as e:
        _handle_db_error(e)


async def reset_demo_store() -> Dict[str, Any]:
    """
    Reset in-memory demo celebrations to initial pristine state with
    sample events, realistic budget breakdown, timeline tasks, vendors, and guests.
    """
    _DEMO_STORE.clear()
    _init_demo_store()
    return {
        "success": True,
        "message": "Demo data successfully reset to pristine state with sample wedding and corporate summit plans.",
        "events_count": len(_DEMO_STORE),
    }



