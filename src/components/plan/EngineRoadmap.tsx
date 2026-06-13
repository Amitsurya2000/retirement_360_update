"use client";

import { BuiltPlan, Client as EngineClient } from "@/lib/retirement-engine";
import { formatINR, formatPct } from "@/lib/format";
import { Home, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  client: EngineClient;
  plan: BuiltPlan;
}

const OWNER_LABEL = {
  self: "Self / Primary",
  spouse: "Spouse",
} as const;

// Joint-holdable instruments show both names (first holder = the one taxed).
function ownerLabel(it: { owner: "self" | "spouse"; joint?: boolean }): string {
  if (it.joint) return it.owner === "self" ? "Self + Spouse" : "Spouse + Self";
  return OWNER_LABEL[it.owner];
}

const STATUS_TONE = {
  BALANCED: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: CheckCircle2, label: "Balanced ✓" },
  UNDERFUNDED: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: AlertTriangle, label: "Underfunded" },
  OVERFUNDED: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: CheckCircle2, label: "Overfunded" },
} as const;

export function EngineRoadmap({ client, plan }: Props) {
  const statusInfo = STATUS_TONE[plan.stage1.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-8">
      {/* ─────────────── STAGE 1 ─────────────── */}
      <section id="stage-1" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Stage 1</p>
            <h2 className="text-2xl font-bold text-slate-900">Monthly Income Floor</h2>
          </div>
        </div>
        <p className="text-slate-600 mb-4">
          Lock-in tax-free monthly income of <strong>{formatINR(client.requiredMonthlyIncome)}</strong>,
          split between both spouses so each stays under ₹12 Lakh/year. Like a salary, for life.
        </p>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200">
                <th className="py-3 px-2">Source</th>
                <th className="py-3 px-2">Investment</th>
                <th className="py-3 px-2 text-right">Monthly</th>
                <th className="py-3 px-2">Whose Name</th>
              </tr>
            </thead>
            <tbody>
              {client.incomeItems.map((it, i) => {
                const isFixed = it.fixedMonthly !== undefined && it.fixedMonthly !== null;
                const monthly = isFixed ? it.fixedMonthly! : (it.principal ?? 0) * (it.rate ?? 0) / 12;
                return (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 font-medium text-slate-900">{it.instrument.replace(/_/g, " ")}</td>
                    <td className="py-3 px-2 text-slate-600">
                      {isFixed
                        ? `Fixed payout${(it.principal ?? 0) > 0 ? ` (principal ${formatINR(it.principal ?? 0, { compact: true })})` : ""}`
                        : `${formatINR(it.principal ?? 0, { compact: true })} @ ${formatPct((it.rate ?? 0) * 100)}`}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-slate-900">{formatINR(monthly)}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                        it.owner === "self" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      }`}>
                        {ownerLabel(it)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-bold">
                <td className="py-3 px-2" colSpan={2}>TOTAL</td>
                <td className="py-3 px-2 text-right text-lg text-slate-900">{formatINR(plan.stage1.managed)}</td>
                <td className="py-3 px-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total corpus deployed for the Stage-1 monthly income (both spouses combined) */}
        <div className="mt-4 rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-300">Total corpus used for monthly income</p>
            <p className="text-2xl font-bold mt-0.5">{formatINR(plan.stage1.stage1Corpus, { compact: true })}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase text-slate-300">Generates</p>
            <p className="text-2xl font-bold mt-0.5">{formatINR(plan.stage1.managed)}/mo</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <p className="text-xs text-blue-700 font-semibold uppercase">Self (primary)</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{formatINR(plan.stage1.selfInc)}/mo</p>
            <p className="text-xs text-slate-500">Principal: {formatINR(plan.stage1.selfPr, { compact: true })}</p>
          </div>
          <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
            <p className="text-xs text-purple-700 font-semibold uppercase">Spouse</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{formatINR(plan.stage1.spouseInc)}/mo</p>
            <p className="text-xs text-slate-500">Principal: {formatINR(plan.stage1.spousePr, { compact: true })}</p>
          </div>
          <div className={`rounded-xl border p-4 ${statusInfo.bg} ${statusInfo.border}`}>
            <p className={`text-xs font-semibold uppercase ${statusInfo.text}`}>Status</p>
            <p className="text-lg font-bold mt-1 flex items-center gap-1.5">
              <StatusIcon className={`w-5 h-5 ${statusInfo.text}`} />
              <span className={statusInfo.text}>{statusInfo.label}</span>
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Deficit: <span className="font-semibold">{formatINR(plan.stage1.deficit)}/mo</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────── STAGE 2 ─────────────── */}
      <section id="stage-2" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Stage 2</p>
            <h2 className="text-2xl font-bold text-slate-900">Big Future Expenses</h2>
          </div>
        </div>
        <p className="text-slate-600 mb-4">
          Set aside cash for known upcoming costs so they NEVER disturb your monthly income.
        </p>

        {plan.stage2.rows.length === 0 ? (
          <div className="card text-center py-8 bg-slate-50">
            <p className="text-slate-600">
              You haven&apos;t entered any big upcoming expenses yet.
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Daughter&apos;s wedding? Grandkids&apos; education? Foreign trip? Add them so we can ring-fence them.
            </p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200">
                  <th className="py-3 px-2">Expense</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                  <th className="py-3 px-2 text-right">When</th>
                  <th className="py-3 px-2">Parked In</th>
                </tr>
              </thead>
              <tbody>
                {plan.stage2.rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 font-medium text-slate-900">{r.head}</td>
                    <td className="py-3 px-2 text-right font-semibold text-slate-900">{formatINR(r.amount, { compact: true })}</td>
                    <td className="py-3 px-2 text-right text-slate-600">
                      {r.tenureYears === 0 ? "This year" : `${r.tenureYears} year${r.tenureYears === 1 ? "" : "s"}`}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {r.instrument === "SPOUSE_BANK_FD" ? "Bank FD (spouse)" : "Equity Savings / Hybrid"}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="py-3 px-2">TOTAL</td>
                  <td className="py-3 px-2 text-right text-lg text-slate-900">{formatINR(plan.stage2.total, { compact: true })}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─────────────── STAGE 3 ─────────────── */}
      <section id="stage-3" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Stage 3</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-amber-50 to-white border border-amber-200">
          <h3 className="font-bold text-slate-900 mb-3">SWP corpus survival</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Withdrawals begin</p>
              <p className="text-lg font-bold text-slate-900 mt-1">Age {client.swp.withdrawalStartAge}</p>
              <p className="text-xs text-slate-500">{formatINR(client.swp.startingMonthlyWithdrawal)}/mo starting</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Yearly step-up</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{formatPct(client.swp.yearlyStepUp * 100)}</p>
              <p className="text-xs text-slate-500">Inflation cover</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Corpus lasts until</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">Age {plan.swp.lastSurvivingAge}</p>
              <p className="text-xs text-slate-500">
                Ending corpus: {formatINR(plan.swp.corpusAtLastAge, { compact: true })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {plan.warnings.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0" />
            <div>
              <p className="font-bold text-amber-900 mb-1">Engine flagged the following:</p>
              <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
                {plan.warnings.map((w, i) => (<li key={i}>{w}</li>))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
