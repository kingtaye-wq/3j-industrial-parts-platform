import { test, expect } from '@playwright/test';

test.describe('3J Industrial Parts LLC — Unified OS Command Center (/os) & Field App (/app)', () => {
  test.beforeEach(async ({ request }) => {
    // Reset shared persistent state before each test
    const res = await request.post('/api/state', {
      data: { action: 'reset_state' },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('1. OS Command Center (/os): 5 Dashboard Tiles, 4 Scorecard Sections (515 Bars + 501 Industrial), 90-Day Targets Rail, and Needs Jason State Mutation', async ({
    page,
  }) => {
    const response = await page.goto('/os');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toContain('noindex');

    // Verify Brand Identity & Verbatim Proof Line
    await expect(page.locator('header')).toContainText('3J Industrial Parts LLC');
    await expect(page.locator('header')).toContainText('SPARE PARTS | SERVICES | CONSULTING');
    await expect(page.locator('header')).toContainText('216-906-2252');
    await expect(page.locator('header')).toContainText('Jallen@3jindustrialparts.com');
    await expect(page.locator('aside')).toContainText(
      '6+ years of aluminum melt-treatment expertise — formerly the single point of contact for SMARTT, MTS 1500, and ThermaTest NGIII 5000 support across the U.S.'
    );

    // Verify all 5 Top-Level Dashboard Tiles
    await expect(page.getByTestId('tile-needs-jason')).toBeVisible();
    await expect(page.getByTestId('tile-quote-sla')).toBeVisible();
    await expect(page.getByTestId('tile-cuyahoga-dispatch-map')).toBeVisible();
    await expect(page.getByTestId('tile-foundry-pipeline')).toBeVisible();
    await expect(page.getByTestId('tile-junior-tech-pulse')).toBeVisible();

    // Verify all 4 Scorecard Sections
    const secA = page.getByTestId('scorecard-section-a');
    await expect(secA).toContainText('FDU');
    await expect(secA).toContainText('MTS 1500');
    await expect(secA).toContainText('SMARTT');
    await expect(secA).toContainText('ThermaTest NGIII 5000');

    const secB = page.getByTestId('scorecard-section-b');
    await expect(secB).toContainText('Cuyahoga County Only');
    await expect(secB).toContainText('$2,146/mo MRR');

    const secC = page.getByTestId('scorecard-section-c');
    await expect(secC).toContainText('The Junior Tech Program & Tech Network');
    await expect(secC).toContainText('15% Network / 20% Hub');

    const secD = page.getByTestId('scorecard-section-d');
    await expect(secD).toContainText('total_targets: 515');
    await expect(secD).toContainText('total_targets: 501');
    await expect(secD).toContainText('162 core foundry/die-cast/forge/heat-treat/steel + 339 broader metalworking long-tail = 501');

    // Verify 90-Day Targets Rail strictly separates Activity Metrics vs Dollar Metrics ($)
    const actCol = page.getByTestId('targets-activity-column');
    const usdCol = page.getByTestId('targets-dollar-column');
    await expect(actCol).toContainText('Column A — Activity Metrics');
    await expect(usdCol).toContainText('Column B — Dollar Metrics ($)');

    // Approve Needs Jason Item NJ-01 (Quote QT-1001) and verify shared state updates
    await expect(page.getByTestId('os-quote-row-QT-1001')).toContainText('Needs Jason Approval');
    await page.getByTestId('needs-jason-approve-NJ-01').click();
    await expect(page.getByTestId('needs-jason-resolved-NJ-01')).toContainText('Signed Off');
    await expect(page.getByTestId('os-quote-row-QT-1001')).toContainText('Approved / Sent');
  });

  test('2. Field App (/app): Role-Gated Job Claiming (Junior Tech Blocked -> Jason Signs Off Graduation -> Solo L1 Claim Unlocked; L2 EPA 608 Gate)', async ({
    page,
  }) => {
    const response = await page.goto('/app');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toContain('noindex');

    // Switch to Junior Tech / Trainee
    await page.getByTestId('role-btn-junior-tech-trainee').click();
    await expect(page.getByTestId('active-role-banner')).toContainText('LOCKED — Shadow Only');

    // Verify Junior Tech cannot claim solo L1 job JOB-201, only request shadow ride
    const claimBtn201 = page.getByTestId('claim-job-btn-JOB-201');
    await expect(claimBtn201).toBeDisabled();
    await expect(page.getByTestId('shadow-ride-btn-JOB-201')).toBeVisible();

    // Switch to Tech L1: can claim L1 job, but blocked from L2 EPA 608 job JOB-203
    await page.getByTestId('role-btn-tech-l1').click();
    await expect(page.getByTestId('claim-job-btn-JOB-203')).toBeDisabled();

    // Switch to Tech L2 (EPA 608): can claim L2 job JOB-203
    await page.getByTestId('role-btn-tech-l2-epa-608-').click();
    await expect(page.getByTestId('claim-job-btn-JOB-203')).toBeEnabled();
    await page.getByTestId('claim-job-btn-JOB-203').click();
    await expect(page.getByTestId('job-claimed-badge-JOB-203')).toContainText('Claimed');

    // Now scroll to Module 6: Jason signs off graduation for Jordan Morales (TECH-04)
    await expect(page.getByTestId('tech-claim-rights-TECH-04')).toContainText('LOCKED');
    await page.getByTestId('graduate-trainee-btn-TECH-04').click();
    await expect(page.getByTestId('tech-claim-rights-TECH-04')).toContainText('ACTIVE');

    // Switch back to Junior Tech / Trainee (Jordan Morales TECH-04 is now graduated to L1) and claim JOB-201!
    await page.getByTestId('role-btn-junior-tech-trainee').click();
    await expect(page.getByTestId('active-role-banner')).toContainText('UNLOCKED (Graduated L1)');
    await expect(page.getByTestId('claim-job-btn-JOB-201')).toBeEnabled();
    await page.getByTestId('claim-job-btn-JOB-201').click();
    await expect(page.getByTestId('job-claimed-badge-JOB-201')).toContainText('Claimed');
  });

  test('3. Field App (/app): 9-Step Loaner Workflow & Ohio Food Code OAC 3717-1-08.1 Gate, Inventory (+35%/+25%), Quote Generator ($99 Credit & ~$98/day Downtime), Cuyahoga Validation, and 15%/20% Ledger', async ({
    page,
  }) => {
    await page.goto('/app');

    // MODULE 2: Loaner LN-03 is in Step 8 (In Sanitizing & Bench Prep)
    await expect(page.getByTestId('selected-loaner-status')).toContainText('In Sanitizing & Bench Prep');
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
    await expect(page.getByTestId('quote-loaner-price-line')).toContainText('$0.00 (Waived — Care Plan)');

    // MODULE 5: Cuyahoga County Booking Validation
    // First test out-of-county rejection (Akron, 44308, Summit)
    await page.getByTestId('booking-city-input').fill('Akron');
    await page.getByTestId('booking-zip-input').fill('44308');
    await page.getByTestId('booking-county-input').fill('Summit');
    await page.getByTestId('submit-booking-btn').click();
    await expect(page.getByTestId('booking-validation-banner')).toContainText(
      'CUYAHOGA COUNTY, OHIO ONLY'
    );

    // Now test valid Cuyahoga County booking (Lakewood, 44107, Cuyahoga)
    await page.getByTestId('booking-city-input').fill('Lakewood');
    await page.getByTestId('booking-zip-input').fill('44107');
    await page.getByTestId('booking-county-input').fill('Cuyahoga');
    await page.getByTestId('submit-booking-btn').click();
    await expect(page.getByTestId('booking-validation-banner')).toContainText('confirmed');

    // MODULE 6: Tech Network Split Ledger (15% Network / 20% Hub)
    const ledger = page.getByTestId('tech-network-split-ledger');
    await expect(ledger).toContainText('15% Take Rate');
    await expect(ledger).toContainText('20% Take Rate');
  });
});
