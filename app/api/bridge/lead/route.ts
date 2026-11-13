import { NextRequest, NextResponse } from 'next/server';
import {
  getPlatformState,
  savePlatformState,
  isCuyahogaCityOrZip,
  BookingRecord,
  QuoteRecord,
  JobRecord,
} from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sourceSite = body.source_site || (body.division?.includes('Foundry') ? 'foundry' : 'commercial');
    const state = getPlatformState();

    if (body.action === 'create_booking' || body.formType === '3ji-repair-cuyahoga-booking') {
      const isDiv2 = sourceSite === 'commercial' || body.division?.includes('Division 02');
      const cuyahogaValid = isDiv2
        ? isCuyahogaCityOrZip(body.city || body.cityOrZip || '', body.zip || body.cityOrZip || '', body.county)
        : true;

      const newBooking: BookingRecord & { source_site?: 'foundry' | 'commercial' } = {
        id: `BK-${300 + state.bookings.length + 1}`,
        division: isDiv2 ? 'Division 02 — 3JI-Repair' : 'Division 01 — Foundry',
        business_name: body.business_name || body.businessName || '[Account Placeholder]',
        address: body.address || body.streetAddress || 'Cuyahoga Service Address',
        city: body.city || body.cityOrZip || 'Cleveland',
        state: body.state || 'OH',
        zip: body.zip || '44113',
        county: isDiv2 ? 'Cuyahoga' : body.county || 'USA',
        cuyahoga_verified: cuyahogaValid,
        machine_or_system: body.machine_or_system || body.equipmentCategory || body.machineType || 'Frozen Beverage / Slushie Machine',
        serial_number: body.serial_number || body.serialNumber || 'SN-PENDING',
        symptom: body.symptom || 'Service requested via commercial web intake',
        preferred_window: body.preferred_window || 'Next Available Priority Window',
        care_plan_member: Boolean(body.care_plan_member || body.planInterest?.includes('Care Plan')),
        status: cuyahogaValid ? 'Scheduled on Map' : 'Blocked — Out of County',
        source_site: sourceSite,
        created_at: new Date().toISOString(),
      };

      state.bookings.unshift(newBooking);

      if (cuyahogaValid && isDiv2) {
        const newJob: JobRecord & { source_site?: 'foundry' | 'commercial' } = {
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
          urgency: body.needLoaner?.includes('Yes') ? 'Emergency Down — Loaner Needed' : 'Standard Repair',
          dot_color: body.needLoaner?.includes('Yes') ? 'red' : 'blue',
          care_plan_status: newBooking.care_plan_member
            ? 'Multi-Machine Location ($149–199/mo)'
            : 'None',
          loaner_needed: Boolean(body.needLoaner?.includes('Yes')),
          assigned_loaner_id: null,
          required_level: newBooking.machine_or_system.includes('Refrigerat') || newBooking.machine_or_system.includes('Freezer') || newBooking.machine_or_system.includes('Ice')
            ? 'L2'
            : 'L1',
          requires_epa_608: Boolean(
            newBooking.machine_or_system.includes('Refrigerat') ||
            newBooking.machine_or_system.includes('Freezer') ||
            newBooking.machine_or_system.includes('Ice')
          ),
          status: 'Unclaimed',
          claimed_by_tech_id: null,
          claimed_by_name: null,
          shadow_requested_by: [],
          posted_hours_ago: 0.1,
          promised_window: '<24h Response',
          escalation_stage: 'Normal (<2h — Matched Techs Notified)',
          on_jason_tentative_schedule: false,
          draft_customer_update: `Hello from 3JI-Repair. We received your breakdown request for ${newBooking.machine_or_system}. Our technician dispatch window is active.`,
          customer_update_approved: false,
          estimated_labor_tier: 'Field ($139–149/hr)',
          estimated_hours: 2,
          payout_mode: 'Network (15% Fee)',
          source_site: sourceSite,
        };
        state.jobs.unshift(newJob);

        state.needs_jason.unshift({
          id: `NJ-${Date.now().toString().slice(-4)}`,
          category: 'Commercial Lead Inbound',
          division: 'Division 02 — 3JI-Repair',
          title: `New 3JI-Repair Booking: ${newBooking.business_name} (${newBooking.machine_or_system})`,
          detail: `Inbound dispatch request from commercial website. Location: ${newBooking.city}, ${newBooking.zip}. Loaner required: ${newJob.loaner_needed ? 'YES' : 'NO'}.`,
          priority: newJob.loaner_needed ? 'HIGH' : 'STANDARD',
          status: 'Pending Jason',
          linked_entity_id: newBooking.id,
          source_site: sourceSite,
          created_at: new Date().toISOString(),
        });
      }

      savePlatformState(state);
      return NextResponse.json({
        ok: true,
        id: newBooking.id,
        source_site: sourceSite,
        booking: newBooking,
      });
    }

    // Otherwise handle quote request (e.g. from foundry site or commercial site)
    const isFoundry = sourceSite === 'foundry' || body.division?.includes('Foundry');
    const newQuote: QuoteRecord & { source_site?: 'foundry' | 'commercial' } = {
      id: `QT-${1000 + state.quotes.length + 1}`,
      division: isFoundry ? 'Division 01 — Foundry' : 'Division 02 — 3JI-Repair',
      customer_id: isFoundry ? 'CUST-D1-01' : 'CUST-D2-01',
      business_name: body.company || body.business_name || '[Foundry / Client Placeholder]',
      city_state: body.city_state || (isFoundry ? 'Nationwide / Foundry Plant' : 'Cleveland, OH (Cuyahoga County)'),
      system_or_machine: body.platform || body.system_or_machine || (isFoundry ? 'FDU Degasser' : 'Commercial Unit'),
      serial_number: body.serialNumber || body.serial_number || 'SN-VERIFIED',
      symptom_or_scope: body.message || body.symptom_or_scope || 'Melt-treatment support estimate requested',
      care_plan_active: Boolean(body.care_plan_active),
      contract_pricing: Boolean(body.contract_pricing),
      include_diagnostic_99: Boolean(body.include_diagnostic_99),
      credit_diagnostic_toward_repair: Boolean(body.credit_diagnostic_toward_repair),
      labor_tier: isFoundry ? 'Refrigeration / Master ($169–179/hr)' : 'Field ($139–149/hr)',
      labor_rate: isFoundry ? 175 : 145,
      labor_hours: 3,
      loaner_billing: 'None',
      loaner_days_or_incidents: 0,
      loaner_rate: 0,
      parts_lines: [],
      total_amount: isFoundry ? 525 : 290,
      sla_hours_remaining: 24.0,
      turnaround_hours: 0.5,
      status: 'Needs Jason Approval',
      source_site: sourceSite,
      created_at: new Date().toISOString(),
    };

    state.quotes.unshift(newQuote);

    state.needs_jason.unshift({
      id: `NJ-${Date.now().toString().slice(-4)}`,
      category: isFoundry ? 'Foundry Quote Approval' : 'Commercial Quote Approval',
      division: newQuote.division,
      title: `Approve Quote ${newQuote.id} (${isFoundry ? 'Foundry Site' : 'Commercial Site'}) — ${newQuote.business_name}`,
      detail: `Inbound quote inquiry for ${newQuote.system_or_machine} (Serial: ${newQuote.serial_number}). <24h estimate promise active.`,
      priority: 'HIGH',
      status: 'Pending Jason',
      linked_entity_id: newQuote.id,
      source_site: sourceSite,
      created_at: new Date().toISOString(),
    });

    savePlatformState(state);
    return NextResponse.json({
      ok: true,
      id: newQuote.id,
      source_site: sourceSite,
      quote: newQuote,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
