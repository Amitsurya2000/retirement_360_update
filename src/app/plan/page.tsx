"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { BuiltPlan as EngineBuiltPlan, Client as EngineClient } from "@/lib/retirement-engine";
import { formatINR, formatPct } from "@/lib/format";
import { EngineRoadmap } from "@/components/plan/EngineRoadmap";
import { SWPCorpusChart, SWPMonthlyChart } from "@/components/plan/SWPProjectionChart";
import { CongratsModal } from "@/components/plan/CongratsModal";
import { WealthManagerCTA } from "@/components/WealthManagerCTA";
import { ArrowRight, Receipt, AlertTriangle, Download } from "lucide-react";

function PlanPageInner() {
  const params = useSearchParams();
  const idFromUrl = params.get("id");
  const [profileId, setProfileId] = useState<string | null>(idFromUrl);
  const [engineClient, setEngineClient] = useState<EngineClient | null>(null);
  const [enginePlan, setEnginePlan] = useState<EngineBuiltPlan | null>(null);
  const [profile, setProfile] = useState<{ fullName?: string | null; age: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [congratsDismissed, setCongratsDismissed] = useState(false);
  const [incomeOverride, setIncomeOverride] = useState<number | null>(null);
  const [corpusOverride, setCorpusOverride] = useState<number | null>(null);

  // If no id in URL, try localStorage
  useEffect(() => {
    if (!idFromUrl) {
      const stored = typeof window !== "undefined" ? localStorage.getItem("retirewell.profileId") : null;
      if (stored) setProfileId(stored);
      else setLoading(false);
    }
  }, [idFromUrl]);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    const q = new URLSearchParams({ id: profileId });
    if (incomeOverride != null) q.set("income", String(incomeOverride));
    if (corpusOverride != null) q.set("corpus", String(corpusOverride));
    fetch(`/api/plan?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setProfile(d.profile);
        if (d.engine) {
          setEngineClient(d.engine.client);
          setEnginePlan(d.engine.plan);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [profileId, incomeOverride, corpusOverride]);

  // Generate + store the plan PDF (for records + the download button).
  useEffect(() => {
    if (!profileId) return;
    fetch(`/api/plan-pdf?id=${profileId}`).catch(() => {});
  }, [profileId]);

  if (!profileId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light text-primary mb-5">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3">No plan yet</h1>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">Spend 5 minutes on the wizard. We&apos;ll show you exactly how to turn your corpus into monthly income.</p>
        <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2 text-lg">
          Start the Wizard <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  if (loading && !enginePlan) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4" />
        <p className="text-slate-600">Building your plan…</p>
      </div>
    );
  }

  if (error || !enginePlan || !engineClient) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold mb-3">Couldn&apos;t load your plan</h1>
        <p className="text-slate-600 mb-6">{error || "Plan not found."}</p>
        <Link href="/onboarding" className="btn-primary">Start over</Link>
      </div>
    );
  }

  // ---- Eligibility (3-stage roadmap engine = the advisor method) ----
  const engineRemaining = enginePlan.remainingCorpus;
  const engineTotal = enginePlan.totalCorpus;
  const isEligible = enginePlan.stage1.status !== "UNDERFUNDED" && engineRemaining >= 0;
  const isComfortable = isEligible && engineRemaining >= 0.2 * engineTotal;

  const fullName = profile?.fullName?.trim();
  const wanted = engineClient.requiredMonthlyIncome;
  const managed = enginePlan.stage1.managed;
  const shortBy = Math.max(0, -engineRemaining);
  const surplus = Math.max(0, engineRemaining);
  const liabs = engineClient.liabilities ?? [];
  const biggest = liabs.length ? liabs.reduce((a, b) => (b.amount > a.amount ? b : a)) : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {isComfortable && !congratsDismissed && (
        <CongratsModal
          name={fullName}
          subtitle={`Your corpus comfortably funds your income, your big expenses are covered, and ${formatINR(engineRemaining, { compact: true })} is left growing for your future. You're all set!`}
          onClose={() => setCongratsDismissed(true)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide">Your Personalized Plan</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">
          {fullName ? `${fullName}, ` : ""}here&apos;s your retirement plan
        </h1>
        <p className="mt-2 text-slate-600">
          Built on the 3-stage roadmap — a steady monthly income, your big expenses ring-fenced, and the rest grown for the future.
        </p>
        <a
          href={`/api/plan-pdf?id=${profileId}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4 text-primary" /> Download my plan (PDF)
        </a>
      </div>

      {/* Eligibility result */}
      {isComfortable ? (
        <div className="mb-8 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 flex items-start gap-3">
          <span className="text-3xl leading-none">🎉</span>
          <div>
            <h2 className="text-xl font-bold text-emerald-800">
              Congratulations{fullName ? `, ${fullName}` : ""}! You&apos;re eligible 🎊
            </h2>
            <p className="text-emerald-700 text-sm mt-1">
              Your corpus <strong>comfortably</strong> funds your <strong>{formatINR(wanted)}/month</strong> income,
              your big expenses are ring-fenced, and you still have <strong>{formatINR(surplus, { compact: true })}</strong>{" "}
              growing for the future. You&apos;re all set!
            </p>
          </div>
        </div>
      ) : isEligible ? (
        <div className="mb-8 rounded-2xl border-2 border-sky-300 bg-sky-50 p-5 flex items-start gap-3">
          <span className="text-3xl leading-none">✅</span>
          <div>
            <h2 className="text-xl font-bold text-sky-800">
              You&apos;re eligible{fullName ? `, ${fullName}` : ""} — just comfortably enough
            </h2>
            <p className="text-sky-700 text-sm mt-1">
              Your <strong>{formatINR(wanted)}/month</strong> income is fully funded and your big expenses are
              covered. Your growth surplus is modest (<strong>{formatINR(surplus, { compact: true })}</strong>) —
              adding a little more corpus would give you a stronger cushion for later years.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 flex items-start gap-3">
          <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-amber-800">
              Almost there{fullName ? `, ${fullName}` : ""} — a small gap to close
            </h2>
            <p className="text-amber-700 text-sm mt-1">
              To fund <strong>{formatINR(wanted)}/month</strong> plus your big expenses, your corpus is short by
              about <strong>{formatINR(shortBy)}</strong>. Any one of these closes the gap:
            </p>
            <ul className="text-amber-700 text-sm mt-2 space-y-1 list-disc list-inside">
              <li>
                Add about <strong>{formatINR(shortBy)}</strong> more to your retirement corpus (the
                {" "}&quot;how much have you saved&quot; step).
              </li>
              {biggest && (
                <li>
                  Trim a big expense — e.g. reduce <strong>{biggest.head}</strong>{" "}
                  ({formatINR(biggest.amount, { compact: true })}) by up to{" "}
                  <strong>{formatINR(Math.min(shortBy, biggest.amount))}</strong>.
                </li>
              )}
              <li>Lower your desired monthly income a little.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Top KPIs — all from the 3-stage engine */}
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <KPI
          label="Monthly income"
          value={formatINR(managed)}
          sublabel="Tax-free — split across both spouses"
          tone="positive"
        />
        <KPI
          label="Big expenses set aside"
          value={formatINR(enginePlan.stage2.total, { compact: true })}
          sublabel="Ring-fenced separately"
        />
        <KPI
          label="Growth corpus (SWP)"
          value={formatINR(enginePlan.swpCorpus, { compact: true })}
          sublabel="Invested + inflation top-ups"
        />
        <KPI
          label="Corpus lasts to age"
          value={`${enginePlan.swp.lastSurvivingAge}`}
          sublabel={`Ending corpus ${formatINR(enginePlan.swp.corpusAtLastAge, { compact: true })}`}
          tone="positive"
        />
      </div>

      {/* Try different numbers — live recalculation through the 3-stage engine */}
      <div className="card mb-10">
        <h3 className="text-lg font-bold mb-1">Try different numbers</h3>
        <p className="text-slate-600 text-sm mb-4">Move a slider — your whole plan recalculates instantly.</p>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Desired monthly income</span>
              <span className="font-semibold text-primary">{formatINR(incomeOverride ?? wanted)}</span>
            </div>
            <input
              type="range" min={20000} max={500000} step={5000}
              value={Math.min(500000, incomeOverride ?? wanted)}
              onChange={(e) => setIncomeOverride(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1"><span>₹20k</span><span>₹5L</span></div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Retirement corpus</span>
              <span className="font-semibold text-primary">{formatINR(corpusOverride ?? engineTotal, { compact: true })}</span>
            </div>
            <input
              type="range" min={1000000} max={200000000} step={500000}
              value={Math.min(200000000, corpusOverride ?? engineTotal)}
              onChange={(e) => setCorpusOverride(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1"><span>₹10L</span><span>₹20Cr</span></div>
          </div>
          {(incomeOverride != null || corpusOverride != null) && (
            <button
              onClick={() => { setIncomeOverride(null); setCorpusOverride(null); }}
              className="btn-secondary"
            >
              ↺ Reset to my saved numbers
            </button>
          )}
        </div>
      </div>

      {/* WhatsApp banner */}
      <div className="mb-10">
        <WealthManagerCTA
          variant="banner"
          context={`I just saw my retirement plan${fullName ? ` (${fullName})` : ""} and would like guidance on what to do next`}
          headline="Want a Wealth Manager to review this with you?"
          subline="Free 15-min WhatsApp call — we'll walk through your plan and answer your questions."
        />
      </div>

      {/* ─────────────── 3-STAGE ROADMAP ─────────────── */}
      <section id="engine-roadmap" className="mb-12 scroll-mt-20">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">The 3-Stage Roadmap</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Your specialist plan, calculated to the rupee</h2>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1">
            🔒 Calculated by Retirement360 engine — Excel-verified
          </span>
        </div>
        <EngineRoadmap client={engineClient} plan={enginePlan} />

        {/* SWP corpus survival chart */}
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-2">SWP corpus over time</h3>
          <p className="text-slate-600 text-sm mb-4">
            How your growth bucket evolves year by year, including monthly withdrawals starting at age {engineClient.swp.withdrawalStartAge}.
          </p>
          <div className="card">
            <SWPCorpusChart plan={enginePlan} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Monthly SWP withdrawal (with {formatPct(engineClient.swp.yearlyStepUp * 100)} step-up)</h3>
          <div className="card">
            <SWPMonthlyChart plan={enginePlan} />
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section className="bg-gradient-to-br from-primary-light via-white to-amber-50 rounded-2xl p-8 border border-slate-200">
        <h2 className="text-2xl font-bold mb-2">What next?</h2>
        <p className="text-slate-600 mb-6">Your plan is just the start. Talk to an expert, save tax, or ask the AI.</p>

        <div className="mb-4">
          <WealthManagerCTA
            variant="card"
            context="I've reviewed my plan and want help putting it into action"
            headline="Put your plan into action with a Wealth Manager"
            subline="Knowing the plan is half the battle. Our wealth manager helps you actually open the accounts and invest — free 15-min WhatsApp call to start."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/tax"
            className="block bg-white rounded-xl p-5 border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
          >
            <Receipt className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-bold text-lg mb-1">Save on tax</h3>
            <p className="text-sm text-slate-600 mb-3">Compare old vs new regime. Use senior citizen deductions.</p>
            <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Open Tax Optimizer <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <Link
            href="/advisor"
            className="block bg-white rounded-xl p-5 border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
          >
            <span className="inline-flex items-center gap-1 mb-3">
              <span className="text-2xl">✨</span>
            </span>
            <h3 className="font-bold text-lg mb-1">Ask the AI Advisor</h3>
            <p className="text-sm text-slate-600 mb-3">Get plain-English answers about your numbers and choices.</p>
            <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Start chatting <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function KPI({ label, value, sublabel, tone = "default" }: { label: string; value: string; sublabel?: string; tone?: "default" | "positive" | "warning" }) {
  const toneClass = tone === "positive" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
      {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-500">Loading…</div>}>
      <PlanPageInner />
    </Suspense>
  );
}
