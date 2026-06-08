/**
 * THREE-STAGE RETIREMENT ROADMAP ENGINE — TypeScript port.
 * ────────────────────────────────────────────────────────────────────────────
 * Direct, formula-by-formula port of /retirement_engine.py.
 * The Python self-test (R C Singh) MUST match this port to the rupee.
 *
 * The AI advisor must CALL this engine. It must NEVER compute these numbers
 * by reasoning — that's why this exists.
 */

// ────────────────────────────────────────────────────────────────────────────
// DEFAULT RATES (override per client). Decimals: 0.082 = 8.2%
// ────────────────────────────────────────────────────────────────────────────

export const DEFAULT_INSTRUMENT_RATES: Record<string, number> = {
  SCSS: 0.082,
  NPS_ANNUITY: 0.0685,
  NPS_PENSION: 0.0685,
  POMIS: 0.074,
  POST_MIS: 0.074,
  IDCW: 0.085,
  RENT: 0.085,
};

export const FUND_CATEGORY_RETURNS: Record<string, number> = {
  EQUITY_SAVINGS: 0.09,
  HYBRID: 0.10,
  MULTI_ASSET: 0.10,
  BALANCED: 0.10,
  DAA: 0.10,
  LARGE_CAP: 0.12,
  FLEXI_CAP: 0.14,
  LARGE_AND_MID: 0.14,
  MULTI_CAP: 0.15,
  MID_CAP: 0.16,
  SMALL_CAP: 0.18,
};

export type RiskAppetite = "conservative" | "moderate" | "aggressive";

// Diversified residual-corpus construction — assured debt, equity hedge,
// predictable income, opportunistic, plus Indian & foreign equity.
export const RISK_ALLOCATION: Record<RiskAppetite, Record<string, number>> = {
  conservative: { BONDS: 0.40, GOLD_SILVER: 0.10, REITS: 0.15, ARBITRAGE: 0.10, INDIAN_EQUITY: 0.20, FOREIGN_EQUITY: 0.05 },
  moderate:     { BONDS: 0.30, GOLD_SILVER: 0.10, REITS: 0.10, ARBITRAGE: 0.10, INDIAN_EQUITY: 0.25, FOREIGN_EQUITY: 0.15 },
  aggressive:   { BONDS: 0.20, GOLD_SILVER: 0.10, REITS: 0.10, ARBITRAGE: 0.05, INDIAN_EQUITY: 0.35, FOREIGN_EQUITY: 0.20 },
};

// (stp_months, deployment_horizon_years)
export const STP_RULES: Record<string, [number, number]> = {
  BONDS:          [2, 3],
  GOLD_SILVER:    [3, 5],
  REITS:          [3, 5],
  ARBITRAGE:      [1, 2],
  INDIAN_EQUITY:  [6, 7],
  FOREIGN_EQUITY: [9, 8],
};

// ────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ────────────────────────────────────────────────────────────────────────────

export interface Fund {
  head: string;
  amount: number;
}

export interface IncomeItem {
  owner: "self" | "spouse";
  instrument: string;
  principal?: number;
  rate?: number;          // decimal; if undefined, looked up via DEFAULT_INSTRUMENT_RATES
  fixedMonthly?: number;  // EPS / pension / rent — hardcoded payout
  // Joint-holdable instruments (POMIS, mutual funds, FDs, rent). When true the
  // "Whose Name" column shows "Self + Spouse" / "Spouse + Self" (owner = first holder).
  // Single-name-only instruments (EPS, NPS annuity, SCSS) leave this false.
  joint?: boolean;
}

export interface Liability {
  head: string;
  amount: number;
  tenureYears: number;
}

export interface SWPParams {
  currentAge: number;                  // D10/D11 — default 60
  preWithdrawalReturn: number;         // D11 — default 0.10
  withdrawalStartAge: number;          // D12 — default 62
  startingMonthlyWithdrawal: number;   // D13 — default 50000
  yearlyStepUp: number;                // D14 — default 0.05
  withdrawalPhaseReturn: number;       // D15 — default 0.08
  /**
   * The Excel grows the corpus at D11 (10%) EVERY year and never switches to
   * D15 (8%) in the withdrawal phase. That's a sheet bug. Default true to
   * reproduce the sheet to the rupee. Set false to use D15 once withdrawals
   * start (financially correct).
   */
  replicateExcelBug: boolean;
  maxAge: number;                      // default 100
}

export const defaultSWPParams = (): SWPParams => ({
  currentAge: 60,
  preWithdrawalReturn: 0.10,
  withdrawalStartAge: 62,
  startingMonthlyWithdrawal: 50_000,
  yearlyStepUp: 0.05,
  withdrawalPhaseReturn: 0.08,
  replicateExcelBug: true,
  maxAge: 100,
});

export interface Client {
  name: string;
  selfAge: number;
  spouseAge: number | null;
  requiredMonthlyIncome: number;
  riskAppetite: RiskAppetite;
  funds: Fund[];
  incomeItems: IncomeItem[];
  liabilities: Liability[];
  swp: SWPParams;
  /**
   * How much of the remaining corpus actually goes into SWP. If null, the
   * whole remaining corpus is used. Advisors often hold a cash buffer.
   * R C Singh parked 2 Cr of 2.2285 Cr (kept 22.85 L in savings).
   */
  swpCorpusOverride: number | null;
}

// ────────────────────────────────────────────────────────────────────────────
// CORE CALCULATIONS (mirror the Python cell formulas)
// ────────────────────────────────────────────────────────────────────────────

function incomeFor(item: IncomeItem): number {
  if (item.fixedMonthly !== undefined && item.fixedMonthly !== null) {
    return Number(item.fixedMonthly);
  }
  const key = item.instrument.toUpperCase().replace(/ /g, "_");
  const rate = item.rate ?? DEFAULT_INSTRUMENT_RATES[key] ?? 0.0;
  return (item.principal ?? 0) * rate / 12.0;
}

export interface Stage1Result {
  selfInc: number;
  spouseInc: number;
  selfPr: number;
  spousePr: number;
  managed: number;
  deficit: number;
  stage1Corpus: number;
  status: "UNDERFUNDED" | "OVERFUNDED" | "BALANCED";
}

export function stage1(c: Client): Stage1Result {
  const selfItems   = c.incomeItems.filter((i) => i.owner === "self");
  const spouseItems = c.incomeItems.filter((i) => i.owner === "spouse");
  const selfInc   = selfItems.reduce((s, i) => s + incomeFor(i), 0);
  const spouseInc = spouseItems.reduce((s, i) => s + incomeFor(i), 0);
  const selfPr    = selfItems.reduce((s, i) => s + (i.principal ?? 0), 0);
  const spousePr  = spouseItems.reduce((s, i) => s + (i.principal ?? 0), 0);
  const managed = selfInc + spouseInc;                  // I18 = F27+K27
  const deficit = c.requiredMonthlyIncome - managed;    // K18 = D18-I18
  const stage1Corpus = selfPr + spousePr;               // M23 = D27+I27
  let status: Stage1Result["status"];
  if (deficit > 2000) status = "UNDERFUNDED";
  else if (deficit < -2000) status = "OVERFUNDED";
  else status = "BALANCED";
  return { selfInc, spouseInc, selfPr, spousePr, managed, deficit, stage1Corpus, status };
}

export interface Stage2Row {
  head: string;
  amount: number;
  tenureYears: number;
  instrument: "SPOUSE_BANK_FD" | "EQUITY_SAVINGS_OR_HYBRID";
}

export interface Stage2Result {
  rows: Stage2Row[];
  total: number;
}

export function stage2(c: Client): Stage2Result {
  const rows: Stage2Row[] = c.liabilities.map((l) => ({
    head: l.head,
    amount: l.amount,
    tenureYears: l.tenureYears,
    instrument: l.tenureYears <= 1 ? "SPOUSE_BANK_FD" : "EQUITY_SAVINGS_OR_HYBRID",
  }));
  const total = c.liabilities.reduce((s, l) => s + l.amount, 0);
  return { rows, total };
}

export interface SWPRow {
  age: number;
  monthly: number;
  annual: number;
  yearEndCorpus: number;
}

export interface SWPResult {
  rows: SWPRow[];
  lastSurvivingAge: number;
  corpusAtLastAge: number;
}

export function swpProjection(corpus0: number, p: SWPParams): SWPResult {
  const rows: SWPRow[] = [];
  let corpus = corpus0;
  let age = p.currentAge;
  while (age <= p.maxAge) {
    let monthly = 0.0;
    if (age >= p.withdrawalStartAge) {
      const yrs = age - p.withdrawalStartAge;
      // FV-style growth: starting × (1 + step)^years
      monthly = p.startingMonthlyWithdrawal * Math.pow(1 + p.yearlyStepUp, yrs);
    }
    const annual = monthly * 12;
    // growth rate: Excel uses D11 throughout (bug). Correct = D15 in withdrawal phase.
    let g: number;
    if (p.replicateExcelBug || age < p.withdrawalStartAge) {
      g = p.preWithdrawalReturn;
    } else {
      g = p.withdrawalPhaseReturn;
    }
    corpus = corpus * (1 + g) - annual;
    rows.push({ age, monthly, annual, yearEndCorpus: corpus });
    age += 1;
  }
  const positive = rows.filter((r) => r.yearEndCorpus > 0);
  const lastSurvivingAge = positive.length > 0 ? positive[positive.length - 1].age : p.currentAge;
  const corpusAtLastAge = positive.length > 0 ? positive[positive.length - 1].yearEndCorpus : corpus0;
  return { rows, lastSurvivingAge, corpusAtLastAge };
}

export interface AllocationBucket {
  bucket: string;
  pct: number;
  amount: number;
  stpMonths: number;
  horizonYears: number;
}

export function stage3Allocation(swpCorpus: number, risk: RiskAppetite): AllocationBucket[] {
  const alloc = RISK_ALLOCATION[risk];
  const out: AllocationBucket[] = [];
  for (const [bucket, frac] of Object.entries(alloc)) {
    const [stp, horizon] = STP_RULES[bucket];
    out.push({
      bucket,
      pct: frac,
      amount: swpCorpus * frac,
      stpMonths: stp,
      horizonYears: horizon,
    });
  }
  return out;
}

export interface BuiltPlan {
  client: string;
  totalCorpus: number;
  stage1: Stage1Result;
  stage2: Stage2Result;
  remainingCorpus: number;
  swpCorpus: number;
  swp: SWPResult;
  allocation: AllocationBucket[];
  warnings: string[];
}

export function buildPlan(c: Client): BuiltPlan {
  const totalCorpus = c.funds.reduce((s, f) => s + f.amount, 0);   // G11
  const s1 = stage1(c);
  const s2 = stage2(c);
  const remainingCorpus = totalCorpus - s1.stage1Corpus - s2.total; // G50
  const swpCorpus = c.swpCorpusOverride !== null ? c.swpCorpusOverride : remainingCorpus;
  const warnings: string[] = [];
  if (remainingCorpus < 0) {
    warnings.push("HARD FAIL: plan does not fit corpus (remaining < 0).");
  } else if (remainingCorpus < 0.20 * totalCorpus) {
    warnings.push("LOW_GROWTH_BUCKET: <20% of corpus left for wealth multiplication.");
  }
  const swp = swpProjection(swpCorpus, c.swp);
  const allocation = stage3Allocation(swpCorpus, c.riskAppetite);
  return {
    client: c.name,
    totalCorpus,
    stage1: s1,
    stage2: s2,
    remainingCorpus,
    swpCorpus,
    swp,
    allocation,
    warnings,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// SELF-TEST: must reproduce the Python R C Singh file exactly
// ────────────────────────────────────────────────────────────────────────────

export function rcSinghClient(): Client {
  return {
    name: "R C Singh",
    selfAge: 60,
    spouseAge: 58,
    requiredMonthlyIncome: 100_000,
    riskAppetite: "moderate",
    funds: [
      { head: "CPF", amount: 2_34_00_000 },
      { head: "CSSS", amount: 6_85_000 },
      { head: "LEAVE ENCASHMENT", amount: 38_00_000 },
      { head: "GRATUITY", amount: 25_00_000 },
      { head: "NPS", amount: 1_40_00_000 },
    ],
    incomeItems: [
      { owner: "self",   instrument: "EPS",          fixedMonthly: 4700 },
      { owner: "self",   instrument: "SCSS",         principal: 30_00_000, rate: 0.082 },
      { owner: "self",   instrument: "NPS_PENSION",  principal: 56_00_000, fixedMonthly: 31_700 },
      { owner: "self",   instrument: "NPS_SLW",      principal: 84_00_000, fixedMonthly: 30_000 },
      { owner: "spouse", instrument: "POST_MIS",     principal: 9_00_000,  rate: 0.074 },
      { owner: "spouse", instrument: "RENT",         principal: 0,         fixedMonthly: 8_000 },
    ],
    liabilities: [
      { head: "EDUCATION",  amount: 10_00_000, tenureYears: 1 },
      { head: "EDUCATION",  amount: 10_00_000, tenureYears: 2 },
      { head: "EDUCATION",  amount: 10_00_000, tenureYears: 3 },
      { head: "RENOVATION", amount: 2_00_000,  tenureYears: 1 },
      { head: "TRAVEL",     amount: 10_00_000, tenureYears: 1 },
    ],
    swp: {
      currentAge: 60,
      preWithdrawalReturn: 0.10,
      withdrawalStartAge: 62,
      startingMonthlyWithdrawal: 50_000,
      yearlyStepUp: 0.05,
      withdrawalPhaseReturn: 0.08,
      replicateExcelBug: true,
      maxAge: 100,
    },
    swpCorpusOverride: 2_00_00_000,
  };
}

export interface SelfTestResult {
  name: string;
  got: number;
  expected: number;
  ok: boolean;
}

export function runSelfTest(): { rows: SelfTestResult[]; allOk: boolean } {
  const c = rcSinghClient();
  const p = buildPlan(c);
  const checks: Array<[string, number, number]> = [
    ["Total corpus",        p.totalCorpus,                        4_43_85_000],
    ["Managed income",      Math.round(p.stage1.managed),         1_00_450],
    ["Deficit",             Math.round(p.stage1.deficit),         -450],
    ["Stage 1 corpus",      p.stage1.stage1Corpus,                1_79_00_000],
    ["Stage 2 total",       p.stage2.total,                       42_00_000],
    ["Remaining corpus",    p.remainingCorpus,                    2_22_85_000],
    ["SWP survival age",    p.swp.lastSurvivingAge,               100],
    ["Corpus at last age",  Math.round(p.swp.corpusAtLastAge * 100) / 100, 58_24_23_302.88],
  ];
  const rows: SelfTestResult[] = checks.map(([name, got, expected]) => ({
    name,
    got,
    expected,
    ok: Math.abs(got - expected) < 1,
  }));
  return { rows, allOk: rows.every((r) => r.ok) };
}
