# 🎉 Festiva AI — Autonomous Event Planning & Intelligence Platform

> **Big moments. Beautifully planned. Architected for production.**

**Festiva AI** is a full-stack, enterprise-grade AI event planning and celebration management SaaS engineered for **PromptWars Virtual Challenge 5: Celebration & Event Planner**.

It transforms high-level event concepts into structured, budget-conscious blueprints for weddings, milestone birthdays, anniversaries, corporate summits, college fests, and community galas — powered by **Google Gemini AI**, **FastAPI**, **React 18 + TypeScript**, and **Supabase PostgreSQL with Row Level Security (RLS)**.

---

## 🌟 Core Modules & Architecture

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

## ✨ Features by Module

### 1. 🤖 10-Section AI Planning Engine
Generates complete event blueprints in under 10 seconds:
- **Event Concept**: Name, tagline, vision narrative, guest experience focus.
- **Venue & Space**: Indoor/outdoor requirements, square footage, acoustics, layout recommendations.
- **Budget Blueprint**: Tiered allocation with reserve contingencies.
- **Feasibility & Economics**: Strict mathematical checks identifying unrealistic budget-to-guest ratios and proposing concrete, non-hallucinatory tradeoffs.
- **Chronological Timeline**: Multi-stage countdown from months before down to day-of run-of-show.
- **Vendor Checklist**: Recommended categories, target price windows, interview checklists.
- **Guest Experience**: Hospitality strategy, dietary accommodations, seating blueprints.
- **Theme & Styling**: Harmonic 5-color palettes, tactile decor direction, dress codes.
- **Contingency & Weather**: Plan B alternatives for outdoor events, supplier delays, and power backup.
- **AI Insider Tips**: Actionable advice tailored to the chosen event format.

### 2. 💰 Budget Studio & Budget Rescue Engine
- **Hierarchical Allocations**: Venues, catering, decor, photography, entertainment, logistics.
- **Expense Tracking**: Actual vs. budgeted variance analysis, payment milestones, receipt notes.
- **Interactive Visualizations**: Recharts pie breakdowns and progress meters.
- **Budget Rescue Engine**: When unexpected costs cause overruns, the AI analyzes low-priority categories and proposes real-world trim recommendations with 1-click safe adoption.

### 3. ⏱️ Timeline & Task Management
- **7 Preparation Stages**: Initial Planning, Budget & Venue, Vendor Selection, Invitations, Final Arrangements, Event Day, and Post-Event.
- **Rich Task Metadata**: Status (`not_started`, `in_progress`, `completed`, `blocked`), priority (`low`, `medium`, `high`, `urgent`), dependencies, estimated cost, and assignees.
- **Stage Regeneration**: Regenerate any specific stage's checklist using AI without disrupting other tasks.
- **Calendar & Chronological Views**: Deadline indicators, overdue alerts, and completion tracking.

### 4. 🤝 Vendor Matchboard & Quotation Comparison
- **9 Vendor Categories**: Venues, Caterers, Photographers, Decorators, Florists, DJs & Entertainment, Makeup Artists, Transportation, and Other Services.
- **Quotation Comparison**: Compare user-entered quotes side-by-side with transparent pricing differentials.
- **Targeted AI Vendor Assistance**: Generates tailored interview questions based strictly on user-supplied quotes without fabricating vendor records or fake reviews.
- **Secure CSV Export**: Formatted vendor lists with automatic spreadsheet formula injection defusal.

### 5. 👥 Guest & RSVP Manager
- **Headcount Intelligence**: Real-time breakdown of confirmed, invited, maybe, and declined RSVPs.
- **Dietary & Accessibility Matrix**: Auto-calculates vegetarian, vegan, Jain, halal, and allergen requirements for caterers, along with mobility/ramp requests.
- **Bulk CSV Import**: Import guest rosters from CSV files with duplicate detection, whitespace trimming, and error reporting.
- **CSV Formula Injection Shield**: Defuses formula trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with single-quote escaping to prevent spreadsheet exploitation.

### 6. 🎨 Moodboard Studio & Concept Comparison
- **Visual Moodboards**: Curated themes, CSS color palettes, decoration directives, floral styles, and dress code guides.
- **Multiple Moodboards per Event**: Create, duplicate, rename, edit, and reorder moodboard inspirations.
- **3-Way Concept Comparison**: Generates 3 contrasting aesthetic directions (e.g., Traditional Regal, Modern Minimalist, Bohemian Sunset) evaluating budget fit, complexity, advantages, and trade-offs.
- **Safe Concept Adoption**: Modifying an active blueprint with a new concept requires explicit two-step user confirmation.

### 7. 🧠 AI Event Copilot & Allowlisted Action System
- **Context-Aware Conversational Assistant**: Fully authorized access to the selected event's budget, tasks, guests, vendors, and styling.
- **Allowlisted Safe Action Cards**:
  1. `update_budget_allocation`
  2. `add_timeline_task`
  3. `update_task_status`
  4. `add_budget_expense`
  5. `update_theme`
  6. `add_moodboard_note`
- **Confirmation Safety**: Action proposals render interactive preview cards. Execution is blocked unless `confirmed: true` is explicitly provided.

### 8. 📊 Transparent Event Readiness Score & Next Best Move
- **Standardized 100-Point Formula**:
  $$\text{Score} = S_{\text{task}}(35) + S_{\text{budget}}(20) + S_{\text{vendor}}(20) + S_{\text{guest}}(15) + S_{\text{timeline}}(10) = 100$$
- **Objective Criteria**:
  - *Tasks (35 pts)*: Ratio of completed vs. open tasks; penalties for overdue or blocked tasks.
  - *Budget (20 pts)*: Presence of explicit budget, expense tracking coverage, and absence of overruns.
  - *Vendors (20 pts)*: Presence of confirmed selections in primary categories (venue, caterer, photo) rather than raw counts.
  - *Guests (15 pts)*: Invitations dispatched and confirmed RSVP percentage.
  - *Timeline (10 pts)*: Event date validity, days remaining, and milestone progression.
- **Insufficient Data Flag**: Brand-new empty events are clearly flagged as "Insufficient Data" rather than unfairly penalizing the user with a low readiness grade.
- **Next Best Move Engine**: P1–P8 decision tree identifying the single highest-impact action (e.g., "Confirm the Venue Before Finalizing Decoration Plans").

### 9. 🛡️ Security, Authentication & Persistence
- **Dual-Mode Operation**:
  - **Cloud Mode**: Supabase Auth (email/password, password recovery, session restoration) + PostgreSQL with strict Row Level Security (`auth.uid() = user_id`).
  - **Demo Mode**: Instant zero-config local exploration with pre-seeded rich events and isolated session storage.
- **Instant Demo Reset**: One-click reset restores sample wedding and summit data via `POST /api/events/reset-demo`.
- **Multi-Tenant Ownership Enforcement**: Every query and update validates `user_id` ownership on the backend.
- **Rate Limiting**: Sliding-window rate limiters protecting authentication (`/api/auth/*`) and general endpoints.
- **Payload Guard**: 10 MB strict request body size limit preventing memory exhaustion.
- **Zero Secrets in Code**: Zero API keys, database credentials, or tokens hardcoded in the source tree.

---

## 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS v3, Framer Motion, Recharts, Lucide React |
| **Backend** | Python 3.11, FastAPI, Uvicorn (ASGI), Pydantic v2, Pydantic Settings |
| **AI Layer** | Google Gemini 2.0 Flash (`google-genai` SDK) with deterministic fallback |
| **Database & Auth** | Supabase PostgreSQL 15 with Row Level Security (RLS), Supabase Auth |
| **Deployment** | Vercel (`vercel.json`), Render (`render.yaml`, `Procfile`), Docker (`Dockerfile`) |

---

## 🗂️ Project Directory Structure

```
festiva-ai/
├── README.md                           # Master documentation & guide
├── PRESENTATION.md                     # Comprehensive 14-section project presentation brief
├── .gitignore                          # Root Git exclusion rules
├── .env.example                        # Root environment variables template
│
├── backend/                            # FastAPI Python Backend
│   ├── .env.example                    # Backend environment template
│   ├── .gitignore                      # Backend-specific ignore rules
│   ├── Dockerfile                      # Non-root container for cloud hosting
│   ├── Procfile                        # Process file for Heroku / Render
│   ├── render.yaml                     # Render infrastructure blueprint
│   ├── requirements.txt                # Python dependencies
│   ├── main.py                         # ASGI entry point
│   ├── app/
│   │   ├── __init__.py                 # FastAPI app, CORS middleware & health probes
│   │   ├── api/
│   │   │   ├── auth.py                 # Registration, login, password recovery, OAuth
│   │   │   ├── events.py               # Blueprint generation, CRUD, budget, tasks, vendors, guests, copilot
│   │   │   └── health.py               # Detailed health check router
│   │   ├── core/
│   │   │   ├── auth.py                 # JWT validation & rate limiters
│   │   │   └── config.py               # Pydantic Settings environment parsing
│   │   ├── schemas/                    # Pydantic domain models
│   │   └── services/
│   │       ├── gemini_service.py       # Gemini 2.0 Flash integration & fallback engine
│   │       ├── readiness_service.py    # 100-point Event Readiness Score engine
│   │       └── supabase_service.py     # Supabase client & in-memory demo store
│   ├── migrations/
│   │   └── 001_initial_schema.sql      # PostgreSQL DDL migrations with RLS policies
│   ├── scripts/
│   │   └── apply_migrations.py         # Automated database migration runner
│   └── tests/
│       ├── __init__.py
│       └── test_api.py                 # 33 passing automated tests (100% green)
│
├── frontend/                           # React 18 + Vite + TypeScript Frontend
│   ├── .env.example                    # Frontend environment template
│   ├── .gitignore                      # Frontend-specific ignore rules
│   ├── package.json                    # Node dependencies & build scripts
│   ├── package-lock.json               # Lockfile
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── tailwind.config.js              # Theme design tokens & breakpoints
│   ├── vite.config.ts                  # Vite build configuration
│   ├── vercel.json                     # Vercel SPA routing rewrites
│   ├── public/
│   │   └── _redirects                  # Netlify / Cloudflare Pages SPA redirects
│   └── src/
│       ├── components/
│       │   ├── dashboard/              # Modular studio tabs (Overview, Budget, Timeline, etc.)
│       │   ├── layout/                 # Navbar, Sidebar, TopNav
│       │   └── ui/                     # Accessible Dialog, Toast, Button, Card
│       ├── contexts/                   # AuthContext, ThemeContext
│       ├── pages/                      # LandingPage, DashboardPage, PresentationPage, NewEventPage
│       └── services/                   # Axios API client, Supabase browser client
│
└── supabase/
    └── migrations/
        └── 20261030000000_festiva_schema.sql # Canonical Supabase migration
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11.0 or higher
- **Package Managers**: `npm` and `pip`
- **Git**: v2.30+ installed

---

### Step 1: Backend Setup & Launch

```bash
# 1. Navigate to backend directory
cd festiva-ai/backend

# 2. Create and activate Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. (Optional) Set up environment variables
copy .env.example .env
# If API keys are omitted, Festiva operates in zero-config Demo Mode!

# 5. Start the FastAPI server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

* **API Base URL**: `http://localhost:8000`
* **Swagger Documentation**: `http://localhost:8000/docs`
* **Health Check Probe**: `http://localhost:8000/api/health` or `http://localhost:8000/healthz`

---

### Step 2: Frontend Setup & Launch

```bash
# 1. Open a new terminal and navigate to frontend directory
cd festiva-ai/frontend

# 2. Install dependencies
npm install

# 3. (Optional) Set up environment variables
copy .env.example .env

# 4. Start the Vite development server
npm run dev -- --host 0.0.0.0 --port 5173
```

* **Frontend Web App**: `http://localhost:5173`
* **In-App Presentation Brief**: `http://localhost:5173/presentation`

---

## 🧪 Automated Testing & Verification

Festiva AI includes a comprehensive test suite verifying business logic, API validation, security defenses, and persistence.

### Running Backend Pytest Suite

```bash
cd festiva-ai/backend
pytest tests/test_api.py -v
```

**Test Coverage Summary (33/33 Passing — 100% Green)**:
- `test_root` & `test_health`: System status and configuration probe.
- `test_generate_event_demo`: 10-section AI generation in demo mode.
- `test_user_events_and_crud`: Full event persistence lifecycle.
- `test_ai_event_planning_engine_10_sections`: Comprehensive blueprint structure.
- `test_budget_feasibility_infeasible_edge_case`: Detection of impossible budgets and non-hallucinatory tradeoffs.
- `test_regenerate_section`: Section-level AI regeneration.
- `test_budget_expenses_crud`: Expense logging and variance metrics.
- `test_budget_rescue_engine`: Deficit detection and AI cut proposals.
- `test_apply_budget_rescue`: Safe atomic rescue plan adoption.
- `test_timeline_tasks_chronological_flow`: 7-stage chronological order & priority.
- `test_timeline_stage_regeneration`: Single-stage checklist re-synthesis.
- `test_vendor_matchboard_crud_and_filters`: Categorization, selection statuses, and queries.
- `test_vendor_comparison_and_ai_assistance`: Quotation analysis & tailored interview questions.
- `test_guest_manager_crud_and_filters`: Headcount, RSVP statuses, dietary preferences.
- `test_guest_bulk_import_and_catering_estimate`: CSV import, duplicate detection & catering requirements.
- `test_moodboard_crud_and_duplication`: Color palettes, styling cards, duplication.
- `test_concept_comparison_and_safe_adoption`: 3-way concept comparison and 2-step confirmed adoption.
- `test_auth_registration_and_login`: User registration, profile retrieval, login.
- `test_password_recovery`: Password reset endpoint and rate limit verification.
- `test_auth_providers`: OAuth provider availability detection.
- `test_authorization_boundaries_cross_user_isolation`: Strict cross-user data isolation.
- `test_payload_size_limit_rejection`: 10MB payload size limit protection.
- `test_copilot_event_aware_chat_and_action_safety`: Event-aware chat and two-step action confirmation.
- `test_data_persistence_lifecycle`: Full cross-module persistence verification.
- `test_event_readiness_score_comprehensive_calculation`: 100-point formula breakdown.
- `test_event_readiness_insufficient_data_distinction`: Distinction between new events and low readiness.
- `test_next_best_move_venue_prioritization`: P1 venue recommendation when venue unconfirmed.
- `test_csv_formula_injection_defusal`: Sanitization of `=`, `+`, `-`, `@`, `\t`, `\r` CSV injection payloads.
- `test_api_validation_rejections`: Pydantic 422/400 validation on invalid inputs.
- `test_database_fallback_resilience_and_auth_validation`: Graceful 404/401 handling on missing records and invalid credentials.
- `test_reset_demo_data_endpoint`: Instant demo store reset verification.
- `test_health_and_healthz_probes`: Multi-orchestrator health probe verification.

### Running Frontend Typecheck & Build

```bash
cd festiva-ai/frontend
npm run build
```
- Executes `tsc -b` (strict TypeScript check) and `vite build`.
- 0 TypeScript errors, 0 lint warnings.

---

## 🔐 Environment Variables Reference

### Root Environment Template (`.env.example`)
Placed in repository root for convenience:

```ini
# Backend Configuration
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
APP_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
JWT_SECRET=your_supabase_jwt_secret_here

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> **Security Rule**: Real `.env` files are ignored by `.gitignore`. Never commit actual API keys or secrets to GitHub.

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com/new).
2. Set Root Directory to `frontend`.
3. Set Environment Variable: `VITE_API_BASE_URL=https://your-backend.onrender.com`.
4. Deploy (managed via `frontend/vercel.json`).

### Backend (Render / Railway / Docker)
1. Create a new Web Service on [Render](https://dashboard.render.com).
2. Set Root Directory to `backend` (or use `backend/render.yaml`).
3. Set Environment Variables:
   - `APP_ENV=production`
   - `CORS_ORIGINS=https://your-frontend.vercel.app`
   - `GEMINI_API_KEY=your_gemini_api_key`
   - `SUPABASE_URL=https://your-project.supabase.co`
   - `SUPABASE_KEY=your_supabase_anon_key`
   - `SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key`
4. Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Database (Supabase PostgreSQL)
1. Open your [Supabase SQL Editor](https://supabase.com/dashboard).
2. Paste and run `backend/migrations/001_initial_schema.sql` (or run `python backend/scripts/apply_migrations.py`).
3. Creates all 10 tables, triggers, and Row Level Security policies.

---

## ♿ Accessibility & Responsiveness

- **Keyboard Navigation**: Full tab index traversal across all forms, dialogs, and navigation pills.
- **Accessible Dialogs**: Built with `role="dialog"`, `aria-modal="true"`, focus management, and `Escape` key listeners.
- **Non-Color Reliance**: High-contrast icons, descriptive badge labels, and percentages accompanying every status and readiness gauge.
- **Responsive Viewports**: Tested and fluid across **320px** (compact mobile), **375px** (standard mobile), **768px** (tablet), and **1440px** (desktop).

---

## 📄 License & Attribution

Built for the **PromptWars Virtual Challenge 5: Celebration & Event Planner**.
Licensed under the [MIT License](LICENSE).
