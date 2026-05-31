import Link from "next/link";
import { ArrowRight, ShieldCheck, Calculator, Receipt, TrendingUp, Users, Award, CheckCircle2, X } from "lucide-react";
import { WealthManagerCTA } from "@/components/WealthManagerCTA";
import { BRAND } from "@/lib/config";

export default function Home() {
  return (
    <div>
      {/* ──────────── HERO — Authority + Tagline ──────────── */}
      <section className="bg-gradient-to-br from-primary-light via-white to-amber-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 border border-slate-200 text-sm text-slate-700 mb-6 shadow-sm">
              <Award className="w-4 h-4 text-amber-600" />
              <span className="font-medium">Retirement specialists — not agents, not insurance sellers</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 text-balance leading-[1.05]">
              Retire Easy. <br />
              <span className="text-primary">Plan With Specialists,</span> <br />
              <span className="text-slate-700">Not Agents.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-700 text-balance leading-relaxed max-w-2xl">
              We don&apos;t sell products. We design your monthly income, protect your big expenses,
              and grow what&apos;s left — <span className="font-semibold text-slate-900">for YOU.</span>
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/onboarding" className="btn-primary inline-flex items-center justify-center gap-2 text-lg">
                {BRAND.ctaPrimary}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/plan" className="btn-secondary inline-flex items-center justify-center text-lg">
                See a Sample Plan
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              5-minute conversation · No signup required · Your data stays on your device
            </p>

            <div className="mt-10 max-w-2xl">
              <WealthManagerCTA
                variant="banner"
                headline="Prefer to talk to a specialist first?"
                subline="Free 15-min WhatsApp consultation. No sales pitch — just clarity on your numbers."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── PROOF — The 3 things we calculate ──────────── */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">What we calculate for you</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">Your retirement, in three honest numbers.</h2>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            We don&apos;t guess. We do the math on YOUR corpus — and show you exactly what it can do.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Priority #1</p>
            <h3 className="text-xl font-semibold mb-2">Your tax-free monthly income</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              We split the income between you and your spouse so each stays under ₹12 Lakh/year —
              the entire amount is <strong>non-taxable for life</strong>. Most agents never do this.
            </p>
          </div>
          <div className="card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Priority #2</p>
            <h3 className="text-xl font-semibold mb-2">Your big expenses, ring-fenced</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Daughter&apos;s wedding, grandchildren&apos;s education, world tour — each gets its own
              parked fund, so they <strong>never disturb your monthly income</strong>.
            </p>
          </div>
          <div className="card hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Priority #3</p>
            <h3 className="text-xl font-semibold mb-2">Your wealth, multiplied</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              The surplus grows in liquid equity/hybrid funds with SWP for inflation top-ups —
              <strong> 12.5% LTCG, not 30% slab tax</strong>. Real returns, real liquidity.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────── THE CONTRAST — Specialist vs Local Agent ──────────── */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Why most retirees end up underpaid</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
              The agent sells a product. <br className="hidden md:block" />
              <span className="text-primary">We design YOUR plan.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl bg-white border-2 border-red-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">The Local Agent</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2"><X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><span>Pushes the policy that pays them the highest commission</span></li>
                <li className="flex gap-2"><X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><span>Parks everything in FDs or a single annuity — no diversification</span></li>
                <li className="flex gap-2"><X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><span>Ignores your spouse&apos;s tax-free ceiling — you pay 20–30% tax unnecessarily</span></li>
                <li className="flex gap-2"><X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><span>No plan for daughter&apos;s wedding, education, travel — it just &quot;comes out of FDs&quot;</span></li>
                <li className="flex gap-2"><X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><span>Vanishes after the sale — you&apos;re alone for 25 years</span></li>
              </ul>
            </div>
            <div className="rounded-2xl bg-primary-light border-2 border-primary p-6 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{BRAND.name} Specialists</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span><strong>Zero commissions</strong> — we don&apos;t sell products. Our job is your plan.</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Diversify across SCSS, POMIS, RBI Bonds, NPS annuity, MF SWP — each instrument for its specific job</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span><strong>Split income across both spouses</strong> — keep your monthly income fully tax-free for life</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Ring-fence wedding/education/travel funds separately — protected from market dips</span></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Stay with you — quarterly reviews as rates, slabs, and your goals change</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-600 text-base mb-4 max-w-2xl mx-auto">
              On a ₹2 Cr corpus, the difference between a local agent&apos;s plan and ours is typically
              <span className="font-bold text-primary"> ₹40–80 Lakh in saved tax + extra wealth</span> over 25 years.
              We&apos;ll calculate yours exactly.
            </p>
            <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2 text-lg">
              See the Difference for Your Numbers
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────── THE METHOD — 3-Stage Framework ──────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">The 3-Stage Framework</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">How we build your plan, step by step.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card border-2 border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🏠</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">STAGE 1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Monthly Income Floor</h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                Lock in tax-free monthly income using EPS, SCSS, POMIS, NPS annuity — split across both spouses.
                Like a salary, for life.
              </p>
            </div>
            <div className="card border-2 border-blue-200 bg-blue-50/40">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🎯</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">STAGE 2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Big Expenses, Ring-Fenced</h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                Education, wedding, world tour, renovation — each parked in the right instrument by horizon.
                Your monthly income stays protected.
              </p>
            </div>
            <div className="card border-2 border-amber-200 bg-amber-50/40">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📈</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">STAGE 3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Surplus, Grown Tax-Light</h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                Equity/hybrid funds, fully liquid. SWP for inflation top-ups — only 12.5% LTCG, no slab tax.
                Compounds while you withdraw.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FINAL CTA ──────────── */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to see YOUR numbers?</h2>
        <p className="mt-3 text-lg text-slate-600">
          Answer a few short questions in plain English (or Hindi). We&apos;ll build the full plan in 5 minutes.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2 text-lg">
            {BRAND.ctaPrimary}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="text-slate-400 text-sm">or</span>
          <WealthManagerCTA variant="inline" headline="Talk to a Specialist" />
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Built for Indian retirees</div>
          <div className="flex items-center gap-1.5"><Award className="w-4 h-4" /> Method used by SEBI-registered advisors</div>
          <div className="flex items-center gap-1.5"><Receipt className="w-4 h-4" /> Educational guidance, not investment advice</div>
        </div>
      </section>
    </div>
  );
}
