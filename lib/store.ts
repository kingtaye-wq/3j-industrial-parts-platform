import fs from 'fs';
import os from 'os';
import path from 'path';

export type TechLevel =
  | '3JI-Repair Trainee'
  | 'L1 — PM / Swap'
  | 'L2 — Sealed System / EPA 608'
  | 'L3 — Master / Foundry';

export type UserRole =
  | 'Admin (Jason / 3JI Staff)'
  | 'Tech L1 (Technician Portal)'
  | 'Tech L2 — EPA 608 (Technician Portal)'
  | 'Tech L3 — Master / Foundry (Technician Portal)'
  | '3JI-Repair Trainee'
  | 'Customer (Customer Portal)';

export const EQUIPMENT_SCOPE_3JI_REPAIR = [
  'Refrigerators',
  'Coolers',
  'Freezers',
  'Ice Machines',
  'HVAC',
  'Beverage Machines',
  'Frozen Beverage / Slushie Machines',
  'Walk-In Coolers & Freezers',
  'Reach-In & Undercounter Refrigeration',
  'Display Merchandiser Cases',
  'Ice Dispensers & Bins',
  'Soda Fountain & Carbonation Systems',
  'Draft Beer Systems & Glycol Chillers',
  'Bottle Coolers & Kegerators',
  'Juice Dispensers & Mixers',
] as const;

export type EquipmentCategory3JIRepair = (typeof EQUIPMENT_SCOPE_3JI_REPAIR)[number];

export interface CustomerContractInfo {
  plan_tier:
    | 'None'
    | 'Single-Machine ($79–99/mo)'
    | 'Multi-Machine Location ($149–199/mo)'
    | 'Foundry PM Contract';
  monthly_mrr: number;
  terms: string;
  auto_pm_schedule: string;
}

export interface CustomerRecord {
  id: string;
  business_name: string;
  division: 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair';
  city: string;
  state: string;
  zip: string;
  county: string;
  locations: string[];
  care_plan_tier:
    | 'None'
    | 'Single-Machine ($79–99/mo)'
    | 'Multi-Machine Location ($149–199/mo)'
    | 'Foundry PM Contract';
  monthly_mrr: number;
  is_contract_account: boolean;
  contact_Placeholder: string;
  contract_info: CustomerContractInfo;
}

export interface MachineRecord {
  id: string;
  customer_id: string;
  division: 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair';
  platform_or_type: string;
  make_model: string;
  serial_number: string;
  location_label: string;
  status: 'Operational' | 'Down — Emergency' | 'Degraded' | 'On Bench';
}

export interface SanitationChecklist {
  wash_rinse_sanitize_completed: boolean;
  sanitizer_ppm_verified: boolean;
  food_contact_parts_inspected: boolean;
  leak_and_freeze_test_passed: boolean;
}

export interface SanitationLog {
  id: string;
  loaner_id: string;
  date: string;
  method: string;
  sanitizer_ppm: string;
  tech_initials: string;
  oac_code: 'OAC 3717-1-08.1';
  checklist: SanitationChecklist;
  verified_by_jason: boolean;
}

export type LoanerStatus =
  | 'Available'
  | 'Reserved'
  | 'Deployed'
  | 'In Sanitizing & Bench Prep'
  | 'Out of Service';

export interface LoanerAsset {
  id: string; // LN-01 .. LN-05
  serial_number: string;
  machine_type: string;
  model: string;
  status: LoanerStatus;
  current_location: string;
  assigned_job_id: string | null;
  active_workflow_step: number; // 1 to 9
  pricing_mode: 'Care Plan ($0 Waived)' | 'Daily ($25–49/day)' | 'Per Incident ($149–249/incident)';
  daily_or_incident_rate: number;
  customer_machine_bench_status: string;
  sanitation_checklist: SanitationChecklist;
  sanitation_method: string;
  sanitation_tech_initials: string;
  sanitation_logs: SanitationLog[];
}

export type JobUrgency =
  | 'Emergency Down — Loaner Needed'
  | 'Standard Repair'
  | 'Scheduled PM'
  | 'Ready for Return Swap';

export type EscalationStage =
  | 'Normal (<2h — Matched Techs Notified)'
  | 'Widened (≥2h — All Graduated Techs Notified)'
  | 'Escalated to Jason (≥4h or 1h Emergency / 2h Before Window — On Jason Schedule)'
  | 'Fulfilled / Claimed';

export interface JobRecord {
  id: string;
  division: 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair';
  customer_id: string;
  business_name: string;
  city: string;
  county: string;
  zip: string;
  lat: number;
  lng: number;
  equipment_category: string;
  machine_type: string;
  serial_number: string;
  reported_symptom: string;
  urgency: JobUrgency;
  dot_color: 'red' | 'amber' | 'blue';
  care_plan_status:
    | 'None'
    | 'Single-Machine ($79–99/mo)'
    | 'Multi-Machine Location ($149–199/mo)'
    | 'Foundry PM Contract';
  loaner_needed: boolean;
  assigned_loaner_id: string | null;
  required_level: 'L1' | 'L2' | 'L3';
  requires_epa_608: boolean;
  status: 'Unclaimed' | 'Claimed' | 'In Progress' | 'Bench Repair' | 'Completed';
  claimed_by_tech_id: string | null;
  claimed_by_name: string | null;
  shadow_requested_by: string[];
  posted_hours_ago: number;
  promised_window: string;
  escalation_stage: EscalationStage;
  on_jason_tentative_schedule: boolean;
  draft_customer_update: string;
  customer_update_approved: boolean;
  estimated_labor_tier: 'Bench ($119–129/hr)' | 'Field ($139–149/hr)' | 'Refrigeration / Master ($169–179/hr)';
  estimated_hours: number;
  payout_mode: 'Network (15% Fee)' | 'Hub (20% Fee)';
}

export interface PartRecord {
  id: string;
  sku: string;
  division: 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair';
  family: string;
  name: string;
  system_fit:
    | 'FDU'
    | 'MTS 1500'
    | 'SMARTT'
    | 'ThermaTest NGIII 5000'
    | 'Frozen Beverage / Slushie'
    | 'Ice Machine / Cooler';
  serial_fit_notes: string;
  unit_cost: number;
  list_price_35: number; // auto = unit_cost * 1.35
  contract_price_25: number; // auto = unit_cost * 1.25
  qty_on_hand: number;
  reorder_point: number;
  supplier: string;
}

export interface InventoryTxn {
  id: string;
  part_id: string;
  sku: string;
  part_name: string;
  qty_delta: number;
  reference_type: 'Job' | 'Quote' | 'Restock';
  reference_id: string;
  timestamp: string;
}

export interface QuoteRecord {
  id: string;
  division: 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair';
  customer_id: string;
  business_name: string;
  city_state: string;
  system_or_machine: string;
  serial_number: string;
  symptom_or_scope: string;
  care_plan_active: boolean;
  contract_pricing: boolean;
  include_diagnostic_99: boolean;
  credit_diagnostic_toward_repair: boolean;
  labor_tier: 'Bench ($119–129/hr)' | 'Field ($139–149/hr)' | 'Refrigeration / Master ($169–179/hr)';
  labor_rate: number;
  labor_hours: number;
  loaner_billing: 'Waived — Care Plan ($0)' | 'Daily ($39/day)' | 'Incident Flat ($199/incident)' | 'None';
  loaner_days_or_incidents: number;
  loaner_rate: number;
  parts_lines: {
    part_id: string;
    sku: string;
    name: string;
    qty: number;
    unit_cost: number;
    markup_pct: 35 | 25;
    sell_price: number;
  }[];
  total_amount: number;
  sla_hours_remaining: number;
  turnaround_hours: number;
  status: 'Draft' | 'Needs Jason Approval' | 'Approved / Sent' | 'Accepted' | 'Declined';
  created_at: string;
}

export interface BookingRecord {
  id: string;
  division: 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair';
  business_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  cuyahoga_verified: boolean;
  machine_or_system: string;
  serial_number: string;
  symptom: string;
  preferred_window: string;
  care_plan_member: boolean;
  status: 'Scheduled on Map' | 'Blocked — Out of County' | 'Escalated to Needs Jason';
  created_at: string;
}

export interface CurriculumMilestones {
  shop_safety_and_tools: boolean;
  slushie_teardown_seal_brix: boolean;
  ohio_food_code_sanitizing: boolean;
  customer_comm_and_photos: boolean;
  five_shadowed_field_swaps: boolean;
}

export interface TechRecord {
  id: string;
  name: string;
  contact_info: string;
  cohort: string;
  level: TechLevel;
  can_claim_solo: boolean;
  graduated_signed_off_by_jason: boolean;
  division_01_foundry_track: boolean;
  epa_608_verified: boolean;
  epa_608_cert_number: string;
  coi_verified_1m: boolean;
  coi_expiry: string;
  skills_and_certs: string[];
  job_types: string[];
  shadow_swaps_completed: number;
  supervised_bench_hours: number;
  jobs_completed_30d: number;
  weekly_claim_rate_pct: number;
  customer_rating: number;
  callback_rate_pct: number;
  payout_tier: 'Network (15% Take Rate)' | 'Hub (20% Take Rate)';
  milestones: CurriculumMilestones;
}

export interface PayoutRecord {
  id: string;
  job_id: string;
  tech_id: string;
  tech_name: string;
  gross_labor_billable: number;
  tier: 'Network (15%)' | 'Hub (20%)';
  platform_take_pct: 15 | 20;
  platform_fee_amount: number;
  tech_net_payout: number;
  status: 'Batched Monthly' | 'Paid';
}

export interface InvoiceRecord {
  id: string;
  customer_name: string;
  division: 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair';
  amount: number;
  paid_amount: number;
  aging_bucket: 'Current (0–30d)' | '31–60d' | '61–90d';
  status: 'Paid' | 'Open AR';
}

export interface SupportDocRecord {
  id: string;
  title: string;
  equipment_type: string;
  file_name: string;
  file_notes: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface NeedsJasonItem {
  id: string;
  category:
    | 'Quote Approval'
    | '3JI-Repair Trainee Graduation Sign-Off'
    | 'Sanitizing Log Sign-Off'
    | 'Out-of-County Exception'
    | 'Low-Stock Critical Part'
    | 'Opportunity Escalated (Module 1 Retention Rule)'
    | 'Tech COI / Cert Expiry';
  division: 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair' | '3JI-Repair & Tech Network';
  title: string;
  detail: string;
  priority: 'CRITICAL' | 'HIGH' | 'STANDARD';
  status: 'Pending Jason' | 'Approved / Signed Off';
  linked_entity_id?: string;
  created_at: string;
}

export interface TargetRow {
  id: string;
  division: 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair' | '3JI-Repair & Tech Network';
  horizon: '30-Day' | '60-Day' | '90-Day';
  activity_metric_label: string;
  activity_current: number;
  activity_target: number;
  activity_unit: string;
  dollar_metric_label: string;
  dollar_current: number;
  dollar_target: number;
}

export interface PlatformState {
  last_updated: string;
  service_area_config: {
    active_launch_area: string;
    allowed_counties: string[];
    expansion_mode: 'Launch Area Only (Cuyahoga County, OH)' | 'Multi-County Expansion Preview';
    note: string;
  };
  customers: CustomerRecord[];
  machines: MachineRecord[];
  loaners: LoanerAsset[];
  jobs: JobRecord[];
  parts: PartRecord[];
  inventory_txns: InventoryTxn[];
  quotes: QuoteRecord[];
  bookings: BookingRecord[];
  techs: TechRecord[];
  payouts: PayoutRecord[];
  invoices: InvoiceRecord[];
  support_docs: SupportDocRecord[]; // Ships EMPTY per spec (Alex, 2026-11-02)
  needs_jason: NeedsJasonItem[];
  pipeline_funnel: {
    cuyahoga_bars_restaurants: {
      total_targets: 515;
      untouched: number;
      contacted: number;
      quoted_or_demo: number;
      active_customers: number;
    };
    industrial_targets: {
      total_targets: 501;
      enriched_core_foundry: 162;
      broader_metalworking_long_tail: 339;
      untouched: number;
      contacted: number;
      quoted: number;
      active_accounts: number;
    };
  };
  targets_90_day: TargetRow[];
}

export const CUYAHOGA_CITIES = [
  'Cleveland',
  'Lakewood',
  'Parma',
  'Westlake',
  'Rocky River',
  'Euclid',
  'Cleveland Heights',
  'Shaker Heights',
  'Strongsville',
  'Berea',
  'Brooklyn',
  'Garfield Heights',
  'Maple Heights',
  'North Olmsted',
  'Olmsted Falls',
  'Bay Village',
  'Fairview Park',
  'Beachwood',
  'Solon',
  'Independence',
  'Broadview Heights',
  'Brecksville',
  'Bedford',
  'Mayfield Heights',
  'South Euclid',
  'University Heights',
  'Middleburg Heights',
  'Brook Park',
];

export function isCuyahogaCityOrZip(city: string, zip: string, county?: string): boolean {
  const cleanCity = city.trim().toLowerCase();
  const cleanZip = zip.trim();
  const cleanCounty = (county || '').trim().toLowerCase();

  if (cleanCounty && cleanCounty !== 'cuyahoga' && cleanCounty !== 'cuyahoga county') {
    return false;
  }

  const cityMatch = CUYAHOGA_CITIES.some((c) => c.toLowerCase() === cleanCity);
  const zipMatch =
    /^441\d{2}$/.test(cleanZip) ||
    ['44017', '44022', '44040', '44070'].includes(cleanZip);

  return cityMatch && zipMatch;
}

const INITIAL_STATE: PlatformState = {
  last_updated: '2026-11-02T18:45:00Z',
  service_area_config: {
    active_launch_area: 'Cuyahoga County, OH',
    allowed_counties: ['Cuyahoga'],
    expansion_mode: 'Launch Area Only (Cuyahoga County, OH)',
    note: '3JI-Repair launch area is Cuyahoga County, OH. Configurable setting built for planned national expansion — never presented as nationwide at launch.',
  },
  customers: [
    {
      id: 'CUST-D2-01',
      business_name: '[Bar Account Placeholder #01 — Lakewood Patio & Tap]',
      division: 'Division 02 — 3JI-Repair',
      city: 'Lakewood',
      state: 'OH',
      zip: '44107',
      county: 'Cuyahoga',
      locations: [
        'Location 1 (Main Bar): 14800 Detroit Ave, Lakewood, OH 44107 [Placeholder]',
        'Location 2 (Rooftop Patio): 14802 Detroit Ave, Lakewood, OH 44107 [Placeholder]',
      ],
      care_plan_tier: 'Multi-Machine Location ($149–199/mo)',
      monthly_mrr: 179,
      is_contract_account: true,
      contact_Placeholder: 'Bar GM [Placeholder] · 216-555-0101 · ops@lakewoodpatio.example',
      contract_info: {
        plan_tier: 'Multi-Machine Location ($149–199/mo)',
        monthly_mrr: 179,
        terms: '12-Month 3JI-Repair Care Plan · $0 Loaner Machine Swaps · $99 Diagnostic Credited · +25% Contract Parts Markup',
        auto_pm_schedule: 'Quarterly Frozen-Machine OAC 3717-1-08.1 Sanitize + Bi-Annual Ice Machine PM',
      },
    },
    {
      id: 'CUST-D2-02',
      business_name: '[Restaurant Placeholder #02 — West 25th Cantina]',
      division: 'Division 02 — 3JI-Repair',
      city: 'Cleveland',
      state: 'OH',
      zip: '44113',
      county: 'Cuyahoga',
      locations: ['Main Dining & Service Bar: 1940 W 25th St, Cleveland, OH 44113 [Placeholder]'],
      care_plan_tier: 'Multi-Machine Location ($149–199/mo)',
      monthly_mrr: 199,
      is_contract_account: true,
      contact_Placeholder: 'Kitchen Ops [Placeholder] · 216-555-0102 · kitchen@w25cantina.example',
      contract_info: {
        plan_tier: 'Multi-Machine Location ($149–199/mo)',
        monthly_mrr: 199,
        terms: '12-Month 3JI-Repair Care Plan · Priority Same-Day Dispatch · $0 Loaner Machine Swaps',
        auto_pm_schedule: 'Quarterly Frozen-Beverage Sanitize + Bi-Annual Walk-In & Ice PM',
      },
    },
    {
      id: 'CUST-D2-03',
      business_name: '[Tavern Placeholder #03 — Parma Corner Grille]',
      division: 'Division 02 — 3JI-Repair',
      city: 'Parma',
      state: 'OH',
      zip: '44129',
      county: 'Cuyahoga',
      locations: ['5800 Ridge Rd, Parma, OH 44129 [Placeholder]'],
      care_plan_tier: 'Single-Machine ($79–99/mo)',
      monthly_mrr: 89,
      is_contract_account: true,
      contact_Placeholder: 'Owner [Placeholder] · 216-555-0103 · owner@parmagrille.example',
      contract_info: {
        plan_tier: 'Single-Machine ($79–99/mo)',
        monthly_mrr: 89,
        terms: 'Single-Machine 3JI-Repair Care Plan ($89/mo) · Free Loaner Swap on Covered Slushie Unit',
        auto_pm_schedule: 'Quarterly OAC 3717-1-08.1 Sanitize & Seal Check',
      },
    },
    {
      id: 'CUST-D2-04',
      business_name: '[Bar Placeholder #04 — Tremont Slush & Social]',
      division: 'Division 02 — 3JI-Repair',
      city: 'Cleveland',
      state: 'OH',
      zip: '44113',
      county: 'Cuyahoga',
      locations: ['2150 Professor Ave, Cleveland, OH 44113 [Placeholder]'],
      care_plan_tier: 'None',
      monthly_mrr: 0,
      is_contract_account: false,
      contact_Placeholder: 'Shift Lead [Placeholder] · 216-555-0104',
      contract_info: {
        plan_tier: 'None',
        monthly_mrr: 0,
        terms: 'On-Demand Commercial Repair · $99 Diagnostic (Credited Toward Repair) · +35% Standard Parts',
        auto_pm_schedule: 'None — Eligible for $149–199/mo Care Plan Upsell',
      },
    },
    {
      id: 'CUST-D1-01',
      business_name: '[Foundry Account Placeholder #01 — Midwest Aluminum Castings]',
      division: 'Division 01 — Foundry',
      city: 'Toledo',
      state: 'OH',
      zip: '43612',
      county: 'Lucas',
      locations: ['Melt Shop Plant #1: Toledo, OH 43612 [Placeholder]'],
      care_plan_tier: 'Foundry PM Contract',
      monthly_mrr: 0,
      is_contract_account: true,
      contact_Placeholder: 'Melt Shop Superintendent [Placeholder]',
      contract_info: {
        plan_tier: 'Foundry PM Contract',
        monthly_mrr: 0,
        terms: 'Division 01 Foundry Support Contract · +25% Contract Parts · Quarterly Health Checks',
        auto_pm_schedule: 'Quarterly SMARTT & FDU Calibration & Rotor Inspection',
      },
    },
  ],
  machines: [
    // Multiple assets for CUST-D2-01 (Lakewood Patio & Tap) covering Jason's 15-item equipment scope
    {
      id: 'MACH-201A',
      customer_id: 'CUST-D2-01',
      division: 'Division 02 — 3JI-Repair',
      platform_or_type: 'Frozen Beverage / Slushie Machines',
      make_model: 'Twin-Bowl Frozen Beverage Dispenser 2x12L',
      serial_number: 'SN-FB-2104',
      location_label: 'Main Bar Station 1',
      status: 'Down — Emergency',
    },
    {
      id: 'MACH-201B',
      customer_id: 'CUST-D2-01',
      division: 'Division 02 — 3JI-Repair',
      platform_or_type: 'Ice Machines',
      make_model: 'Modular Cube Ice Machine 500 lb/day + Bin',
      serial_number: 'SN-ICE-4410',
      location_label: 'Back Bar Ice Alcove',
      status: 'Operational',
    },
    {
      id: 'MACH-201C',
      customer_id: 'CUST-D2-01',
      division: 'Division 02 — 3JI-Repair',
      platform_or_type: 'Walk-In Coolers & Freezers',
      make_model: '10x12 Walk-In Keg & Prep Cooler (R-404A)',
      serial_number: 'SN-WIC-7701',
      location_label: 'Basement Commissary',
      status: 'Operational',
    },
    {
      id: 'MACH-201D',
      customer_id: 'CUST-D2-01',
      division: 'Division 02 — 3JI-Repair',
      platform_or_type: 'Draft Beer Systems & Glycol Chillers',
      make_model: '12-Tap Trunkline Glycol Chiller Power Pack',
      serial_number: 'SN-GLY-3099',
      location_label: 'Rooftop Patio Tap Tower',
      status: 'Operational',
    },
    // Multiple assets for CUST-D2-02 (West 25th Cantina)
    {
      id: 'MACH-202A',
      customer_id: 'CUST-D2-02',
      division: 'Division 02 — 3JI-Repair',
      platform_or_type: 'Frozen Beverage / Slushie Machines',
      make_model: 'Triple-Bowl Frozen Margarita / Slush Unit',
      serial_number: 'SN-FB-3391',
      location_label: 'Cantina Service Bar',
      status: 'On Bench',
    },
    {
      id: 'MACH-202B',
      customer_id: 'CUST-D2-02',
      division: 'Division 02 — 3JI-Repair',
      platform_or_type: 'Reach-In & Undercounter Refrigeration',
      make_model: '2-Door Stainless Reach-In Line Freezer',
      serial_number: 'SN-RIF-6120',
      location_label: 'Hot Line Station',
      status: 'Operational',
    },
    // Foundry assets
    {
      id: 'MACH-01',
      customer_id: 'CUST-D1-01',
      division: 'Division 01 — Foundry',
      platform_or_type: 'SMARTT',
      make_model: 'Foseco SMARTT Rotary Degassing Unit',
      serial_number: 'SN-SMARTT-4409A',
      location_label: 'Furnace Bay 2',
      status: 'Operational',
    },
  ],
  loaners: [
    {
      id: 'LN-01',
      serial_number: '3J-LOANER-FB101',
      machine_type: 'Twin-Bowl Frozen Beverage / Slushie Machine',
      model: '3J Fleet Twin-12L Heavy Duty',
      status: 'Available',
      current_location: '3J Cleveland Hub — Sanitizing & Bench Bay 1',
      assigned_job_id: null,
      active_workflow_step: 1,
      pricing_mode: 'Care Plan ($0 Waived)',
      daily_or_incident_rate: 0,
      customer_machine_bench_status: 'Standby for Dispatch',
      sanitation_checklist: {
        wash_rinse_sanitize_completed: true,
        sanitizer_ppm_verified: true,
        food_contact_parts_inspected: true,
        leak_and_freeze_test_passed: true,
      },
      sanitation_method: '3-Compartment Food-Contact Wash + 200 ppm Quaternary Ammonium Sanitize',
      sanitation_tech_initials: 'JA',
      sanitation_logs: [
        {
          id: 'SAN-101',
          loaner_id: 'LN-01',
          date: '2026-10-28',
          method: 'OAC 3717-1-08.1 Full Teardown + 200 ppm Quat Sanitize',
          sanitizer_ppm: '200 ppm Quat',
          tech_initials: 'JA',
          oac_code: 'OAC 3717-1-08.1',
          checklist: {
            wash_rinse_sanitize_completed: true,
            sanitizer_ppm_verified: true,
            food_contact_parts_inspected: true,
            leak_and_freeze_test_passed: true,
          },
          verified_by_jason: true,
        },
      ],
    },
    {
      id: 'LN-02',
      serial_number: '3J-LOANER-FB102',
      machine_type: 'Triple-Bowl Frozen Beverage / Slushie Machine',
      model: '3J Fleet Triple-12L High Output',
      status: 'Deployed',
      current_location: '[Restaurant Placeholder #02 — West 25th Cantina] (Cleveland, OH)',
      assigned_job_id: 'JOB-202',
      active_workflow_step: 5,
      pricing_mode: 'Care Plan ($0 Waived)',
      daily_or_incident_rate: 0,
      customer_machine_bench_status:
        'Step 5: Customer unit on 3J Shop Bench (Auger motor + seal kit replacement)',
      sanitation_checklist: {
        wash_rinse_sanitize_completed: false,
        sanitizer_ppm_verified: false,
        food_contact_parts_inspected: false,
        leak_and_freeze_test_passed: false,
      },
      sanitation_method: '',
      sanitation_tech_initials: '',
      sanitation_logs: [],
    },
    {
      id: 'LN-03',
      serial_number: '3J-LOANER-FB103',
      machine_type: 'Single-Bowl Frozen Beverage / Cocktail Freezer',
      model: '3J Fleet Single-15L Compact',
      status: 'In Sanitizing & Bench Prep',
      current_location: '3J Cleveland Hub — Sanitation Bay 2 (Returned from Parma)',
      assigned_job_id: 'JOB-204',
      active_workflow_step: 8,
      pricing_mode: 'Per Incident ($149–249/incident)',
      daily_or_incident_rate: 199,
      customer_machine_bench_status:
        'Step 8: Customer machine returned; Loaner awaiting OAC 3717-1-08.1 Sanitation Gate',
      sanitation_checklist: {
        wash_rinse_sanitize_completed: true,
        sanitizer_ppm_verified: true,
        food_contact_parts_inspected: false,
        leak_and_freeze_test_passed: false,
      },
      sanitation_method: 'OAC 3717-1-08.1 3-Step Wash/Rinse/Sanitize (200 ppm Quat)',
      sanitation_tech_initials: 'DK',
      sanitation_logs: [],
    },
    {
      id: 'LN-04',
      serial_number: '3J-LOANER-FB104',
      machine_type: 'Twin-Bowl Frozen Beverage / Slushie Machine',
      model: '3J Fleet Twin-12L Heavy Duty',
      status: 'Available',
      current_location: '3J Cleveland Hub — Ready Rack A',
      assigned_job_id: null,
      active_workflow_step: 1,
      pricing_mode: 'Daily ($25–49/day)',
      daily_or_incident_rate: 39,
      customer_machine_bench_status: 'Sanitized & Ready for Next Deployment',
      sanitation_checklist: {
        wash_rinse_sanitize_completed: true,
        sanitizer_ppm_verified: true,
        food_contact_parts_inspected: true,
        leak_and_freeze_test_passed: true,
      },
      sanitation_method: 'OAC 3717-1-08.1 Verified 200 ppm Quat',
      sanitation_tech_initials: 'JA',
      sanitation_logs: [],
    },
    {
      id: 'LN-05',
      serial_number: '3J-LOANER-JM105',
      machine_type: 'Commercial Refrigerated Juice / Post-Mix Dispenser',
      model: '3J Fleet Cold-Bev 3-Valve',
      status: 'Deployed',
      current_location: '[Venue Placeholder #05 — Rocky River Harbor Lounge] (Rocky River, OH)',
      assigned_job_id: 'JOB-205',
      active_workflow_step: 4,
      pricing_mode: 'Care Plan ($0 Waived)',
      daily_or_incident_rate: 0,
      customer_machine_bench_status:
        'Step 4: Loaner installed on bar counter; customer unit in transit to 3J Bench',
      sanitation_checklist: {
        wash_rinse_sanitize_completed: false,
        sanitizer_ppm_verified: false,
        food_contact_parts_inspected: false,
        leak_and_freeze_test_passed: false,
      },
      sanitation_method: '',
      sanitation_tech_initials: '',
      sanitation_logs: [],
    },
  ],
  jobs: [
    {
      id: 'JOB-201',
      division: 'Division 02 — 3JI-Repair',
      customer_id: 'CUST-D2-01',
      business_name: '[Bar Account Placeholder #01 — Lakewood Patio & Tap]',
      city: 'Lakewood',
      county: 'Cuyahoga',
      zip: '44107',
      lat: 41.4819,
      lng: -81.7982,
      equipment_category: 'Frozen Beverage / Slushie Machines',
      machine_type: 'Frozen Beverage / Slushie Machine (Twin-Bowl)',
      serial_number: 'SN-FB-2104',
      reported_symptom: 'Right barrel auger stalled, drive seal weeping syrup — Loaner Swap Requested',
      urgency: 'Emergency Down — Loaner Needed',
      dot_color: 'red',
      care_plan_status: 'Multi-Machine Location ($149–199/mo)',
      loaner_needed: true,
      assigned_loaner_id: 'LN-01',
      required_level: 'L1',
      requires_epa_608: false,
      status: 'Unclaimed',
      claimed_by_tech_id: null,
      claimed_by_name: null,
      shadow_requested_by: [],
      posted_hours_ago: 0.6,
      promised_window: 'Today 1:00 PM – 3:00 PM',
      escalation_stage: 'Normal (<2h — Matched Techs Notified)',
      on_jason_tentative_schedule: false,
      draft_customer_update:
        'DRAFT (Awaiting Jason Approval): 3JI-Repair has reserved Loaner LN-01 for your Lakewood location; tech arriving between 1:00 PM and 3:00 PM today.',
      customer_update_approved: false,
      estimated_labor_tier: 'Field ($139–149/hr)',
      estimated_hours: 2.5,
      payout_mode: 'Hub (20% Fee)',
    },
    {
      id: 'JOB-202',
      division: 'Division 02 — 3JI-Repair',
      customer_id: 'CUST-D2-02',
      business_name: '[Restaurant Placeholder #02 — West 25th Cantina]',
      city: 'Cleveland',
      county: 'Cuyahoga',
      zip: '44113',
      lat: 41.4846,
      lng: -81.7044,
      equipment_category: 'Frozen Beverage / Slushie Machines',
      machine_type: 'Frozen Beverage / Margarita Machine (Triple-Bowl)',
      serial_number: 'SN-FB-3391',
      reported_symptom: 'Loaner LN-02 deployed; customer unit on bench for auger gear motor & seal kit',
      urgency: 'Emergency Down — Loaner Needed',
      dot_color: 'red',
      care_plan_status: 'Multi-Machine Location ($149–199/mo)',
      loaner_needed: true,
      assigned_loaner_id: 'LN-02',
      required_level: 'L1',
      requires_epa_608: false,
      status: 'Bench Repair',
      claimed_by_tech_id: 'TECH-03',
      claimed_by_name: 'Devon Carter (L1)',
      shadow_requested_by: ['TECH-04'],
      posted_hours_ago: 18.0,
      promised_window: 'Loaner Installed — Bench Turnaround ≤5d',
      escalation_stage: 'Fulfilled / Claimed',
      on_jason_tentative_schedule: false,
      draft_customer_update: '',
      customer_update_approved: true,
      estimated_labor_tier: 'Bench ($119–129/hr)',
      estimated_hours: 3.0,
      payout_mode: 'Hub (20% Fee)',
    },
    {
      id: 'JOB-203',
      division: 'Division 02 — 3JI-Repair',
      customer_id: 'CUST-D2-04',
      business_name: '[Bar Placeholder #04 — Tremont Slush & Social]',
      city: 'Cleveland',
      county: 'Cuyahoga',
      zip: '44113',
      lat: 41.4729,
      lng: -81.6931,
      equipment_category: 'Walk-In Coolers & Freezers',
      machine_type: 'Under-Counter Commercial Ice Machine + Walk-In Cooler',
      serial_number: 'SN-ICE-8820',
      reported_symptom: 'High head pressure, sealed-system R-290/R-404A subcooling & compressor relay check',
      urgency: 'Standard Repair',
      dot_color: 'amber',
      care_plan_status: 'None',
      loaner_needed: false,
      assigned_loaner_id: null,
      required_level: 'L2',
      requires_epa_608: true,
      status: 'Unclaimed',
      claimed_by_tech_id: null,
      claimed_by_name: null,
      shadow_requested_by: [],
      posted_hours_ago: 4.5,
      promised_window: 'Today 4:00 PM – 6:00 PM (Escalated ≥4h)',
      escalation_stage:
        'Escalated to Jason (≥4h or 1h Emergency / 2h Before Window — On Jason Schedule)',
      on_jason_tentative_schedule: true,
      draft_customer_update:
        'DRAFT PROACTIVE UPDATE (Requires Jason Approval): Hi [Tremont Slush & Social], your Walk-In Cooler & Ice Machine service is confirmed for today at 4:30 PM with Master Tech Jason Allen.',
      customer_update_approved: false,
      estimated_labor_tier: 'Refrigeration / Master ($169–179/hr)',
      estimated_hours: 3.5,
      payout_mode: 'Network (15% Fee)',
    },
    {
      id: 'JOB-204',
      division: 'Division 02 — 3JI-Repair',
      customer_id: 'CUST-D2-03',
      business_name: '[Tavern Placeholder #03 — Parma Corner Grille]',
      city: 'Parma',
      county: 'Cuyahoga',
      zip: '44129',
      lat: 41.3912,
      lng: -81.7279,
      equipment_category: 'Beverage Machines',
      machine_type: 'Frozen Beverage / Slushie Machine (Single-Bowl)',
      serial_number: 'SN-FB-1180',
      reported_symptom: 'Quarterly Care Plan PM: OAC 3717-1-08.1 sanitize, brix calibration (13–15°), seal swap',
      urgency: 'Scheduled PM',
      dot_color: 'blue',
      care_plan_status: 'Single-Machine ($79–99/mo)',
      loaner_needed: false,
      assigned_loaner_id: null,
      required_level: 'L1',
      requires_epa_608: false,
      status: 'Unclaimed',
      claimed_by_tech_id: null,
      claimed_by_name: null,
      shadow_requested_by: [],
      posted_hours_ago: 2.2,
      promised_window: 'Tomorrow 10:00 AM – 12:00 PM',
      escalation_stage: 'Widened (≥2h — All Graduated Techs Notified)',
      on_jason_tentative_schedule: false,
      draft_customer_update: '',
      customer_update_approved: false,
      estimated_labor_tier: 'Field ($139–149/hr)',
      estimated_hours: 1.5,
      payout_mode: 'Network (15% Fee)',
    },
    {
      id: 'JOB-205',
      division: 'Division 02 — 3JI-Repair',
      customer_id: 'CUST-D2-01',
      business_name: '[Venue Placeholder #05 — Rocky River Harbor Lounge]',
      city: 'Rocky River',
      county: 'Cuyahoga',
      zip: '44116',
      lat: 41.4785,
      lng: -81.8389,
      equipment_category: 'Juice Dispensers & Mixers',
      machine_type: 'Commercial Juice & Frozen Cocktail System',
      serial_number: 'SN-JM-5502',
      reported_symptom: 'Repaired customer unit ready for return swap + retrieve Loaner LN-05',
      urgency: 'Ready for Return Swap',
      dot_color: 'blue',
      care_plan_status: 'Multi-Machine Location ($149–199/mo)',
      loaner_needed: true,
      assigned_loaner_id: 'LN-05',
      required_level: 'L3',
      requires_epa_608: true,
      status: 'Unclaimed',
      claimed_by_tech_id: null,
      claimed_by_name: null,
      shadow_requested_by: [],
      posted_hours_ago: 0.8,
      promised_window: 'Today 3:00 PM – 5:00 PM',
      escalation_stage: 'Normal (<2h — Matched Techs Notified)',
      on_jason_tentative_schedule: false,
      draft_customer_update: '',
      customer_update_approved: false,
      estimated_labor_tier: 'Refrigeration / Master ($169–179/hr)',
      estimated_hours: 2.0,
      payout_mode: 'Hub (20% Fee)',
    },
  ],
  parts: [
    {
      id: 'PART-D1-01',
      sku: '3J-FDU-XSR220',
      division: 'Division 01 — Foundry',
      family: 'Graphite Rotors & Shafts (XSR/FDR/XDR/FDDR)',
      name: 'FDU XSR High-Efficiency Graphite Degassing Rotor & Shaft Assembly',
      system_fit: 'FDU',
      serial_fit_notes: 'Serial-verified fit for Foseco FDU rotary degassers (XSR/FDR spindle flange)',
      unit_cost: 680,
      list_price_35: 918,
      contract_price_25: 850,
      qty_on_hand: 6,
      reorder_point: 3,
      supplier: 'Foseco / Vesuvius Spec Certified Supply',
    },
    {
      id: 'PART-D1-02',
      sku: '3J-MTS-FDR1500',
      division: 'Division 01 — Foundry',
      family: 'Graphite Rotors & Shafts (XSR/FDR/XDR/FDDR)',
      name: 'MTS 1500 FDDR Baffled Rotor + Anti-Oxidation Impregnated Shaft',
      system_fit: 'MTS 1500',
      serial_fit_notes: 'Matched to MTS 1500 melt treatment stations; requires serial check for shaft length',
      unit_cost: 840,
      list_price_35: 1134,
      contract_price_25: 1050,
      qty_on_hand: 2,
      reorder_point: 4,
      supplier: 'Foseco / Vesuvius Spec Certified Supply',
    },
    {
      id: 'PART-D1-03',
      sku: '3J-SMT-DIA400',
      division: 'Division 01 — Foundry',
      family: 'DIAMANT Ceramic Wear Parts',
      name: 'SMARTT DIAMANT Silicon Nitride Metering Tube & Nozzle Kit',
      system_fit: 'SMARTT',
      serial_fit_notes: 'Fits SMARTT automated rotary degassing & flux injection units',
      unit_cost: 520,
      list_price_35: 702,
      contract_price_25: 650,
      qty_on_hand: 5,
      reorder_point: 3,
      supplier: 'Foseco / Vesuvius Spec Certified Supply',
    },
    {
      id: 'PART-D1-04',
      sku: '3J-MTS-COV25',
      division: 'Division 01 — Foundry',
      family: 'Fluxes (COVERAL / SIMODAL / NUCLEANT)',
      name: 'COVERAL / SIMODAL / NUCLEANT Granular Melt Treatment Flux Drum',
      system_fit: 'MTS 1500',
      serial_fit_notes: 'Calibrated grain size for MTS 1500 & SMARTT rotary flux feeders',
      unit_cost: 320,
      list_price_35: 432,
      contract_price_25: 400,
      qty_on_hand: 11,
      reorder_point: 5,
      supplier: 'Foseco / Vesuvius Spec Certified Supply',
    },
    {
      id: 'PART-D1-05',
      sku: '3J-TT5-CUP100',
      division: 'Division 01 — Foundry',
      family: 'Thermal-Analysis Cups & Thermocouples',
      name: 'ThermaTest NGIII 5000 Type-K Quartz Thermal Analysis Cup Case + Lead Harness',
      system_fit: 'ThermaTest NGIII 5000',
      serial_fit_notes: 'Direct fit for ThermaTest NGIII 5000 stands; NIST-traceable calibration match',
      unit_cost: 440,
      list_price_35: 594,
      contract_price_25: 550,
      qty_on_hand: 2,
      reorder_point: 4,
      supplier: 'Foseco / Vesuvius Spec Certified Supply',
    },
    {
      id: 'PART-D2-01',
      sku: '3J-FB-SEAL12',
      division: 'Division 02 — 3JI-Repair',
      family: 'Seals, Gaskets & Bushings',
      name: 'Universal Twin/Triple Slushie Bowl Rear Seal, Bushing & Food-Grade O-Ring Kit',
      system_fit: 'Frozen Beverage / Slushie',
      serial_fit_notes: 'Fits Bunn Ultra-2, Elmeco, Ugolini, Donper & Vollrath 12L bowls',
      unit_cost: 40,
      list_price_35: 54,
      contract_price_25: 50,
      qty_on_hand: 18,
      reorder_point: 6,
      supplier: 'Cleveland Commercial Bev Supply',
    },
    {
      id: 'PART-D2-02',
      sku: '3J-FB-AUGMTR',
      division: 'Division 02 — 3JI-Repair',
      family: 'Auger Drive Motors & Gearboxes',
      name: 'Heavy-Duty 24V/115V Auger Gear Motor Assembly',
      system_fit: 'Frozen Beverage / Slushie',
      serial_fit_notes: 'High-torque replacement gearbox for twin/triple frozen drink dispensers',
      unit_cost: 160,
      list_price_35: 216,
      contract_price_25: 200,
      qty_on_hand: 3,
      reorder_point: 4,
      supplier: 'Cleveland Commercial Bev Supply',
    },
    {
      id: 'PART-D2-03',
      sku: '3J-ICE-COMP404',
      division: 'Division 02 — 3JI-Repair',
      family: 'Compressors, Relays & Control Boards',
      name: 'Commercial Refrigeration Compressor Start Relay + Main Control Board Kit',
      system_fit: 'Ice Machine / Cooler',
      serial_fit_notes: 'EPA 608 L2/L3 certified installation required',
      unit_cost: 220,
      list_price_35: 297,
      contract_price_25: 275,
      qty_on_hand: 7,
      reorder_point: 3,
      supplier: 'Great Lakes HVAC/R Supply',
    },
  ],
  inventory_txns: [
    {
      id: 'TXN-01',
      part_id: 'PART-D2-01',
      sku: '3J-FB-SEAL12',
      part_name: 'Universal Twin/Triple Slushie Bowl Rear Seal, Bushing & Food-Grade O-Ring Kit',
      qty_delta: -1,
      reference_type: 'Job',
      reference_id: 'JOB-202',
      timestamp: '2026-11-02T14:20:00Z',
    },
    {
      id: 'TXN-02',
      part_id: 'PART-D1-01',
      sku: '3J-FDU-XSR220',
      part_name: 'FDU XSR High-Efficiency Graphite Degassing Rotor & Shaft Assembly',
      qty_delta: -2,
      reference_type: 'Quote',
      reference_id: 'QT-1001',
      timestamp: '2026-11-02T15:10:00Z',
    },
  ],
  quotes: [
    {
      id: 'QT-1001',
      division: 'Division 01 — Foundry',
      customer_id: 'CUST-D1-01',
      business_name: '[Foundry Account Placeholder #01 — Midwest Aluminum Castings]',
      city_state: 'Toledo, OH (Nationwide Foundry Support)',
      system_or_machine: 'SMARTT & FDU Rotary Degassing Systems',
      serial_number: 'SN-SMARTT-4409A',
      symptom_or_scope: 'Serial-verified spare parts + annual melt-treatment health check & calibration',
      care_plan_active: true,
      contract_pricing: true,
      include_diagnostic_99: false,
      credit_diagnostic_toward_repair: false,
      labor_tier: 'Refrigeration / Master ($169–179/hr)',
      labor_rate: 175,
      labor_hours: 8,
      loaner_billing: 'None',
      loaner_days_or_incidents: 0,
      loaner_rate: 0,
      parts_lines: [
        {
          part_id: 'PART-D1-01',
          sku: '3J-FDU-XSR220',
          name: 'FDU XSR High-Efficiency Graphite Degassing Rotor & Shaft Assembly',
          qty: 2,
          unit_cost: 680,
          markup_pct: 25,
          sell_price: 850,
        },
        {
          part_id: 'PART-D1-03',
          sku: '3J-SMT-DIA400',
          name: 'SMARTT DIAMANT Silicon Nitride Metering Tube & Nozzle Kit',
          qty: 1,
          unit_cost: 520,
          markup_pct: 25,
          sell_price: 650,
        },
      ],
      total_amount: 3750,
      sla_hours_remaining: 6.5,
      turnaround_hours: 4.2,
      status: 'Needs Jason Approval',
      created_at: '2026-11-02T12:15:00Z',
    },
    {
      id: 'QT-1002',
      division: 'Division 02 — 3JI-Repair',
      customer_id: 'CUST-D2-01',
      business_name: '[Bar Account Placeholder #01 — Lakewood Patio & Tap]',
      city_state: 'Lakewood, OH (Cuyahoga County)',
      system_or_machine: 'Twin-Bowl Frozen Beverage / Slushie Machine',
      serial_number: 'SN-FB-2104',
      symptom_or_scope: 'Bench auger motor & rear seal rebuild + Loaner LN-01 Swap (Care Plan Waived)',
      care_plan_active: true,
      contract_pricing: false,
      include_diagnostic_99: true,
      credit_diagnostic_toward_repair: true,
      labor_tier: 'Bench ($119–129/hr)',
      labor_rate: 125,
      labor_hours: 3,
      loaner_billing: 'Waived — Care Plan ($0)',
      loaner_days_or_incidents: 4,
      loaner_rate: 0,
      parts_lines: [
        {
          part_id: 'PART-D2-02',
          sku: '3J-FB-AUGMTR',
          name: 'Heavy-Duty 24V/115V Auger Gear Motor Assembly',
          qty: 1,
          unit_cost: 160,
          markup_pct: 35,
          sell_price: 216,
        },
        {
          part_id: 'PART-D2-01',
          sku: '3J-FB-SEAL12',
          name: 'Universal Twin/Triple Slushie Bowl Rear Seal, Bushing & Food-Grade O-Ring Kit',
          qty: 1,
          unit_cost: 40,
          markup_pct: 35,
          sell_price: 54,
        },
      ],
      total_amount: 645,
      sla_hours_remaining: 14.2,
      turnaround_hours: 2.8,
      status: 'Approved / Sent',
      created_at: '2026-11-02T10:30:00Z',
    },
    {
      id: 'QT-1003',
      division: 'Division 01 — Foundry',
      customer_id: 'CUST-D1-01',
      business_name: '[Foundry Account Placeholder #02 — Great Lakes Die Cast]',
      city_state: 'Fort Wayne, IN (Nationwide Foundry Support)',
      system_or_machine: 'MTS 1500 & ThermaTest NGIII 5000',
      serial_number: 'SN-MTS1500-8821B',
      symptom_or_scope: 'MTS 1500 FDDR Rotor + COVERAL flux + ThermaTest NGIII 5000 quartz cups',
      care_plan_active: false,
      contract_pricing: false,
      include_diagnostic_99: false,
      credit_diagnostic_toward_repair: false,
      labor_tier: 'Field ($139–149/hr)',
      labor_rate: 145,
      labor_hours: 6,
      loaner_billing: 'None',
      loaner_days_or_incidents: 0,
      loaner_rate: 0,
      parts_lines: [
        {
          part_id: 'PART-D1-02',
          sku: '3J-MTS-FDR1500',
          name: 'MTS 1500 FDDR Baffled Rotor + Anti-Oxidation Impregnated Shaft',
          qty: 1,
          unit_cost: 840,
          markup_pct: 35,
          sell_price: 1134,
        },
        {
          part_id: 'PART-D1-05',
          sku: '3J-TT5-CUP100',
          name: 'ThermaTest NGIII 5000 Type-K Quartz Thermal Analysis Cup Case + Lead Harness',
          qty: 1,
          unit_cost: 440,
          markup_pct: 35,
          sell_price: 594,
        },
      ],
      total_amount: 2598,
      sla_hours_remaining: 18.0,
      turnaround_hours: 5.1,
      status: 'Accepted',
      created_at: '2026-11-01T16:00:00Z',
    },
  ],
  bookings: [
    {
      id: 'BK-301',
      division: 'Division 02 — 3JI-Repair',
      business_name: '[Bar Account Placeholder #01 — Lakewood Patio & Tap]',
      address: '14800 Detroit Ave [Placeholder]',
      city: 'Lakewood',
      state: 'OH',
      zip: '44107',
      county: 'Cuyahoga',
      cuyahoga_verified: true,
      machine_or_system: 'Frozen Beverage / Slushie Machines',
      serial_number: 'SN-FB-2104',
      symptom: 'Right bowl not freezing, auger seal leaking — Priority Care Plan Swap',
      preferred_window: 'Today 1:00 PM – 3:00 PM (Priority Care Plan)',
      care_plan_member: true,
      status: 'Scheduled on Map',
      created_at: '2026-11-02T11:00:00Z',
    },
    {
      id: 'BK-302',
      division: 'Division 01 — Foundry',
      business_name: '[Foundry Account Placeholder #03 — Valley Precision Alloy]',
      address: '2400 Industrial Pkwy [Placeholder]',
      city: 'Pittsburgh',
      state: 'PA',
      zip: '15222',
      county: 'Allegheny',
      cuyahoga_verified: false,
      machine_or_system: 'ThermaTest NGIII 5000 & SMARTT Degasser',
      serial_number: 'SN-TT5000-1904C',
      symptom: 'Quarterly thermal analysis calibration & rotor shaft inspection (Nationwide Foundry Support)',
      preferred_window: 'Next Tuesday 8:00 AM EST',
      care_plan_member: true,
      status: 'Scheduled on Map',
      created_at: '2026-11-02T09:15:00Z',
    },
  ],
  techs: [
    {
      id: 'TECH-01',
      name: 'Marcus Vance (L3 Master / Foundry)',
      contact_info: '216-555-0201 · mvance@3jirepair.example · Cuyahoga & Foundry Master',
      cohort: 'Cohort 01 — Inaugural Trade Track',
      level: 'L3 — Master / Foundry',
      can_claim_solo: true,
      graduated_signed_off_by_jason: true,
      division_01_foundry_track: true,
      epa_608_verified: true,
      epa_608_cert_number: 'EPA-608-UNIV-99281',
      coi_verified_1m: true,
      coi_expiry: '2027-06-30',
      skills_and_certs: [
        'EPA 608 Universal Certified',
        'COI ≥ $1M Verified (Exp 2027-06-30)',
        'OAC 3717-1-08.1 Sanitation Certified',
        'Division 01 Foundry Mentorship (FDU / MTS 1500 / SMARTT / ThermaTest)',
      ],
      job_types: [...EQUIPMENT_SCOPE_3JI_REPAIR],
      shadow_swaps_completed: 12,
      supervised_bench_hours: 140,
      jobs_completed_30d: 19,
      weekly_claim_rate_pct: 96,
      customer_rating: 4.9,
      callback_rate_pct: 1.8,
      payout_tier: 'Hub (20% Take Rate)',
      milestones: {
        shop_safety_and_tools: true,
        slushie_teardown_seal_brix: true,
        ohio_food_code_sanitizing: true,
        customer_comm_and_photos: true,
        five_shadowed_field_swaps: true,
      },
    },
    {
      id: 'TECH-02',
      name: 'Elena Rostova (L2 Sealed System / EPA 608)',
      contact_info: '216-555-0202 · erostova@3jirepair.example · Cuyahoga Refrigeration Specialist',
      cohort: 'Cohort 01 — Inaugural Trade Track',
      level: 'L2 — Sealed System / EPA 608',
      can_claim_solo: true,
      graduated_signed_off_by_jason: true,
      division_01_foundry_track: true,
      epa_608_verified: true,
      epa_608_cert_number: 'EPA-608-TYPE2-77410',
      coi_verified_1m: true,
      coi_expiry: '2027-04-15',
      skills_and_certs: [
        'EPA 608 Type II & Universal Sealed System',
        'COI ≥ $1M Verified (Exp 2027-04-15)',
        'OAC 3717-1-08.1 Sanitation Certified',
        'R-290 / R-404A Subcooling & Compressor Diagnostics',
      ],
      job_types: [
        'Refrigerators',
        'Coolers',
        'Freezers',
        'Ice Machines',
        'HVAC',
        'Walk-In Coolers & Freezers',
        'Reach-In & Undercounter Refrigeration',
        'Display Merchandiser Cases',
        'Draft Beer Systems & Glycol Chillers',
        'Bottle Coolers & Kegerators',
        'Frozen Beverage / Slushie Machines',
        'Beverage Machines',
      ],
      shadow_swaps_completed: 8,
      supervised_bench_hours: 95,
      jobs_completed_30d: 15,
      weekly_claim_rate_pct: 91,
      customer_rating: 4.8,
      callback_rate_pct: 2.4,
      payout_tier: 'Network (15% Take Rate)',
      milestones: {
        shop_safety_and_tools: true,
        slushie_teardown_seal_brix: true,
        ohio_food_code_sanitizing: true,
        customer_comm_and_photos: true,
        five_shadowed_field_swaps: true,
      },
    },
    {
      id: 'TECH-03',
      name: 'Devon Carter (L1 PM / Swap)',
      contact_info: '216-555-0203 · dcarter@3jirepair.example · Cuyahoga Beverage & Loaner Tech',
      cohort: 'Cohort 02 — Cuyahoga Fall Cohort',
      level: 'L1 — PM / Swap',
      can_claim_solo: true,
      graduated_signed_off_by_jason: true,
      division_01_foundry_track: false,
      epa_608_verified: false,
      epa_608_cert_number: 'Pending EPA 608 Exam',
      coi_verified_1m: true,
      coi_expiry: '2027-03-01',
      skills_and_certs: [
        '3JI-Repair L1 Graduated (Signed Off by Jason Allen)',
        'OAC 3717-1-08.1 Food-Code Sanitation Certified',
        'COI ≥ $1M Verified (Exp 2027-03-01)',
        'Brix Calibration (13–15°) & Auger/Seal Rebuild',
      ],
      job_types: [
        'Beverage Machines',
        'Frozen Beverage / Slushie Machines',
        'Ice Dispensers & Bins',
        'Soda Fountain & Carbonation Systems',
        'Juice Dispensers & Mixers',
      ],
      shadow_swaps_completed: 6,
      supervised_bench_hours: 64,
      jobs_completed_30d: 11,
      weekly_claim_rate_pct: 88,
      customer_rating: 4.8,
      callback_rate_pct: 3.1,
      payout_tier: 'Hub (20% Take Rate)',
      milestones: {
        shop_safety_and_tools: true,
        slushie_teardown_seal_brix: true,
        ohio_food_code_sanitizing: true,
        customer_comm_and_photos: true,
        five_shadowed_field_swaps: true,
      },
    },
    {
      id: 'TECH-04',
      name: 'Jordan Morales (3JI-Repair Trainee — Ready for Graduation)',
      contact_info: '216-555-0204 · jmorales@3jirepair.example · Cohort 02 Trainee',
      cohort: 'Cohort 02 — Cuyahoga Fall Cohort',
      level: '3JI-Repair Trainee',
      can_claim_solo: false,
      graduated_signed_off_by_jason: false,
      division_01_foundry_track: false,
      epa_608_verified: false,
      epa_608_cert_number: 'In Curriculum Study',
      coi_verified_1m: true,
      coi_expiry: '2027-08-01',
      skills_and_certs: [
        '5/5 Shadowed Field Swaps Completed',
        'OAC 3717-1-08.1 Sanitation Procedure Passed',
        'Awaiting Jason Allen In-App Graduation Sign-Off',
      ],
      job_types: [
        'Frozen Beverage / Slushie Machines',
        'Beverage Machines',
        'Juice Dispensers & Mixers',
      ],
      shadow_swaps_completed: 5,
      supervised_bench_hours: 48,
      jobs_completed_30d: 0,
      weekly_claim_rate_pct: 0,
      customer_rating: 4.9,
      callback_rate_pct: 0,
      payout_tier: 'Hub (20% Take Rate)',
      milestones: {
        shop_safety_and_tools: true,
        slushie_teardown_seal_brix: true,
        ohio_food_code_sanitizing: true,
        customer_comm_and_photos: true,
        five_shadowed_field_swaps: true,
      },
    },
    {
      id: 'TECH-05',
      name: 'Tariq Brooks (3JI-Repair Trainee — Bench & Shadow Track)',
      contact_info: '216-555-0205 · tbrooks@3jirepair.example · Cohort 02 Trainee',
      cohort: 'Cohort 02 — Cuyahoga Fall Cohort',
      level: '3JI-Repair Trainee',
      can_claim_solo: false,
      graduated_signed_off_by_jason: false,
      division_01_foundry_track: false,
      epa_608_verified: false,
      epa_608_cert_number: 'In Curriculum Study',
      coi_verified_1m: true,
      coi_expiry: '2027-08-01',
      skills_and_certs: [
        '3/5 Shadowed Field Swaps Completed',
        'Bench Teardown & Seal Replacement Active',
      ],
      job_types: ['Frozen Beverage / Slushie Machines', 'Beverage Machines'],
      shadow_swaps_completed: 3,
      supervised_bench_hours: 32,
      jobs_completed_30d: 0,
      weekly_claim_rate_pct: 0,
      customer_rating: 4.7,
      callback_rate_pct: 0,
      payout_tier: 'Hub (20% Take Rate)',
      milestones: {
        shop_safety_and_tools: true,
        slushie_teardown_seal_brix: true,
        ohio_food_code_sanitizing: true,
        customer_comm_and_photos: false,
        five_shadowed_field_swaps: false,
      },
    },
  ],
  payouts: [
    {
      id: 'PAY-501',
      job_id: 'JOB-194',
      tech_id: 'TECH-02',
      tech_name: 'Elena Rostova (L2)',
      gross_labor_billable: 520,
      tier: 'Network (15%)',
      platform_take_pct: 15,
      platform_fee_amount: 78,
      tech_net_payout: 442,
      status: 'Batched Monthly',
    },
    {
      id: 'PAY-502',
      job_id: 'JOB-198',
      tech_id: 'TECH-01',
      tech_name: 'Marcus Vance (L3)',
      gross_labor_billable: 680,
      tier: 'Hub (20%)',
      platform_take_pct: 20,
      platform_fee_amount: 136,
      tech_net_payout: 544,
      status: 'Batched Monthly',
    },
    {
      id: 'PAY-503',
      job_id: 'JOB-200',
      tech_id: 'TECH-03',
      tech_name: 'Devon Carter (L1)',
      gross_labor_billable: 375,
      tier: 'Hub (20%)',
      platform_take_pct: 20,
      platform_fee_amount: 75,
      tech_net_payout: 300,
      status: 'Batched Monthly',
    },
  ],
  invoices: [
    {
      id: 'INV-9001',
      customer_name: '[Foundry Account Placeholder #01 — Midwest Aluminum Castings]',
      division: 'Division 01 — Foundry',
      amount: 14850,
      paid_amount: 14850,
      aging_bucket: 'Current (0–30d)',
      status: 'Paid',
    },
    {
      id: 'INV-9002',
      customer_name: '[Foundry Account Placeholder #03 — Valley Precision Alloy]',
      division: 'Division 01 — Foundry',
      amount: 8420,
      paid_amount: 0,
      aging_bucket: 'Current (0–30d)',
      status: 'Open AR',
    },
    {
      id: 'INV-9003',
      customer_name: '[Foundry Account Placeholder #02 — Great Lakes Die Cast]',
      division: 'Division 01 — Foundry',
      amount: 3910,
      paid_amount: 0,
      aging_bucket: '31–60d',
      status: 'Open AR',
    },
    {
      id: 'INV-9004',
      customer_name: '3JI-Repair Cuyahoga Care Plans & Bench Repairs (14 Active Accounts)',
      division: 'Division 02 — 3JI-Repair',
      amount: 9640,
      paid_amount: 9640,
      aging_bucket: 'Current (0–30d)',
      status: 'Paid',
    },
    {
      id: 'INV-9005',
      customer_name: '[Bar Placeholder #04 — Tremont Slush & Social]',
      division: 'Division 02 — 3JI-Repair',
      amount: 685,
      paid_amount: 0,
      aging_bucket: '31–60d',
      status: 'Open AR',
    },
  ],
  // Support Docs library ships EMPTY per spec (Alex, 2026-11-02)
  support_docs: [],
  needs_jason: [
    {
      id: 'NJ-01',
      category: 'Quote Approval',
      division: 'Division 01 — Foundry',
      title: 'Approve Quote QT-1001 ($3,750) — SMARTT & FDU Spare Parts + Health Check',
      detail:
        'Draft quote for [Foundry Account Placeholder #01]. 6.5h remaining on <24h estimate promise. Nothing sends without Jason approval.',
      priority: 'CRITICAL',
      status: 'Pending Jason',
      linked_entity_id: 'QT-1001',
      created_at: '2026-11-02T12:20:00Z',
    },
    {
      id: 'NJ-02',
      category: '3JI-Repair Trainee Graduation Sign-Off',
      division: '3JI-Repair & Tech Network',
      title: 'Graduation Sign-Off: Jordan Morales (Cohort 02 -> L1 PM / Swap)',
      detail:
        'Completed all 5 curriculum milestones + 5 shadowed field swaps + OAC 3717-1-08.1 sanitation sign-off. Sign-off unlocks solo L1 job claiming in 3JI-Repair.',
      priority: 'HIGH',
      status: 'Pending Jason',
      linked_entity_id: 'TECH-04',
      created_at: '2026-11-02T11:45:00Z',
    },
    {
      id: 'NJ-03',
      category: 'Sanitizing Log Sign-Off',
      division: 'Division 02 — 3JI-Repair',
      title: 'Loaner LN-03 Returned from Parma — Pending OAC 3717-1-08.1 Sanitation Gate',
      detail:
        'Loaner LN-03 is in Sanitizing & Bench Prep (Step 8). Cannot return to Available until all 4 OAC 3717-1-08.1 sanitation checks are verified.',
      priority: 'HIGH',
      status: 'Pending Jason',
      linked_entity_id: 'LN-03',
      created_at: '2026-11-02T13:10:00Z',
    },
    {
      id: 'NJ-04',
      category: 'Opportunity Escalated (Module 1 Retention Rule)',
      division: 'Division 02 — 3JI-Repair',
      title:
        'Escalated Opportunity > 4h (JOB-203 — Tremont Walk-In Cooler & Ice Machine) — Landed on Jason Schedule',
      detail:
        'Unclaimed at 4.5 business hours: automatically placed on Jason Allen tentative schedule per Module 1 customer-retention rule + draft-first proactive customer update ready for approval.',
      priority: 'CRITICAL',
      status: 'Pending Jason',
      linked_entity_id: 'JOB-203',
      created_at: '2026-11-02T14:00:00Z',
    },
    {
      id: 'NJ-05',
      category: 'Low-Stock Critical Part',
      division: 'Division 01 — Foundry',
      title: 'Low Stock Alert: 3J-MTS-FDR1500 Rotor (2 on hand / Reorder Pt 4) & 3J-TT5-CUP100',
      detail:
        'MTS 1500 FDDR Rotor (qty 2) and ThermaTest NGIII 5000 Cups (qty 2) + 3JI-Repair Auger Motor (qty 3) below reorder point.',
      priority: 'STANDARD',
      status: 'Pending Jason',
      linked_entity_id: 'PART-D1-02',
      created_at: '2026-11-02T08:30:00Z',
    },
  ],
  pipeline_funnel: {
    cuyahoga_bars_restaurants: {
      total_targets: 515,
      untouched: 382,
      contacted: 89,
      quoted_or_demo: 30,
      active_customers: 14,
    },
    industrial_targets: {
      total_targets: 501,
      enriched_core_foundry: 162,
      broader_metalworking_long_tail: 339,
      untouched: 374,
      contacted: 78,
      quoted: 31,
      active_accounts: 18,
    },
  },
  targets_90_day: [
    {
      id: 'TGT-30-D1',
      division: 'Division 01 — Foundry',
      horizon: '30-Day',
      activity_metric_label: 'Foundry Outreach Calls & Serial-Verified Quotes Issued (<24h)',
      activity_current: 24,
      activity_target: 30,
      activity_unit: 'quotes / calls',
      dollar_metric_label: 'Division 01 Parts (+35%/+25%) & Field Service Revenue',
      dollar_current: 24490,
      dollar_target: 30000,
    },
    {
      id: 'TGT-30-D2',
      division: 'Division 02 — 3JI-Repair',
      horizon: '30-Day',
      activity_metric_label: '3JI-Repair Cuyahoga Diagnostics ($99), Loaner Swaps & Care Plan Demos',
      activity_current: 19,
      activity_target: 25,
      activity_unit: 'swaps / demos',
      dollar_metric_label: '3JI-Repair Care Plan MRR + Bench/Field Repair Revenue',
      dollar_current: 9640,
      dollar_target: 12500,
    },
    {
      id: 'TGT-60-D1',
      division: 'Division 01 — Foundry',
      horizon: '60-Day',
      activity_metric_label:
        'Foundry Health Checks & Active Multi-System Accounts (FDU/MTS/SMARTT/ThermaTest)',
      activity_current: 18,
      activity_target: 28,
      activity_unit: 'active accounts',
      dollar_metric_label: 'Division 01 Cumulative Parts & Service Invoiced (60d)',
      dollar_current: 51200,
      dollar_target: 65000,
    },
    {
      id: 'TGT-60-D2',
      division: 'Division 02 — 3JI-Repair',
      horizon: '60-Day',
      activity_metric_label: 'Active Cuyahoga Care Plan Locations & Graduated 3JI-Repair Techs',
      activity_current: 14,
      activity_target: 24,
      activity_unit: 'care plan locations',
      dollar_metric_label: '3JI-Repair Recurring Care Plan MRR + Repair Revenue (60d)',
      dollar_current: 18900,
      dollar_target: 28000,
    },
    {
      id: 'TGT-90-D1',
      division: 'Division 01 — Foundry',
      horizon: '90-Day',
      activity_metric_label:
        'Quarterly Health Checks (≥8/qtr) + 3JI-Repair Graduates on Div 01 Foundry Mentorship',
      activity_current: 9,
      activity_target: 12,
      activity_unit: 'health checks & mentees',
      dollar_metric_label: 'Division 01 Quarterly Foundry Revenue Target (QTD)',
      dollar_current: 78400,
      dollar_target: 105000,
    },
    {
      id: 'TGT-90-D2',
      division: '3JI-Repair & Tech Network',
      horizon: '90-Day',
      activity_metric_label:
        '3JI-Repair Cohort Graduates (L1 Certified) + Div 01 Foundry Track Recruits',
      activity_current: 3,
      activity_target: 6,
      activity_unit: 'graduated techs',
      dollar_metric_label: '3JI-Repair Tech Network Gross Volume (15% Network / 20% Hub)',
      dollar_current: 14200,
      dollar_target: 25000,
    },
  ],
};

const SEED_FILE_PATH = path.join(process.cwd(), 'data', 'platform-state.json');
const WRITABLE_FILE_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), '3j-platform-state.json')
  : SEED_FILE_PATH;

const globalForState = globalThis as unknown as { __3jPlatformState?: PlatformState };

export function getPlatformState(): PlatformState {
  try {
    if (fs.existsSync(WRITABLE_FILE_PATH)) {
      const raw = fs.readFileSync(WRITABLE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as PlatformState;
      globalForState.__3jPlatformState = parsed;
      return parsed;
    }
  } catch {
    // Fallback to in-memory or seed
  }

  if (globalForState.__3jPlatformState) {
    return globalForState.__3jPlatformState;
  }

  const fresh = JSON.parse(JSON.stringify(INITIAL_STATE)) as PlatformState;
  return savePlatformState(fresh);
}

export function savePlatformState(state: PlatformState): PlatformState {
  state.last_updated = new Date().toISOString();
  globalForState.__3jPlatformState = state;
  try {
    const dir = path.dirname(WRITABLE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(WRITABLE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Ignore write errors in read-only environments; in-memory state remains updated
  }
  return state;
}

export function resetPlatformState(): PlatformState {
  const fresh = JSON.parse(JSON.stringify(INITIAL_STATE)) as PlatformState;
  return savePlatformState(fresh);
}
