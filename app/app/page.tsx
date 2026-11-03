'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { PlatformState, UserRole } from '@/lib/store';

const EQUIPMENT_SCOPE_3JI_REPAIR = [
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

const ROLES: { role: UserRole; testId: string; shortLabel: string }[] = [
  {
    role: 'Admin (Jason / 3JI Staff)',
    testId: 'role-btn-admin',
    shortLabel: 'Admin (Jason / 3JI Staff)',
  },
  {
    role: 'Tech L1 (Technician Portal)',
    testId: 'role-btn-tech-l1',
    shortLabel: 'Tech L1',
  },
  {
    role: 'Tech L2 — EPA 608 (Technician Portal)',
    testId: 'role-btn-tech-l2',
    shortLabel: 'Tech L2 (EPA 608)',
  },
  {
    role: 'Tech L3 — Master / Foundry (Technician Portal)',
    testId: 'role-btn-tech-l3',
    shortLabel: 'Tech L3 (Master / Foundry)',
  },
  {
    role: '3JI-Repair Trainee',
    testId: 'role-btn-3ji-repair-trainee',
    shortLabel: '3JI-Repair Trainee',
  },
  {
    role: 'Customer (Customer Portal)',
    testId: 'role-btn-customer',
    shortLabel: 'Customer',
  },
];

const NINE_STEPS = [
  { step: 1, title: '1. Intake & Claim Breakdown', desc: 'Breakdown posted on Cuyahoga map; tech claims opportunity.' },
  {
    step: 2,
    title: '2. Eligibility & Pricing Check',
    desc: '$0 Care Plan ($149–199/mo or $79–99/mo) vs $25–49/day or $149–249/incident.',
  },
  { step: 3, title: '3. Loaner Assignment & Hub Pickup', desc: 'Assign sanitized loaner (LN-01..LN-05) from 3J Hub.' },
  {
    step: 4,
    title: '4. Field Drop-Off First & Pickup',
    desc: 'Install loaner at customer first (customer keeps selling ~60 drinks/day); load customer unit.',
  },
  {
    step: 5,
    title: '5. Shop Bench Repair',
    desc: '$99 diagnostic credit + $119–129/hr bench labor + +35% standard (+25% contract) parts.',
  },
  { step: 6, title: '6. Customer Approval (Draft-First)', desc: 'Jason approves quote; customer authorizes repair.' },
  { step: 7, title: '7. Return Swap & Retrieve Loaner', desc: 'Reinstall customer machine; bring loaner back to 3J Hub.' },
  {
    step: 8,
    title: '8. Post-Return Sanitizing & Prep (OAC 3717-1-08.1 Gate)',
    desc: 'Mandatory 4-point Ohio Food Code OAC 3717-1-08.1 sanitation checklist + tech initials.',
  },
  {
    step: 9,
    title: '9. Ready for Next Deployment',
    desc: 'Sanitation logged; loaner status flips back to Available.',
  },
];

export default function FieldOperationsAppPage() {
  const [state, setState] = useState<PlatformState | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('Admin (Jason / 3JI Staff)');
  const [activeTraineeId] = useState<string>('TECH-04');
  const [toast, setToast] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Module 1 Filters
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [loanerFilter, setLoanerFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');

  // Module 2 Selected Loaner (`LN-03` default because it is at Step 8 In Sanitizing & Bench Prep)
  const [selectedLoanerId, setSelectedLoanerId] = useState<string>('LN-03');

  // Module 3 Inventory Tab
  const [invTab, setInvTab] = useState<'ALL' | 'DIV1' | 'DIV2' | 'LOANERS'>('ALL');

  // Module 4 Quote Generator State
  const [qDivision, setQDivision] = useState<'Division 01 — Foundry' | 'Division 02 — 3JI-Repair'>(
    'Division 02 — 3JI-Repair'
  );
  const [qBusinessName, setQBusinessName] = useState('[Bar Account Placeholder #01 — Lakewood Patio & Tap]');
  const [qMachine, setQMachine] = useState('Twin-Bowl Frozen Beverage / Slushie Machine');
  const [qSerial, setQSerial] = useState('SN-FB-2104');
  const [qSymptom, setQSymptom] = useState('Auger drive motor stall + rear bowl seal replacement');
  const [qIncludeDiag, setQIncludeDiag] = useState<boolean>(true);
  const [qCreditDiag, setQCreditDiag] = useState<boolean>(true);
  const [qLaborTier, setQLaborTier] = useState<
    'Bench ($119–129/hr)' | 'Field ($139–149/hr)' | 'Refrigeration / Master ($169–179/hr)'
  >('Bench ($119–129/hr)');
  const [qLaborRate, setQLaborRate] = useState<number>(125);
  const [qLaborHours, setQLaborHours] = useState<number>(3);
  const [qContractMarkup, setQContractMarkup] = useState<boolean>(false);
  const [qSelectedPartId, setQSelectedPartId] = useState<string>('PART-D2-02');
  const [qPartQty, setQPartQty] = useState<number>(1);
  const [qCarePlanActive, setQCarePlanActive] = useState<boolean>(false);
  const [qLoanerMode, setQLoanMode] = useState<'Daily ($39/day)' | 'Incident Flat ($199/incident)' | 'None'>(
    'Incident Flat ($199/incident)'
  );
  const [qLoanerDays, setQLoanerDays] = useState<number>(3);
  const [qDrinksPerDay, setQDrinksPerDay] = useState<number>(60);
  const [qDaysDown] = useState<number>(4);

  // Module 5 Mobile Work Booking State
  const [bkDivision, setBkDivision] = useState<'Division 02 — 3JI-Repair' | 'Division 01 — Foundry'>(
    'Division 02 — 3JI-Repair'
  );
  const [bkBusiness, setBkBusiness] = useState('[Bar Placeholder — Tremont Frozen Cocktail Co.]');
  const [bkAddress, setBkAddress] = useState('2100 Professor Ave [Placeholder]');
  const [bkCity, setBkCity] = useState('Cleveland');
  const [bkState, setBkState] = useState('OH');
  const [bkZip, setBkZip] = useState('44113');
  const [bkCounty, setBkCounty] = useState('Cuyahoga');
  const [bkMachine, setBkMachine] = useState<string>(EQUIPMENT_SCOPE_3JI_REPAIR[6]);
  const [bkSerial, setBkSerial] = useState('SN-FB-9012');
  const [bkSymptom, setBkSymptom] = useState('Bowl #2 not freezing to slush consistency; loaner requested');
  const [bkWindow, setBkWindow] = useState('Today 2:00 PM – 4:00 PM (Priority)');
  const [bkCarePlan, setBkCarePlan] = useState(true);
  const [bkFlagJason, setBkFlagJason] = useState(true);
  const [bookingResultMsg, setBookingResultMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Module 7 Portals & Support Docs State
  const [activePortalTab, setActivePortalTab] = useState<'CUSTOMER' | 'TECH' | 'STAFF'>('STAFF');
  const [selectedPortalCustomerId, setSelectedPortalCustomerId] = useState<string>('CUST-D2-01');
  const [selectedPortalTechId, setSelectedPortalTechId] = useState<string>('TECH-02');
  const [selectedDocCategoryFilter, setSelectedDocCategoryFilter] = useState<string>('ALL');

  // 3JI Staff Portal — New Customer Setup Form State
  const [newCustName, setNewCustName] = useState('[New Account Placeholder — Ohio City Taproom & Kitchen]');
  const [newCustAddress, setNewCustAddress] = useState('2510 Bridge Ave, Cleveland, OH 44113 [Placeholder]');
  const [newCustCity, setNewCustCity] = useState('Cleveland');
  const [newCustZip, setNewCustZip] = useState('44113');
  const [newCustContact, setNewCustContact] = useState('Bar GM [Placeholder] · 216-555-0144');
  const [newCustPlanTier, setNewCustPlanTier] = useState<
    'None' | 'Single-Machine ($79–99/mo)' | 'Multi-Machine Location ($149–199/mo)'
  >('Multi-Machine Location ($149–199/mo)');
  const [newCustTerms, setNewCustTerms] = useState(
    '12-Month 3JI-Repair Multi-Machine Care Plan ($179/mo) · $0 Loaner Swaps · Quarterly OAC 3717-1-08.1 Sanitize'
  );
  const [newCustAssets, setNewCustAssets] = useState<
    { equipment_type: string; make_model: string; serial_number: string; location_label: string }[]
  >([
    {
      equipment_type: 'Frozen Beverage / Slushie Machines',
      make_model: 'Twin-Bowl Frozen Beverage Dispenser 2x12L',
      serial_number: 'SN-FB-8801',
      location_label: 'Main Patio Bar',
    },
    {
      equipment_type: 'Ice Machines',
      make_model: 'Commercial Modular Cube Ice Maker 500 lb',
      serial_number: 'SN-ICE-8802',
      location_label: 'Service Prep Kitchen',
    },
  ]);

  // 3JI Staff Portal — Support Docs Upload Form State
  const [docTitle, setDocTitle] = useState('Twin-Bowl Slushie Auger Seal & Brix Service Manual');
  const [docEquipType, setDocEquipType] = useState<string>('Frozen Beverage / Slushie Machines');
  const [docFileName, setDocFileName] = useState('3ji-slushie-auger-seal-manual.pdf');
  const [docNotes, setDocNotes] = useState(
    'OAC 3717-1-08.1 teardown sequence, rear seal lubrication, and 13–15° Brix calibration guide.'
  );

  const fetchState = useCallback(async () => {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setState(data);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const notify = (msg: string) => {
    setErrorBanner(null);
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const handleLaborTierChange = (
    tier: 'Bench ($119–129/hr)' | 'Field ($139–149/hr)' | 'Refrigeration / Master ($169–179/hr)'
  ) => {
    setQLaborTier(tier);
    if (tier === 'Bench ($119–129/hr)') setQLaborRate(125);
    else if (tier === 'Field ($139–149/hr)') setQLaborRate(145);
    else setQLaborRate(175);
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono text-sm">
        Loading 3J Industrial Parts Field Operations App (app.3jindustrialparts.com)...
      </div>
    );
  }

  const activeTrainee = state.techs.find((t) => t.id === activeTraineeId) || state.techs[3];

  // Determine current role's claim permissions for a job
  const evaluateJobClaimPermission = (job: PlatformState['jobs'][0]) => {
    if (activeRole === 'Customer (Customer Portal)') {
      return { canClaim: false, reason: 'Customer Portal View Only (No Tech Claim Rights)' };
    }
    if (activeRole === '3JI-Repair Trainee') {
      if (!activeTrainee.can_claim_solo) {
        return {
          canClaim: false,
          reason: '3JI-Repair Trainee Gate: Shadow Ride Only until Jason signs off L1 Graduation',
        };
      }
      if (job.required_level !== 'L1') {
        return {
          canClaim: false,
          reason: `Graduated L1 Tech can claim L1 jobs only (Requires ${job.required_level})`,
        };
      }
      if (job.requires_epa_608) {
        return { canClaim: false, reason: 'Requires EPA 608 Certification (L2/L3)' };
      }
      return { canClaim: true, reason: 'Graduated to L1 — Solo Claim Unlocked!' };
    }
    if (activeRole === 'Tech L1 (Technician Portal)') {
      if (job.required_level !== 'L1') {
        return { canClaim: false, reason: `Skill Gate: Requires ${job.required_level} Certification` };
      }
      if (job.requires_epa_608) {
        return { canClaim: false, reason: 'EPA 608 Gate: Requires Verified EPA 608 on file' };
      }
      return { canClaim: true, reason: 'Eligible (L1 — PM / Swap)' };
    }
    if (activeRole === 'Tech L2 — EPA 608 (Technician Portal)') {
      if (job.required_level === 'L3') {
        return { canClaim: false, reason: 'Skill Gate: Requires L3 Master / Foundry Tech' };
      }
      return { canClaim: true, reason: 'Eligible (L2 Sealed System / EPA 608 Verified)' };
    }
    // Admin (Jason / 3JI Staff) or Tech L3 — Master / Foundry (Technician Portal)
    return { canClaim: true, reason: 'Eligible (L3 Master / Foundry Authority)' };
  };

  const handleClaimJob = async (jobId: string) => {
    const techIdForClaim =
      activeRole === '3JI-Repair Trainee'
        ? activeTrainee.id
        : activeRole === 'Tech L1 (Technician Portal)'
        ? 'TECH-03'
        : activeRole === 'Tech L2 — EPA 608 (Technician Portal)'
        ? 'TECH-02'
        : 'TECH-01';

    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'claim_job',
        job_id: jobId,
        role: activeRole,
        tech_id: techIdForClaim,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorBanner(data.error || 'Cannot claim job');
      return;
    }
    setState(data.state);
    notify(`Opportunity ${jobId} claimed under role ${activeRole}!`);
  };

  const handleRequestShadowRide = async (jobId: string) => {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'request_shadow_ride',
        job_id: jobId,
        trainee_id: activeTrainee.id,
      }),
    });
    const data = await res.json();
    if (data.state) {
      setState(data.state);
      notify(`Shadow Ride requested on ${jobId} for ${activeTrainee.name}.`);
    }
  };

  const handleScheduleJasonOnOpportunity = async (jobId: string) => {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'schedule_jason_on_opportunity',
        job_id: jobId,
      }),
    });
    const data = await res.json();
    if (data.state) {
      setState(data.state);
      notify(`Scheduled Jason Allen onto opportunity ${jobId} per Module 1 Customer-Retention Rule!`);
    }
  };

  const selectedLoaner = state.loaners.find((l) => l.id === selectedLoanerId) || state.loaners[2];
  const allSanitationChecksPassed =
    selectedLoaner.sanitation_checklist.wash_rinse_sanitize_completed &&
    selectedLoaner.sanitation_checklist.sanitizer_ppm_verified &&
    selectedLoaner.sanitation_checklist.food_contact_parts_inspected &&
    selectedLoaner.sanitation_checklist.leak_and_freeze_test_passed &&
    selectedLoaner.sanitation_tech_initials.trim().length > 0;

  const handleUpdateLoanerChecklist = async (
    field: keyof typeof selectedLoaner.sanitation_checklist,
    value: boolean
  ) => {
    const updatedChecklist = {
      ...selectedLoaner.sanitation_checklist,
      [field]: value,
    };
    setState((prev) =>
      prev
        ? {
            ...prev,
            loaners: prev.loaners.map((l) =>
              l.id === selectedLoaner.id ? { ...l, sanitation_checklist: updatedChecklist } : l
            ),
          }
        : prev
    );
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_loaner_workflow',
        loaner_id: selectedLoaner.id,
        target_step: selectedLoaner.active_workflow_step,
        checklist: updatedChecklist,
      }),
    });
    const data = await res.json();
    if (data.state) setState(data.state);
  };

  const handleUpdateLoanerInitials = async (initials: string) => {
    setState((prev) =>
      prev
        ? {
            ...prev,
            loaners: prev.loaners.map((l) =>
              l.id === selectedLoaner.id ? { ...l, sanitation_tech_initials: initials } : l
            ),
          }
        : prev
    );
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_loaner_workflow',
        loaner_id: selectedLoaner.id,
        target_step: selectedLoaner.active_workflow_step,
        sanitation_tech_initials: initials,
      }),
    });
    const data = await res.json();
    if (data.state) setState(data.state);
  };

  const handleAdvanceLoanerStep = async (targetStep: number) => {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_loaner_workflow',
        loaner_id: selectedLoaner.id,
        target_step: targetStep,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorBanner(data.error || 'Blocked by Ohio Food Code OAC 3717-1-08.1 Gate');
      return;
    }
    setState(data.state);
    notify(
      targetStep === 9
        ? `Loaner ${selectedLoaner.id} passed OAC 3717-1-08.1 Sanitation Gate and is now Available!`
        : `Loaner ${selectedLoaner.id} updated to Workflow Step ${targetStep}.`
    );
  };

  const handleUsePart = async (partId: string, sku: string) => {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'use_part',
        part_id: partId,
        qty: 1,
        reference_type: 'Job',
        reference_id: 'JOB-202',
      }),
    });
    const data = await res.json();
    if (data.state) {
      setState(data.state);
      notify(`Allocated 1x ${sku} from inventory to JOB-202.`);
    }
  };

  // Quote Generator Calculations
  const selectedPartObj = state.parts.find((p) => p.id === qSelectedPartId) || state.parts[0];
  const partSellUnit = qContractMarkup ? selectedPartObj.contract_price_25 : selectedPartObj.list_price_35;
  const partLineTotal = partSellUnit * qPartQty;
  const diagFee = qIncludeDiag ? 99 : 0;
  const diagCredit = qIncludeDiag && qCreditDiag ? -99 : 0;
  const laborTotal = qLaborRate * qLaborHours;
  const loanerTotal = qCarePlanActive
    ? 0
    : qLoanerMode === 'Daily ($39/day)'
    ? 39 * qLoanerDays
    : qLoanerMode === 'Incident Flat ($199/incident)'
    ? 199
    : 0;
  const grandTotalQuote = Math.max(0, diagFee + diagCredit + laborTotal + partLineTotal + loanerTotal);
  const dailyDowntimeLoss = Math.round(qDrinksPerDay * 2.72 * 0.6);
  const exactSpecDailyLoss = qDrinksPerDay === 60 ? 98 : dailyDowntimeLoss;
  const totalDowntimeLoss = exactSpecDailyLoss * qDaysDown;

  const handleCreateQuote = async (targetStatus: 'Draft' | 'Needs Jason Approval') => {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_quote',
        division: qDivision,
        business_name: qBusinessName,
        city_state:
          qDivision === 'Division 02 — 3JI-Repair'
            ? 'Cuyahoga County, OH'
            : 'Nationwide Foundry Support (USA)',
        system_or_machine: qMachine,
        serial_number: qSerial,
        symptom_or_scope: qSymptom,
        care_plan_active: qCarePlanActive,
        contract_pricing: qContractMarkup,
        include_diagnostic_99: qIncludeDiag,
        credit_diagnostic_toward_repair: qCreditDiag,
        labor_tier: qLaborTier,
        labor_rate: qLaborRate,
        labor_hours: qLaborHours,
        loaner_billing: qCarePlanActive ? 'Waived — Care Plan ($0)' : qLoanerMode,
        loaner_days_or_incidents: qLoanerDays,
        loaner_rate: loanerTotal,
        parts_lines: [
          {
            part_id: selectedPartObj.id,
            sku: selectedPartObj.sku,
            name: selectedPartObj.name,
            qty: qPartQty,
            unit_cost: selectedPartObj.unit_cost,
            markup_pct: qContractMarkup ? 25 : 35,
            sell_price: partSellUnit,
          },
        ],
        total_amount: grandTotalQuote,
        status: targetStatus,
      }),
    });
    const data = await res.json();
    if (data.state) {
      setState(data.state);
      notify(
        `Quote ${data.quote.id} ($${grandTotalQuote.toLocaleString()}) saved as ${targetStatus} (<24h SLA active).`
      );
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_booking',
        division: bkDivision,
        business_name: bkBusiness,
        address: bkAddress,
        city: bkCity,
        state: bkState,
        zip: bkZip,
        county: bkCounty,
        machine_or_system: bkMachine,
        serial_number: bkSerial,
        symptom: bkSymptom,
        preferred_window: bkWindow,
        care_plan_member: bkCarePlan,
        flag_needs_jason: bkFlagJason,
      }),
    });
    const data = await res.json();
    if (data.state) {
      setState(data.state);
    }
    if (!data.ok) {
      setBookingResultMsg({
        ok: false,
        text: data.message,
      });
    } else {
      setBookingResultMsg({
        ok: true,
        text: `Booking ${data.booking.id} confirmed! Estimate within 24 hours. Posted to 3JI-Repair Dispatch Map.`,
      });
      notify(`Booking ${data.booking.id} scheduled!`);
    }
  };

  const handleGraduateTrainee = async (techId: string, name: string) => {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'graduate_trainee', tech_id: techId }),
    });
    const data = await res.json();
    if (data.state) {
      setState(data.state);
      notify(`Jason signed off graduation for ${name}! Promoted to L1 — PM / Swap (can_claim_solo = true).`);
    }
  };

  const handleToggleFoundryTrack = async (techId: string) => {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_foundry_track', tech_id: techId }),
    });
    const data = await res.json();
    if (data.state) {
      setState(data.state);
      notify(`Updated Division 01 Foundry Mentorship Track flag.`);
    }
  };

  const handleAddNewAssetRow = () => {
    setNewCustAssets((prev) => [
      ...prev,
      {
        equipment_type: 'Walk-In Coolers & Freezers',
        make_model: 'Commercial Walk-In Cooler Box',
        serial_number: `SN-WIC-${Math.floor(1000 + Math.random() * 8999)}`,
        location_label: 'Back Bar Storage',
      },
    ]);
  };

  const handleCreateCustomerSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_customer_setup',
        business_name: newCustName,
        address: newCustAddress,
        city: newCustCity,
        zip: newCustZip,
        contact_info: newCustContact,
        plan_tier: newCustPlanTier,
        terms: newCustTerms,
        assets: newCustAssets,
      }),
    });
    const data = await res.json();
    if (data.state && data.customer) {
      setState(data.state);
      setSelectedPortalCustomerId(data.customer.id);
      notify(
        `Customer ${data.customer.business_name} (${data.customer.id}) created with ${newCustAssets.length} equipment assets!`
      );
    }
  };

  const handleUploadSupportDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload_support_doc',
        title: docTitle,
        equipment_type: docEquipType,
        file_name: docFileName,
        file_notes: docNotes,
        uploaded_by: 'Jason Allen (3JI Staff Portal)',
      }),
    });
    const data = await res.json();
    if (data.state && data.doc) {
      setState(data.state);
      notify(`Uploaded "${data.doc.title}" (${data.doc.equipment_type}) to Support Docs Library!`);
    }
  };

  // Filtered jobs for Module 1 (Care Plan jobs surface first per spec)
  const filteredJobs = state.jobs
    .filter((j) => {
      if (urgencyFilter !== 'ALL' && j.urgency !== urgencyFilter) return false;
      if (levelFilter !== 'ALL' && j.required_level !== levelFilter) return false;
      if (loanerFilter === 'YES' && !j.loaner_needed) return false;
      if (loanerFilter === 'NO' && j.loaner_needed) return false;
      if (cityFilter !== 'ALL' && j.city !== cityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const aPlan = a.care_plan_status !== 'None' ? 1 : 0;
      const bPlan = b.care_plan_status !== 'None' ? 1 : 0;
      return bPlan - aPlan;
    });

  // Portal selections
  const selectedPortalCustomer =
    state.customers.find((c) => c.id === selectedPortalCustomerId) || state.customers[0];
  const selectedCustomerMachines = state.machines.filter(
    (m) => m.customer_id === selectedPortalCustomer.id
  );
  const selectedCustomerJobs = state.jobs.filter(
    (j) =>
      j.customer_id === selectedPortalCustomer.id ||
      j.business_name === selectedPortalCustomer.business_name
  );
  const selectedCustomerQuotes = state.quotes.filter(
    (q) =>
      q.customer_id === selectedPortalCustomer.id ||
      q.business_name === selectedPortalCustomer.business_name
  );

  const selectedPortalTech =
    state.techs.find((t) => t.id === selectedPortalTechId) || state.techs[1];
  const matchedOpportunitiesForTech = state.jobs.filter(
    (j) =>
      j.status === 'Unclaimed' &&
      (selectedPortalTech.job_types.includes(j.equipment_category) ||
        selectedPortalTech.level.includes('L3') ||
        selectedPortalTech.level.includes('L2'))
  );
  const selectedTechPayouts = state.payouts.filter(
    (p) => p.tech_id === selectedPortalTech.id
  );

  const filteredSupportDocs = state.support_docs.filter(
    (d) => selectedDocCategoryFilter === 'ALL' || d.equipment_type === selectedDocCategoryFilter
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Bar with Role Switcher */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur border-b border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/assets/3j-logo.png"
              alt="3J Industrial Parts LLC"
              className="h-11 w-auto object-contain bg-black"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider uppercase text-white text-sm md:text-base">
                  3J Industrial Parts — Field App &amp; Portals
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#5ADCC8]/15 text-[#5ADCC8] border border-[#5ADCC8]/40">
                  app.3jindustrialparts.com
                </span>
              </div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-[#5ADCC8]">
                SPARE PARTS | SERVICES | CONSULTING · Division 02 (3JI-Repair): CUYAHOGA COUNTY, OHIO ONLY · 216-906-2252
              </div>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="role-select" className="text-xs font-mono text-zinc-400">
              Active Portal / Role:
            </label>
            <select
              id="role-select"
              data-testid="role-switcher"
              value={activeRole}
              onChange={(e) => {
                const nextRole = e.target.value as UserRole;
                setActiveRole(nextRole);
                if (nextRole === 'Customer (Customer Portal)') setActivePortalTab('CUSTOMER');
                else if (nextRole === 'Admin (Jason / 3JI Staff)') setActivePortalTab('STAFF');
                else setActivePortalTab('TECH');
              }}
              className="bg-zinc-900 border border-[#5ADCC8] text-[#5ADCC8] font-bold text-xs rounded px-3 py-1.5 font-mono"
            >
              {ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.role}
                </option>
              ))}
            </select>

            <Link
              href="/os"
              data-testid="switch-to-os-link"
              className="px-3 py-1.5 rounded bg-[#5ADCC8] text-black font-black uppercase tracking-wider text-xs hover:bg-[#5ADCC8]/90 transition"
            >
              OS Command Center (/os) →
            </Link>
          </div>
        </div>

        {/* Role Quick-Switch Pills for Fast Testing */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-zinc-400 mr-1">Quick Role Gate Test:</span>
            {ROLES.map((r) => (
              <button
                key={r.role}
                type="button"
                data-testid={r.testId}
                onClick={() => {
                  setActiveRole(r.role);
                  if (r.role === 'Customer (Customer Portal)') setActivePortalTab('CUSTOMER');
                  else if (r.role === 'Admin (Jason / 3JI Staff)') setActivePortalTab('STAFF');
                  else setActivePortalTab('TECH');
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                  activeRole === r.role
                    ? 'bg-[#5ADCC8] text-black font-black'
                    : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                }`}
              >
                {r.shortLabel}
              </button>
            ))}
          </div>

          <div
            data-testid="active-role-banner"
            className="text-[11px] font-mono text-[#5ADCC8]"
          >
            Mode: <strong>{activeRole}</strong>
            {activeRole === '3JI-Repair Trainee' && (
              <span>
                {' '}
                · Profile: {activeTrainee.name} (Solo Claim:{' '}
                <strong>{activeTrainee.can_claim_solo ? 'UNLOCKED (Graduated L1)' : 'LOCKED — Shadow Only'}</strong>)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Notifications */}
      {toast && (
        <div
          data-testid="app-toast"
          className="fixed bottom-5 right-5 z-50 bg-[#5ADCC8] text-black font-bold px-4 py-3 rounded shadow-lg border border-black text-xs font-mono"
        >
          ✓ {toast}
        </div>
      )}
      {errorBanner && (
        <div
          data-testid="app-error-banner"
          className="max-w-7xl mx-auto mt-4 px-4 py-3 rounded bg-red-950/90 border border-red-500 text-red-200 text-xs font-mono flex items-center justify-between"
        >
          <span>⚠ {errorBanner}</span>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Container: All 7 Field App Modules */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 space-y-10">
        {/* =====================================================================
            MODULE 7 (FEATURED TOP): PORTALS & SUPPORT DOCS (CUSTOMER · TECHNICIAN · 3JI STAFF)
           ===================================================================== */}
        <section
          id="module-portals-support-docs"
          data-testid="module-portals-support-docs"
          aria-label="Module 7: Portals & Support Docs (Customer · Technician · 3JI Staff)"
          className="bg-zinc-950 border-2 border-[#5ADCC8] rounded p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                  Module 7 · Three Portals &amp; Support Docs
                </span>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                  Customer Portal · Technician Portal · 3JI Staff Portal &amp; Support Docs Library
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                3JI-Repair is a named service of <strong className="text-white">3J Industrial Parts LLC</strong> (launch area: <strong className="text-[#5ADCC8]">Cuyahoga County, OH</strong>). All company &amp; 3JI-Repair financials live exclusively in the <strong className="text-[#5ADCC8]">OS Command Center (/os)</strong> — portals below carry only operational records and each tech&apos;s own payout summary (15% / 20%).
              </p>
            </div>

            {/* Portal Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <button
                type="button"
                data-testid="portal-tab-customer"
                onClick={() => setActivePortalTab('CUSTOMER')}
                className={`px-3.5 py-2 rounded font-bold uppercase cursor-pointer transition ${
                  activePortalTab === 'CUSTOMER'
                    ? 'bg-[#5ADCC8] text-black font-black'
                    : 'bg-black text-zinc-300 border border-zinc-800 hover:border-[#5ADCC8]'
                }`}
              >
                1. Customer Portal
              </button>
              <button
                type="button"
                data-testid="portal-tab-technician"
                onClick={() => setActivePortalTab('TECH')}
                className={`px-3.5 py-2 rounded font-bold uppercase cursor-pointer transition ${
                  activePortalTab === 'TECH'
                    ? 'bg-[#5ADCC8] text-black font-black'
                    : 'bg-black text-zinc-300 border border-zinc-800 hover:border-[#5ADCC8]'
                }`}
              >
                2. Technician Portal
              </button>
              <button
                type="button"
                data-testid="portal-tab-staff"
                onClick={() => setActivePortalTab('STAFF')}
                className={`px-3.5 py-2 rounded font-bold uppercase cursor-pointer transition ${
                  activePortalTab === 'STAFF'
                    ? 'bg-[#5ADCC8] text-black font-black'
                    : 'bg-black text-zinc-300 border border-zinc-800 hover:border-[#5ADCC8]'
                }`}
              >
                3. 3JI Staff Portal (Jason / Staff)
              </button>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              PORTAL 1: CUSTOMER PORTAL
             ----------------------------------------------------------------- */}
          {activePortalTab === 'CUSTOMER' && (
            <div data-testid="portal-customer" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-black border border-zinc-800 rounded p-4">
                <div>
                  <div className="text-xs font-mono uppercase text-[#5ADCC8] font-bold">
                    Customer Portal — Multi-Asset Equipment Roster, Contract Terms &amp; Service Status
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {selectedPortalCustomer.business_name} ({selectedPortalCustomer.id})
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    Contact: {selectedPortalCustomer.contact_Placeholder} · City: {selectedPortalCustomer.city},{' '}
                    {selectedPortalCustomer.state} {selectedPortalCustomer.zip} ({selectedPortalCustomer.county} County)
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <label htmlFor="portal-customer-select" className="text-zinc-400">
                    Select Customer Account:
                  </label>
                  <select
                    id="portal-customer-select"
                    data-testid="portal-customer-select"
                    value={selectedPortalCustomer.id}
                    onChange={(e) => setSelectedPortalCustomerId(e.target.value)}
                    className="bg-zinc-900 border border-[#5ADCC8] text-[#5ADCC8] font-bold rounded px-3 py-1.5"
                  >
                    {state.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} — {c.business_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Contract Info & Locations */}
                <div
                  data-testid="customer-contract-info"
                  className="lg:col-span-5 bg-black border border-zinc-800 rounded p-4 space-y-3 text-xs"
                >
                  <div className="text-xs font-black uppercase text-[#5ADCC8] border-b border-zinc-800 pb-2">
                    Contract Information &amp; Service Locations
                  </div>
                  <div>
                    <span className="text-zinc-400 font-mono">Care Plan Tier: </span>
                    <strong className="text-white">{selectedPortalCustomer.contract_info.plan_tier}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-mono">Contract Terms: </span>
                    <span className="text-zinc-200">{selectedPortalCustomer.contract_info.terms}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-mono">PM Schedule: </span>
                    <span className="text-[#5ADCC8] font-mono">
                      {selectedPortalCustomer.contract_info.auto_pm_schedule}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-zinc-900">
                    <div className="text-zinc-400 font-mono mb-1">Registered Service Locations:</div>
                    <ul className="space-y-1">
                      {selectedPortalCustomer.locations.map((loc, idx) => (
                        <li key={idx} className="font-mono text-zinc-200 bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-800">
                          📍 {loc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Multiple Equipment Assets per Customer */}
                <div
                  data-testid="customer-assets-list"
                  className="lg:col-span-7 bg-black border border-zinc-800 rounded p-4 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-black uppercase text-[#5ADCC8]">
                      Customer Equipment Assets ({selectedCustomerMachines.length} Registered Units)
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      15-Item 3JI-Repair Equipment Scope
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCustomerMachines.map((mach) => (
                      <div
                        key={mach.id}
                        data-testid={`customer-asset-${mach.id}`}
                        className="p-3 rounded bg-zinc-950 border border-zinc-800 space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-[#5ADCC8]">{mach.id}</span>
                          <span className="px-2 py-0.5 rounded bg-black border border-zinc-700 text-[10px] text-white">
                            {mach.status}
                          </span>
                        </div>
                        <div className="font-bold text-white">{mach.platform_or_type}</div>
                        <div className="text-zinc-300">{mach.make_model}</div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          SN: {mach.serial_number} · Loc: {mach.location_label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Jobs & Quotes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-black border border-zinc-800 rounded p-4 space-y-2">
                  <div className="font-black uppercase text-[#5ADCC8]">
                    Customer Service Opportunities / Jobs ({selectedCustomerJobs.length})
                  </div>
                  {selectedCustomerJobs.map((j) => (
                    <div key={j.id} className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono">
                      <div className="flex justify-between">
                        <strong className="text-[#5ADCC8]">{j.id}</strong>
                        <span className="text-white">{j.status}</span>
                      </div>
                      <div className="text-zinc-300">{j.machine_type} — {j.reported_symptom}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-black border border-zinc-800 rounded p-4 space-y-2">
                  <div className="font-black uppercase text-[#5ADCC8]">
                    Customer Quotes &amp; Estimates ({selectedCustomerQuotes.length})
                  </div>
                  {selectedCustomerQuotes.map((q) => (
                    <div key={q.id} className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono">
                      <div className="flex justify-between">
                        <strong className="text-[#5ADCC8]">{q.id}</strong>
                        <span className="text-white">${q.total_amount.toFixed(2)} ({q.status})</span>
                      </div>
                      <div className="text-zinc-300">{q.system_or_machine} — {q.symptom_or_scope}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              PORTAL 2: TECHNICIAN PORTAL
             ----------------------------------------------------------------- */}
          {activePortalTab === 'TECH' && (
            <div data-testid="portal-technician" className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-black border border-zinc-800 rounded p-4">
                <div>
                  <div className="text-xs font-mono uppercase text-[#5ADCC8] font-bold">
                    Technician Portal — Skills &amp; Certs, Paired Job Types, Matched Opportunities &amp; Support Docs
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {selectedPortalTech.name} ({selectedPortalTech.id})
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    Contact: {selectedPortalTech.contact_info} · Level: <strong className="text-[#5ADCC8]">{selectedPortalTech.level}</strong> · Cohort: {selectedPortalTech.cohort}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <label htmlFor="portal-tech-select" className="text-zinc-400">
                    Inspect Technician Profile:
                  </label>
                  <select
                    id="portal-tech-select"
                    data-testid="portal-tech-select"
                    value={selectedPortalTech.id}
                    onChange={(e) => setSelectedPortalTechId(e.target.value)}
                    className="bg-zinc-900 border border-[#5ADCC8] text-[#5ADCC8] font-bold rounded px-3 py-1.5"
                  >
                    {state.techs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} — {t.name} ({t.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                {/* Skills & Certs + Paired Job Types */}
                <div className="lg:col-span-5 bg-black border border-zinc-800 rounded p-4 space-y-4">
                  <div data-testid="tech-skills-certs" className="space-y-2">
                    <div className="font-black uppercase text-[#5ADCC8] border-b border-zinc-800 pb-1.5">
                      Verified Skills &amp; Certifications
                    </div>
                    <div className="font-mono text-zinc-300">
                      EPA 608: <strong className="text-white">{selectedPortalTech.epa_608_cert_number}</strong> · COI ≥ $1M Exp:{' '}
                      <strong className="text-white">{selectedPortalTech.coi_expiry}</strong>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedPortalTech.skills_and_certs.map((sc, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-zinc-950 border border-[#5ADCC8]/50 text-[#5ADCC8] font-mono text-[11px]"
                        >
                          ✓ {sc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div data-testid="tech-job-types" className="space-y-2 pt-2 border-t border-zinc-900">
                    <div className="font-black uppercase text-[#5ADCC8]">
                      Paired 3JI-Repair Job Types (15-Item Equipment Scope)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPortalTech.job_types.map((jt, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white font-mono text-[11px]"
                        >
                          🔧 {jt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tech's Own Payout Summary (No Company Financials) */}
                  <div
                    data-testid="tech-own-payout-summary"
                    className="space-y-2 pt-2 border-t border-zinc-900"
                  >
                    <div className="font-black uppercase text-[#5ADCC8]">
                      My Technician Payout Summary ({selectedPortalTech.payout_tier})
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Shows only this technician&apos;s own net payouts (15% Network / 20% Hub). Company-wide financials live exclusively in the OS Command Center (/os).
                    </p>
                    {selectedTechPayouts.length === 0 ? (
                      <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-zinc-400">
                        No completed solo payouts settled this cycle yet.
                      </div>
                    ) : (
                      selectedTechPayouts.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono flex items-center justify-between"
                        >
                          <span>
                            {p.id} ({p.job_id}) · {p.tier}
                          </span>
                          <strong className="text-[#5ADCC8]">Net: ${p.tech_net_payout.toFixed(2)}</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Opportunities Tab + Support Docs Area */}
                <div className="lg:col-span-7 space-y-4 text-xs">
                  {/* Matched Opportunities Feed */}
                  <div
                    data-testid="tech-opportunities-tab"
                    className="bg-black border border-zinc-800 rounded p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="font-black uppercase text-[#5ADCC8]">
                        Opportunities Tab — Matched Available Opportunities ({matchedOpportunitiesForTech.length})
                      </span>
                      <span className="font-mono text-[11px] text-zinc-400">
                        UpShift / Amazon Flex Style Claim Feed
                      </span>
                    </div>
                    {matchedOpportunitiesForTech.map((opp) => (
                      <div
                        key={opp.id}
                        className="p-3 rounded bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-mono font-bold text-[#5ADCC8]">
                            {opp.id} · {opp.equipment_category} ({opp.urgency})
                          </div>
                          <div className="text-white font-bold">{opp.business_name} — {opp.city}, OH</div>
                          <div className="text-zinc-400 font-mono text-[11px]">
                            Req: {opp.required_level} · Split: {opp.payout_mode} · Escalation: {opp.escalation_stage}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleClaimJob(opp.id)}
                          className="px-3 py-1.5 rounded bg-[#5ADCC8] text-black font-black uppercase text-[11px] cursor-pointer"
                        >
                          Claim Opportunity
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Support Docs Viewer in Technician Portal */}
                  <div
                    data-testid="tech-support-docs-viewer"
                    className="bg-black border border-zinc-800 rounded p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                      <div>
                        <span className="font-black uppercase text-[#5ADCC8]">
                          Technician Support Docs Area — PDFs by Equipment Type ({state.support_docs.length} Uploaded)
                        </span>
                      </div>
                      <select
                        aria-label="Filter Support Docs by Equipment Category"
                        value={selectedDocCategoryFilter}
                        onChange={(e) => setSelectedDocCategoryFilter(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-white font-mono text-[11px]"
                      >
                        <option value="ALL">All 15 Equipment Categories</option>
                        {EQUIPMENT_SCOPE_3JI_REPAIR.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {filteredSupportDocs.length === 0 ? (
                      <div
                        data-testid="tech-support-docs-empty"
                        className="p-4 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono text-xs"
                      >
                        Support Docs library is currently empty (0 PDFs uploaded). Docs uploaded by Jason / 3JI Staff in the 3JI Staff Portal automatically appear here by equipment category.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredSupportDocs.map((doc) => (
                          <div
                            key={doc.id}
                            data-testid={`tech-support-doc-item-${doc.id}`}
                            className="p-3 rounded bg-zinc-950 border border-[#5ADCC8]/50 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-white">📄 {doc.title}</div>
                              <div className="text-[11px] font-mono text-[#5ADCC8]">
                                Category: {doc.equipment_type} · File: {doc.file_name}
                              </div>
                              <div className="text-[11px] text-zinc-400">{doc.file_notes}</div>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-[#5ADCC8]/15 border border-[#5ADCC8] text-[#5ADCC8] font-mono text-[11px] font-bold">
                              View PDF Ready
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              PORTAL 3: 3JI STAFF PORTAL (JASON / DESIGNATED STAFF)
             ----------------------------------------------------------------- */}
          {activePortalTab === 'STAFF' && (
            <div data-testid="portal-staff" className="space-y-6">
              <div className="p-3.5 rounded bg-black border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-[#5ADCC8] font-bold">
                  3JI Staff Portal (Jason Allen &amp; Designated Staff) — Customer Setup · Available-Opportunities Oversight · Support Docs Management
                </span>
                <span className="text-zinc-400">
                  Financials Boundary: Zero P&amp;L/Revenue here (All financials in /os)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* 1. New Customer Setup Form */}
                <form
                  onSubmit={handleCreateCustomerSetup}
                  data-testid="staff-new-customer-form"
                  className="lg:col-span-6 bg-black border border-zinc-800 rounded p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-black uppercase text-[#5ADCC8]">
                      1. New Customer Setup (Multi-Asset &amp; Contract Info)
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">Populates Customer Portal</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Customer / Business Name</label>
                      <input
                        type="text"
                        data-testid="staff-cust-name-input"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Primary Contact Info</label>
                      <input
                        type="text"
                        data-testid="staff-cust-contact-input"
                        value={newCustContact}
                        onChange={(e) => setNewCustContact(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="md:col-span-2">
                      <label className="block font-mono text-zinc-400 mb-1">Service Location Address</label>
                      <input
                        type="text"
                        data-testid="staff-cust-address-input"
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Cuyahoga ZIP</label>
                      <input
                        type="text"
                        value={newCustZip}
                        onChange={(e) => setNewCustZip(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Contract / Care Plan Tier</label>
                      <select
                        data-testid="staff-cust-plan-select"
                        value={newCustPlanTier}
                        onChange={(e) =>
                          setNewCustPlanTier(
                            e.target.value as
                              | 'None'
                              | 'Single-Machine ($79–99/mo)'
                              | 'Multi-Machine Location ($149–199/mo)'
                          )
                        }
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                      >
                        <option value="Multi-Machine Location ($149–199/mo)">
                          Multi-Machine Location ($149–199/mo)
                        </option>
                        <option value="Single-Machine ($79–99/mo)">
                          Single-Machine ($79–99/mo)
                        </option>
                        <option value="None">Standard Account (No Monthly Care Plan)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Contract Terms Note</label>
                      <input
                        type="text"
                        value={newCustTerms}
                        onChange={(e) => setNewCustTerms(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  {/* Multiple Equipment Assets Builder */}
                  <div className="space-y-2 pt-2 border-t border-zinc-900">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#5ADCC8] font-bold">
                        Customer Equipment Assets ({newCustAssets.length} Units)
                      </span>
                      <button
                        type="button"
                        data-testid="staff-add-asset-row-btn"
                        onClick={handleAddNewAssetRow}
                        className="px-2.5 py-1 rounded bg-zinc-900 border border-[#5ADCC8] text-[#5ADCC8] font-mono text-[11px] cursor-pointer"
                      >
                        + Add Equipment Asset
                      </button>
                    </div>
                    {newCustAssets.map((asset, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                        <select
                          value={asset.equipment_type}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewCustAssets((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, equipment_type: val } : a))
                            );
                          }}
                          className="bg-black border border-zinc-700 rounded px-2 py-1 text-white text-[11px]"
                        >
                          {EQUIPMENT_SCOPE_3JI_REPAIR.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={asset.make_model}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewCustAssets((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, make_model: val } : a))
                            );
                          }}
                          placeholder="Make / Model"
                          className="bg-black border border-zinc-700 rounded px-2 py-1 text-white text-[11px]"
                        />
                        <input
                          type="text"
                          value={asset.serial_number}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewCustAssets((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, serial_number: val } : a))
                            );
                          }}
                          placeholder="Serial #"
                          className="bg-black border border-zinc-700 rounded px-2 py-1 text-white font-mono text-[11px]"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    data-testid="staff-create-customer-submit"
                    className="w-full py-2 rounded bg-[#5ADCC8] text-black font-black uppercase tracking-wider text-xs hover:bg-[#5ADCC8]/90 cursor-pointer"
                  >
                    Create Customer Profile &amp; Register {newCustAssets.length} Equipment Assets
                  </button>
                </form>

                {/* 2. Available-Opportunities Oversight & Module 1 Retention Escalation Rule */}
                <div
                  data-testid="staff-opportunities-oversight"
                  className="lg:col-span-6 bg-black border border-zinc-800 rounded p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-black uppercase text-[#5ADCC8]">
                      2. Available-Opportunities Oversight (Module 1 Retention Rule)
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      1h Emergency / 2h Widen / 4h → Jason&apos;s Schedule
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    No customer request is ever left hanging: unclaimed emergency opportunities after <strong>1h</strong> (or standard opportunities after <strong>2h widen / 4h</strong> or within <strong>2h of promised window</strong>) escalate to Needs Jason, land on <strong>Jason&apos;s tentative schedule</strong>, and prepare a draft-first customer update.
                  </p>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {state.jobs.map((job) => (
                      <div
                        key={job.id}
                        data-testid={`staff-oversight-job-${job.id}`}
                        className={`p-3 rounded border space-y-1.5 ${
                          job.on_jason_tentative_schedule && job.status === 'Unclaimed'
                            ? 'bg-red-950/30 border-red-500'
                            : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono font-bold text-[#5ADCC8]">
                            {job.id} · {job.business_name} ({job.city})
                          </span>
                          <span className="px-2 py-0.5 rounded bg-black border border-zinc-700 font-mono text-[10px] text-white">
                            {job.escalation_stage}
                          </span>
                        </div>
                        <div className="text-zinc-300">
                          {job.equipment_category}: {job.machine_type} — <em>{job.reported_symptom}</em>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          Posted: {job.posted_hours_ago}h ago · Window: {job.promised_window} · Status:{' '}
                          <strong className="text-white">{job.status}</strong>
                          {job.claimed_by_name ? ` (${job.claimed_by_name})` : ''}
                        </div>
                        {job.draft_customer_update && (
                          <div className="p-2 rounded bg-black border border-zinc-800 font-mono text-[11px] text-amber-300">
                            Draft Customer Update: &ldquo;{job.draft_customer_update}&rdquo;
                          </div>
                        )}
                        {job.status === 'Unclaimed' && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              data-testid={`staff-schedule-jason-btn-${job.id}`}
                              onClick={() => handleScheduleJasonOnOpportunity(job.id)}
                              className="px-3 py-1 rounded bg-[#5ADCC8] text-black font-black uppercase text-[11px] hover:bg-[#5ADCC8]/90 cursor-pointer"
                            >
                              Schedule Jason onto this opportunity
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Support Docs Management (Ships EMPTY with 15 Equipment Categories) */}
              <div
                data-testid="staff-support-docs-manager"
                className="bg-black border border-zinc-800 rounded p-5 space-y-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#5ADCC8]">
                      3. Support Docs Management — 15 Equipment Categories (Ships Empty · Live Upload to Technician Portal)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Full 15-category tree from Jason&apos;s 3JI-Repair equipment scope. Library ships empty (0 seeded PDFs) — upload support PDFs below and they immediately appear in the Technician Portal.
                    </p>
                  </div>
                  <span
                    data-testid="support-docs-count-badge"
                    className="px-3 py-1 rounded bg-[#5ADCC8]/15 border border-[#5ADCC8] text-[#5ADCC8] font-mono font-bold"
                  >
                    {state.support_docs.length} PDFs Uploaded Across 15 Categories
                  </span>
                </div>

                {/* 15-Category Tree Pills */}
                <div
                  data-testid="support-docs-category-tree"
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"
                >
                  {EQUIPMENT_SCOPE_3JI_REPAIR.map((cat) => {
                    const count = state.support_docs.filter((d) => d.equipment_type === cat).length;
                    return (
                      <div
                        key={cat}
                        className={`p-2 rounded border font-mono text-[11px] flex items-center justify-between gap-1 ${
                          count > 0
                            ? 'bg-[#5ADCC8]/15 border-[#5ADCC8] text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <span className="truncate" title={cat}>
                          {cat}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-black text-[#5ADCC8] font-bold shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Upload Form + Uploaded Docs List */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                  <form
                    onSubmit={handleUploadSupportDoc}
                    data-testid="upload-support-doc-form"
                    className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded p-4 space-y-3"
                  >
                    <div className="font-black uppercase text-white">Upload Support PDF to Category</div>
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Equipment Category (15-Item Scope)</label>
                      <select
                        data-testid="upload-doc-category-select"
                        value={docEquipType}
                        onChange={(e) => setDocEquipType(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                      >
                        {EQUIPMENT_SCOPE_3JI_REPAIR.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Document Title</label>
                      <input
                        type="text"
                        data-testid="upload-doc-title-input"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">PDF File Name</label>
                      <input
                        type="text"
                        data-testid="upload-doc-filename-input"
                        value={docFileName}
                        onChange={(e) => setDocFileName(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Technician Field Notes</label>
                      <input
                        type="text"
                        value={docNotes}
                        onChange={(e) => setDocNotes(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      data-testid="upload-support-doc-submit"
                      className="w-full py-2 rounded bg-[#5ADCC8] text-black font-black uppercase tracking-wider text-xs hover:bg-[#5ADCC8]/90 cursor-pointer"
                    >
                      Upload PDF to Support Library
                    </button>
                  </form>

                  <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded p-4 space-y-3">
                    <div className="font-black uppercase text-white">
                      Uploaded Support Documents ({state.support_docs.length})
                    </div>
                    {state.support_docs.length === 0 ? (
                      <div
                        data-testid="support-docs-empty-state"
                        className="p-6 rounded bg-black border border-dashed border-zinc-700 text-center space-y-1 font-mono"
                      >
                        <div className="text-[#5ADCC8] font-bold">
                          Support Docs Library is Empty (0 Seeded Documents)
                        </div>
                        <p className="text-zinc-400 text-[11px]">
                          All 15 3JI-Repair equipment categories are ready. Upload a PDF on the left to publish it to the Technician Portal.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {state.support_docs.map((doc) => (
                          <div
                            key={doc.id}
                            data-testid={`staff-support-doc-row-${doc.id}`}
                            className="p-3 rounded bg-black border border-[#5ADCC8] flex flex-wrap items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-white">
                                📄 {doc.title} <span className="font-mono text-xs text-[#5ADCC8]">({doc.file_name})</span>
                              </div>
                              <div className="text-[11px] font-mono text-zinc-300">
                                Equipment Type: <strong>{doc.equipment_type}</strong> · Uploaded by {doc.uploaded_by}
                              </div>
                              <div className="text-[11px] text-zinc-400">{doc.file_notes}</div>
                            </div>
                            <span className="px-2 py-1 rounded bg-[#5ADCC8]/20 text-[#5ADCC8] font-mono text-[10px] font-bold">
                              Published to Tech Portal
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            MODULE 1: CUYAHOGA COUNTY JOB MAP & ROLE-GATED OPPORTUNITY CLAIMING
           ===================================================================== */}
        <section
          id="module-job-map"
          data-testid="module-job-map"
          aria-label="Module 1: Cuyahoga County Job Map & Claiming"
          className="bg-zinc-950 border border-zinc-800 rounded p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                  Module 1
                </span>
                <h1 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                  3JI-Repair Opportunity Map &amp; Role-Gated Claiming (Launch Area: Cuyahoga County)
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Launch Service Area: <strong className="text-[#5ADCC8]">CUYAHOGA COUNTY, OHIO ONLY</strong> (configurable for future expansion) · Care-Plan opportunities surface first · Customer-retention escalation rule: <strong className="text-white">1h emergency / 2h widen / 4h or 2h-before-window → lands on Jason&apos;s schedule + draft customer update</strong>.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <select
                aria-label="Filter by Urgency"
                data-testid="filter-urgency"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="bg-black border border-zinc-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="ALL">All Urgencies</option>
                <option value="Emergency Down — Loaner Needed">Emergency Down — Loaner Needed</option>
                <option value="Standard Repair">Standard Repair</option>
                <option value="Scheduled PM">Scheduled PM</option>
                <option value="Ready for Return Swap">Ready for Return Swap</option>
              </select>

              <select
                aria-label="Filter by Skill Level"
                data-testid="filter-level"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-black border border-zinc-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="ALL">All Skill Levels (L1/L2/L3)</option>
                <option value="L1">L1 — PM / Swap</option>
                <option value="L2">L2 — Sealed System / EPA 608</option>
                <option value="L3">L3 — Master / Foundry</option>
              </select>

              <select
                aria-label="Filter by Loaner Required"
                data-testid="filter-loaner"
                value={loanerFilter}
                onChange={(e) => setLoanerFilter(e.target.value)}
                className="bg-black border border-zinc-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="ALL">Loaner: All</option>
                <option value="YES">Loaner Needed: Yes</option>
                <option value="NO">Loaner Needed: No</option>
              </select>

              <select
                aria-label="Filter by Cuyahoga City"
                data-testid="filter-city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-black border border-zinc-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="ALL">All Cuyahoga Cities</option>
                <option value="Cleveland">Cleveland</option>
                <option value="Lakewood">Lakewood</option>
                <option value="Parma">Parma</option>
                <option value="Rocky River">Rocky River</option>
              </select>
            </div>
          </div>

          {/* Interactive Cuyahoga County Map Visualization */}
          <div className="bg-black border border-zinc-800 rounded p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400 mb-3">
              <span>CUYAHOGA COUNTY, OH LIVE 3JI-REPAIR DISPATCH GRID (41.4993° N, 81.6944° W)</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Red = Machine Down (Loaner Swap)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" /> Amber = Degraded / Standard Repair
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#5ADCC8] inline-block" /> Blue/Teal = Scheduled PM / Return Swap
                </span>
              </div>
            </div>

            {/* Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => {
                const perm = evaluateJobClaimPermission(job);
                const isClaimed = job.status !== 'Unclaimed';
                return (
                  <div
                    key={job.id}
                    data-testid={`job-card-${job.id}`}
                    className="p-4 rounded bg-zinc-950 border border-zinc-800 hover:border-[#5ADCC8]/60 transition flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-3 w-3 rounded-full shrink-0 ${
                              job.dot_color === 'red'
                                ? 'bg-red-500'
                                : job.dot_color === 'amber'
                                ? 'bg-amber-400'
                                : 'bg-[#5ADCC8]'
                            }`}
                          />
                          <span className="font-mono text-xs font-bold text-[#5ADCC8]">
                            {job.id}
                          </span>
                          <span className="text-xs font-black uppercase text-white">
                            {job.urgency}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-black border border-zinc-700 font-mono text-[11px] text-[#5ADCC8] font-bold">
                          Req: {job.required_level}
                          {job.requires_epa_608 ? ' + EPA 608' : ''}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white">{job.business_name}</div>
                      <div className="text-xs text-zinc-300">
                        <strong>City:</strong> {job.city}, OH ({job.zip} · {job.county} County) ·{' '}
                        <strong>Care Plan:</strong>{' '}
                        <span className="text-[#5ADCC8]">{job.care_plan_status}</span>
                      </div>
                      <div className="text-xs text-zinc-300">
                        <strong>Category:</strong> {job.equipment_category} · <strong>Equipment:</strong> {job.machine_type} ({job.serial_number})
                      </div>
                      <div className="text-xs text-zinc-400">
                        <strong>Symptom:</strong> {job.reported_symptom}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-300 pt-1">
                        <span className="px-2 py-0.5 rounded bg-black border border-zinc-800">
                          Loaner Needed: <strong>{job.loaner_needed ? `YES (${job.assigned_loaner_id || 'Auto-Reserve'})` : 'NO'}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black border border-zinc-800">
                          Split: <strong className="text-[#5ADCC8]">{job.payout_mode}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black border border-zinc-800 text-amber-300">
                          Retention Stage: {job.escalation_stage}
                        </span>
                      </div>
                    </div>

                    {/* Role-Gated Action Footer */}
                    <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] font-mono text-zinc-400">
                        {isClaimed ? (
                          <span className="text-[#5ADCC8] font-bold">
                            ✓ Status: {job.status} by {job.claimed_by_name}
                          </span>
                        ) : (
                          <span>{perm.reason}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {activeRole === '3JI-Repair Trainee' && !activeTrainee.can_claim_solo ? (
                          <>
                            <button
                              type="button"
                              data-testid={`shadow-ride-btn-${job.id}`}
                              onClick={() => handleRequestShadowRide(job.id)}
                              className="px-3 py-1.5 rounded bg-zinc-900 border border-[#5ADCC8] text-[#5ADCC8] text-[11px] font-mono font-bold hover:bg-[#5ADCC8] hover:text-black transition cursor-pointer"
                            >
                              {job.shadow_requested_by.includes(activeTrainee.id)
                                ? '✓ Shadow Ride Requested'
                                : 'Shadow Ride Available — Request Assignment'}
                            </button>
                            <button
                              type="button"
                              data-testid={`claim-job-btn-${job.id}`}
                              disabled
                              className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 text-[11px] font-mono uppercase cursor-not-allowed"
                            >
                              Solo Claim Locked (Trainee)
                            </button>
                          </>
                        ) : isClaimed ? (
                          <span
                            data-testid={`job-claimed-badge-${job.id}`}
                            className="px-3 py-1.5 rounded bg-[#5ADCC8]/15 border border-[#5ADCC8] text-[#5ADCC8] text-[11px] font-mono font-bold"
                          >
                            Claimed
                          </span>
                        ) : (
                          <button
                            type="button"
                            data-testid={`claim-job-btn-${job.id}`}
                            disabled={!perm.canClaim}
                            onClick={() => handleClaimJob(job.id)}
                            className={`px-3.5 py-1.5 rounded text-xs font-black uppercase tracking-wider transition ${
                              perm.canClaim
                                ? 'bg-[#5ADCC8] text-black hover:bg-[#5ADCC8]/90 cursor-pointer'
                                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                            }`}
                          >
                            {perm.canClaim
                              ? `Claim Job (${job.required_level})`
                              : `Locked (${job.required_level}${job.requires_epa_608 ? ' / EPA 608' : ''})`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            MODULE 2: 9-STEP LOANER WORKFLOW + OHIO FOOD CODE (OAC 3717-1-08.1) GATE
           ===================================================================== */}
        <section
          id="module-loaner-workflow"
          data-testid="module-loaner-workflow"
          aria-label="Module 2: 9-Step Loaner Machine Workflow & Ohio Food Code Gate"
          className="bg-zinc-950 border border-zinc-800 rounded p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                  Module 2
                </span>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                  End-to-End 9-Step Loaner Machine Workflow &amp; Ohio Food Code Gate
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Drop off &amp; install loaner first so the customer keeps selling (~$98/day saved) · Hard Gate on Step 8 → Step 9: Loaner cannot return to <strong className="text-[#5ADCC8]">Available</strong> until all 4 <strong className="text-[#5ADCC8]">OAC 3717-1-08.1</strong> sanitation checks are completed.
              </p>
            </div>

            {/* Loaner Unit Selector LN-01..LN-05 */}
            <div className="flex items-center gap-2">
              <label htmlFor="loaner-unit-select" className="text-xs font-mono text-zinc-400">
                Inspect Loaner Asset:
              </label>
              <select
                id="loaner-unit-select"
                data-testid="loaner-selector"
                value={selectedLoaner.id}
                onChange={(e) => setSelectedLoanerId(e.target.value)}
                className="bg-black border border-[#5ADCC8] text-[#5ADCC8] font-mono font-bold text-xs rounded px-3 py-1.5"
              >
                {state.loaners.map((ln) => (
                  <option key={ln.id} value={ln.id}>
                    {ln.id} — {ln.status} (Step {ln.active_workflow_step}/9)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Loaner Status Banner */}
          <div className="p-4 rounded bg-black border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-black text-[#5ADCC8]">{selectedLoaner.id}</span>
                <span className="text-sm font-bold text-white">{selectedLoaner.machine_type}</span>
                <span
                  data-testid="selected-loaner-status"
                  className="px-2 py-0.5 rounded bg-[#5ADCC8]/15 border border-[#5ADCC8] text-[#5ADCC8] font-mono text-xs font-bold"
                >
                  {selectedLoaner.status}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-1 font-mono">
                Serial: {selectedLoaner.serial_number} · Location: {selectedLoaner.current_location} · Pricing:{' '}
                <strong className="text-white">{selectedLoaner.pricing_mode}</strong>
              </div>
            </div>
            <div className="text-xs font-mono text-zinc-300">
              Active Workflow Step: <strong className="text-[#5ADCC8]">Step {selectedLoaner.active_workflow_step} of 9</strong>
            </div>
          </div>

          {/* 9-Step Stepper Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {NINE_STEPS.map((s) => {
              const isCurrent = selectedLoaner.active_workflow_step === s.step;
              const isCompleted = selectedLoaner.active_workflow_step > s.step;
              return (
                <div
                  key={s.step}
                  data-testid={`loaner-step-${s.step}`}
                  className={`p-3.5 rounded border transition flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-black border-[#5ADCC8] ring-1 ring-[#5ADCC8]'
                      : isCompleted
                      ? 'bg-black/60 border-zinc-800 text-zinc-300'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-white">{s.title}</span>
                      <span className="text-[10px] font-mono text-[#5ADCC8]">
                        {isCompleted ? '✓ Done' : isCurrent ? '● Active' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{s.desc}</p>
                  </div>
                  {s.step < 9 && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceLoanerStep(s.step)}
                      className="mt-2 self-start text-[10px] font-mono text-[#5ADCC8] hover:underline cursor-pointer"
                    >
                      Set to Step {s.step}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hard Gate Box: Step 8 -> Step 9 Ohio Food Code OAC 3717-1-08.1 */}
          <div
            data-testid="ohio-food-code-gate-box"
            className="p-5 rounded bg-black border-2 border-[#5ADCC8] space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#5ADCC8] font-bold">
                  Mandatory Regulatory Gate · Ohio Food Code OAC 3717-1-08.1
                </span>
                <h3 className="text-base font-black uppercase text-white">
                  Step 8 → Step 9 Gate: Post-Return Sanitizing &amp; Bench Prep ({selectedLoaner.id})
                </h3>
              </div>
              <span
                data-testid="sanitation-gate-state"
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                  allSanitationChecksPassed
                    ? 'bg-[#5ADCC8] text-black'
                    : 'bg-red-950 text-red-300 border border-red-500'
                }`}
              >
                {allSanitationChecksPassed
                  ? '✓ All 4 OAC 3717-1-08.1 Checks Verified — Ready for Available'
                  : '🔒 Gate Locked: Complete All 4 OAC 3717-1-08.1 Checks to Unlock Available'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded bg-zinc-950 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="chk-wash-rinse-sanitize"
                  checked={selectedLoaner.sanitation_checklist.wash_rinse_sanitize_completed}
                  onChange={(e) =>
                    handleUpdateLoanerChecklist('wash_rinse_sanitize_completed', e.target.checked)
                  }
                  className="mt-0.5"
                />
                <span>
                  <strong className="text-white">1. Wash, Rinse &amp; Food-Contact Sanitize Completed</strong>
                  <br />
                  <span className="text-zinc-400">
                    Full bowl, auger, faucet, and seal teardown washed &amp; sanitized per OAC 3717-1-08.1.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded bg-zinc-950 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="chk-sanitizer-ppm"
                  checked={selectedLoaner.sanitation_checklist.sanitizer_ppm_verified}
                  onChange={(e) =>
                    handleUpdateLoanerChecklist('sanitizer_ppm_verified', e.target.checked)
                  }
                  className="mt-0.5"
                />
                <span>
                  <strong className="text-white">2. Sanitizer Concentration (PPM) Test-Strip Verified</strong>
                  <br />
                  <span className="text-zinc-400">
                    200 ppm Quaternary Ammonium or 50–100 ppm Chlorine verified &amp; logged.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded bg-zinc-950 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="chk-food-contact-parts"
                  checked={selectedLoaner.sanitation_checklist.food_contact_parts_inspected}
                  onChange={(e) =>
                    handleUpdateLoanerChecklist('food_contact_parts_inspected', e.target.checked)
                  }
                  className="mt-0.5"
                />
                <span>
                  <strong className="text-white">3. Food-Contact Gaskets, Seals &amp; Bushings Inspected</strong>
                  <br />
                  <span className="text-zinc-400">
                    Food-grade lubricant applied; rear seal &amp; drive bushing verified clean.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded bg-zinc-950 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="chk-leak-freeze-test"
                  checked={selectedLoaner.sanitation_checklist.leak_and_freeze_test_passed}
                  onChange={(e) =>
                    handleUpdateLoanerChecklist('leak_and_freeze_test_passed', e.target.checked)
                  }
                  className="mt-0.5"
                />
                <span>
                  <strong className="text-white">4. Bench Leak, Brix (13–15°) &amp; Freeze Pull-Down Test Passed</strong>
                  <br />
                  <span className="text-zinc-400">
                    Zero weeping at rear seal; cylinder pull-down temperature verified.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="tech-initials-input" className="font-mono text-zinc-300">
                  Sanitizing Tech Initials:
                </label>
                <input
                  id="tech-initials-input"
                  data-testid="sanitation-tech-initials"
                  type="text"
                  maxLength={5}
                  value={selectedLoaner.sanitation_tech_initials}
                  onChange={(e) => handleUpdateLoanerInitials(e.target.value)}
                  placeholder="JA"
                  className="w-24 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-mono uppercase"
                />
              </div>

              <button
                type="button"
                data-testid="return-loaner-to-available-btn"
                disabled={!allSanitationChecksPassed}
                onClick={() => handleAdvanceLoanerStep(9)}
                className={`px-5 py-2.5 rounded text-xs font-black uppercase tracking-wider transition ${
                  allSanitationChecksPassed
                    ? 'bg-[#5ADCC8] text-black hover:bg-[#5ADCC8]/90 cursor-pointer'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                }`}
              >
                Complete OAC 3717-1-08.1 Sanitation &amp; Return Loaner to Available (Step 9)
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================================
            MODULE 3: INVENTORY MANAGEMENT (+35% STANDARD / +25% CONTRACT)
           ===================================================================== */}
        <section
          id="module-inventory"
          data-testid="module-inventory"
          aria-label="Module 3: Inventory Management"
          className="bg-zinc-950 border border-zinc-800 rounded p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                  Module 3
                </span>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                  Inventory Management — Foundry Parts, 3JI-Repair Parts &amp; Loaner Fleet
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Auto-calculated pricing: <strong className="text-[#5ADCC8]">+35% Standard List Markup</strong> (cost × 1.35) and <strong className="text-[#5ADCC8]">+25% Contract Account Markup</strong> (cost × 1.25) · Low-stock alerts feed OS Needs Jason queue.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              {[
                { id: 'ALL', label: 'All Inventory Tabs' },
                { id: 'DIV1', label: 'Tab 1: Div 01 Foundry Parts' },
                { id: 'DIV2', label: 'Tab 2: Div 02 3JI-Repair Parts' },
                { id: 'LOANERS', label: 'Tab 3: Loaner Fleet (LN-01..LN-05)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  data-testid={`inv-tab-${t.id.toLowerCase()}`}
                  onClick={() => setInvTab(t.id as 'ALL' | 'DIV1' | 'DIV2' | 'LOANERS')}
                  className={`px-3 py-1.5 rounded font-bold uppercase cursor-pointer ${
                    invTab === t.id
                      ? 'bg-[#5ADCC8] text-black'
                      : 'bg-black text-zinc-300 border border-zinc-800 hover:border-[#5ADCC8]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parts Table (Div 01 & Div 02) */}
          {invTab !== 'LOANERS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] font-mono uppercase text-zinc-400">
                    <th className="py-2.5 px-3">SKU &amp; Division</th>
                    <th className="py-2.5 px-3">Part / Family / Serial-Fit Notes</th>
                    <th className="py-2.5 px-3">System Fit</th>
                    <th className="py-2.5 px-3">Unit Cost</th>
                    <th className="py-2.5 px-3">+35% Standard</th>
                    <th className="py-2.5 px-3">+25% Contract</th>
                    <th className="py-2.5 px-3">Stock / Alert</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {state.parts
                    .filter((p) => {
                      if (invTab === 'DIV1') return p.division === 'Division 01 — Foundry';
                      if (invTab === 'DIV2') return p.division === 'Division 02 — 3JI-Repair';
                      return true;
                    })
                    .map((part) => {
                      const isLow = part.qty_on_hand <= part.reorder_point;
                      return (
                        <tr
                          key={part.id}
                          data-testid={`part-row-${part.sku}`}
                          className="hover:bg-black/60"
                        >
                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold text-[#5ADCC8]">{part.sku}</div>
                            <div className="text-[10px] text-zinc-400">{part.division}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{part.name}</div>
                            <div className="text-[11px] text-zinc-400">
                              {part.family} · <em>{part.serial_fit_notes}</em>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-zinc-200">{part.system_fit}</td>
                          <td className="py-3 px-3 font-mono text-zinc-300">
                            ${part.unit_cost.toFixed(2)}
                          </td>
                          <td
                            data-testid={`part-list35-${part.sku}`}
                            className="py-3 px-3 font-mono font-bold text-[#5ADCC8]"
                          >
                            ${part.list_price_35.toFixed(2)}
                          </td>
                          <td
                            data-testid={`part-contract25-${part.sku}`}
                            className="py-3 px-3 font-mono font-bold text-white"
                          >
                            ${part.contract_price_25.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <span
                              data-testid={`part-qty-${part.sku}`}
                              className="font-bold text-white"
                            >
                              {part.qty_on_hand}
                            </span>{' '}
                            <span className="text-zinc-500">(Min {part.reorder_point})</span>
                            {isLow && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 text-[10px]">
                                LOW STOCK
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              data-testid={`use-part-btn-${part.sku}`}
                              onClick={() => handleUsePart(part.id, part.sku)}
                              className="px-2.5 py-1 rounded bg-[#5ADCC8] text-black font-black uppercase text-[10px] hover:bg-[#5ADCC8]/90 cursor-pointer"
                            >
                              Use Part on Job / Quote
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Loaner Fleet Registry Table (LN-01..LN-05) */}
          {(invTab === 'ALL' || invTab === 'LOANERS') && (
            <div className="pt-3 border-t border-zinc-800">
              <div className="text-xs font-mono uppercase text-[#5ADCC8] font-bold mb-2">
                Loaner Machine Fleet Registry (LN-01 .. LN-05)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                {state.loaners.map((ln) => (
                  <div
                    key={ln.id}
                    data-testid={`fleet-registry-${ln.id}`}
                    className="p-3 rounded bg-black border border-zinc-800 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-black text-[#5ADCC8]">{ln.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                        {ln.status}
                      </span>
                    </div>
                    <div className="font-bold text-white text-[11px]">{ln.machine_type}</div>
                    <div className="text-[10px] font-mono text-zinc-400">SN: {ln.serial_number}</div>
                    <div className="text-[10px] text-zinc-400">{ln.current_location}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            MODULE 4: QUOTE GENERATOR (<24-HOUR TURNAROUND PROMISE & LOCKED PRICING)
           ===================================================================== */}
        <section
          id="module-quote-generator"
          data-testid="module-quote-generator"
          aria-label="Module 4: Quote Generator"
          className="bg-zinc-950 border border-zinc-800 rounded p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                  Module 4
                </span>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                  Quote Generator — Locked Pricing Engine &amp; &lt;24-Hour Turnaround Promise
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Diagnostic <strong className="text-white">$99 (credited toward repair)</strong> · Bench <strong className="text-white">$119–129/hr</strong> · Field <strong className="text-white">$139–149/hr</strong> · Refrigeration/Master <strong className="text-white">$169–179/hr</strong> · Parts <strong className="text-white">+35% (+25% contract)</strong> · Loaner <strong className="text-white">$25–49/day or $149–249/incident ($0 Care Plan)</strong>.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded bg-[#5ADCC8]/15 border border-[#5ADCC8] text-[#5ADCC8] font-mono text-xs font-bold">
              ⏱ Estimate Within 24 Hours SLA Active
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Quote Builder Controls */}
            <div className="lg:col-span-7 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Division</label>
                  <select
                    data-testid="quote-division-select"
                    value={qDivision}
                    onChange={(e) =>
                      setQDivision(
                        e.target.value as 'Division 01 — Foundry' | 'Division 02 — 3JI-Repair'
                      )
                    }
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  >
                    <option value="Division 02 — 3JI-Repair">
                      Division 02 — 3JI-Repair (Cuyahoga County Launch Area)
                    </option>
                    <option value="Division 01 — Foundry">
                      Division 01 — Foundry Support (Nationwide)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Customer Account (Placeholder)</label>
                  <input
                    type="text"
                    value={qBusinessName}
                    onChange={(e) => setQBusinessName(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Machine / Foundry System</label>
                  <input
                    type="text"
                    value={qMachine}
                    onChange={(e) => setQMachine(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Unit Serial Number</label>
                  <input
                    type="text"
                    value={qSerial}
                    onChange={(e) => setQSerial(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Diagnostic $99 & Credit Toggle */}
              <div className="p-3.5 rounded bg-black border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="quote-include-diag-99"
                    checked={qIncludeDiag}
                    onChange={(e) => setQIncludeDiag(e.target.checked)}
                  />
                  <span className="font-bold text-white">Include $99 Diagnostic Fee</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="quote-credit-diag-99"
                    checked={qCreditDiag}
                    onChange={(e) => setQCreditDiag(e.target.checked)}
                  />
                  <span className="font-bold text-[#5ADCC8]">
                    Credit $99 Diagnostic Toward Repair (-$99)
                  </span>
                </label>
              </div>

              {/* Locked Labor Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Locked Labor Tier</label>
                  <select
                    data-testid="quote-labor-tier"
                    value={qLaborTier}
                    onChange={(e) =>
                      handleLaborTierChange(
                        e.target.value as
                          | 'Bench ($119–129/hr)'
                          | 'Field ($139–149/hr)'
                          | 'Refrigeration / Master ($169–179/hr)'
                      )
                    }
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  >
                    <option value="Bench ($119–129/hr)">Bench Labor ($119–129/hr)</option>
                    <option value="Field ($139–149/hr)">Field Labor ($139–149/hr)</option>
                    <option value="Refrigeration / Master ($169–179/hr)">
                      Refrigeration / Master ($169–179/hr)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Hourly Rate ($/hr)</label>
                  <input
                    type="number"
                    data-testid="quote-labor-rate"
                    value={qLaborRate}
                    onChange={(e) => setQLaborRate(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    data-testid="quote-labor-hours"
                    min={1}
                    value={qLaborHours}
                    onChange={(e) => setQLaborHours(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Parts Selection & +35%/+25% Markup */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-mono text-zinc-400 mb-1">
                    Pull Part from Inventory ({qContractMarkup ? '+25% Contract' : '+35% Standard'})
                  </label>
                  <select
                    data-testid="quote-part-select"
                    value={qSelectedPartId}
                    onChange={(e) => setQSelectedPartId(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  >
                    {state.parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name} (Cost ${p.unit_cost} → +35%: ${p.list_price_35} / +25%: $
                        {p.contract_price_25})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col justify-between">
                  <label className="flex items-center gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="quote-contract-markup-toggle"
                      checked={qContractMarkup}
                      onChange={(e) => setQContractMarkup(e.target.checked)}
                    />
                    <span className="font-mono text-[#5ADCC8]">Contract Account (+25%)</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-zinc-400">Qty:</span>
                    <input
                      type="number"
                      min={1}
                      value={qPartQty}
                      onChange={(e) => setQPartQty(Number(e.target.value))}
                      className="w-20 bg-black border border-zinc-700 rounded px-2 py-1 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Loaner Line & Care Plan Auto-Waive */}
              <div className="p-3.5 rounded bg-black border border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="quote-care-plan-toggle"
                      checked={qCarePlanActive}
                      onChange={(e) => setQCarePlanActive(e.target.checked)}
                    />
                    <span className="font-bold text-[#5ADCC8]">
                      Customer on Care Plan ($149–199/mo Loc or $79–99/mo Single — Waives Loaner to $0)
                    </span>
                  </label>
                </div>

                {!qCarePlanActive && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Loaner Billing Mode</label>
                      <select
                        value={qLoanerMode}
                        onChange={(e) =>
                          setQLoanMode(
                            e.target.value as
                              | 'Daily ($39/day)'
                              | 'Incident Flat ($199/incident)'
                              | 'None'
                          )
                        }
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white"
                      >
                        <option value="Incident Flat ($199/incident)">
                          Per-Incident Loaner ($149–249/incident → $199)
                        </option>
                        <option value="Daily ($39/day)">Daily Loaner ($25–49/day → $39/day)</option>
                        <option value="None">No Loaner Required ($0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-zinc-400 mb-1">Loaner Days</label>
                      <input
                        type="number"
                        min={1}
                        value={qLoanerDays}
                        onChange={(e) => setQLoanerDays(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Quote Summary + Downtime Math Callout */}
            <div className="lg:col-span-5 bg-black border border-zinc-800 rounded p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-sm font-black uppercase text-[#5ADCC8]">
                    Customer Estimate Preview (&lt;24h SLA)
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">Draft-First Gate</span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span>Diagnostic Fee ($99):</span>
                    <span>${diagFee.toFixed(2)}</span>
                  </div>
                  {qIncludeDiag && qCreditDiag && (
                    <div
                      data-testid="quote-diag-credit-line"
                      className="flex justify-between text-[#5ADCC8] font-bold"
                    >
                      <span>Diagnostic Credit Toward Repair:</span>
                      <span>-$99.00</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>
                      Labor ({qLaborTier} · {qLaborHours}h × ${qLaborRate}/hr):
                    </span>
                    <span>${laborTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Parts ({selectedPartObj.sku} × {qPartQty} @ {qContractMarkup ? '+25%' : '+35%'}):
                    </span>
                    <span>${partLineTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loaner Machine Program:</span>
                    <span data-testid="quote-loaner-price-line" className="text-[#5ADCC8] font-bold">
                      {qCarePlanActive ? '$0.00 (Waived — Care Plan)' : `$${loanerTotal.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between text-base font-black text-white">
                    <span>Total Estimate:</span>
                    <span data-testid="quote-grand-total" className="text-[#5ADCC8]">
                      ${grandTotalQuote.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Downtime Comparison Callout (60 drinks/day * ~$2.72/drink ≈ $98/day) */}
                <div
                  data-testid="downtime-comparison-callout"
                  className="p-3.5 rounded bg-zinc-950 border border-[#5ADCC8]/50 space-y-2 text-xs"
                >
                  <div className="font-black uppercase text-[#5ADCC8]">
                    Downtime Comparison Callout (Frozen Beverage Economics)
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    A down frozen machine costs{' '}
                    <strong>60 drinks/day × ~$2.72/drink ≈ $98/day</strong> in lost gross profit (
                    <strong>~${totalDowntimeLoss}/incident</strong> over {qDaysDown} days down). 3JI-Repair drops off a loaner machine first so you keep selling.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div>
                      <span className="text-zinc-400">Drinks/Day: </span>
                      <input
                        type="number"
                        value={qDrinksPerDay}
                        onChange={(e) => setQDrinksPerDay(Number(e.target.value))}
                        className="w-16 bg-black border border-zinc-700 rounded px-1.5 py-0.5 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-zinc-400">Est. Lost Profit: </span>
                      <strong className="text-[#5ADCC8]">${exactSpecDailyLoss}/day</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  data-testid="save-quote-draft-btn"
                  onClick={() => handleCreateQuote('Draft')}
                  className="py-2.5 px-3 rounded bg-zinc-900 border border-zinc-700 text-white font-bold uppercase text-xs hover:border-[#5ADCC8] cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  data-testid="submit-quote-jason-btn"
                  onClick={() => handleCreateQuote('Needs Jason Approval')}
                  className="py-2.5 px-3 rounded bg-[#5ADCC8] text-black font-black uppercase text-xs hover:bg-[#5ADCC8]/90 cursor-pointer"
                >
                  Submit for Jason Approval
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            MODULE 5: MOBILE WORK BOOKING (CUYAHOGA COUNTY VALIDATION GATE)
           ===================================================================== */}
        <section
          id="module-booking"
          data-testid="module-booking"
          aria-label="Module 5: Mobile Work Booking"
          className="bg-zinc-950 border border-zinc-800 rounded p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                  Module 5
                </span>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                  Mobile Work Booking — Cuyahoga County Validation (3JI-Repair) &amp; Nationwide Foundry (Div 01)
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                3JI-Repair (Division 02) bookings validate <strong className="text-[#5ADCC8]">CUYAHOGA COUNTY, OHIO ONLY</strong> city &amp; ZIP. Out-of-county requests display a clear Cuyahoga-only notice and optionally escalate to Needs Jason.
              </p>
            </div>
          </div>

          <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-mono text-zinc-400 mb-1">Service Division</label>
              <select
                data-testid="booking-division-select"
                value={bkDivision}
                onChange={(e) =>
                  setBkDivision(
                    e.target.value as 'Division 02 — 3JI-Repair' | 'Division 01 — Foundry'
                  )
                }
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
              >
                <option value="Division 02 — 3JI-Repair">
                  Division 02 — 3JI-Repair (CUYAHOGA COUNTY, OH ONLY)
                </option>
                <option value="Division 01 — Foundry">
                  Division 01 — Foundry Support (Nationwide USA)
                </option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-zinc-400 mb-1">Business Name (Placeholder)</label>
              <input
                type="text"
                data-testid="booking-business-input"
                value={bkBusiness}
                onChange={(e) => setBkBusiness(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-zinc-400 mb-1">Street Address</label>
              <input
                type="text"
                value={bkAddress}
                onChange={(e) => setBkAddress(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-zinc-400 mb-1">City</label>
              <input
                type="text"
                data-testid="booking-city-input"
                value={bkCity}
                onChange={(e) => setBkCity(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-zinc-400 mb-1">ZIP Code</label>
              <input
                type="text"
                data-testid="booking-zip-input"
                value={bkZip}
                onChange={(e) => setBkZip(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-zinc-400 mb-1">County / State</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  data-testid="booking-county-input"
                  value={bkCounty}
                  onChange={(e) => setBkCounty(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                />
                <input
                  type="text"
                  value={bkState}
                  onChange={(e) => setBkState(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-zinc-400 mb-1">Equipment Category (15-Item Scope) / Platform</label>
              <select
                value={bkMachine}
                onChange={(e) => setBkMachine(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
              >
                {EQUIPMENT_SCOPE_3JI_REPAIR.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="FDU — Foundry Degassing Unit">FDU — Foundry Degassing Unit (Div 01)</option>
                <option value="MTS 1500 — Metal Treatment Station">MTS 1500 — Metal Treatment Station (Div 01)</option>
                <option value="SMARTT — Rotary Degassing">SMARTT — Rotary Degassing (Div 01)</option>
                <option value="ThermaTest NGIII 5000">ThermaTest NGIII 5000 (Div 01)</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-zinc-400 mb-1">Reported Symptom</label>
              <input
                type="text"
                value={bkSymptom}
                onChange={(e) => setBkSymptom(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-zinc-400 mb-1">Preferred Service Window</label>
              <input
                type="text"
                value={bkWindow}
                onChange={(e) => setBkWindow(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
              />
            </div>

            <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bkCarePlan}
                    onChange={(e) => setBkCarePlan(e.target.checked)}
                  />
                  <span className="text-white font-bold">
                    Care Plan Member (Priority Window + Quarterly PM Auto-Booking)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bkFlagJason}
                    onChange={(e) => setBkFlagJason(e.target.checked)}
                  />
                  <span className="text-zinc-300">
                    Log Out-of-County Requests to OS &ldquo;Needs Jason&rdquo; Queue
                  </span>
                </label>
              </div>

              <button
                type="submit"
                data-testid="submit-booking-btn"
                className="px-6 py-2.5 rounded bg-[#5ADCC8] text-black font-black uppercase tracking-wider text-xs hover:bg-[#5ADCC8]/90 cursor-pointer"
              >
                Validate &amp; Submit Booking
              </button>
            </div>
          </form>

          {bookingResultMsg && (
            <div
              data-testid="booking-validation-banner"
              className={`p-4 rounded border font-mono text-xs ${
                bookingResultMsg.ok
                  ? 'bg-[#5ADCC8]/15 border-[#5ADCC8] text-[#5ADCC8]'
                  : 'bg-red-950/90 border-red-500 text-red-200'
              }`}
            >
              {bookingResultMsg.text}
            </div>
          )}
        </section>

        {/* =====================================================================
            MODULE 6: 3JI-REPAIR TECHNICIAN PIPELINE & TECH NETWORK (15% / 20% PAYOUTS)
           ===================================================================== */}
        <section
          id="module-3ji-repair-techs"
          data-testid="module-3ji-repair-techs"
          aria-label="Module 6: 3JI-Repair Technician Pipeline & Tech Network"
          className="bg-zinc-950 border border-zinc-800 rounded p-6 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                  Module 6
                </span>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                  3JI-Repair Technician Pipeline &amp; Tech Network Payout Summary
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Hands-on 3JI-Repair training led by Jason Allen · Trainees complete 5 curriculum milestones &amp; 5 shadowed swaps · <strong className="text-[#5ADCC8]">Jason&apos;s Graduation Sign-Off</strong> promotes a <strong className="text-white">3JI-Repair Trainee</strong> to <strong className="text-white">L1 — PM / Swap</strong> (`can_claim_solo = true`) · Top graduates recruited onward to <strong className="text-[#5ADCC8]">Division 01 Foundry Mentorship</strong> (FDU, MTS 1500, SMARTT, ThermaTest NGIII 5000).
              </p>
            </div>
          </div>

          {/* Cohort & Trainee Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {state.techs.map((tech) => (
              <div
                key={tech.id}
                data-testid={`tech-card-${tech.id}`}
                className="p-4 rounded bg-black border border-zinc-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-black text-white">{tech.name}</div>
                      <div className="text-[11px] font-mono text-[#5ADCC8]">
                        {tech.cohort} · Level: <strong>{tech.level}</strong>
                      </div>
                    </div>
                    <span
                      data-testid={`tech-claim-rights-${tech.id}`}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        tech.can_claim_solo
                          ? 'bg-[#5ADCC8]/20 text-[#5ADCC8] border border-[#5ADCC8]'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {tech.can_claim_solo ? 'Solo Claim Rights: ACTIVE' : 'Solo Claim Rights: LOCKED'}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-400">
                    EPA 608: <strong className="text-white">{tech.epa_608_cert_number}</strong> · COI ≥ $1M Exp:{' '}
                    <strong className="text-white">{tech.coi_expiry}</strong> · Tier:{' '}
                    <strong className="text-[#5ADCC8]">{tech.payout_tier}</strong>
                  </div>

                  {/* 5 Curriculum Milestones */}
                  <div className="p-3 rounded bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                    <div className="font-mono text-[10px] uppercase text-zinc-400 mb-1">
                      5 3JI-Repair Curriculum Milestones:
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5ADCC8]">
                        {tech.milestones.shop_safety_and_tools ? '☑' : '☐'}
                      </span>
                      <span>1. Shop safety &amp; tool fundamentals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5ADCC8]">
                        {tech.milestones.slushie_teardown_seal_brix ? '☑' : '☐'}
                      </span>
                      <span>
                        2. Slushie / frozen beverage machine teardown, seal replacement, brix calibration
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5ADCC8]">
                        {tech.milestones.ohio_food_code_sanitizing ? '☑' : '☐'}
                      </span>
                      <span>3. Ohio food-code sanitizing procedure (OAC 3717-1-08.1)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5ADCC8]">
                        {tech.milestones.customer_comm_and_photos ? '☑' : '☐'}
                      </span>
                      <span>4. Customer communication &amp; photo documentation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5ADCC8]">
                        {tech.milestones.five_shadowed_field_swaps ? '☑' : '☐'}
                      </span>
                      <span>
                        5. 5 shadowed field swaps with L2/L3 mentor ({tech.shadow_swaps_completed}/5 completed)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Graduation Sign-Off & Division 01 Foundry Track */}
                <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid={`foundry-track-toggle-${tech.id}`}
                    onClick={() => handleToggleFoundryTrack(tech.id)}
                    className={`px-3 py-1.5 rounded font-mono text-[11px] font-bold border transition cursor-pointer ${
                      tech.division_01_foundry_track
                        ? 'bg-[#5ADCC8]/20 border-[#5ADCC8] text-[#5ADCC8]'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-[#5ADCC8]'
                    }`}
                  >
                    {tech.division_01_foundry_track
                      ? '★ Division 01 Foundry Mentorship Track: ACTIVE'
                      : '+ Nominate for Division 01 Foundry Mentorship'}
                  </button>

                  {!tech.graduated_signed_off_by_jason && (
                    <button
                      type="button"
                      data-testid={`graduate-trainee-btn-${tech.id}`}
                      onClick={() => handleGraduateTrainee(tech.id, tech.name)}
                      className="px-3.5 py-1.5 rounded bg-[#5ADCC8] text-black font-black uppercase text-xs hover:bg-[#5ADCC8]/90 transition cursor-pointer"
                    >
                      Sign Off Graduation (Promote to L1)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tech Payout Summary (Strictly 15% Network / 20% Hub — Never 25-30%; Company Financials in /os) */}
          <div
            data-testid="tech-network-split-ledger"
            className="p-5 rounded bg-black border border-zinc-800 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black uppercase text-[#5ADCC8]">
                  Technician Payout Summary — Locked 15% Network / 20% Hub Take Rates
                </h3>
                <p className="text-xs text-zinc-400">
                  15% platform fee on Network jobs (tech brings van/tools) · 20% platform fee on Hub jobs (3J loaner machine, shop bench &amp; parts support). Never 25–30%. All company &amp; 3JI-Repair financials live in the OS Command Center (/os).
                </p>
              </div>
              <div className="font-mono text-xs text-[#5ADCC8] font-bold">
                15% Network | 20% Hub
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[11px]">
                    <th className="py-2 px-3">Payout ID</th>
                    <th className="py-2 px-3">Job ID</th>
                    <th className="py-2 px-3">Certified Tech</th>
                    <th className="py-2 px-3">Take-Rate Tier</th>
                    <th className="py-2 px-3">Tech Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {state.payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 text-[#5ADCC8] font-bold">{p.id}</td>
                      <td className="py-2.5 px-3 text-white">{p.job_id}</td>
                      <td className="py-2.5 px-3 text-white">{p.tech_name}</td>
                      <td className="py-2.5 px-3 text-[#5ADCC8] font-bold">
                        {p.tier} ({p.platform_take_pct}% Take Rate)
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        ${p.tech_net_payout.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black px-6 py-4 text-xs text-zinc-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <strong className="text-white">3J Industrial Parts LLC</strong> · SPARE PARTS | SERVICES | CONSULTING ·{' '}
            <strong className="text-[#5ADCC8]">Division 02 (3JI-Repair): CUYAHOGA COUNTY, OHIO ONLY</strong>
          </div>
          <div className="font-mono">
            Founder: Jason Allen · 216-906-2252 · Jallen@3jindustrialparts.com · Estimate within 24 hours
          </div>
        </div>
      </footer>
    </div>
  );
}
