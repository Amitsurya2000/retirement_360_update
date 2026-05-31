// Indian senior-citizen tax calculation utilities.
// Implements old regime (which has 80C/80D/80TTB/80DDB deductions retirees commonly use)
// and new regime (simpler, slightly different slabs). FY 2024-25 / AY 2025-26 reference.

export type AgeBracket = "regular" | "senior" | "super_senior";

export function ageBracket(age: number): AgeBracket {
  if (age >= 80) return "super_senior";
  if (age >= 60) return "senior";
  return "regular";
}

export interface TaxInputs {
  age: number;
  // Income streams
  pensionAnnual: number;          // pension/annuity
  interestAnnual: number;         // FD/SCSS/POMIS interest
  rentalAnnual: number;
  capitalGainsLT: number;         // equity LTCG above ₹1.25L is taxed at 12.5%
  capitalGainsST: number;         // equity STCG taxed at 20%
  dividendsAnnual: number;        // taxed at slab rate
  otherAnnual: number;
  // Deductions (old regime only)
  section80C: number;             // PPF / ELSS / LIC up to ₹1.5L
  section80D: number;             // health insurance — seniors up to ₹50k self + ₹50k parents
  section80DDB: number;           // medical treatment specified diseases — up to ₹1L (seniors)
  section80TTB: number;           // interest deduction for seniors — up to ₹50k
  standardDeduction: number;      // ₹50k for pensioners (treated as salary)
}

export interface TaxBreakdown {
  regime: "old" | "new";
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxOnSlabs: number;
  taxOnLTCG: number;
  taxOnSTCG: number;
  rebate87A: number;
  cessAndSurcharge: number;
  totalTax: number;
  effectiveRate: number;
}

// Old regime slabs FY24-25 — senior (60-79) & super senior (80+) have higher exemption.
function oldRegimeTaxOnSlabs(taxable: number, bracket: AgeBracket): number {
  const exemption = bracket === "super_senior" ? 5_00_000 : bracket === "senior" ? 3_00_000 : 2_50_000;
  let remaining = Math.max(0, taxable - exemption);
  let tax = 0;
  // 5% on next ₹2L (so up to ₹5L for regular, ₹5L for senior, but super-senior skips this band)
  if (bracket !== "super_senior") {
    const band1 = Math.min(remaining, 2_00_000);
    tax += band1 * 0.05;
    remaining -= band1;
  }
  // 20% on income up to ₹10L
  const band2Limit = 10_00_000 - (bracket === "super_senior" ? 5_00_000 : 5_00_000);
  const band2 = Math.min(remaining, band2Limit);
  tax += band2 * 0.20;
  remaining -= band2;
  // 30% above ₹10L
  tax += remaining * 0.30;
  return tax;
}

// New regime slabs FY24-25.
function newRegimeTaxOnSlabs(taxable: number): number {
  // 0–3L: 0, 3–7L: 5%, 7–10L: 10%, 10–12L: 15%, 12–15L: 20%, >15L: 30%
  const bands: Array<[number, number]> = [
    [3_00_000, 0],
    [7_00_000, 0.05],
    [10_00_000, 0.10],
    [12_00_000, 0.15],
    [15_00_000, 0.20],
    [Infinity, 0.30],
  ];
  let tax = 0;
  let prev = 0;
  for (const [limit, rate] of bands) {
    if (taxable <= prev) break;
    const slice = Math.min(taxable, limit) - prev;
    tax += slice * rate;
    prev = limit;
  }
  return tax;
}

function rebate87A(taxOnSlabs: number, totalIncome: number, regime: "old" | "new"): number {
  // Old regime: full rebate if total income <= ₹5L, capped at ₹12,500
  // New regime: full rebate if total income <= ₹7L, capped at ₹25,000
  if (regime === "old" && totalIncome <= 5_00_000) return Math.min(taxOnSlabs, 12_500);
  if (regime === "new" && totalIncome <= 7_00_000) return Math.min(taxOnSlabs, 25_000);
  return 0;
}

export function calcTax(inputs: TaxInputs, regime: "old" | "new"): TaxBreakdown {
  const bracket = ageBracket(inputs.age);

  const slabIncome =
    inputs.pensionAnnual +
    inputs.interestAnnual +
    inputs.rentalAnnual * 0.7 + // 30% standard deduction on rental
    inputs.dividendsAnnual +
    inputs.otherAnnual;

  const grossIncome =
    slabIncome + inputs.capitalGainsLT + inputs.capitalGainsST;

  // Deductions only apply to old regime
  let totalDeductions = 0;
  if (regime === "old") {
    totalDeductions =
      Math.min(inputs.section80C, 1_50_000) +
      Math.min(inputs.section80D, bracket !== "regular" ? 1_00_000 : 75_000) +
      Math.min(inputs.section80DDB, bracket !== "regular" ? 1_00_000 : 40_000) +
      Math.min(inputs.section80TTB, bracket !== "regular" ? 50_000 : 0) +
      Math.min(inputs.standardDeduction, 50_000);
  } else {
    // New regime: only standard deduction allowed (₹75k for AY25-26)
    totalDeductions = Math.min(inputs.standardDeduction, 75_000);
  }

  const taxableSlab = Math.max(0, slabIncome - totalDeductions);

  const taxOnSlabs =
    regime === "old" ? oldRegimeTaxOnSlabs(taxableSlab, bracket) : newRegimeTaxOnSlabs(taxableSlab);

  // LTCG on equity above ₹1.25L taxed at 12.5%
  const taxOnLTCG = Math.max(0, inputs.capitalGainsLT - 1_25_000) * 0.125;
  const taxOnSTCG = inputs.capitalGainsST * 0.20;

  const totalIncomeForRebate = taxableSlab; // rebate is on slab income only
  const rebate = rebate87A(taxOnSlabs, totalIncomeForRebate, regime);

  const beforeCess = Math.max(0, taxOnSlabs - rebate) + taxOnLTCG + taxOnSTCG;
  const cessAndSurcharge = beforeCess * 0.04; // 4% health & education cess
  const totalTax = beforeCess + cessAndSurcharge;

  return {
    regime,
    grossIncome,
    totalDeductions,
    taxableIncome: taxableSlab,
    taxOnSlabs,
    taxOnLTCG,
    taxOnSTCG,
    rebate87A: rebate,
    cessAndSurcharge,
    totalTax,
    effectiveRate: grossIncome > 0 ? totalTax / grossIncome : 0,
  };
}

export function compareRegimes(inputs: TaxInputs): { old: TaxBreakdown; new: TaxBreakdown; savings: number; recommended: "old" | "new" } {
  const oldR = calcTax(inputs, "old");
  const newR = calcTax(inputs, "new");
  const savings = Math.abs(oldR.totalTax - newR.totalTax);
  const recommended = oldR.totalTax <= newR.totalTax ? "old" : "new";
  return { old: oldR, new: newR, savings, recommended };
}
