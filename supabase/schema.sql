-- ====================================================================
-- 3J INDUSTRIAL PARTS PLATFORM (APP & OS) DATABASE SCHEMA
-- Single System of Record for Foundry (Div 01) & 3JI-Repair Commercial (Div 02)
-- Architecture: Next.js + Supabase (PostgreSQL 17)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers Table (Division 01 Industrial & Division 02 Commercial)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    division VARCHAR(50) NOT NULL, -- 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair'
    city VARCHAR(100) NOT NULL,
    state VARCHAR(10) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    county VARCHAR(100) NOT NULL,
    locations JSONB DEFAULT '[]'::jsonb,
    care_plan_tier VARCHAR(100) DEFAULT 'None',
    monthly_mrr NUMERIC(10, 2) DEFAULT 0.00,
    is_contract_account BOOLEAN DEFAULT FALSE,
    contact_placeholder VARCHAR(255),
    contract_info JSONB DEFAULT '{}'::jsonb,
    source_site VARCHAR(50) DEFAULT 'platform', -- 'foundry' | 'commercial' | 'platform'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Machines & Systems
CREATE TABLE IF NOT EXISTS machines (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
    division VARCHAR(50) NOT NULL,
    platform_or_type VARCHAR(100) NOT NULL, -- 'FDU' | 'MTS 1500' | 'Frozen Beverage' | etc.
    make_model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    location_label VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Operational', -- 'Operational' | 'Down — Emergency' | 'Degraded' | 'On Bench'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Loaner Machine Assets (Cuyahoga Fleet)
CREATE TABLE IF NOT EXISTS loaner_assets (
    id VARCHAR(50) PRIMARY KEY, -- LN-01 .. LN-05
    serial_number VARCHAR(100) NOT NULL,
    machine_type VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'Available' | 'Reserved' | 'Deployed' | 'In Sanitizing & Bench Prep' | 'Out of Service'
    current_location VARCHAR(255) NOT NULL,
    assigned_job_id VARCHAR(50),
    active_workflow_step INT DEFAULT 1,
    pricing_mode VARCHAR(100) DEFAULT 'Care Plan ($0 Waived)',
    daily_or_incident_rate NUMERIC(10, 2) DEFAULT 0.00,
    customer_machine_bench_status TEXT,
    sanitation_checklist JSONB DEFAULT '{"wash_rinse_sanitize_completed": true, "sanitizer_ppm_verified": true, "food_contact_parts_inspected": true, "leak_and_freeze_test_passed": true}'::jsonb,
    sanitation_method VARCHAR(100) DEFAULT 'EPA / Ohio Food Code Sanitizing Wash',
    sanitation_tech_initials VARCHAR(10) DEFAULT 'JA',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sanitation Logs (Mandatory OAC 3717-1-08.1 compliance)
CREATE TABLE IF NOT EXISTS sanitation_logs (
    id VARCHAR(50) PRIMARY KEY,
    loaner_id VARCHAR(50) REFERENCES loaner_assets(id) ON DELETE CASCADE,
    date TIMESTAMPTZ DEFAULT NOW(),
    method VARCHAR(100) NOT NULL,
    sanitizer_ppm VARCHAR(50) NOT NULL,
    tech_initials VARCHAR(10) NOT NULL,
    oac_code VARCHAR(50) DEFAULT 'OAC 3717-1-08.1',
    checklist JSONB NOT NULL,
    verified_by_jason BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Jobs & Field Opportunities (Cross-Division Dispatch)
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(50) PRIMARY KEY,
    division VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) REFERENCES customers(id),
    business_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    county VARCHAR(100) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    equipment_category VARCHAR(100) NOT NULL,
    machine_type VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    reported_symptom TEXT NOT NULL,
    urgency VARCHAR(100) NOT NULL, -- 'Emergency Down — Loaner Needed' | 'Standard Repair' | 'Scheduled PM' | 'Ready for Return Swap'
    dot_color VARCHAR(20) DEFAULT 'blue', -- 'red' | 'amber' | 'blue'
    care_plan_status VARCHAR(100) DEFAULT 'None',
    loaner_needed BOOLEAN DEFAULT FALSE,
    assigned_loaner_id VARCHAR(50) REFERENCES loaner_assets(id),
    required_level VARCHAR(20) DEFAULT 'L1', -- 'L1' | 'L2' | 'L3'
    requires_epa_608 BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Unclaimed', -- 'Unclaimed' | 'Claimed' | 'In Progress' | 'Bench Repair' | 'Completed'
    claimed_by_tech_id VARCHAR(50),
    claimed_by_name VARCHAR(100),
    shadow_requested_by JSONB DEFAULT '[]'::jsonb,
    posted_hours_ago NUMERIC(6, 2) DEFAULT 0.0,
    promised_window VARCHAR(100),
    escalation_stage VARCHAR(100) DEFAULT 'Normal (<2h — Matched Techs Notified)',
    on_jason_tentative_schedule BOOLEAN DEFAULT FALSE,
    draft_customer_update TEXT,
    customer_update_approved BOOLEAN DEFAULT FALSE,
    estimated_labor_tier VARCHAR(100) DEFAULT 'Field ($139–149/hr)',
    estimated_hours NUMERIC(6, 2) DEFAULT 2.0,
    payout_mode VARCHAR(100) DEFAULT 'Network (15% Fee)',
    source_site VARCHAR(50) DEFAULT 'platform', -- 'foundry' | 'commercial' | 'platform'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quotes (<24-Hour SLA Estimate Desk)
CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR(50) PRIMARY KEY,
    division VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    business_name VARCHAR(255) NOT NULL,
    city_state VARCHAR(100) NOT NULL,
    system_or_machine VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    symptom_or_scope TEXT NOT NULL,
    care_plan_active BOOLEAN DEFAULT FALSE,
    contract_pricing BOOLEAN DEFAULT FALSE,
    include_diagnostic_99 BOOLEAN DEFAULT FALSE,
    credit_diagnostic_toward_repair BOOLEAN DEFAULT FALSE,
    labor_tier VARCHAR(100) NOT NULL,
    labor_rate NUMERIC(10, 2) NOT NULL,
    labor_hours NUMERIC(6, 2) NOT NULL,
    loaner_billing VARCHAR(100) DEFAULT 'None',
    loaner_days_or_incidents INT DEFAULT 0,
    loaner_rate NUMERIC(10, 2) DEFAULT 0.00,
    parts_lines JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10, 2) NOT NULL,
    sla_hours_remaining NUMERIC(6, 2) DEFAULT 24.0,
    turnaround_hours NUMERIC(6, 2) DEFAULT 0.5,
    status VARCHAR(50) DEFAULT 'Needs Jason Approval',
    source_site VARCHAR(50) DEFAULT 'platform', -- 'foundry' | 'commercial' | 'platform'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Bookings (Web Intake Inbound)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY,
    division VARCHAR(50) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(10) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    county VARCHAR(100) NOT NULL,
    cuyahoga_verified BOOLEAN DEFAULT TRUE,
    machine_or_system VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    symptom TEXT NOT NULL,
    preferred_window VARCHAR(100),
    care_plan_member BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Scheduled on Map',
    source_site VARCHAR(50) DEFAULT 'platform', -- 'foundry' | 'commercial' | 'platform'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Technicians & Vocational Pathway
CREATE TABLE IF NOT EXISTS techs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_info VARCHAR(255) NOT NULL,
    cohort VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL, -- '3JI-Repair Trainee' | 'L1 — PM / Swap' | 'L2 — Sealed System / EPA 608' | 'L3 — Master / Foundry'
    can_claim_solo BOOLEAN DEFAULT FALSE,
    graduated_signed_off_by_jason BOOLEAN DEFAULT FALSE,
    division_01_foundry_track BOOLEAN DEFAULT FALSE,
    epa_608_verified BOOLEAN DEFAULT FALSE,
    epa_608_cert_number VARCHAR(100),
    coi_verified_1m BOOLEAN DEFAULT TRUE,
    coi_expiry VARCHAR(50),
    skills_and_certs JSONB DEFAULT '[]'::jsonb,
    job_types JSONB DEFAULT '[]'::jsonb,
    shadow_swaps_completed INT DEFAULT 0,
    supervised_bench_hours INT DEFAULT 0,
    jobs_completed_30d INT DEFAULT 0,
    weekly_claim_rate_pct NUMERIC(5, 2) DEFAULT 0.0,
    customer_rating NUMERIC(3, 2) DEFAULT 5.0,
    callback_rate_pct NUMERIC(5, 2) DEFAULT 0.0,
    payout_tier VARCHAR(50) DEFAULT 'Network (15% Take Rate)',
    milestones JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Parts Catalog & Inventory
CREATE TABLE IF NOT EXISTS parts (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    division VARCHAR(50) NOT NULL,
    family VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    system_fit VARCHAR(100) NOT NULL,
    serial_fit_notes TEXT,
    unit_cost NUMERIC(10, 2) NOT NULL,
    list_price_35 NUMERIC(10, 2) NOT NULL,
    contract_price_25 NUMERIC(10, 2) NOT NULL,
    qty_on_hand INT DEFAULT 0,
    reorder_point INT DEFAULT 2,
    supplier VARCHAR(100) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_txns (
    id VARCHAR(50) PRIMARY KEY,
    part_id VARCHAR(50) REFERENCES parts(id),
    sku VARCHAR(50) NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    qty_delta INT NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Needs Jason Operational Queue
CREATE TABLE IF NOT EXISTS needs_jason (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    division VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    detail TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'STANDARD',
    status VARCHAR(50) DEFAULT 'Pending Jason',
    linked_entity_id VARCHAR(50),
    source_site VARCHAR(50) DEFAULT 'platform', -- 'foundry' | 'commercial' | 'platform'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Support Documentation Library (Technician Portal — empty at launch per spec)
CREATE TABLE IF NOT EXISTS support_docs (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    access_tier VARCHAR(50) DEFAULT 'All Techs',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_division ON jobs(division);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_source_site ON jobs(source_site);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_source_site ON quotes(source_site);
CREATE INDEX IF NOT EXISTS idx_bookings_source_site ON bookings(source_site);
CREATE INDEX IF NOT EXISTS idx_needs_jason_status ON needs_jason(status);
CREATE INDEX IF NOT EXISTS idx_needs_jason_source_site ON needs_jason(source_site);
