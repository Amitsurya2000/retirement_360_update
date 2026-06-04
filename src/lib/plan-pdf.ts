// Generates a one-or-two page PDF summary of a retirement plan from a profile.
// Uses the SAME calculation engines as the plan page, so numbers always match.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type RGB } from "pdf-lib";
import type { UserProfile } from "@prisma/client";
import { generatePlan, PlanInputs, RiskAppetite } from "@/lib/calculations";
import { buildPlan as buildEnginePlan } from "@/lib/retirement-engine";
import { profileToClient } from "@/lib/profile-to-engine";

// pdf-lib's standard fonts can't render the ₹ glyph or Indic scripts, so we use
// "Rs" + Indian-grouped digits, and strip any non-Latin1 characters from text.
function formatRs(n: number, compact = false): string {
  if (!Number.isFinite(n)) return "Rs 0";
  const abs = Math.abs(n);
  if (compact) {
    if (abs >= 1_00_00_000) return `Rs ${(n / 1_00_00_000).toFixed(2)} Cr`;
    if (abs >= 1_00_000) return `Rs ${(n / 1_00_000).toFixed(2)} L`;
  }
  const rounded = Math.round(n);
  const s = Math.abs(rounded).toString();
  let last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest) last3 = "," + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `Rs ${rounded < 0 ? "-" : ""}${rest}${last3}`;
}

const ascii = (s: string) => (s || "").replace(/[^\x00-\xff]/g, "").trim();

export async function generatePlanPdf(profile: UserProfile): Promise<Uint8Array> {
  const inputs: PlanInputs = {
    age: profile.age,
    corpus: profile.corpus,
    desiredMonthlyIncome: profile.desiredMonthlyIncome,
    otherMonthlyIncome: profile.pensionMonthly + profile.rentalMonthly + profile.dividendMonthly,
    inflationRate: profile.inflationRate,
    planningHorizon: profile.planningHorizon,
    riskAppetite: profile.riskAppetite as RiskAppetite,
    legacyAmount: profile.legacyAmount,
  };
  const plan = generatePlan(inputs);
  const engineClient = profileToClient(profile);
  const enginePlan = buildEnginePlan(engineClient);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const pageW = 595;
  const pageH = 842;
  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  const primary = rgb(0.02, 0.45, 0.42);
  const dark = rgb(0.1, 0.12, 0.16);
  const gray = rgb(0.4, 0.43, 0.47);

  const ensure = (space: number) => {
    if (y - space < margin) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
  };
  const text = (s: string, opts: { size?: number; f?: PDFFont; color?: RGB; x?: number } = {}) => {
    const size = opts.size ?? 11;
    ensure(size + 6);
    page.drawText(ascii(s), { x: opts.x ?? margin, y, size, font: opts.f ?? font, color: opts.color ?? dark });
    y -= size + 6;
  };
  const heading = (s: string) => {
    ensure(28);
    y -= 8;
    page.drawText(ascii(s), { x: margin, y, size: 13, font: bold, color: primary });
    y -= 6;
    page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: rgb(0.8, 0.82, 0.85) });
    y -= 14;
  };
  const row = (label: string, value: string) => {
    ensure(16);
    page.drawText(ascii(label), { x: margin, y, size: 10, font, color: gray });
    page.drawText(ascii(value), { x: margin + 210, y, size: 10, font: bold, color: dark });
    y -= 16;
  };

  // ---- Header ----
  text("Retirement360", { size: 22, f: bold, color: primary });
  text("Personal Retirement Plan", { size: 12, color: gray });

  // ---- Client ----
  heading("Client Details");
  row("Name", ascii(profile.fullName || "") || "-");
  row("Phone", ascii(profile.phone || "") || "-");
  row("Company", ascii(profile.companyName || "") || "-");
  row("Email", ascii(profile.email || "") || "-");
  row("Age", String(profile.age));
  row("Marital status", profile.maritalStatus);

  // ---- Snapshot ----
  heading("Your Snapshot");
  row("Total retirement corpus", formatRs(profile.corpus, true));
  row("Desired monthly income", formatRs(profile.desiredMonthlyIncome));
  row("Risk appetite", profile.riskAppetite);
  row("Planning horizon", `${profile.planningHorizon} years`);

  // ---- 3-Stage roadmap ----
  heading("3-Stage Roadmap");
  row("Stage 1 - Monthly income managed", `${formatRs(enginePlan.stage1.managed)} / mo`);
  row("Stage 1 - Status", enginePlan.stage1.status);
  row("Stage 2 - Liabilities ring-fenced", formatRs(enginePlan.stage2.total, true));
  row("Stage 3 - Growth corpus (SWP)", formatRs(enginePlan.swpCorpus, true));
  row("SWP withdrawals start at age", String(engineClient.swp.withdrawalStartAge));
  row("Corpus lasts until age", String(enginePlan.swp.lastSurvivingAge));

  // ---- Bucket allocation ----
  heading("Bucket Allocation");
  for (const b of plan.buckets) {
    text(`${b.name} (${b.yearsCovered}) - ${formatRs(b.amount, true)} (${Math.round(b.targetPercent)}%)`, { size: 11, f: bold });
    for (const inst of b.instruments) {
      text(`   - ${inst.name}: ${formatRs(inst.amount, true)}`, { size: 9, color: gray });
    }
    y -= 2;
  }

  // ---- Projections ----
  heading("Projected Outcomes");
  row("Net monthly income (Year 1)", formatRs(plan.summary.monthlyIncomeYear1));
  row("Net monthly income (Year 10)", formatRs(plan.summary.monthlyIncomeYear10));
  row("Final corpus at end of plan", formatRs(plan.legacyAtEnd, true));

  // ---- Footer ----
  y -= 12;
  text(
    "Educational guidance, not investment advice. Consult a SEBI registered advisor or AMFI Registered MFD before investing.",
    { size: 8, color: gray }
  );

  return doc.save();
}
