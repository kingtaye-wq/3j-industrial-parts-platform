import { NextRequest, NextResponse } from 'next/server';
import {
  getPlatformState,
  savePlatformState,
  resetPlatformState,
  isCuyahogaCityOrZip,
  SanitationChecklist,
  JobRecord,
  QuoteRecord,
  CustomerRecord,
  MachineRecord,
  SupportDocRecord,
} from '@/lib/store';

export async function GET() {
  const state = getPlatformState();
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'reset_state') {
      const fresh = resetPlatformState();
      return NextResponse.json({ ok: true, state: fresh });
    }

    const state = getPlatformState();

    if (action === 'resolve_needs_jason') {
      const { item_id } = body;
      const item = state.needs_jason.find((i) => i.id === item_id);
      if (!item) {
        return NextResponse.json({ error: 'Needs Jason item not found' }, { status: 404 });
      }
      item.status = 'Approved / Signed Off';

      if (item.category === 'Quote Approval' && item.linked_entity_id) {
        const quote = state.quotes.find((q) => q.id === item.linked_entity_id);
        if (quote) {
          quote.status = 'Approved / Sent';
        }
      } else if (
        item.category === '3JI-Repair Trainee Graduation Sign-Off' &&
        item.linked_entity_id
      ) {
        const tech = state.techs.find((t) => t.id === item.linked_entity_id);
        if (tech) {
          tech.level = 'L1 — PM / Swap';
          tech.can_claim_solo = true;
          tech.graduated_signed_off_by_jason = true;
          tech.name = tech.name.replace(/\(3JI-Repair Trainee.*\)/, '(L1 PM / Swap — Graduated)');
        }
      } else if (
        item.category === 'Opportunity Escalated (Module 1 Retention Rule)' &&
        item.linked_entity_id
      ) {
        const job = state.jobs.find((j) => j.id === item.linked_entity_id);
        if (job && job.status === 'Unclaimed') {
          job.status = 'Claimed';
          job.claimed_by_tech_id = 'TECH-JASON';
          job.claimed_by_name = 'Jason Allen (Founder / Scheduled via Retention Rule)';
          job.escalation_stage = 'Fulfilled / Claimed';
          job.on_jason_tentative_schedule = true;
          job.customer_update_approved = true;
        }
      }

      savePlatformState(state);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'schedule_jason_on_opportunity') {
      const { job_id } = body;
      const job = state.jobs.find((j) => j.id === job_id);
      if (!job) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }
      job.status = 'Claimed';
      job.claimed_by_tech_id = 'TECH-JASON';
      job.claimed_by_name = 'Jason Allen (Founder / Scheduled via Module 1 Retention Rule)';
      job.on_jason_tentative_schedule = true;
      job.escalation_stage = 'Fulfilled / Claimed';
      job.customer_update_approved = true;

      const nj = state.needs_jason.find((n) => n.linked_entity_id === job.id);
      if (nj) {
        nj.status = 'Approved / Signed Off';
      }

      savePlatformState(state);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'claim_job') {
      const { job_id, role, tech_id } = body;
      const job = state.jobs.find((j) => j.id === job_id);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      const tech = state.techs.find((t) => t.id === tech_id);
      const isTraineeRole = String(role).includes('Trainee');
      const isCustomerRole = String(role).includes('Customer');

      if (isTraineeRole && (!tech || !tech.can_claim_solo)) {
        return NextResponse.json(
          {
            error:
              'Graduation Gate: 3JI-Repair Trainees cannot claim solo jobs until Jason Allen signs off graduation to L1.',
          },
          { status: 403 }
        );
      }

      if (isCustomerRole) {
        return NextResponse.json({ error: 'Customers cannot claim field jobs.' }, { status: 403 });
      }

      const roleStr = String(role);
      const effectiveLevel =
        roleStr.includes('Admin') || roleStr.includes('L3')
          ? 3
          : roleStr.includes('L2')
          ? 2
          : roleStr.includes('L1') || (tech && tech.can_claim_solo)
          ? 1
          : 0;

      const requiredNumeric = job.required_level === 'L3' ? 3 : job.required_level === 'L2' ? 2 : 1;

      if (effectiveLevel < requiredNumeric) {
        return NextResponse.json(
          {
            error: `Skill Gate: Job requires ${job.required_level} certification. Current active level cannot claim this job.`,
          },
          { status: 403 }
        );
      }

      const hasEpa608 =
        roleStr.includes('Admin') ||
        roleStr.includes('L3') ||
        roleStr.includes('L2') ||
        Boolean(tech?.epa_608_verified);

      if (job.requires_epa_608 && !hasEpa608) {
        return NextResponse.json(
          {
            error:
              'EPA 608 Gate: Sealed-system refrigeration jobs require verified EPA 608 certification on file.',
          },
          { status: 403 }
        );
      }

      job.status = 'Claimed';
      job.escalation_stage = 'Fulfilled / Claimed';
      job.claimed_by_tech_id = tech?.id || 'TECH-ADMIN';
      job.claimed_by_name =
        tech?.name ||
        (roleStr.includes('Admin')
          ? 'Jason Allen (Founder / Master)'
          : roleStr.includes('L3')
          ? 'Marcus Vance (L3 Master)'
          : roleStr.includes('L2')
          ? 'Elena Rostova (L2 EPA 608)'
          : 'Devon Carter (L1 PM / Swap)');

      if (job.loaner_needed) {
        const targetLoaner =
          state.loaners.find((l) => l.id === job.assigned_loaner_id) ||
          state.loaners.find((l) => l.status === 'Available');
        if (targetLoaner) {
          job.assigned_loaner_id = targetLoaner.id;
          if (targetLoaner.status === 'Available') {
            targetLoaner.status = 'Deployed';
            targetLoaner.assigned_job_id = job.id;
            targetLoaner.active_workflow_step = 3;
            targetLoaner.current_location = `${job.business_name} (${job.city}, OH)`;
          }
        }
      }

      savePlatformState(state);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'request_shadow_ride') {
      const { job_id, trainee_id } = body;
      const job = state.jobs.find((j) => j.id === job_id);
      if (job && !job.shadow_requested_by.includes(trainee_id || 'TECH-04')) {
        job.shadow_requested_by.push(trainee_id || 'TECH-04');
      }
      savePlatformState(state);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'update_loaner_workflow') {
      const {
        loaner_id,
        target_step,
        checklist,
        sanitation_method,
        sanitation_tech_initials,
      }: {
        loaner_id: string;
        target_step: number;
        checklist?: SanitationChecklist;
        sanitation_method?: string;
        sanitation_tech_initials?: string;
      } = body;

      const loaner = state.loaners.find((l) => l.id === loaner_id);
      if (!loaner) {
        return NextResponse.json({ error: 'Loaner not found' }, { status: 404 });
      }

      if (checklist) {
        loaner.sanitation_checklist = {
          ...loaner.sanitation_checklist,
          ...checklist,
        };
      }
      if (typeof sanitation_method === 'string') {
        loaner.sanitation_method = sanitation_method;
      }
      if (typeof sanitation_tech_initials === 'string') {
        loaner.sanitation_tech_initials = sanitation_tech_initials;
      }

      if (target_step === 9) {
        const c = loaner.sanitation_checklist;
        const allChecked =
          c.wash_rinse_sanitize_completed &&
          c.sanitizer_ppm_verified &&
          c.food_contact_parts_inspected &&
          c.leak_and_freeze_test_passed;

        if (!allChecked || !loaner.sanitation_tech_initials.trim()) {
          return NextResponse.json(
            {
              error:
                'Ohio Food Code OAC 3717-1-08.1 Gate: All 4 sanitation checks and tech initials must be completed before returning loaner to Available.',
            },
            { status: 400 }
          );
        }

        loaner.active_workflow_step = 9;
        loaner.status = 'Available';
        loaner.current_location = '3J Cleveland Hub — Sanitized & Ready Rack';
        loaner.customer_machine_bench_status =
          'Step 9: Sanitized per OAC 3717-1-08.1 & Ready for Next Deployment';
        loaner.sanitation_logs.unshift({
          id: `SAN-${Date.now().toString().slice(-4)}`,
          loaner_id: loaner.id,
          date: new Date().toISOString().slice(0, 10),
          method:
            loaner.sanitation_method || 'OAC 3717-1-08.1 3-Compartment Sanitize (200 ppm Quat)',
          sanitizer_ppm: '200 ppm Verified',
          tech_initials: loaner.sanitation_tech_initials.trim().toUpperCase(),
          oac_code: 'OAC 3717-1-08.1',
          checklist: { ...loaner.sanitation_checklist },
          verified_by_jason: true,
        });

        const nj = state.needs_jason.find(
          (n) => n.linked_entity_id === loaner.id && n.category === 'Sanitizing Log Sign-Off'
        );
        if (nj) {
          nj.status = 'Approved / Signed Off';
        }
      } else {
        loaner.active_workflow_step = target_step;
        if (target_step === 8) {
          loaner.status = 'In Sanitizing & Bench Prep';
          loaner.customer_machine_bench_status =
            'Step 8: Returned to 3J Hub — Awaiting Ohio Food Code OAC 3717-1-08.1 Sanitation Gate';
        } else if (target_step >= 3 && target_step <= 7) {
          loaner.status = 'Deployed';
        }
      }

      savePlatformState(state);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'use_part') {
      const { part_id, qty = 1, reference_type = 'Job', reference_id = 'JOB-202' } = body;
      const part = state.parts.find((p) => p.id === part_id);
      if (!part) {
        return NextResponse.json({ error: 'Part not found' }, { status: 404 });
      }
      part.qty_on_hand = Math.max(0, part.qty_on_hand - Number(qty));
      state.inventory_txns.unshift({
        id: `TXN-${Date.now().toString().slice(-4)}`,
        part_id: part.id,
        sku: part.sku,
        part_name: part.name,
        qty_delta: -Number(qty),
        reference_type,
        reference_id,
        timestamp: new Date().toISOString(),
      });

      if (part.qty_on_hand <= part.reorder_point) {
        const exists = state.needs_jason.some(
          (n) => n.linked_entity_id === part.id && n.status === 'Pending Jason'
        );
        if (!exists) {
          state.needs_jason.unshift({
            id: `NJ-${Date.now().toString().slice(-4)}`,
            category: 'Low-Stock Critical Part',
            division: part.division,
            title: `Low Stock Alert: ${part.sku} (${part.qty_on_hand} on hand / Reorder Pt ${part.reorder_point})`,
            detail: `${part.name} dropped to ${part.qty_on_hand} units after allocation to ${reference_id}.`,
            priority: 'HIGH',
            status: 'Pending Jason',
            linked_entity_id: part.id,
            created_at: new Date().toISOString(),
          });
        }
      }

      savePlatformState(state);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'create_quote') {
      const newQuote: QuoteRecord = {
        id: `QT-${1000 + state.quotes.length + 1}`,
        division: body.division || 'Division 02 — 3JI-Repair',
        customer_id: body.customer_id || 'CUST-D2-01',
        business_name: body.business_name || '[Account Placeholder — New Quote Request]',
        city_state: body.city_state || 'Cleveland, OH (Cuyahoga County)',
        system_or_machine: body.system_or_machine || 'Frozen Beverage / Slushie Machine',
        serial_number: body.serial_number || 'SN-VERIFIED-01',
        symptom_or_scope: body.symptom_or_scope || 'Diagnostic + Bench/Field Repair Estimate',
        care_plan_active: Boolean(body.care_plan_active),
        contract_pricing: Boolean(body.contract_pricing),
        include_diagnostic_99: Boolean(body.include_diagnostic_99),
        credit_diagnostic_toward_repair: Boolean(body.credit_diagnostic_toward_repair),
        labor_tier: body.labor_tier || 'Field ($139–149/hr)',
        labor_rate: Number(body.labor_rate || 145),
        labor_hours: Number(body.labor_hours || 2),
        loaner_billing: body.loaner_billing || 'Waived — Care Plan ($0)',
        loaner_days_or_incidents: Number(body.loaner_days_or_incidents || 1),
        loaner_rate: Number(body.loaner_rate || 0),
        parts_lines: body.parts_lines || [],
        total_amount: Number(body.total_amount || 0),
        sla_hours_remaining: 23.9,
        turnaround_hours: 0.5,
        status: body.status || 'Needs Jason Approval',
        created_at: new Date().toISOString(),
      };

      state.quotes.unshift(newQuote);

      if (newQuote.status === 'Needs Jason Approval') {
        state.needs_jason.unshift({
          id: `NJ-${Date.now().toString().slice(-4)}`,
          category: 'Quote Approval',
          division: newQuote.division,
          title: `Approve Quote ${newQuote.id} ($${newQuote.total_amount.toLocaleString()}) — ${newQuote.system_or_machine}`,
          detail: `Draft quote for ${newQuote.business_name}. <24h estimate promise active. Nothing sends without Jason's approval.`,
          priority: 'HIGH',
          status: 'Pending Jason',
          linked_entity_id: newQuote.id,
          created_at: new Date().toISOString(),
        });
      }

      savePlatformState(state);
      return NextResponse.json({ ok: true, quote: newQuote, state });
    }

    if (action === 'update_quote_status') {
      const { quote_id, status } = body;
      const quote = state.quotes.find((q) => q.id === quote_id);
      if (quote) {
        quote.status = status;
        if (status === 'Approved / Sent' || status === 'Accepted') {
          const nj = state.needs_jason.find((n) => n.linked_entity_id === quote.id);
          if (nj) nj.status = 'Approved / Signed Off';
        }
      }
      savePlatformState(state);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'create_booking') {
      const {
        division,
        business_name,
        address,
        city,
        state: st,
        zip,
        county,
        machine_or_system,
        serial_number,
        symptom,
        preferred_window,
        care_plan_member,
        flag_needs_jason,
      } = body;

      const isDiv2 = !division || String(division).includes('Division 02');
      const cuyahogaValid = isDiv2 ? isCuyahogaCityOrZip(city || '', zip || '', county) : true;

      if (isDiv2 && !cuyahogaValid) {
        const blockedBooking = {
          id: `BK-${300 + state.bookings.length + 1}`,
          division: 'Division 02 — 3JI-Repair' as const,
          business_name: business_name || '[Out-of-County Request Placeholder]',
          address: address || '',
          city: city || '',
          state: st || 'OH',
          zip: zip || '',
          county: county || 'Outside Cuyahoga',
          cuyahoga_verified: false,
          machine_or_system: machine_or_system || 'Frozen Beverage Machine',
          serial_number: serial_number || 'N/A',
          symptom: symptom || '',
          preferred_window: preferred_window || 'Standard',
          care_plan_member: Boolean(care_plan_member),
          status: (flag_needs_jason ? 'Escalated to Needs Jason' : 'Blocked — Out of County') as
            | 'Escalated to Needs Jason'
            | 'Blocked — Out of County',
          created_at: new Date().toISOString(),
        };
        state.bookings.unshift(blockedBooking);

        if (flag_needs_jason) {
          state.needs_jason.unshift({
            id: `NJ-${Date.now().toString().slice(-4)}`,
            category: 'Out-of-County Exception',
            division: 'Division 02 — 3JI-Repair',
            title: `Out-of-County Request Flagged: ${city}, ${st} ${zip}`,
            detail: `${business_name} requested 3JI-Repair service outside launch area (${city}, ${zip}). Launch area is strictly Cuyahoga County, OH only.`,
            priority: 'STANDARD',
            status: 'Pending Jason',
            linked_entity_id: blockedBooking.id,
            created_at: new Date().toISOString(),
          });
        }

        savePlatformState(state);
        return NextResponse.json({
          ok: false,
          cuyahoga_verified: false,
          message:
            '3JI-Repair (Division 02) launch service area is CUYAHOGA COUNTY, OHIO ONLY.',
          booking: blockedBooking,
          state,
        });
      }

      const newBooking = {
        id: `BK-${300 + state.bookings.length + 1}`,
        division: (isDiv2 ? 'Division 02 — 3JI-Repair' : 'Division 01 — Foundry') as
          | 'Division 02 — 3JI-Repair'
          | 'Division 01 — Foundry',
        business_name: business_name || '[Cuyahoga Account Placeholder]',
        address: address || 'Cuyahoga Service Address',
        city: city || 'Cleveland',
        state: st || 'OH',
        zip: zip || '44113',
        county: isDiv2 ? 'Cuyahoga' : county || 'USA',
        cuyahoga_verified: isDiv2,
        machine_or_system: machine_or_system || 'Frozen Beverage / Slushie Machines',
        serial_number: serial_number || 'SN-BOOKED',
        symptom: symptom || 'Scheduled service / PM booking',
        preferred_window: preferred_window || 'Next Available Priority Window',
        care_plan_member: Boolean(care_plan_member),
        status: 'Scheduled on Map' as const,
        created_at: new Date().toISOString(),
      };
      state.bookings.unshift(newBooking);

      if (isDiv2) {
        const newJob: JobRecord = {
          id: `JOB-${200 + state.jobs.length + 1}`,
          division: 'Division 02 — 3JI-Repair',
          customer_id: 'CUST-D2-01',
          business_name: newBooking.business_name,
          city: newBooking.city,
          county: 'Cuyahoga',
          zip: newBooking.zip,
          lat: 41.4993,
          lng: -81.6944,
          equipment_category: newBooking.machine_or_system,
          machine_type: newBooking.machine_or_system,
          serial_number: newBooking.serial_number,
          reported_symptom: newBooking.symptom,
          urgency: 'Scheduled PM',
          dot_color: 'blue',
          care_plan_status: care_plan_member ? 'Multi-Machine Location ($149–199/mo)' : 'None',
          loaner_needed: false,
          assigned_loaner_id: null,
          required_level: 'L1',
          requires_epa_608: false,
          status: 'Unclaimed',
          claimed_by_tech_id: null,
          claimed_by_name: null,
          shadow_requested_by: [],
          posted_hours_ago: 0.1,
          promised_window: newBooking.preferred_window,
          escalation_stage: 'Normal (<2h — Matched Techs Notified)',
          on_jason_tentative_schedule: false,
          draft_customer_update: '',
          customer_update_approved: false,
          estimated_labor_tier: 'Field ($139–149/hr)',
          estimated_hours: 2.0,
          payout_mode: 'Network (15% Fee)',
        };
        state.jobs.unshift(newJob);
      }

      savePlatformState(state);
      return NextResponse.json({ ok: true, cuyahoga_verified: true, booking: newBooking, state });
    }

    if (action === 'graduate_trainee') {
      const { tech_id } = body;
      const tech = state.techs.find((t) => t.id === tech_id);
      if (!tech) {
        return NextResponse.json({ error: 'Trainee not found' }, { status: 404 });
      }
      tech.level = 'L1 — PM / Swap';
      tech.can_claim_solo = true;
      tech.graduated_signed_off_by_jason = true;
      tech.milestones = {
        shop_safety_and_tools: true,
        slushie_teardown_seal_brix: true,
        ohio_food_code_sanitizing: true,
        customer_comm_and_photos: true,
        five_shadowed_field_swaps: true,
      };

      const nj = state.needs_jason.find(
        (n) =>
          n.linked_entity_id === tech.id &&
          n.category === '3JI-Repair Trainee Graduation Sign-Off'
      );
      if (nj) {
        nj.status = 'Approved / Signed Off';
      }

      savePlatformState(state);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'toggle_foundry_track') {
      const { tech_id } = body;
      const tech = state.techs.find((t) => t.id === tech_id);
      if (tech) {
        tech.division_01_foundry_track = !tech.division_01_foundry_track;
      }
      savePlatformState(state);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'create_customer_setup') {
      const {
        business_name,
        city,
        zip,
        address,
        contact_info,
        plan_tier,
        terms,
        assets,
      }: {
        business_name: string;
        city: string;
        zip: string;
        address: string;
        contact_info: string;
        plan_tier:
          | 'None'
          | 'Single-Machine ($79–99/mo)'
          | 'Multi-Machine Location ($149–199/mo)';
        terms: string;
        assets: { equipment_type: string; make_model: string; serial_number: string; location_label: string }[];
      } = body;

      const mrr =
        plan_tier === 'Multi-Machine Location ($149–199/mo)'
          ? 179
          : plan_tier === 'Single-Machine ($79–99/mo)'
          ? 89
          : 0;

      const newCust: CustomerRecord = {
        id: `CUST-D2-0${state.customers.length + 1}`,
        business_name: business_name || '[New 3JI-Repair Customer Placeholder]',
        division: 'Division 02 — 3JI-Repair',
        city: city || 'Cleveland',
        state: 'OH',
        zip: zip || '44113',
        county: 'Cuyahoga',
        locations: [address || '1200 Euclid Ave, Cleveland, OH 44115 [Placeholder]'],
        care_plan_tier: plan_tier || 'Multi-Machine Location ($149–199/mo)',
        monthly_mrr: mrr,
        is_contract_account: mrr > 0,
        contact_Placeholder: contact_info || 'GM [Placeholder] · 216-555-0199',
        contract_info: {
          plan_tier: plan_tier || 'Multi-Machine Location ($149–199/mo)',
          monthly_mrr: mrr,
          terms:
            terms ||
            '12-Month 3JI-Repair Care Plan · $0 Loaner Swaps · $99 Diagnostic Credited Toward Repair',
          auto_pm_schedule: 'Quarterly OAC 3717-1-08.1 Sanitize & Bi-Annual Ice/Cooler PM',
        },
      };

      state.customers.unshift(newCust);

      const assetList = Array.isArray(assets) && assets.length > 0
        ? assets
        : [
            {
              equipment_type: 'Frozen Beverage / Slushie Machines',
              make_model: 'Twin-Bowl Slushie Unit 2x12L',
              serial_number: `SN-FB-${Math.floor(1000 + Math.random() * 8999)}`,
              location_label: 'Main Bar',
            },
          ];

      for (const a of assetList) {
        const m: MachineRecord = {
          id: `MACH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
          customer_id: newCust.id,
          division: 'Division 02 — 3JI-Repair',
          platform_or_type: a.equipment_type || 'Frozen Beverage / Slushie Machines',
          make_model: a.make_model || 'Commercial Unit',
          serial_number: a.serial_number || 'SN-VERIFIED',
          location_label: a.location_label || 'Main Bar',
          status: 'Operational',
        };
        state.machines.push(m);
      }

      savePlatformState(state);
      return NextResponse.json({ ok: true, customer: newCust, state });
    }

    if (action === 'upload_support_doc') {
      const { title, equipment_type, file_name, file_notes, uploaded_by } = body;
      const newDoc: SupportDocRecord = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        title: title || 'Service & Wiring Manual PDF',
        equipment_type: equipment_type || 'Frozen Beverage / Slushie Machines',
        file_name: file_name || 'service-manual.pdf',
        file_notes: file_notes || 'Uploaded via 3JI Staff Portal for field technician access.',
        uploaded_by: uploaded_by || 'Jason Allen (3JI Staff)',
        uploaded_at: new Date().toISOString().slice(0, 10),
      };
      state.support_docs.unshift(newDoc);
      savePlatformState(state);
      return NextResponse.json({ ok: true, doc: newDoc, state });
    }

    if (action === 'dispatch_job') {
      const {
        business_name,
        city,
        zip,
        machine_type,
        reported_symptom,
        urgency,
        required_level,
        loaner_needed,
        care_plan_status,
      } = body;
      const newJob: JobRecord = {
        id: `JOB-${200 + state.jobs.length + 1}`,
        division: 'Division 02 — 3JI-Repair',
        customer_id: 'CUST-D2-01',
        business_name: business_name || '[Cuyahoga Account Placeholder — New Dispatch]',
        city: city || 'Cleveland',
        county: 'Cuyahoga',
        zip: zip || '44113',
        lat: 41.495,
        lng: -81.705,
        equipment_category: machine_type || 'Frozen Beverage / Slushie Machines',
        machine_type: machine_type || 'Frozen Beverage / Slushie Machine',
        serial_number: `SN-FB-${Math.floor(1000 + Math.random() * 8999)}`,
        reported_symptom: reported_symptom || 'Emergency breakdown — Loaner swap requested',
        urgency: urgency || 'Emergency Down — Loaner Needed',
        dot_color:
          urgency === 'Emergency Down — Loaner Needed'
            ? 'red'
            : urgency === 'Standard Repair'
            ? 'amber'
            : 'blue',
        care_plan_status: care_plan_status || 'Multi-Machine Location ($149–199/mo)',
        loaner_needed: Boolean(loaner_needed),
        assigned_loaner_id: loaner_needed ? 'LN-01' : null,
        required_level: required_level || 'L1',
        requires_epa_608: required_level === 'L2' || required_level === 'L3',
        status: 'Unclaimed',
        claimed_by_tech_id: null,
        claimed_by_name: null,
        shadow_requested_by: [],
        posted_hours_ago: 0.1,
        promised_window: 'Today Priority Window',
        escalation_stage: 'Normal (<2h — Matched Techs Notified)',
        on_jason_tentative_schedule: false,
        draft_customer_update: '',
        customer_update_approved: false,
        estimated_labor_tier:
          required_level === 'L2' || required_level === 'L3'
            ? 'Refrigeration / Master ($169–179/hr)'
            : 'Field ($139–149/hr)',
        estimated_hours: 2.0,
        payout_mode: loaner_needed ? 'Hub (20% Fee)' : 'Network (15% Fee)',
      };
      state.jobs.unshift(newJob);
      savePlatformState(state);
      return NextResponse.json({ ok: true, job: newJob, state });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
