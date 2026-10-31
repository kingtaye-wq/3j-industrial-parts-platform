'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { PlatformState } from '@/lib/store';

type NavSection =
  | 'Dashboard'
  | 'Scorecard'
  | 'Division 01 — Foundry'
  | 'Division 02 — Food Service (Cuyahoga)'
  | 'Loaner Fleet'
  | 'Quotes (<24h SLA)'
  | 'Inventory'
  | 'Junior Tech Program'
  | 'Tech Network'
  | 'Needs Jason';

const NAV_ITEMS: NavSection[] = [
  'Dashboard',
  'Scorecard',
  'Division 01 — Foundry',
  'Division 02 — Food Service (Cuyahoga)',
  'Loaner Fleet',
  'Quotes (<24h SLA)',
  'Inventory',
  'Junior Tech Program',
  'Tech Network',
  'Needs Jason',
];

export default function OSCommandCenterPage() {
  const [state, setState] = useState<PlatformState | null>(null);
  const [activeNav, setActiveNav] = useState<NavSection>('Dashboard');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  // Quick Dispatch Form State
  const [dispatchBiz, setDispatchBiz] = useState('[Bar Account Placeholder — Cleveland Flats Taproom]');
  const [dispatchCity, setDispatchCity] = useState('Cleveland');
  const [dispatchZip, setDispatchZip] = useState('44113');
  const [dispatchMachine, setDispatchMachine] = useState('Frozen Beverage / Slushie Machine (Twin-Bowl)');
  const [dispatchSymptom, setDispatchSymptom] = useState('Emergency Down — Left freeze cylinder warm, loaner needed');
  const [dispatchLevel, setDispatchLevel] = useState<'L1' | 'L2' | 'L3'>('L1');
  const [dispatchLoaner, setDispatchLoaner] = useState(true);

  // Quick Quote Form State
  const [quoteDiv, setQuoteDiv] = useState<'Division 01 — Foundry' | 'Division 02 — Commercial Equipment'>('Division 01 — Foundry');
  const [quoteBiz, setQuoteBiz] = useState('[Foundry Account Placeholder — Canton Alloy Castings]');
  const [quoteSystem, setQuoteSystem] = useState('FDU & SMARTT Degassing Rotor + Health Check');
  const [quoteSerial, setQuoteSerial] = useState('SN-FDU-7741A');
  const [quoteTotal, setQuoteTotal] = useState(2150);

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
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleResolveNeedsJason = async (itemId: string, title: string) => {
    setBusyId(itemId);
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_needs_jason', item_id: itemId }),
      });
      const data = await res.json();
      if (data.state) {
        setState(data.state);
        notify(`Jason signed off: ${title}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleApproveQuote = async (quoteId: string) => {
    setBusyId(quoteId);
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_quote_status', quote_id: quoteId, status: 'Approved / Sent' }),
      });
      const data = await res.json();
      if (data.state) {
        setState(data.state);
        notify(`Quote ${quoteId} approved by Jason & released under <24h SLA.`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleGraduateTrainee = async (techId: string, name: string) => {
    setBusyId(techId);
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'graduate_trainee', tech_id: techId }),
      });
      const data = await res.json();
      if (data.state) {
        setState(data.state);
        notify(`Graduated ${name} to L1 — PM / Swap! Solo claiming unlocked in Field App.`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dispatch_job',
        business_name: dispatchBiz,
        city: dispatchCity,
        zip: dispatchZip,
        machine_type: dispatchMachine,
        reported_symptom: dispatchSymptom,
        urgency: dispatchLoaner ? 'Emergency Down — Loaner Needed' : 'Standard Repair',
        required_level: dispatchLevel,
        loaner_needed: dispatchLoaner,
      }),
    });
    const data = await res.json();
    if (data.state) {
      setState(data.state);
      setShowDispatchModal(false);
      notify(`Dispatched ${data.job.id} to Cuyahoga County Job Map.`);
    }
  };

  const handleQuickQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_quote',
        division: quoteDiv,
        business_name: quoteBiz,
        city_state:
          quoteDiv === 'Division 01 — Foundry'
            ? 'Nationwide Foundry Support (USA)'
            : 'Cleveland, OH (Cuyahoga County)',
        system_or_machine: quoteSystem,
        serial_number: quoteSerial,
        symptom_or_scope: 'Serial-verified quote request (<24h SLA promise)',
        total_amount: Number(quoteTotal),
        status: 'Needs Jason Approval',
      }),
    });
    const data = await res.json();
    if (data.state) {
      setState(data.state);
      setShowQuoteModal(false);
      notify(`Created ${data.quote.id} (<24h SLA timer started; queued in Needs Jason).`);
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono text-sm">
        Loading 3J Industrial Parts OS Command Center (os.3jindustrialparts.com)...
      </div>
    );
  }

  const openJobsCount = state.jobs.filter((j) => j.status !== 'Completed').length;
  const unclaimedJobsCount = state.jobs.filter((j) => j.status === 'Unclaimed').length;
  const openQuotesCount = state.quotes.filter(
    (q) => q.status === 'Draft' || q.status === 'Needs Jason Approval' || q.status === 'Approved / Sent'
  ).length;
  const deployedLoanersCount = state.loaners.filter((l) => l.status === 'Deployed').length;
  const availableLoanersCount = state.loaners.filter((l) => l.status === 'Available').length;
  const sanitizingLoanersCount = state.loaners.filter(
    (l) => l.status === 'In Sanitizing & Bench Prep'
  ).length;
  const pendingNeedsJason = state.needs_jason.filter((n) => n.status === 'Pending Jason');
  const lowStockParts = state.parts.filter((p) => p.qty_on_hand <= p.reorder_point);
  const carePlanMrr = 2146; // 14 active Cuyahoga Care Plan locations ($149-199/mo multi, $79-99/mo single)
  const juniorTechsInProgram = state.techs.filter((t) => !t.graduated_signed_off_by_jason).length;
  const graduatedTechsCount = state.techs.filter((t) => t.graduated_signed_off_by_jason).length;
  const div1MentorshipCount = state.techs.filter((t) => t.division_01_foundry_track).length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Status Bar */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur border-b border-zinc-800 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/3j-logo.png"
              alt="3J Industrial Parts LLC"
              className="h-11 w-auto object-contain bg-black"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider uppercase text-white text-sm md:text-base">
                  3J Industrial Parts LLC
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#5ADCC8]/15 text-[#5ADCC8] border border-[#5ADCC8]/40">
                  os.3jindustrialparts.com
                </span>
              </div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-[#5ADCC8]">
                SPARE PARTS | SERVICES | CONSULTING · Founder: Jason Allen · 216-906-2252 · Jallen@3jindustrialparts.com
              </div>
            </div>
          </div>

          {/* Live Status Counters */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div
              data-testid="status-open-jobs"
              className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800"
            >
              Open Jobs: <strong className="text-[#5ADCC8]">{openJobsCount}</strong>{' '}
              <span className="text-zinc-400">({unclaimedJobsCount} awaiting claim)</span>
            </div>
            <div
              data-testid="status-quotes-sla"
              className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800"
            >
              Quotes &lt;24h SLA: <strong className="text-[#5ADCC8]">{openQuotesCount}</strong>
            </div>
            <div
              data-testid="status-loaners"
              className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800"
            >
              Loaners:{' '}
              <strong className="text-[#5ADCC8]">
                {deployedLoanersCount} Deployed / {availableLoanersCount} Available
              </strong>{' '}
              <span className="text-zinc-400">({sanitizingLoanersCount} Prep)</span>
            </div>
            <div
              data-testid="status-needs-jason"
              className="px-2.5 py-1.5 rounded bg-zinc-900 border border-[#5ADCC8]/60"
            >
              Needs Jason: <strong className="text-[#5ADCC8]">{pendingNeedsJason.length}</strong>
            </div>

            {/* Quick Action Buttons */}
            <button
              type="button"
              data-testid="quick-action-new-quote"
              onClick={() => setShowQuoteModal(true)}
              className="px-3 py-1.5 rounded bg-[#5ADCC8] text-black font-black uppercase tracking-wider text-xs hover:bg-[#5ADCC8]/90 transition cursor-pointer"
            >
              + New Quote
            </button>
            <button
              type="button"
              data-testid="quick-action-dispatch-job"
              onClick={() => setShowDispatchModal(true)}
              className="px-3 py-1.5 rounded bg-zinc-900 text-[#5ADCC8] border border-[#5ADCC8] font-black uppercase tracking-wider text-xs hover:bg-[#5ADCC8] hover:text-black transition cursor-pointer"
            >
              + Dispatch Job
            </button>
            <Link
              href="/app"
              data-testid="switch-to-field-app"
              className="px-3 py-1.5 rounded bg-white text-black font-black uppercase tracking-wider text-xs hover:bg-[#5ADCC8] transition"
            >
              Field App (/app) →
            </Link>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          data-testid="os-toast"
          className="fixed bottom-5 right-5 z-50 bg-[#5ADCC8] text-black font-bold px-4 py-3 rounded shadow-lg border border-black text-xs font-mono"
        >
          ✓ {toast}
        </div>
      )}

      {/* Main Layout: Left Rail + Content Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Rail Navigation */}
        <aside
          aria-label="OS Command Center Navigation"
          className="w-full lg:w-64 bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800 p-4 flex flex-col justify-between shrink-0"
        >
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-3 px-2">
              Command Center Rail
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeNav === item;
                return (
                  <button
                    key={item}
                    type="button"
                    data-testid={`nav-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    onClick={() => setActiveNav(item)}
                    className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#5ADCC8] text-black font-black'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-[#5ADCC8]'
                    }`}
                  >
                    <span>{item}</span>
                    {item === 'Needs Jason' && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isActive ? 'bg-black text-[#5ADCC8]' : 'bg-[#5ADCC8]/20 text-[#5ADCC8]'
                        }`}
                      >
                        {pendingNeedsJason.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Verbatim Proof & Guardrail Box */}
          <div className="mt-6 p-3 rounded bg-black border border-zinc-800 text-[11px] text-zinc-300 space-y-2">
            <div className="text-[#5ADCC8] font-bold uppercase tracking-wider">
              Verbatim Brand Proof
            </div>
            <p className="leading-relaxed text-zinc-300">
              &ldquo;6+ years of aluminum melt-treatment expertise — formerly the single point of contact for SMARTT, MTS 1500, and ThermaTest NGIII 5000 support across the U.S.&rdquo;
            </p>
            <div className="pt-2 border-t border-zinc-800 font-mono text-[10px] text-zinc-400">
              • Foseco (Vesuvius) Platforms
              <br />
              • Div 01: Nationwide (USA)
              <br />
              • Div 02: CUYAHOGA COUNTY, OH ONLY
              <br />• Draft-First: Nothing contacts customers without Jason&apos;s approval.
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-5 md:p-7 space-y-8 overflow-y-auto">
          {/* Top KPI Strip (8 Live Counts per Spec Part 1) */}
          <section aria-label="Executive Live Counts" className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Open Jobs</div>
              <div className="text-xl font-black text-white mt-1">{openJobsCount}</div>
              <div className="text-[11px] text-[#5ADCC8] font-mono">Active Dispatch</div>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Awaiting Claim</div>
              <div className="text-xl font-black text-white mt-1">{unclaimedJobsCount}</div>
              <div className="text-[11px] text-[#5ADCC8] font-mono">≤ 2h Claim SLA</div>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Loaners Out</div>
              <div className="text-xl font-black text-white mt-1">
                {deployedLoanersCount} / {state.loaners.length}
              </div>
              <div className="text-[11px] text-[#5ADCC8] font-mono">{availableLoanersCount} Ready Now</div>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Quotes &lt;24h</div>
              <div className="text-xl font-black text-white mt-1">{openQuotesCount}</div>
              <div className="text-[11px] text-[#5ADCC8] font-mono">100% &lt;24h SLA</div>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Care-Plan MRR</div>
              <div className="text-xl font-black text-[#5ADCC8] mt-1">${carePlanMrr.toLocaleString()}/mo</div>
              <div className="text-[11px] text-zinc-400 font-mono">14 Cuyahoga Locs</div>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Junior Techs</div>
              <div className="text-xl font-black text-white mt-1">{juniorTechsInProgram} Enrolled</div>
              <div className="text-[11px] text-[#5ADCC8] font-mono">{graduatedTechsCount} Graduated</div>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Low-Stock Alerts</div>
              <div className="text-xl font-black text-white mt-1">{lowStockParts.length}</div>
              <div className="text-[11px] text-[#5ADCC8] font-mono">Critical SKUs</div>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Revenue MTD</div>
              <div className="text-xl font-black text-[#5ADCC8] mt-1">$34,130</div>
              <div className="text-[11px] text-zinc-400 font-mono">$24.5k D1 · $9.6k D2</div>
            </div>
          </section>

          {/* =====================================================================
              5 TOP-LEVEL DASHBOARD TILES
             ===================================================================== */}
          <section aria-label="OS Command Center 5 Top-Level Tiles" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white">
                  OS Command Center — Active View: <span className="text-[#5ADCC8]">{activeNav}</span>
                </h1>
                <p className="text-xs text-zinc-400 font-mono">
                  Two Divisions · One Shared Dataset · Estimate within 24 hours · Nothing contacts customers without Jason&apos;s approval
                </p>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                Synced: {new Date(state.last_updated).toLocaleTimeString()}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* TILE 1: Needs Jason Queue */}
              <div
                data-testid="tile-needs-jason"
                className="xl:col-span-6 bg-zinc-950 border border-zinc-800 rounded p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                        Tile 1
                      </span>
                      <h2 className="text-base font-black uppercase tracking-wider text-white">
                        1. Needs Jason Queue (Draft-First Gate)
                      </h2>
                    </div>
                    <span
                      data-testid="needs-jason-pending-badge"
                      className="text-xs font-mono text-[#5ADCC8] font-bold"
                    >
                      {pendingNeedsJason.length} Pending Sign-Off
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">
                    Pending quote approvals, Junior Tech graduation sign-offs, OAC 3717-1-08.1 sanitizing log gates, unclaimed jobs &gt; 4h, and out-of-county exceptions.
                  </p>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {state.needs_jason.map((item) => {
                      const isDone = item.status === 'Approved / Signed Off';
                      return (
                        <div
                          key={item.id}
                          data-testid={`needs-jason-item-${item.id}`}
                          className={`p-3 rounded border transition ${
                            isDone
                              ? 'bg-black/50 border-zinc-800 opacity-65'
                              : 'bg-black border-zinc-700 hover:border-[#5ADCC8]'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-[#5ADCC8] border border-zinc-700">
                                  {item.category}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400">
                                  {item.division}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-white">{item.title}</div>
                              <div className="text-[11px] text-zinc-400">{item.detail}</div>
                            </div>

                            <div>
                              {isDone ? (
                                <span
                                  data-testid={`needs-jason-resolved-${item.id}`}
                                  className="inline-block px-2.5 py-1 rounded bg-zinc-900 text-[#5ADCC8] border border-[#5ADCC8]/40 text-[11px] font-mono font-bold"
                                >
                                  ✓ Signed Off
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  data-testid={`needs-jason-approve-${item.id}`}
                                  disabled={busyId === item.id}
                                  onClick={() => handleResolveNeedsJason(item.id, item.title)}
                                  className="px-3 py-1.5 rounded bg-[#5ADCC8] text-black font-black uppercase tracking-wider text-[11px] hover:bg-[#5ADCC8]/90 transition cursor-pointer"
                                >
                                  {busyId === item.id ? 'Signing...' : 'Approve / Sign Off'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* TILE 2: <24-Hour Quote SLA Tracker */}
              <div
                data-testid="tile-quote-sla"
                className="xl:col-span-6 bg-zinc-950 border border-zinc-800 rounded p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                        Tile 2
                      </span>
                      <h2 className="text-base font-black uppercase tracking-wider text-white">
                        2. &lt;24-Hour Quote SLA Tracker
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-[#5ADCC8] font-bold">
                      Estimate Within 24 Hours Promise
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">
                    Live countdown timers on every open quote request across Division 01 (Foundry) &amp; Division 02 (Cuyahoga Commercial Equipment).
                  </p>

                  <div className="space-y-2.5">
                    {state.quotes.map((q) => (
                      <div
                        key={q.id}
                        data-testid={`os-quote-row-${q.id}`}
                        className="p-3 rounded bg-black border border-zinc-800 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#5ADCC8]">
                              {q.id}
                            </span>
                            <span className="text-xs font-bold text-white">{q.business_name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                              {q.division}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {q.system_or_machine} · Serial: <span className="font-mono text-zinc-200">{q.serial_number}</span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-300">
                            Labor: {q.labor_tier} · Markup: {q.contract_pricing ? '+25% Contract' : '+35% Standard'} · Total:{' '}
                            <strong className="text-[#5ADCC8]">${q.total_amount.toLocaleString()}</strong>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <div className="px-2 py-0.5 rounded bg-[#5ADCC8]/15 border border-[#5ADCC8]/50 text-[#5ADCC8] font-mono text-[11px] font-bold">
                            ⏱ {q.sla_hours_remaining.toFixed(1)}h left on &lt;24h SLA
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-zinc-300">
                              Status: <strong>{q.status}</strong>
                            </span>
                            {q.status === 'Needs Jason Approval' && (
                              <button
                                type="button"
                                data-testid={`os-approve-quote-${q.id}`}
                                onClick={() => handleApproveQuote(q.id)}
                                className="px-2.5 py-1 rounded bg-[#5ADCC8] text-black font-black uppercase text-[10px] cursor-pointer"
                              >
                                Approve Quote
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TILE 3: Cuyahoga County Live Dispatch & Loaner Map */}
              <div
                data-testid="tile-cuyahoga-dispatch-map"
                className="xl:col-span-4 bg-zinc-950 border border-zinc-800 rounded p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                      Tile 3
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      3. Cuyahoga County Live Dispatch &amp; Loaner Map
                    </h2>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-[#5ADCC8] mb-3 uppercase">
                  Division 02 Service Area: CUYAHOGA COUNTY, OHIO ONLY
                </div>

                {/* Stylized Live Cuyahoga Radar Map */}
                <div className="bg-black border border-zinc-800 rounded p-3 mb-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-2">
                    <span>LAKE ERIE SHORELINE (CLEVELAND / LAKEWOOD / EUCLID)</span>
                    <span>CUYAHOGA BOUNDARY</span>
                  </div>
                  <div className="space-y-2">
                    {state.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-2 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              job.dot_color === 'red'
                                ? 'bg-red-500'
                                : job.dot_color === 'amber'
                                ? 'bg-amber-400'
                                : 'bg-[#5ADCC8]'
                            }`}
                          />
                          <div>
                            <div className="font-bold text-white text-[11px]">
                              {job.id} · {job.city}, OH ({job.required_level})
                            </div>
                            <div className="text-[10px] text-zinc-400">{job.machine_type}</div>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[10px]">
                          <div className="text-[#5ADCC8] font-bold">{job.status}</div>
                          {job.assigned_loaner_id && (
                            <div className="text-zinc-400">Loaner: {job.assigned_loaner_id}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Loaner Fleet LN-01..LN-05 Mini Strip */}
                <div className="text-[11px] font-mono uppercase text-zinc-400 mb-2">
                  Loaner Fleet Status (LN-01 .. LN-05)
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
                  {state.loaners.map((ln) => (
                    <div
                      key={ln.id}
                      className={`p-1.5 rounded border ${
                        ln.status === 'Available'
                          ? 'border-[#5ADCC8] bg-[#5ADCC8]/10 text-[#5ADCC8]'
                          : ln.status === 'Deployed'
                          ? 'border-zinc-700 bg-zinc-900 text-white'
                          : 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      <div className="font-bold">{ln.id}</div>
                      <div className="truncate text-[9px]">{ln.status.split(' ')[0]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TILE 4: Division 01 Foundry Pipeline */}
              <div
                data-testid="tile-foundry-pipeline"
                className="xl:col-span-4 bg-zinc-950 border border-zinc-800 rounded p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                      Tile 4
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      4. Division 01 Foundry Pipeline (Nationwide)
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Foseco (Vesuvius) melt-treatment platforms: serial-verified spare parts (`+35%` standard / `+25%` contract), health checks, and U.S. field service.
                </p>

                <div className="space-y-2.5 text-xs">
                  {[
                    {
                      platform: 'FDU (Foundry Degassing Unit)',
                      family: 'Graphite Rotors & Shafts (XSR/FDR/XDR/FDDR)',
                      activeAccounts: 6,
                      ordersOpen: 4,
                      status: 'Serial-Verified Dispatch',
                    },
                    {
                      platform: 'MTS 1500 (Metal Treatment Station)',
                      family: 'FDDR Rotors + COVERAL / SIMODAL / NUCLEANT Fluxes',
                      activeAccounts: 5,
                      ordersOpen: 3,
                      status: '2 PM Visits + Rotor Restock',
                    },
                    {
                      platform: 'SMARTT (Automated Degassing)',
                      family: 'DIAMANT Ceramic Wear Parts & Metering Nozzles',
                      activeAccounts: 4,
                      ordersOpen: 3,
                      status: 'Health Check & Calibration',
                    },
                    {
                      platform: 'ThermaTest NGIII 5000',
                      family: 'Thermal-Analysis Quartz Cups & Type-K Thermocouples',
                      activeAccounts: 3,
                      ordersOpen: 2,
                      status: 'NIST Calibration + Cup Orders',
                    },
                  ].map((sys) => (
                    <div
                      key={sys.platform}
                      className="p-2.5 rounded bg-black border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-white">{sys.platform}</div>
                        <div className="text-[11px] text-zinc-400">{sys.family}</div>
                      </div>
                      <div className="text-right font-mono text-[11px] shrink-0">
                        <div className="text-[#5ADCC8] font-bold">{sys.activeAccounts} Accounts</div>
                        <div className="text-zinc-400">{sys.ordersOpen} Open Orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TILE 5: Junior Tech & Tech Network Pulse */}
              <div
                data-testid="tile-junior-tech-pulse"
                className="xl:col-span-4 bg-zinc-950 border border-zinc-800 rounded p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#5ADCC8] text-black rounded">
                      Tile 5
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      5. Junior Tech &amp; Tech Network Pulse
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Vocational training pipeline for Division 02 (bar/restaurant equipment) &amp; recruiting funnel for Jason&apos;s Division 01 foundry mentorship.
                </p>

                <div className="space-y-2 mb-3">
                  {state.techs.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded bg-black border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{t.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          {t.level} · Swaps: {t.shadow_swaps_completed}/5 · {t.payout_tier}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {t.division_01_foundry_track && (
                          <span className="px-1.5 py-0.5 rounded bg-[#5ADCC8]/15 text-[#5ADCC8] border border-[#5ADCC8]/40 text-[9px] font-mono uppercase">
                            Div 01 Foundry Track
                          </span>
                        )}
                        {!t.graduated_signed_off_by_jason && (
                          <button
                            type="button"
                            data-testid={`os-graduate-btn-${t.id}`}
                            onClick={() => handleGraduateTrainee(t.id, t.name)}
                            className="px-2 py-0.5 rounded bg-[#5ADCC8] text-black font-black text-[10px] uppercase cursor-pointer"
                          >
                            Sign Off L1 Graduation
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 rounded bg-black border border-zinc-800 text-[11px] font-mono flex items-center justify-between">
                  <span>Platform Take Rate (Locked):</span>
                  <span className="text-[#5ADCC8] font-bold">15% Network / 20% Hub</span>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              4-SECTION EXECUTIVE SCORECARD + 90-DAY TARGETS RAIL
             ===================================================================== */}
          <section
            id="scorecard-section"
            data-testid="os-scorecard-section"
            aria-label="3J Executive Scorecard"
            className="space-y-6 pt-4 border-t border-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider text-white">
                  Executive Scorecard — 4 Core Sections &amp; 90-Day Targets Rail
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Live KPIs across Division 01 Foundry (Nationwide), Division 02 Commercial Equipment (Cuyahoga County, OH Only), Junior Tech Program, and Pipeline/Financials
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SECTION A — Division 01: Industrial Foundry Support (Nationwide) */}
              <div
                data-testid="scorecard-section-a"
                className="bg-zinc-950 border border-zinc-800 rounded p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#5ADCC8] font-bold">
                      Scorecard Section A · Nationwide (USA)
                    </span>
                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                      A. Division 01 — Industrial Foundry Support (Nationwide)
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-black border border-zinc-800 rounded text-[#5ADCC8]">
                    Foseco / Vesuvius Platforms
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">1. Quotes Requested (7d / 30d)</div>
                    <div className="text-lg font-black text-white mt-0.5">9 (7d) · 28 (30d)</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">↑ +18% vs prior 30d</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">2. Quote Turnaround SLA</div>
                    <div className="text-lg font-black text-[#5ADCC8] mt-0.5">4.2h Median (100% &lt;24h)</div>
                    <div className="text-[11px] text-zinc-400 font-mono">Target: ≤ 24 hours</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">3. Win Rate &amp; Open Pipeline ($)</div>
                    <div className="text-lg font-black text-white mt-0.5">42.8% · $48,600</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">Target Win Rate: ≥ 35%</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">4. Active PM / Calibration Contracts</div>
                    <div className="text-lg font-black text-white mt-0.5">11 Contracts · 9 Checks/Qtr</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">Target Health Checks: ≥ 8/qtr</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">5. Parts Fulfillment &amp; Margin</div>
                    <div className="text-lg font-black text-white mt-0.5">$24,490 · 28.4% GM</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">+35% Standard / +25% Contract (Target ≥26%)</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">6. Repeat-Order &amp; Field Days</div>
                    <div className="text-lg font-black text-white mt-0.5">66.7% Repeat · 14 Days</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">Target ≥ 60% · Billed at $139–149/hr</div>
                  </div>
                </div>

                <div className="p-3 bg-black border border-zinc-800 rounded text-xs">
                  <div className="font-mono text-[11px] text-zinc-400 uppercase mb-2">
                    Top Platform Demand &amp; Active Accounts by System (18 Distinct Customers)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                      <div className="text-[#5ADCC8] font-bold">FDU</div>
                      <div>6 Accounts · 34%</div>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                      <div className="text-[#5ADCC8] font-bold">MTS 1500</div>
                      <div>5 Accounts · 28%</div>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                      <div className="text-[#5ADCC8] font-bold">SMARTT</div>
                      <div>4 Accounts · 22%</div>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                      <div className="text-[#5ADCC8] font-bold">ThermaTest NGIII 5000</div>
                      <div>3 Accounts · 16%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B — Division 02: Commercial Equipment & Loaner Fleet (Cuyahoga County Only) */}
              <div
                data-testid="scorecard-section-b"
                className="bg-zinc-950 border border-zinc-800 rounded p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#5ADCC8] font-bold">
                      Scorecard Section B · CUYAHOGA COUNTY, OHIO ONLY
                    </span>
                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                      B. Division 02 — Commercial Equipment &amp; Loaner Fleet (Cuyahoga Only)
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-[#5ADCC8]/15 border border-[#5ADCC8]/40 rounded text-[#5ADCC8] font-bold">
                    Cuyahoga County Only
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">1. Active Care Plans &amp; MRR</div>
                    <div className="text-lg font-black text-[#5ADCC8] mt-0.5">14 Locs · $2,146/mo MRR</div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      9 Multi ($149–199/mo) · 5 Single ($79–99/mo)
                    </div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">2. Emergency Claim &amp; Response</div>
                    <div className="text-lg font-black text-white mt-0.5">1.1h Claim · Same-Day</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">Target Claim ≤ 2h · On-site 2.6h med</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">3. First-Visit Resolution (w/ Swap)</div>
                    <div className="text-lg font-black text-white mt-0.5">88.5% First-Time Fix</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">Target: ≥ 80% · 34 Jobs Completed (30d)</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">4. Loaner Fleet &amp; Turnaround</div>
                    <div className="text-lg font-black text-white mt-0.5">
                      {availableLoanersCount} Avail / {deployedLoanersCount} Out / {sanitizingLoanersCount} Prep
                    </div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">
                      54% Util (40–70% band) · 26h Turnaround (≤48h)
                    </div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">5. $99 Diagnostics &amp; Conversion</div>
                    <div className="text-lg font-black text-white mt-0.5">22 ($99) · 86.4% Conv</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">$99 Diagnostic Credited Toward Repair</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">6. Labor Tier Revenue Mix &amp; Bench</div>
                    <div className="text-lg font-black text-white mt-0.5">3.2d Med Bench (≤5d)</div>
                    <div className="text-[11px] text-zinc-300 font-mono">
                      $119–129 Bench (38%) · $139–149 Field (41%) · $169–179 Master (21%)
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION C — The Junior Tech Program & Tech Network */}
              <div
                data-testid="scorecard-section-c"
                className="bg-zinc-950 border border-zinc-800 rounded p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#5ADCC8] font-bold">
                      Scorecard Section C · Vocational Training &amp; Foundry Recruiting Funnel
                    </span>
                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                      C. The Junior Tech Program &amp; Tech Network
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-black border border-zinc-800 rounded text-[#5ADCC8]">
                    15% Network / 20% Hub
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">1. Junior Tech Cohort Enrollment</div>
                    <div className="text-lg font-black text-white mt-0.5">
                      {juniorTechsInProgram} Trainees Enrolled
                    </div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">
                      Cohort 02: Classroom/Bench + Shadow Rides
                    </div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">2. Graduation &amp; Div 01 Foundry Track</div>
                    <div className="text-lg font-black text-[#5ADCC8] mt-0.5">
                      {graduatedTechsCount} Graduated · {div1MentorshipCount} Foundry Track
                    </div>
                    <div className="text-[11px] text-zinc-300 font-mono">
                      Top graduates recruited to Division 01 Mentorship
                    </div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">3. Certified Techs by Tier</div>
                    <div className="text-lg font-black text-white mt-0.5">L1: 1 · L2: 1 · L3: 2</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">
                      L1 PM/Swap · L2 EPA 608 · L3 Master/Foundry
                    </div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">4. Claim Rate &amp; Time-to-Claim</div>
                    <div className="text-lg font-black text-white mt-0.5">91.7% Claim · 1.1h Avg</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">4.8 Jobs / Tech / Week</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">5. Quality Rating &amp; Callback Rate</div>
                    <div className="text-lg font-black text-white mt-0.5">4.85 ★ · 2.4% Callback</div>
                    <div className="text-[11px] text-[#5ADCC8] font-mono">Targets: Rating ≥ 4.7 · Callback ≤ 5%</div>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="text-zinc-400 font-mono text-[11px]">6. Marketplace Take-Rate Revenue</div>
                    <div className="text-lg font-black text-[#5ADCC8] mt-0.5">$289 Fee / $1,286 Net</div>
                    <div className="text-[11px] text-zinc-300 font-mono">
                      Strictly 15% Network / 20% Hub (Never 25–30%)
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION D — Pipeline & Financials */}
              <div
                data-testid="scorecard-section-d"
                className="bg-zinc-950 border border-zinc-800 rounded p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#5ADCC8] font-bold">
                      Scorecard Section D · Seeded Prospect Lists &amp; Financials
                    </span>
                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                      D. Pipeline &amp; Financials (515 Bars/Restaurants · 501 Industrial)
                    </h3>
                  </div>
                </div>

                {/* Seeded Prospect Funnels */}
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">
                        Division 02 Outreach Funnel: 515 Cuyahoga County Bars &amp; Restaurants
                      </span>
                      <span className="font-mono text-[#5ADCC8] font-bold">total_targets: 515</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 font-mono text-[11px] mt-2 text-center">
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-400">Untouched</div>
                        <div className="text-white font-bold">
                          {state.pipeline_funnel.cuyahoga_bars_restaurants.untouched}
                        </div>
                      </div>
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-400">Contacted</div>
                        <div className="text-white font-bold">
                          {state.pipeline_funnel.cuyahoga_bars_restaurants.contacted}
                        </div>
                      </div>
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-400">Quoted / Demo</div>
                        <div className="text-[#5ADCC8] font-bold">
                          {state.pipeline_funnel.cuyahoga_bars_restaurants.quoted_or_demo}
                        </div>
                      </div>
                      <div className="p-1.5 bg-zinc-950 border border-[#5ADCC8]/50 rounded">
                        <div className="text-[#5ADCC8]">Closed Active</div>
                        <div className="text-white font-bold">
                          {state.pipeline_funnel.cuyahoga_bars_restaurants.active_customers}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-black border border-zinc-800 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">
                        Division 01 Industrial Targets: 501 Total (162 Enriched Core Foundry + 339 Long-Tail)
                      </span>
                      <span className="font-mono text-[#5ADCC8] font-bold">total_targets: 501</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mb-2">
                      162 core foundry/die-cast/forge/heat-treat/steel + 339 broader metalworking long-tail = 501
                    </div>
                    <div className="grid grid-cols-4 gap-2 font-mono text-[11px] text-center">
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-400">Untouched</div>
                        <div className="text-white font-bold">
                          {state.pipeline_funnel.industrial_targets.untouched}
                        </div>
                      </div>
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-400">Contacted</div>
                        <div className="text-white font-bold">
                          {state.pipeline_funnel.industrial_targets.contacted}
                        </div>
                      </div>
                      <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-400">Quote Requests</div>
                        <div className="text-[#5ADCC8] font-bold">
                          {state.pipeline_funnel.industrial_targets.quoted}
                        </div>
                      </div>
                      <div className="p-1.5 bg-zinc-950 border border-[#5ADCC8]/50 rounded">
                        <div className="text-[#5ADCC8]">Active Accounts</div>
                        <div className="text-white font-bold">
                          {state.pipeline_funnel.industrial_targets.active_accounts}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cash Collected vs Open AR & Margin by Stream */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-black border border-zinc-800 rounded">
                      <div className="text-zinc-400 font-mono text-[11px]">Cash Collected vs Open A/R</div>
                      <div className="text-sm font-black text-white mt-1">
                        $24,490 MTD · $92,600 QTD Collected
                      </div>
                      <div className="text-[11px] text-[#5ADCC8] font-mono mt-0.5">
                        Open A/R: $13,015 ($8,420 0–30d · $4,595 31–60d)
                      </div>
                    </div>
                    <div className="p-3 bg-black border border-zinc-800 rounded">
                      <div className="text-zinc-400 font-mono text-[11px]">Gross Margin by Stream</div>
                      <div className="text-[11px] font-mono text-zinc-200 mt-1 space-y-0.5">
                        <div>• Parts (+35%/+25%): <strong className="text-[#5ADCC8]">28.4% GM</strong></div>
                        <div>• Field Service &amp; Care Plans: <strong className="text-[#5ADCC8]">66.8% GM</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =====================================================================
                90-DAY TARGETS RAIL (Activity vs Dollar Metrics Strictly Separated)
               ===================================================================== */}
            <div
              data-testid="targets-90-day-rail"
              className="bg-zinc-950 border border-zinc-800 rounded p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#5ADCC8] font-bold">
                    30 / 60 / 90-Day Target Tracker · Dual-Column Separation Rule
                  </span>
                  <h3 className="text-base font-black uppercase tracking-wide text-white">
                    90-Day Targets Rail (Activity Metrics vs. Dollar Metrics — Strictly Separated)
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Activity counts and Dollar ($) metrics are never summed together
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Activity Metrics ONLY */}
                <div
                  data-testid="targets-activity-column"
                  className="bg-black border border-zinc-800 rounded p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#5ADCC8]">
                      Column A — Activity Metrics (Calls, Quotes, Swaps, Trainees)
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Non-Monetary Units Only</span>
                  </div>
                  {state.targets_90_day.map((row) => {
                    const pct = Math.min(100, Math.round((row.activity_current / row.activity_target) * 100));
                    return (
                      <div key={`${row.id}-act`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">
                            [{row.horizon}] {row.activity_metric_label}
                          </span>
                          <span className="font-mono text-[#5ADCC8] font-bold">
                            {row.activity_current} / {row.activity_target} {row.activity_unit} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded overflow-hidden">
                          <div className="h-full bg-[#5ADCC8]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Column 2: Dollar Metrics ($) ONLY */}
                <div
                  data-testid="targets-dollar-column"
                  className="bg-black border border-zinc-800 rounded p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#5ADCC8]">
                      Column B — Dollar Metrics ($) (MRR, Parts Revenue, Service Revenue)
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">USD ($) Revenue Only</span>
                  </div>
                  {state.targets_90_day.map((row) => {
                    const pct = Math.min(100, Math.round((row.dollar_current / row.dollar_target) * 100));
                    return (
                      <div key={`${row.id}-usd`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">
                            [{row.horizon}] {row.dollar_metric_label}
                          </span>
                          <span className="font-mono text-[#5ADCC8] font-bold">
                            ${row.dollar_current.toLocaleString()} / ${row.dollar_target.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded overflow-hidden">
                          <div className="h-full bg-[#5ADCC8]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Modal: Quick Dispatch Job */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleQuickDispatch}
            className="bg-zinc-950 border border-[#5ADCC8] rounded p-6 max-w-lg w-full space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#5ADCC8]">
                + Dispatch Cuyahoga County Field Job
              </h3>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-zinc-400 mb-1">Business Name (Placeholder)</label>
                <input
                  type="text"
                  value={dispatchBiz}
                  onChange={(e) => setDispatchBiz(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Cuyahoga City</label>
                  <input
                    type="text"
                    value={dispatchCity}
                    onChange={(e) => setDispatchCity(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={dispatchZip}
                    onChange={(e) => setDispatchZip(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-mono text-zinc-400 mb-1">Equipment Type</label>
                <input
                  type="text"
                  value={dispatchMachine}
                  onChange={(e) => setDispatchMachine(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-mono text-zinc-400 mb-1">Reported Symptom</label>
                <input
                  type="text"
                  value={dispatchSymptom}
                  onChange={(e) => setDispatchSymptom(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Required Skill Level</label>
                  <select
                    value={dispatchLevel}
                    onChange={(e) => setDispatchLevel(e.target.value as 'L1' | 'L2' | 'L3')}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  >
                    <option value="L1">L1 — PM / Swap</option>
                    <option value="L2">L2 — Sealed System / EPA 608</option>
                    <option value="L3">L3 — Master / Foundry</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    id="loaner-chk"
                    type="checkbox"
                    checked={dispatchLoaner}
                    onChange={(e) => setDispatchLoaner(e.target.checked)}
                  />
                  <label htmlFor="loaner-chk" className="text-white font-bold">
                    Reserve Loaner Machine
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 rounded bg-zinc-800 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#5ADCC8] text-black text-xs font-black uppercase"
              >
                Post to Job Map
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Quick New Quote */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleQuickQuote}
            className="bg-zinc-950 border border-[#5ADCC8] rounded p-6 max-w-lg w-full space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#5ADCC8]">
                + Create Draft Quote (&lt;24h SLA Promise)
              </h3>
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-zinc-400 mb-1">Division</label>
                <select
                  value={quoteDiv}
                  onChange={(e) =>
                    setQuoteDiv(e.target.value as 'Division 01 — Foundry' | 'Division 02 — Commercial Equipment')
                  }
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                >
                  <option value="Division 01 — Foundry">Division 01 — Foundry Support (Nationwide)</option>
                  <option value="Division 02 — Commercial Equipment">
                    Division 02 — Commercial Equipment (Cuyahoga County Only)
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-zinc-400 mb-1">Customer Placeholder</label>
                <input
                  type="text"
                  value={quoteBiz}
                  onChange={(e) => setQuoteBiz(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-mono text-zinc-400 mb-1">System / Equipment</label>
                <input
                  type="text"
                  value={quoteSystem}
                  onChange={(e) => setQuoteSystem(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={quoteSerial}
                    onChange={(e) => setQuoteSerial(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-zinc-400 mb-1">Estimated Total ($)</label>
                  <input
                    type="number"
                    value={quoteTotal}
                    onChange={(e) => setQuoteTotal(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="px-4 py-2 rounded bg-zinc-800 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#5ADCC8] text-black text-xs font-black uppercase"
              >
                Queue for Jason&apos;s Approval
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
