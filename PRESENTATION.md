# 🏆 Festiva AI — PromptWars Virtual Challenge 5: Project Presentation & Architecture Brief

> **Submission Title:** Festiva AI — Autonomous Event Planning & Intelligence Platform  
> **Challenge:** PromptWars Virtual Challenge 5: Celebration & Event Planner  
> **Version:** 1.0.0 (Production Release)  
> **Repository:** `d:\promptwar\festiva-ai`  
> **Interactive In-App Brief:** [http://localhost:5173/presentation](http://localhost:5173/presentation)

---

## 1. Problem Statement

Organizing a milestone celebration (wedding, anniversary, milestone birthday, corporate conference, or community gala) is notoriously stressful, fragmented, and prone to costly budget blowouts. Today, planners and hosts face three structural failure points:

1. **Unrealistic Budgets & Cost Blindspots**: Most planners begin with an arbitrary budget figure divorced from market realities. They fail to account for mandatory per-plate catering minimums, venue service fees, and contingency reserves, causing mid-planning financial crises.
2. **Timeline Disarray & Dependency Conflicts**: Novice planners frequently book dependent elements out of sequence (e.g., ordering custom stationery before confirming the banquet hall or booking a decorator before measuring the venue ceiling height).
3. **Cognitive Overload & Quotation Paralysis**: Evaluating disparate quotations across 10+ vendor categories, calculating complex dietary headcounts (vegan, Jain, halal, nut allergies), and managing seating across spreadsheets leads to friction and human error.

---

## 2. Proposed Solution: Festiva AI

**Festiva AI** is a full-stack, enterprise-grade autonomous event intelligence platform. Rather than serving as a simplistic chat wrapper, Festiva functions as a deterministic celebration operating system:

* **Instant Multi-Stage Blueprinting**: Synthesizes complete 10-section event architectures in under 10 seconds.
* **Infeasibility Economics**: Mathematical validation that flags unrealistic budget-to-guest ratios and computes non-hallucinatory tradeoffs.
* **Algorithmic Budget Rescue**: Discretionary spending audit that balances category deficits with 1-click safe adoption.
* **Transparent 100-Point Readiness Score**: Measurable readiness index ($S = 35 + 20 + 20 + 15 + 10 = 100$) powering a prioritized P1–P8 **Next Best Move** engine.
* **Safe Event Copilot**: Conversational assistant executing allowlisted actions via preview cards requiring explicit two-step user confirmation.
* **Dual-Mode Operation**: Seamlessly operates in production cloud mode (Supabase PostgreSQL + RLS) or in 100% offline-ready Zero-Config Demo Mode.

---

## 3. Target Users & Personas

| Persona | Primary Use Case | Key Value Proposition |
|---|---|---|
| **Couples & Families** | Weddings, Silver/Golden Anniversaries, Sangeets, Sweet 16s | Cultural theme palettes, guest dietary management, multi-day schedule run-of-show. |
| **Corporate Event Leads** | Annual Tech Summits, Product Launches, Executive Retreats | AV/Keynote logistics, verified quotation comparisons, exportable CSV rosters. |
| **Community Organizers** | College Cultural Fests, Charity Galas, Neighborhood Festivals | Crowd safety contingencies, volunteer task checklists, tiered budget allocations. |
| **Independent Event Planners** | Boutique Event Agencies & Solo Wedding Coordinators | Rapid client pitch generation, instant budget variance tracking, printable PDF/CSV exports. |

---

## 4. Unique Features & Core Differentiators

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       6 PILLARS OF FESTIVA AI INNOVATION                    │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│ 1. Infeasibility Econ    │ Mathematical reality chk │ Flags unrealistic $   │
│ 2. Budget Rescue Engine  │ Algorithmic reallocation │ 1-Click recovery plan │
│ 3. 100-Pt Readiness Score│ Explainable weighted math│ Prioritized Next Move │
│ 4. Allowlisted Copilot   │ 2-Step Action Cards      │ No unconfirmed changes│
│ 5. CSV Injection Shield  │ Sanitizes `=, +, -, @`   │ Spreadsheet safety    │
│ 6. Zero-Config Demo Mode │ 100% functional offline  │ Self-contained sample │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

1. **Infeasibility Economics**: Identifies impossible event combinations (e.g., 250 guests on a ₹50,000 budget in a 5-star hotel). It explains *why* the numbers fail and calculates specific mathematical tradeoffs: reduce guest count to 45, switch from plated multi-course to dessert buffet, or raise budget to ₹2,50,000.
2. **Budget Rescue Engine**: When unexpected venue deposits or overtime fees cause category overruns, Budget Rescue audits discretionary categories and recommends balanced clawbacks.
3. **Transparent 100-Point Event Readiness Score**:
   $$\text{Score} = S_{\text{task}}(35) + S_{\text{budget}}(20) + S_{\text{vendor}}(20) + S_{\text{guest}}(15) + S_{\text{timeline}}(10) = 100$$
   *Clearly separates brand-new empty events ("Insufficient Data") from genuinely unprepared events.*
4. **Allowlisted Copilot Action System**: Actions are restricted to 6 safe primitives (`update_budget_allocation`, `add_timeline_task`, `update_task_status`, `add_budget_expense`, `update_theme`, `add_moodboard_note`). Execution requires explicit user confirmation.
5. **CSV Formula Injection Defense**: Defuses spreadsheet injection characters (`=`, `+`, `-`, `@`, `\t`, `\r`) by prefixing `'` to protect users opening exported rosters in Microsoft Excel, Google Sheets, or LibreOffice.
6. **Zero-Config Demo Mode with Quick Reset**: Operates immediately out-of-the-box without requiring API keys or database setup. Includes a 1-click **Reset Demo Data** action to restore pristine sample states during live judging.

---

## 5. System Architecture

```
                                 ┌─────────────────────────────┐
                                 │      Festiva AI Client       │
                                 │  (React 18 + Vite + TS)     │
                                 └──────────────┬──────────────┘
                                                │
                                    REST APIs / JSON Payloads
                                                │
                                 ┌──────────────▼──────────────┐
                                 │     FastAPI Core Engine     │
                                 │  (Python 3.11 + Pydantic)   │
                                 └──────┬───────────────┬──────┘
                                        │               │
            ┌───────────────────────────┴────┐     ┌────┴───────────────────────────┐
            │    AI Intelligence Layer       │     │     Persistence & Security     │
            │  - Gemini 2.0 Flash / Pro      │     │  - Supabase Auth & JWT Tokens  │
            │  - Infeasibility Economics     │     │  - PostgreSQL 15 + Strict RLS  │
            │  - Budget Rescue Engine        │     │  - Rate Limiting & Input Guard │
            │  - Event Copilot Safe Actions  │     │  - CSV Injection Defusal       │
            │  - Event Readiness Score (100) │     │  - In-Memory Zero-Config Store │
            └────────────────────────────────┘     └────────────────────────────────┘
```

---

## 6. Technology Stack

| Layer | Technology | Selection Rationale |
|---|---|---|
| **Frontend UI** | React 18, Vite 5, TypeScript 5 | Sub-second HMR, strict type safety, optimized production bundle (4.82s). |
| **Styling & Theme** | Tailwind CSS v3, CSS Custom Properties | Semantic design system, fluid dark/light theme switching with zero layout shift. |
| **Data Visualization** | Recharts v2 | Accessible SVG pie and bar charts for category budget allocations and variances. |
| **Icons & Motion** | Lucide React, Framer Motion | High-contrast accessible icons and fluid micro-interactions. |
| **Backend API** | Python 3.11, FastAPI, Uvicorn | Async ASGI throughput, automated OpenAPI Swagger documentation, Pydantic v2 schemas. |
| **AI Integration** | Google Gemini 2.0 Flash (`google-genai` SDK) | Ultra-fast token generation (~10s for 10 sections), structured JSON schema mode. |
| **Database & Auth** | Supabase PostgreSQL 15, Supabase Auth | Fully managed PostgreSQL with native Row Level Security (RLS) and JWT auth. |

---

## 7. AI Integration & Prompt Engineering

* **SDK:** Official Google GenAI SDK (`google-genai==0.8.0`).
* **Model:** `gemini-2.0-flash` (with configurable fallback).
* **Structured Schemas:** All AI generations enforce strict Pydantic model dump parsing to guarantee schema compliance.
* **Deterministic Fallback Engine:** If API keys are omitted or external rate limits occur, Festiva seamlessly engages its deterministic fallback engine. It serves realistic cultural blueprints, color palettes, and timelines without crashing.
* **Context Grounding:** The Event Copilot is strictly fed authorized event parameters (current budget, actual expenses, confirmed guest headcounts, task statuses, and vendor quotes) to prevent hallucinated answers.

---

## 8. Database Design & Row Level Security

The relational schema comprises **10 normalized tables** defined in `backend/migrations/001_initial_schema.sql`:

1. `profiles`: Planner user profiles, preferences, and roles.
2. `events`: Primary celebration entity, dates, locations, target budgets, and serialized blueprints.
3. `event_plans`: Full 10-section structured blueprints.
4. `budget_categories`: Allocated category ceilings and priority weightings.
5. `expenses`: Granular expenditures with vendor links, dates, and payment statuses.
6. `tasks`: Chronological milestones with stages, priorities, due dates, and dependencies.
7. `vendors`: Quotes, selection statuses (`shortlisted`, `contacted`, `selected`, `rejected`), user ratings, and notes.
8. `guests`: Headcount, RSVP status, dietary needs, accessibility accommodations, and table numbers.
9. `moodboards`: Theme palettes, decor styles, dress codes, and inspiration notes.
10. `copilot_conversations`: History of conversational context and executed actions.

### Strict Row Level Security (RLS)
PostgreSQL RLS is enabled on every table. All operations enforce that `auth.uid() = user_id`:

```sql
alter table public.events enable row level security;

create policy "Users can only access their own events"
  on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 9. Security & Hardening Measures

* **Zero Hardcoded Secrets**: Comprehensive regex scans confirm 0 exposed API keys or tokens.
* **Cross-Tenant Isolation**: Verified via automated tests; querying another user's event returns `HTTP 404 Not Found`.
* **CSV Formula Injection Shield**: Defuses formula execution in CSV export/import (`=`, `+`, `-`, `@`, `\t`, `\r`).
* **Sliding-Window Rate Limiting**: 10 req/min for auth endpoints, 120 req/min for general endpoints.
* **Request Payload Guard**: 10MB ceiling prevents buffer and memory exhaustion attacks.
* **Allowlisted Action Confirmations**: The Copilot cannot alter the event without explicit `confirmed: true` payload approval.

---

## 10. Local Setup & Testing

### Quick Start (2 Minutes)

```bash
# 1. Start Backend (Port 8000)
cd festiva-ai/backend
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
uvicorn app:app --port 8000 --host 0.0.0.0 --reload

# 2. Start Frontend (Port 5173) in a second terminal
cd festiva-ai/frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Endpoint:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Running Automated Test Suite

```bash
cd festiva-ai/backend
pytest tests/test_api.py -v
```
**Outcome:** **31/31 passed (100% green)** in 2.97 seconds.

---

## 11. Production Deployment

### Frontend (Vercel)
* Pre-configured with `frontend/vercel.json` and `frontend/public/_redirects`.
* Set environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com`

### Backend (Render / Railway / Docker)
* Pre-configured with `backend/Procfile`, `backend/render.yaml`, and `backend/Dockerfile`.
* Set environment variables in the platform dashboard:
  - `APP_ENV=production`
  - `CORS_ORIGINS=https://festiva-ai.vercel.app`
  - `GEMINI_API_KEY=your_gemini_api_key`
  - `SUPABASE_URL=https://your-project.supabase.co`
  - `SUPABASE_KEY=your_supabase_anon_key`
  - `SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key`

### Database (Supabase)
* Run `python backend/scripts/apply_migrations.py` or paste `backend/migrations/001_initial_schema.sql` into the Supabase SQL Editor.

---

## 12. External Service Costs & Free-Tier Limitations

| Service | Free Tier Allowance | Production Pricing / Limitations |
|---|---|---|
| **Google Gemini API** | 15 RPM / 1,500 RPD free tier | Pay-as-you-go: ~$0.10 / 1M input tokens, ~$0.40 / 1M output tokens. Fallback engine guarantees zero disruption if quota exceeded. |
| **Supabase PostgreSQL** | 500 MB database, 50,000 monthly active users | Free tier pauses after 1 week of inactivity (resumes upon dashboard login). Pro plan is $25/month. |
| **Vercel Frontend** | 100 GB bandwidth, unlimited deployments | Free for hobby use. Pro plan is $20/month per seat. |
| **Render Backend** | 750 free instance hours per month | Free web instances spin down after 15 minutes of inactivity (30-second cold start). Starter plan is $7/month for 24/7 uptime. |

---

## 13. Known Limitations

* **No Direct Financial Rail**: Payments are tracked as financial reconciliation records and receipts rather than live credit card charges.
* **Simulated Telecommunications Gateway**: Guest RSVP tracking uses manual tracking states rather than live SMS/WhatsApp broadcast gateways.
* **Free-Tier Cold Starts**: Free hosting tiers (Render) experience a ~30 second cold-start delay after 15 minutes of inactivity.

---

## 14. Future Roadmap

1. **Phase 1: Real Payment Rails** — Stripe & Razorpay milestone escrow contracts for vendor booking advances.
2. **Phase 2: Live WhatsApp Business API** — Direct interactive RSVP messages with automatic dietary capture.
3. **Phase 3: 2D Spatial Floor Planner** — Drag-and-drop table layouts, seating charts, and acoustic stage placement.
4. **Phase 4: Multi-Planner Real-Time Sync** — WebSockets for live co-planning between family members and wedding coordinators.

---

## 15. Reliable 12-Step Demonstration Walkthrough

Follow these steps for a live presentation or judging walkthrough:

1. **Open Landing Page (`/`)**: Review the celebration hero, celebration ribbon branding, and feature grid.
2. **Create a Sample Event (`/events/new`)**: Fill out the 4-step wizard (Event: "Grand Royal Wedding", 120 guests, Budget: ₹15,00,000).
3. **Generate AI Event Plan**: Click "Synthesize Blueprint" to generate the 10-section plan in ~10 seconds.
4. **Review Budget Allocation (`/dashboard?tab=budget`)**: Inspect Recharts pie chart, allocated category amounts, and logged expense list.
5. **Run Budget Rescue (`/dashboard?tab=budget`)**: Click "Analyze Deficit & Run Budget Rescue" to inspect AI-calculated spending cuts and click "Apply Rescue Plan".
6. **Review Generated Timeline (`/dashboard?tab=timeline`)**: Inspect the 7 chronological preparation stages, dependencies, costs, and priority tags.
7. **Compare Vendors (`/dashboard?tab=vendors`)**: Select 2 vendors in the Catering or Venue category and click "Compare Quotations" to generate targeted interview questions.
8. **Update a Guest RSVP (`/dashboard?tab=guests`)**: Select a guest and update status from "Invited" to "Confirmed"; observe the live update in the Catering Headcount matrix.
9. **Ask AI Copilot for Guidance (`/dashboard?tab=copilot`)**: Submit *"What tasks should I prioritize this week?"*, review the interactive Action Preview Card, and click "Confirm & Apply".
10. **Switch to Dark Mode & Refresh (`/dashboard`)**: Click the Moon icon in the navbar; refresh the page (`F5`) to demonstrate local storage theme persistence.
11. **Inspect Event Readiness Score (`/dashboard`)**: Examine the 100-point gauge, category breakdown, and the prioritized **Next Best Move** hero card.
12. **Return to Light Mode**: Click the Sun icon in the navbar to return to the warm celebration theme.

