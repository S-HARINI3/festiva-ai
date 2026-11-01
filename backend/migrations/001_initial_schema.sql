-- ==============================================================================
-- FESTIVA AI — PRODUCTION POSTGRESQL & SUPABASE DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: Core tables, foreign keys, UUID identifiers, triggers, indexes,
--              and PostgreSQL Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE: profiles
-- Tied directly to Supabase auth.users for authenticated identity.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'planner', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 3. TABLE: events
-- Master celebrations table owned by a specific user profile.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    location TEXT NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 50 CHECK (guest_count >= 1),
    budget_range TEXT DEFAULT 'moderate',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    total_budget NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_budget >= 0),
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('draft', 'planning', 'confirmed', 'completed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 4. TABLE: event_plans
-- Complete structured AI-generated celebration blueprint snapshots.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.event_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_adopted BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT uq_event_plans_event_version UNIQUE (event_id, version)
);

-- ==============================================================================
-- 5. TABLE: budget_categories
-- Normalized category breakdown for budget tracking and economic feasibility.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    allocated_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_amount >= 0),
    percentage NUMERIC(6, 2) DEFAULT 0.00,
    notes TEXT,
    color VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 6. TABLE: expenses
-- Logged expenditures, receipts, and vendor commitments.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.budget_categories(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'logged_expense' CHECK (status IN ('logged_expense', 'vendor_commitment', 'pending_approval', 'paid')),
    vendor_name TEXT,
    vendor_id UUID,
    notes TEXT,
    receipt_note TEXT,
    is_verified_payment BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 7. TABLE: tasks
-- Timeline tasks with chronological stages, priorities, and dependency graphs.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    stage TEXT NOT NULL DEFAULT 'initial_planning' CHECK (stage IN (
        'initial_planning', 'budget_and_venue', 'vendor_selection',
        'invitations', 'final_arrangements', 'event_day', 'post_event'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    category TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
    assignee TEXT,
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_cost NUMERIC(14, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 8. TABLE: vendors
-- Vendor matchboard records, quotations, and evaluation matrix.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'venue', 'caterer', 'photographer', 'decorator', 'florist',
        'dj_entertainment', 'makeup_artist', 'transportation', 'other'
    )),
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    quoted_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (quoted_price >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'unavailable', 'pending')),
    selection_status TEXT NOT NULL DEFAULT 'shortlisted' CHECK (selection_status IN ('shortlisted', 'contacted', 'selected', 'rejected')),
    rating NUMERIC(2, 1) DEFAULT 4.0 CHECK (rating >= 1.0 AND rating <= 5.0),
    notes TEXT,
    follow_up_date DATE,
    comparison_notes TEXT,
    quotation_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 9. TABLE: guests
-- Guest list, RSVP responses, dietary matrix, and accessibility requirements.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    group_household TEXT,
    invitation_status TEXT NOT NULL DEFAULT 'not_sent' CHECK (invitation_status IN ('not_sent', 'sent_manual', 'delivered_external', 'viewed')),
    invitation_delivery_note TEXT,
    rsvp_status TEXT NOT NULL DEFAULT 'invited' CHECK (rsvp_status IN ('not_invited', 'invited', 'attending', 'declined', 'tentative')),
    party_size INTEGER NOT NULL DEFAULT 1 CHECK (party_size >= 1),
    adults_count INTEGER NOT NULL DEFAULT 1 CHECK (adults_count >= 0),
    children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count >= 0),
    dietary_preference TEXT,
    accessibility_requests TEXT,
    table_assignment TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 10. TABLE: moodboards
-- Aesthetic visual studios, color palettes, and 10 styling dimensions.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.moodboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    theme TEXT,
    color_palette JSONB NOT NULL DEFAULT '[]'::jsonb,
    dress_code TEXT,
    invitation_direction TEXT,
    decoration_ideas JSONB NOT NULL DEFAULT '[]'::jsonb,
    venue_styling JSONB NOT NULL DEFAULT '[]'::jsonb,
    lighting JSONB NOT NULL DEFAULT '[]'::jsonb,
    floral_arrangements JSONB NOT NULL DEFAULT '[]'::jsonb,
    table_styling JSONB NOT NULL DEFAULT '[]'::jsonb,
    food_presentation JSONB NOT NULL DEFAULT '[]'::jsonb,
    inspiration_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 11. TABLE: copilot_conversations
-- Event-aware Copilot conversation sessions and context summaries.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    context_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 12. PERFORMANCE INDEXES
-- Optimize user filtering, foreign key joins, and date queries.
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_plans_event_id ON public.event_plans(event_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_event_id ON public.budget_categories(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON public.expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON public.tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_vendors_event_id ON public.vendors(event_id);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON public.guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON public.guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_moodboards_event_id ON public.moodboards(event_id);
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_event_id ON public.copilot_conversations(event_id);

-- ==============================================================================
-- 13. AUTOMATIC UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'profiles', 'events', 'event_plans', 'budget_categories',
        'expenses', 'tasks', 'vendors', 'guests', 'moodboards', 'copilot_conversations'
    ]
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;
            CREATE TRIGGER trg_set_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
        ', tbl, tbl);
    END LOOP;
END;
$$;

-- ==============================================================================
-- 14. AUTH USER PROFILE CREATION TRIGGER
-- When a user registers via Supabase Auth, automatically insert a public.profile.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user isolation: users can ONLY select, insert, update, or delete
-- records where user_id matches their authenticated auth.uid().
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Generic policy generator macro for user_id owned tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'events', 'event_plans', 'budget_categories',
        'expenses', 'tasks', 'vendors', 'guests', 'moodboards', 'copilot_conversations'
    ]
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "%s_owner_select" ON public.%I;
            CREATE POLICY "%s_owner_select"
                ON public.%I FOR SELECT
                USING (auth.uid() = user_id);

            DROP POLICY IF EXISTS "%s_owner_insert" ON public.%I;
            CREATE POLICY "%s_owner_insert"
                ON public.%I FOR INSERT
                WITH CHECK (auth.uid() = user_id);

            DROP POLICY IF EXISTS "%s_owner_update" ON public.%I;
            CREATE POLICY "%s_owner_update"
                ON public.%I FOR UPDATE
                USING (auth.uid() = user_id)
                WITH CHECK (auth.uid() = user_id);

            DROP POLICY IF EXISTS "%s_owner_delete" ON public.%I;
            CREATE POLICY "%s_owner_delete"
                ON public.%I FOR DELETE
                USING (auth.uid() = user_id);
        ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
    END LOOP;
END;
$$;

