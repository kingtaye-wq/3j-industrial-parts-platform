import { test, expect } from '@playwright/test';

test.describe('3J Industrial Parts LLC — Unified OS Command Center (/os) & 3JI-Repair Field App (/app)', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/state', {
      data: { action: 'reset_state' },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('1. Zero "Junior Tech Program" / "Junior Tech" Occurrences Across /, /os, and /app + Brand & Security Headers', async ({
    page,
  }) => {
    for (const route of ['/', '/os', '/app']) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      expect(response?.headers()['x-robots-tag']).toContain('noindex');

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.toLowerCase()).not.toContain('junior tech program');
      expect(bodyText.toLowerCase()).not.toContain('junior tech');
      expect(bodyText).toContain('3JI-Repair');
    }
  });

  test('2. OS Command Center (/os): 5 Dashboard Tiles, 3JI-Repair & Tech Network Scorecard, All Financials in OS, 90-Day Targets Rail, and Needs Jason / Retention Escalation', async ({
    page,
  }) => {
    await page.goto('/os');

    // Verify Brand Identity & Verbatim Proof Line
    await expect(page.locator('header')).toContainText('3J Industrial Parts LLC');
    await expect(page.locator('header')).toContainText('SPARE PARTS | SERVICES | CONSULTING');
    await expect(page.locator('header')).toContainText('216-906-2252');
    await expect(page.locator('header')).toContainText('Jallen@3jindustrialparts.com');
    await expect(page.locator('aside')).toContainText(
      '6+ years of aluminum melt-treatment expertise — formerly the single point of contact for SMARTT, MTS 1500, and ThermaTest NGIII 5000 support across the U.S.'
    );
    await expect(page.locator('aside')).toContainText('3JI-Repair & Techs');

    // Verify KPI Tile: 3JI-Repair Trainees in Pipeline
    await expect(page.getByTestId('tile-trainees-in-pipeline')).toContainText(
      '3JI-Repair Trainees in Pipeline'
    );

    // Verify all 5 Top-Level Dashboard Tiles
    await expect(page.getByTestId('tile-needs-jason')).toBeVisible();
    await expect(page.getByTestId('tile-quote-sla')).toBeVisible();
    await expect(page.getByTestId('tile-cuyahoga-dispatch-map')).toBeVisible();
    await expect(page.getByTestId('tile-foundry-pipeline')).toBeVisible();
    await expect(page.getByTestId('tile-3ji-repair-tech-pulse')).toBeVisible();

    // Verify all 4 Scorecard Sections
    const secA = page.getByTestId('scorecard-section-a');
    await expect(secA).toContainText('FDU');
    await expect(secA).toContainText('MTS 1500');
    await expect(secA).toContainText('SMARTT');
    await expect(secA).toContainText('ThermaTest NGIII 5000');

    const secB = page.getByTestId('scorecard-section-b');
    await expect(secB).toContainText(
      'B. Division 02 — 3JI-Repair, commercial repair service (launch area: Cuyahoga County)'
    );
    await expect(secB).toContainText('$2,146/mo MRR');

    const secC = page.getByTestId('scorecard-section-c');
    await expect(secC).toContainText('C. 3JI-Repair & Tech Network');
    await expect(secC).toContainText('3JI-Repair Trainees Enrolled');
    await expect(secC).toContainText('15% Network / 20% Hub');

    const secD = page.getByTestId('scorecard-section-d');
    await expect(secD).toContainText('ALL Company & 3JI-Repair Financials Live in OS');
    await expect(secD).toContainText('total_targets: 515');
    await expect(secD).toContainText('total_targets: 501');
    await expect(secD).toContainText(
      '162 core foundry/die-cast/forge/heat-treat/steel + 339 broader metalworking long-tail = 501'
    );

    // Verify 90-Day Targets Rail strictly separates Activity Metrics vs Dollar Metrics ($)
    await expect(page.getByTestId('targets-activity-column')).toContainText(
      'Column A — Activity Metrics'
    );
    await expect(page.getByTestId('targets-dollar-column')).toContainText(
      'Column B — Dollar Metrics ($)'
    );

    // Approve Needs Jason Item NJ-01 (Quote QT-1001) and verify shared state updates
    await expect(page.getByTestId('os-quote-row-QT-1001')).toContainText('Needs Jason Approval');
    await page.getByTestId('needs-jason-approve-NJ-01').click();
    await expect(page.getByTestId('needs-jason-resolved-NJ-01')).toContainText('Signed Off');
    await expect(page.getByTestId('os-quote-row-QT-1001')).toContainText('Approved / Sent');
  });

  test('3. Field App (/app) Module 7: Customer Portal, Technician Portal, 3JI Staff Portal & Empty-By-Default Support Docs Library with Live Upload', async ({
    page,
  }) => {
    await page.goto('/app');

    // 1. 3JI Staff Portal is active by default — verify Support Docs Library ships EMPTY (0 PDFs)
    await expect(page.getByTestId('portal-staff')).toBeVisible();
    await expect(page.getByTestId('support-docs-count-badge')).toContainText(
      '0 PDFs Uploaded Across 15 Categories'
    );
    await expect(page.getByTestId('support-docs-empty-state')).toContainText(
      'Support Docs Library is Empty (0 Seeded Documents)'
    );

    // Verify all 15 equipment categories are rendered in the Support Docs category tree
    const catTree = page.getByTestId('support-docs-category-tree');
    await expect(catTree).toContainText('Refrigerators');
    await expect(catTree).toContainText('Frozen Beverage / Slushie Machines');
    await expect(catTree).toContainText('Draft Beer Systems & Glycol Chillers');
    await expect(catTree).toContainText('Juice Dispensers & Mixers');

    // 2. Upload a Support PDF in the 3JI Staff Portal
    await page.getByTestId('upload-support-doc-submit').click();
    await expect(page.getByTestId('support-docs-count-badge')).toContainText(
      '1 PDFs Uploaded Across 15 Categories'
    );

    // 3. Verify Available-Opportunities Oversight & "Schedule Jason onto this opportunity" button for JOB-204
    const oversight = page.getByTestId('staff-opportunities-oversight');
    await expect(oversight).toContainText('JOB-204');
    await expect(oversight).toContainText('Escalated to Jason');
    await page.getByTestId('staff-schedule-jason-btn-JOB-204').click();
    await expect(page.getByTestId('staff-oversight-job-JOB-204')).toContainText(
      'Claimed (Jason Allen'
    );

    // 4. Create a New Customer with Multiple Equipment Assets in 3JI Staff Portal
    await page.getByTestId('staff-add-asset-row-btn').click();
    await page.getByTestId('staff-create-customer-submit').click();

    // 5. Switch to Customer Portal and verify multi-asset equipment roster & contract info
    await page.getByTestId('portal-tab-customer').click();
    await expect(page.getByTestId('portal-customer')).toBeVisible();
    await expect(page.getByTestId('customer-contract-info')).toContainText(
      'Multi-Machine Location ($149–199/mo)'
    );
    await expect(page.getByTestId('customer-assets-list')).toContainText('3 Registered Units');

    // 6. Switch to Technician Portal and verify Skills & Certs, Paired Job Types, Opportunities Tab, Own Payouts, and the Uploaded Support PDF!
    await page.getByTestId('portal-tab-technician').click();
    await expect(page.getByTestId('portal-technician')).toBeVisible();
    await expect(page.getByTestId('tech-skills-certs')).toContainText(
      'EPA 608 Type II & Universal Sealed System'
    );
    await expect(page.getByTestId('tech-job-types')).toContainText(
      'Frozen Beverage / Slushie Machines'
    );
    await expect(page.getByTestId('tech-own-payout-summary')).toContainText('Net: $442.00');
    await expect(page.getByTestId('tech-support-docs-viewer')).toContainText(
      'Twin-Bowl Slushie Auger Seal & Brix Service Manual'
    );
  });

  test('4. Field App (/app): Role-Gated Claiming (3JI-Repair Trainee Blocked -> Jason Signs Off Graduation -> Solo L1 Claim Unlocked; L2 EPA 608 Gate)', async ({
    page,
  }) => {
    await page.goto('/app');

    // Switch to 3JI-Repair Trainee
    await page.getByTestId('role-btn-3ji-repair-trainee').click();
    await expect(page.getByTestId('active-role-banner')).toContainText('LOCKED — Shadow Only');

    // Verify 3JI-Repair Trainee cannot claim solo L1 job JOB-201, only request shadow ride
    await expect(page.getByTestId('claim-job-btn-JOB-201')).toBeDisabled();
    await expect(page.getByTestId('shadow-ride-btn-JOB-201')).toBeVisible();

    // Switch to Tech L1: can claim L1 job, but blocked from L2 EPA 608 job JOB-203
    await page.getByTestId('role-btn-tech-l1').click();
    await expect(page.getByTestId('claim-job-btn-JOB-203')).toBeDisabled();

    // Switch to Tech L2 (EPA 608): can claim L2 job JOB-203
    await page.getByTestId('role-btn-tech-l2').click();
    await expect(page.getByTestId('claim-job-btn-JOB-203')).toBeEnabled();
    await page.getByTestId('claim-job-btn-JOB-203').click();
    await expect(page.getByTestId('job-claimed-badge-JOB-203')).toContainText('Claimed');

    // Module 6: Jason signs off graduation for Jordan Morales (TECH-04)
    await expect(page.getByTestId('tech-claim-rights-TECH-04')).toContainText('LOCKED');
    await page.getByTestId('graduate-trainee-btn-TECH-04').click();
    await expect(page.getByTestId('tech-claim-rights-TECH-04')).toContainText('ACTIVE');

    // Switch back to 3JI-Repair Trainee (Jordan Morales TECH-04 is now graduated to L1) and claim JOB-201!
    await page.getByTestId('role-btn-3ji-repair-trainee').click();
    await expect(page.getByTestId('active-role-banner')).toContainText('UNLOCKED (Graduated L1)');
    await expect(page.getByTestId('claim-job-btn-JOB-201')).toBeEnabled();
    await page.getByTestId('claim-job-btn-JOB-201').click();
    await expect(page.getByTestId('job-claimed-badge-JOB-201')).toContainText('Claimed');
  });

  test('5. Field App (/app): 9-Step Loaner Workflow & Ohio Food Code OAC 3717-1-08.1 Gate, Inventory (+35%/+25%), Quote Generator ($99 Credit & ~$98/day Downtime), Cuyahoga Validation, and 15%/20% Payout Summary', async ({
    page,
  }) => {
    await page.goto('/app');

    // MODULE 2: Loaner LN-03 is in Step 8 (In Sanitizing & Bench Prep)
    await expect(page.getByTestId('selected-loaner-status')).toContainText(
      'In Sanitizing & Bench Prep'
    );
    const returnBtn = page.getByTestId('return-loaner-to-available-btn');
    await expect(returnBtn).toBeDisabled();

    // Check remaining 2 OAC 3717-1-08.1 checkboxes
    await page.getByTestId('chk-food-contact-parts').check();
    await page.getByTestId('chk-leak-freeze-test').check();
    await expect(returnBtn).toBeEnabled();

    // Complete Step 8 -> Step 9 transition to Available
    await returnBtn.click();
    await expect(page.getByTestId('selected-loaner-status')).toContainText('Available');

    // MODULE 3: Inventory +35% and +25% pricing & Use Part
    await expect(page.getByTestId('part-list35-3J-FDU-XSR220')).toContainText('$918.00');
    await expect(page.getByTestId('part-contract25-3J-FDU-XSR220')).toContainText('$850.00');
    await expect(page.getByTestId('part-qty-3J-FDU-XSR220')).toContainText('6');
    await page.getByTestId('use-part-btn-3J-FDU-XSR220').click();
    await expect(page.getByTestId('part-qty-3J-FDU-XSR220')).toContainText('5');

    // MODULE 4: Quote Generator ($99 diagnostic credit, ~$98/day downtime math, Care Plan loaner waiver)
    await expect(page.getByTestId('quote-diag-credit-line')).toContainText('-$99.00');
    await expect(page.getByTestId('downtime-comparison-callout')).toContainText(
      '60 drinks/day × ~$2.72/drink ≈ $98/day'
    );
    await expect(page.getByTestId('quote-loaner-price-line')).toContainText('$199.00');
    await page.getByTestId('quote-care-plan-toggle').check();
    await expect(page.getByTestId('quote-loaner-price-line')).toContainText(
      '$0.00 (Waived — Care Plan)'
    );

    // MODULE 5: Cuyahoga County Booking Validation
    await page.getByTestId('booking-city-input').fill('Akron');
    await page.getByTestId('booking-zip-input').fill('44308');
    await page.getByTestId('booking-county-input').fill('Summit');
    await page.getByTestId('submit-booking-btn').click();
    await expect(page.getByTestId('booking-validation-banner')).toContainText(
      'CUYAHOGA COUNTY, OHIO ONLY'
    );

    await page.getByTestId('booking-city-input').fill('Lakewood');
    await page.getByTestId('booking-zip-input').fill('44107');
    await page.getByTestId('booking-county-input').fill('Cuyahoga');
    await page.getByTestId('submit-booking-btn').click();
    await expect(page.getByTestId('booking-validation-banner')).toContainText('confirmed');

    // MODULE 6: Technician Payout Summary (15% Network / 20% Hub)
    const ledger = page.getByTestId('tech-network-split-ledger');
    await expect(ledger).toContainText('15% Take Rate');
    await expect(ledger).toContainText('20% Take Rate');
  });
});
