"use client";

import { useMemo, useState } from "react";
import { compareRegimes, TaxInputs, ageBracket } from "@/lib/tax";
import { formatINR, formatPct } from "@/lib/format";
import { Field, MoneyInput, NumberInput } from "@/components/wizard/FormField";
import { CheckCircle2, TrendingDown, Info } from "lucide-react";
import { WealthManagerCTA } from "@/components/WealthManagerCTA";

export default function TaxPage() {
  const [inputs, setInputs] = useState<TaxInputs>({
    age: 65,
    pensionAnnual: 3_60_000,
    interestAnnual: 4_00_000,
    rentalAnnual: 0,
    capitalGainsLT: 0,
    capitalGainsST: 0,
    dividendsAnnual: 0,
    otherAnnual: 0,
    section80C: 1_50_000,
    section80DDB: 0,
    section80TTB: 50_000,
    standardDeduction: 50_000,
  });

  const update = (patch: Partial<TaxInputs>) => setInputs((p) => ({ ...p, ...patch }));

  const result = useMemo(() => compareRegimes(inputs), [inputs]);
  const bracket = ageBracket(inputs.age);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-10">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide">Feature 3</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">Tax Optimizer for Seniors</h1>
        <p className="mt-2 text-slate-600">
          Compare old vs new tax regime. Apply senior-citizen deductions. Reduce your tax bill legally.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
        {/* INPUTS */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Your situation</h2>
            <Field label="Age" helper={bracket === "super_senior" ? "Super senior — ₹5L exemption (old regime)" : bracket === "senior" ? "Senior citizen — ₹3L exemption + 80TTB benefit" : "Below 60 — regular slabs apply"}>
              <NumberInput value={inputs.age} onChange={(v) => update({ age: v })} min={18} max={100} suffix="years" />
            </Field>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4">Annual income</h2>
            <div className="space-y-4">
              <Field label="Pension / annuity" helper="Treated as salary income">
                <MoneyInput value={inputs.pensionAnnual} onChange={(v) => update({ pensionAnnual: v })} />
              </Field>
              <Field label="Interest income" helper="FD, SCSS, POMIS, savings — all interest combined">
                <MoneyInput value={inputs.interestAnnual} onChange={(v) => update({ interestAnnual: v })} />
              </Field>
              <Field label="Rental income (gross)" helper="30% standard deduction applies automatically">
                <MoneyInput value={inputs.rentalAnnual} onChange={(v) => update({ rentalAnnual: v })} />
              </Field>
              <Field label="Long-term capital gains (equity)" helper="First ₹1.25L is tax-free; above is taxed at 12.5%">
                <MoneyInput value={inputs.capitalGainsLT} onChange={(v) => update({ capitalGainsLT: v })} />
              </Field>
              <Field label="Short-term capital gains (equity)" helper="Taxed at 20%">
                <MoneyInput value={inputs.capitalGainsST} onChange={(v) => update({ capitalGainsST: v })} />
              </Field>
              <Field label="Dividends" helper="Taxed at slab rate">
                <MoneyInput value={inputs.dividendsAnnual} onChange={(v) => update({ dividendsAnnual: v })} />
              </Field>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4">Deductions (old regime)</h2>
            <div className="space-y-4">
              <Field label="Section 80C" helper="PPF, ELSS, LIC, NSC — max ₹1.5L">
                <MoneyInput value={inputs.section80C} onChange={(v) => update({ section80C: v })} />
              </Field>
              <Field label="Section 80DDB — Specified diseases" helper="Seniors: up to ₹1L for cancer, kidney failure, etc.">
                <MoneyInput value={inputs.section80DDB} onChange={(v) => update({ section80DDB: v })} />
              </Field>
              <Field label="Section 80TTB — Interest deduction" helper="Seniors only: ₹50k deduction on bank/post office interest">
                <MoneyInput value={inputs.section80TTB} onChange={(v) => update({ section80TTB: v })} />
              </Field>
              <Field label="Standard deduction" helper="₹50k for pensioners (treated as salary)">
                <MoneyInput value={inputs.standardDeduction} onChange={(v) => update({ standardDeduction: v })} />
              </Field>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="space-y-6">
          {/* Recommendation */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Recommended for you</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {result.recommended === "old" ? "Old Regime" : "New Regime"}
                </h3>
                <p className="text-slate-700 mt-2">
                  Saves you <span className="font-bold text-emerald-700">{formatINR(result.savings)}</span> in tax this year compared to the other regime.
                </p>
              </div>
            </div>
          </div>

          {/* Side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <RegimeCard
              title="Old Regime"
              breakdown={result.old}
              isWinner={result.recommended === "old"}
            />
            <RegimeCard
              title="New Regime"
              breakdown={result.new}
              isWinner={result.recommended === "new"}
            />
          </div>

          {/* Senior citizen tips */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary" />
              Ways to reduce your tax further
            </h3>
            <div className="space-y-3 text-sm">
              <Tip
                title="Use Section 80TTB fully"
                body="Seniors get a ₹50,000 deduction on bank/SCSS/POMIS interest. Make sure you claim the full ₹50k — most retirees easily cross this on FD interest alone."
                applied={inputs.section80TTB >= 50_000}
              />
              <Tip
                title="Prefer SWP over interest income"
                body="Systematic Withdrawal Plans from debt mutual funds are more tax-efficient than FDs because only the gain portion is taxed (not the principal you withdraw)."
              />
              <Tip
                title="Use LTCG harvesting"
                body="Book ₹1.25L of long-term capital gains every year — it's tax-free. Reinvest immediately to reset the cost base."
              />
              <Tip
                title="Split investments with spouse"
                body="If your spouse is in a lower tax bracket, gifting them money for investments (within ₹5L/year limits) can reduce family tax burden."
              />
              {bracket !== "super_senior" && inputs.age >= 75 && (
                <Tip
                  title="At 75+, you may skip filing ITR"
                  body="If you only have pension + interest from the same bank and the bank deducts TDS, you may not need to file ITR. Check Section 194P."
                />
              )}
            </div>
          </div>

          <WealthManagerCTA
            variant="card"
            context="I used the tax optimizer and want help structuring my income to pay less tax"
            headline="Want help actually saving this tax?"
            subline="Our wealth manager can structure your investments (SWP vs FD, 80TTB, LTCG harvesting) so you keep more. Free 15-min WhatsApp call."
          />

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">This is a simplified calculator.</p>
              <p>Actual tax may vary based on exact slabs, surcharge thresholds, and recent budget changes. Verify with a CA before filing. We assume FY 2025-26 slabs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegimeCard({ title, breakdown, isWinner }: { title: string; breakdown: ReturnType<typeof compareRegimes>["old"]; isWinner: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${isWinner ? "bg-white border-2 border-emerald-300 shadow-md" : "bg-slate-50 border border-slate-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">{title}</h3>
        {isWinner && <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">BEST</span>}
      </div>
      <Row label="Gross income" value={formatINR(breakdown.grossIncome, { compact: true })} />
      <Row label="Deductions" value={formatINR(breakdown.totalDeductions, { compact: true })} />
      <Row label="Taxable income" value={formatINR(breakdown.taxableIncome, { compact: true })} />
      <Row label="Tax on slabs" value={formatINR(breakdown.taxOnSlabs)} />
      {breakdown.taxOnLTCG > 0 && <Row label="LTCG tax" value={formatINR(breakdown.taxOnLTCG)} />}
      {breakdown.taxOnSTCG > 0 && <Row label="STCG tax" value={formatINR(breakdown.taxOnSTCG)} />}
      {breakdown.rebate87A > 0 && <Row label="87A rebate" value={`-${formatINR(breakdown.rebate87A)}`} positive />}
      <Row label="Cess (4%)" value={formatINR(breakdown.cessAndSurcharge)} />
      <div className="border-t border-slate-200 mt-2 pt-2">
        <div className="flex justify-between font-bold">
          <span>Total tax</span>
          <span className={isWinner ? "text-emerald-700" : "text-slate-900"}>{formatINR(breakdown.totalTax)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Effective rate</span>
          <span>{formatPct(breakdown.effectiveRate * 100)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-slate-600">{label}</span>
      <span className={positive ? "text-emerald-700 font-medium" : "text-slate-900 font-medium"}>{value}</span>
    </div>
  );
}

function Tip({ title, body, applied }: { title: string; body: string; applied?: boolean }) {
  return (
    <div className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="shrink-0 mt-0.5">
        {applied ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <span className="block w-5 h-5 rounded-full border-2 border-slate-300" />
        )}
      </div>
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-slate-600 mt-0.5">{body}</p>
      </div>
    </div>
  );
}
