# 3J Industrial Parts LLC — Unified OS Command Center & Field Operations Platform

**Client:** Jason Allen, 3J Industrial Parts LLC  
**Contact:** `216-906-2252` · `Jallen@3jindustrialparts.com`  
**Tagline:** `SPARE PARTS | SERVICES | CONSULTING`  
**Issues:** `kingtaye-wq/recessOS#81` (`os.3jindustrialparts.com`) & `kingtaye-wq/recessOS#82` (`app.3jindustrialparts.com`)

---

## Architecture: Two Systems, One Shared Dataset

- **OS Command Center (`/os` — `os.3jindustrialparts.com`)** (`recessOS#81`):
  - **Left Rail Navigation:** `Dashboard` · `Scorecard` · `Division 01 — Foundry` · `Division 02 — Food Service (Cuyahoga)` · `Loaner Fleet` · `Quotes (<24h SLA)` · `Inventory` · `Junior Tech Program` · `Tech Network` · `Needs Jason`
  - **Top Status Bar:** Live counters for `Open Jobs`, `Quotes <24h SLA`, `Loaners Deployed / Available`, `Needs Jason`, plus quick actions (`+ New Quote`, `+ Dispatch Job`).
  - **5 Top-Level Dashboard Tiles:**
    1. `Needs Jason Queue` (Draft-First gate with live `Approve / Sign Off` actions mutating shared state)
    2. `<24-Hour Quote SLA Tracker` (Live countdown timers on every open quote across Division 01 & Division 02)
    3. `Cuyahoga County Live Dispatch & Loaner Map` (`LN-01`..`LN-05` & active Cuyahoga jobs)
    4. `Division 01 Foundry Pipeline` (`FDU`, `MTS 1500`, `SMARTT`, `ThermaTest NGIII 5000` — Foseco/Vesuvius platforms)
    5. `Junior Tech & Tech Network Pulse` (Cohort tracker, Jason graduation sign-off, `15%` Network / `20%` Hub split)
  - **4-Section Executive Scorecard + 90-Day Targets Rail:**
    - **Section A:** Division 01 — Industrial Foundry Support (Nationwide)
    - **Section B:** Division 02 — Commercial Equipment & Loaner Fleet (Cuyahoga County, OH Only)
    - **Section C:** The Junior Tech Program & Tech Network
    - **Section D:** Pipeline & Financials (`515` Cuyahoga bars & restaurants; `501` industrial targets = `162` core foundry + `339` metalworking long-tail)
    - **90-Day Targets Rail:** Dual-column 30 / 60 / 90-day tracker strictly separating **Activity Metrics** vs. **Dollar Metrics (`$`)**.

- **Field Operations App (`/app` — `app.3jindustrialparts.com`)** (`recessOS#82`):
  - **Role Switcher:** `Admin (Jason)` · `Tech L1` · `Tech L2 (EPA 608)` · `Tech L3 (Master / Foundry)` · `Junior Tech / Trainee` · `Customer`
  - **Module 1 — Cuyahoga County Job Map & Role-Gated Claiming:** Trainees blocked from solo claiming (`Shadow Ride Available — Request Assignment`) until Jason signs off graduation; L2 gated by verified EPA 608.
  - **Module 2 — 9-Step Loaner Machine Workflow + Ohio Food Code (`OAC 3717-1-08.1`) Gate:** Hard gate blocking transition from `In Sanitizing & Bench Prep` (Step 8) to `Available` (Step 9) until all 4 `OAC 3717-1-08.1` sanitation checks and tech initials are completed.
  - **Module 3 — Inventory Management:** Division 01 Foundry Parts, Division 02 Food Service Parts, and Loaner Fleet (`LN-01`..`LN-05`) with auto-calculated `+35%` standard and `+25%` contract pricing.
  - **Module 4 — Quote Generator (`<24h` Turnaround Promise):** Locked pricing (`$99` diagnostic credited toward repair, `$119–129/hr` bench, `$139–149/hr` field, `$169–179/hr` refrigeration/master, `+35%/+25%` parts markup, `$25–49/day` or `$149–249/incident` loaner waived to `$0` on Care Plan, `60 drinks/day × ~$2.72/drink ≈ $98/day` downtime callout).
  - **Module 5 — Mobile Work Booking:** Enforces Cuyahoga County, OH city/ZIP validation for Division 02 and supports Nationwide U.S. requests for Division 01.
  - **Module 6 — The Junior Tech Program & Tech Network:** 5 curriculum milestones, in-app graduation sign-off by Jason flipping `can_claim_solo = true`, Division 01 Foundry Mentorship track nomination, and locked `15%` Network / `20%` Hub split ledger.

---

## Development & Verification

```bash
npm install
npm run build
npx playwright test
```
