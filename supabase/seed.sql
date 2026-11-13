-- ====================================================================
-- 3J INDUSTRIAL PARTS PLATFORM INITIAL SEED DATA
-- Populates default customers, machines, loaner fleet, and tech roster
-- ====================================================================

-- Loaner Assets (5 Units in Cuyahoga Hub)
INSERT INTO loaner_assets (id, serial_number, machine_type, model, status, current_location, active_workflow_step, pricing_mode, daily_or_incident_rate, customer_machine_bench_status)
VALUES
    ('LN-01', 'SN-LN-BUNN-01', 'Frozen Beverage / Slushie Machine', 'Bunn Ultra-2 High Capacity', 'Available', '3J Industrial Cuyahoga Hub (Bench Cleaned)', 1, 'Care Plan ($0 Waived)', 0.00, 'Ready for Next Cuyahoga Dispatch'),
    ('LN-02', 'SN-LN-BUNN-02', 'Frozen Beverage / Slushie Machine', 'Bunn Ultra-2 Twin Bowl', 'Reserved', 'Staged for Dispatch — Cleveland Venue', 2, 'Care Plan ($0 Waived)', 0.00, 'Staged for Swapping'),
    ('LN-03', 'SN-LN-TAY-03', 'Slush / Soft-Serve Machine', 'Taylor Commercial Frozen Drink Unit', 'Deployed', 'Tremont Taphouse & Kitchen', 3, 'Care Plan ($0 Waived)', 0.00, 'Customer Unit On Bench — Awaiting Seals'),
    ('LN-04', 'SN-LN-ELM-04', 'Multi-Bowl Granita Machine', 'Elmeco First Class Twin Bowl', 'In Sanitizing & Bench Prep', '3J Industrial Wash Bay', 4, 'Daily ($25–49/day)', 35.00, 'Sanitization In Progress'),
    ('LN-05', 'SN-LN-FROST-05', 'Frozen Beverage / Slushie Machine', 'Frosty Factory 117A Auto-Fill', 'Available', '3J Industrial Cuyahoga Hub', 1, 'Per Incident ($149–249/incident)', 199.00, 'Ready for Next Cuyahoga Dispatch')
ON CONFLICT (id) DO NOTHING;

-- Initial Customers
INSERT INTO customers (id, business_name, division, city, state, zip, county, care_plan_tier, monthly_mrr, is_contract_account, contact_placeholder, source_site)
VALUES
    ('CUST-D1-01', 'Cuyahoga Aluminum Die Casting LLC', 'Division 01 — Foundry', 'Cleveland', 'OH', '44105', 'Cuyahoga', 'Foundry PM Contract', 850.00, TRUE, 'Mark Vance (Foundry Manager)', 'foundry'),
    ('CUST-D1-02', 'Great Lakes Precision Alloys', 'Division 01 — Foundry', 'Brook Park', 'OH', '44142', 'Cuyahoga', 'Foundry PM Contract', 1200.00, TRUE, 'David Miller (Plant Operations)', 'foundry'),
    ('CUST-D2-01', 'Tremont Taphouse & Kitchen', 'Division 02 — 3JI-Repair', 'Cleveland', 'OH', '44113', 'Cuyahoga', 'Multi-Machine Location ($149–199/mo)', 189.00, TRUE, 'Sarah Jenkins (General Manager)', 'commercial'),
    ('CUST-D2-02', 'Ohio City Slush & Taco Bar', 'Division 02 — 3JI-Repair', 'Cleveland', 'OH', '44113', 'Cuyahoga', 'Single-Machine ($79–99/mo)', 89.00, TRUE, 'Alex Ramos (Owner)', 'commercial')
ON CONFLICT (id) DO NOTHING;

-- Initial Technicians
INSERT INTO techs (id, name, contact_info, cohort, level, can_claim_solo, graduated_signed_off_by_jason, division_01_foundry_track, epa_608_verified, epa_608_cert_number, coi_verified_1m, payout_tier)
VALUES
    ('TECH-JASON', 'Jason Allen (Founder / Master Tech)', '216-906-2252 / Jallen@3jindustrialparts.com', 'Founder', 'L3 — Master / Foundry', TRUE, TRUE, TRUE, TRUE, 'EPA-UNIV-JA906', TRUE, 'Hub (20% Take Rate)'),
    ('TECH-L2-01', 'Marcus Vance (Senior Refrigeration Tech)', '216-555-0144 / marcus.v@3jindustrial.com', 'Cohort 1', 'L2 — Sealed System / EPA 608', TRUE, TRUE, TRUE, TRUE, 'EPA-UNIV-MV441', TRUE, 'Network (15% Take Rate)'),
    ('TECH-L1-01', 'Tyler Brooks (L1 PM / Swap Tech)', '216-555-0182 / tyler.b@3jindustrial.com', 'Cohort 2', 'L1 — PM / Swap', TRUE, TRUE, FALSE, FALSE, NULL, TRUE, 'Network (15% Take Rate)'),
    ('TECH-TR-01', 'Jordan Hayes (3JI-Repair Trainee)', '216-555-0199 / jordan.h@3jindustrial.com', 'Cohort 3', '3JI-Repair Trainee', FALSE, FALSE, FALSE, FALSE, NULL, TRUE, 'Network (15% Take Rate)')
ON CONFLICT (id) DO NOTHING;
