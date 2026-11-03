import Link from 'next/link';

export default function PlatformLandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between border-t-4 border-[#5ADCC8]">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/95 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/assets/3j-logo.png"
              alt="3J Industrial Parts LLC Logo"
              className="h-14 w-auto object-contain bg-black"
            />
            <div>
              <div className="text-lg font-black tracking-wider uppercase text-white">
                3J Industrial Parts LLC
              </div>
              <div className="text-xs font-bold tracking-widest uppercase text-[#5ADCC8]">
                SPARE PARTS | SERVICES | CONSULTING
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-300">
            <span>
              Founder: <strong className="text-white">Jason Allen</strong>
            </span>
            <span>·</span>
            <a href="tel:216-906-2252" className="hover:text-[#5ADCC8]">
              216-906-2252
            </a>
            <span>·</span>
            <a href="mailto:Jallen@3jindustrialparts.com" className="hover:text-[#5ADCC8]">
              Jallen@3jindustrialparts.com
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="mb-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-[#5ADCC8]/50 text-[#5ADCC8] text-xs font-bold uppercase tracking-widest mb-4">
            Unified Operations Platform · Division 01 Foundry &amp; Division 02 3JI-Repair
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            3J Industrial Parts — Command Center &amp; 3JI-Repair Field Operations
          </h1>
          <p className="mt-4 text-zinc-300 text-sm md:text-base border-l-2 border-[#5ADCC8] pl-4">
            &ldquo;6+ years of aluminum melt-treatment expertise — formerly the single point of contact for SMARTT, MTS 1500, and ThermaTest NGIII 5000 support across the U.S.&rdquo;
          </p>
          <p className="mt-2 text-xs text-zinc-400 font-mono">
            Foseco (Vesuvius) Platforms: FDU degassers · MTS 1500 · SMARTT · ThermaTest NGIII 5000 · Division 02 operates as 3JI-Repair (Launch Area: Cuyahoga County, OH) · Quote Promise: Estimate within 24 hours · Nothing contacts customers without Jason&apos;s approval.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: OS Command Center */}
          <div className="bg-zinc-950 border border-zinc-800 hover:border-[#5ADCC8] transition-all p-8 flex flex-col justify-between rounded">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest px-2.5 py-1 bg-[#5ADCC8]/15 text-[#5ADCC8] border border-[#5ADCC8]/40 rounded">
                  os.3jindustrialparts.com
                </span>
                <span className="text-xs font-mono text-zinc-400">recessOS#81</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-wide text-white mb-2">
                OS Command Center (/os)
              </h2>
              <p className="text-sm text-zinc-300 mb-6">
                Internal executive &amp; dispatch command center for Jason Allen + office. Features the Live Dashboard (`3JI-Repair trainees in pipeline`), 4-Section Executive Scorecard (`A. Division 01 — Foundry`, `B. Division 02 — 3JI-Repair`, `C. 3JI-Repair & Tech Network`, `D. Pipeline & Financials` carrying ALL company &amp; 3JI-Repair financials), Module 1 Retention Escalation Oversight in Needs Jason, and 90-Day Targets Rail.
              </p>
            </div>
            <Link
              href="/os"
              data-testid="launch-os-link"
              className="inline-flex items-center justify-center w-full py-3.5 px-6 bg-[#5ADCC8] text-black font-black uppercase tracking-wider text-sm rounded hover:bg-[#5ADCC8]/90 transition"
            >
              Launch OS Command Center (/os) →
            </Link>
          </div>

          {/* Card 2: Field App */}
          <div className="bg-zinc-950 border border-zinc-800 hover:border-[#5ADCC8] transition-all p-8 flex flex-col justify-between rounded">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest px-2.5 py-1 bg-[#5ADCC8]/15 text-[#5ADCC8] border border-[#5ADCC8]/40 rounded">
                  app.3jindustrialparts.com
                </span>
                <span className="text-xs font-mono text-zinc-400">recessOS#82</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-wide text-white mb-2">
                3JI-Repair Field Operations App (/app)
              </h2>
              <p className="text-sm text-zinc-300 mb-6">
                Mobile field operations &amp; three-portal suite (`Customer Portal`, `Technician Portal`, `3JI Staff Portal` + `3JI-Repair Trainee` state). Includes Cuyahoga County Job Map &amp; Role-Gated Claiming with Module 1 Retention Escalation Rule, 9-Step Loaner Machine Workflow with Ohio Food Code (`OAC 3717-1-08.1`) Gate, Inventory (`+35%` / `+25%`), Quote Generator (`&lt;24h` SLA &amp; `$99` diagnostic credit), Cuyahoga Booking Intake across Jason&apos;s 15-item equipment scope, 3JI-Repair Technician Pipeline, and the Support Docs PDF Library (ships empty per spec).
              </p>
            </div>
            <Link
              href="/app"
              data-testid="launch-app-link"
              className="inline-flex items-center justify-center w-full py-3.5 px-6 bg-white text-black font-black uppercase tracking-wider text-sm rounded hover:bg-[#5ADCC8] transition"
            >
              Launch 3JI-Repair Field App (/app) →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black px-6 py-4 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <strong className="text-white">3J Industrial Parts LLC</strong> · Division 01: Nationwide Foundry Support (USA) ·{' '}
            <strong className="text-[#5ADCC8]">
              Division 02 (3JI-Repair): Launch Area Cuyahoga County, OH Only
            </strong>
          </div>
          <div className="font-mono">
            Estimate within 24 hours · 216-906-2252 · Jallen@3jindustrialparts.com
          </div>
        </div>
      </footer>
    </div>
  );
}
