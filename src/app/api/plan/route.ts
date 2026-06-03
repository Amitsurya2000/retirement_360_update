import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePlan, compareWithLocalAgent, PlanInputs, RiskAppetite } from "@/lib/calculations";
import { buildPlan as buildEnginePlan } from "@/lib/retirement-engine";
import { profileToClient } from "@/lib/profile-to-engine";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  // Optional overrides for the "what if" sliders
  const overrideInflation = req.nextUrl.searchParams.get("inflation");
  const overrideIncome = req.nextUrl.searchParams.get("income");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });

  // A plan owned by a signed-in user can only be viewed by that same user.
  // (Legacy rows with no owner stay viewable for backward compatibility.)
  if (profile.userId) {
    let viewerId: string | null = null;
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      viewerId = data.user?.id ?? null;
    } catch {
      // Supabase not configured — skip the ownership check.
    }
    if (viewerId !== null && viewerId !== profile.userId) {
      return NextResponse.json({ error: "Not authorized to view this plan" }, { status: 403 });
    }
  }

  const parsedInflation = overrideInflation ? parseFloat(overrideInflation) : NaN;
  const parsedIncome = overrideIncome ? parseFloat(overrideIncome) : NaN;

  const inputs: PlanInputs = {
    age: profile.age,
    corpus: profile.corpus,
    desiredMonthlyIncome: Number.isFinite(parsedIncome) && parsedIncome >= 0 ? parsedIncome : profile.desiredMonthlyIncome,
    otherMonthlyIncome: profile.pensionMonthly + profile.rentalMonthly + profile.dividendMonthly,
    inflationRate: Number.isFinite(parsedInflation) && parsedInflation >= 0 && parsedInflation <= 25 ? parsedInflation : profile.inflationRate,
    planningHorizon: profile.planningHorizon,
    riskAppetite: profile.riskAppetite as RiskAppetite,
    legacyAmount: profile.legacyAmount,
  };

  const plan = generatePlan(inputs);
  const comparison = compareWithLocalAgent(inputs, plan);

  // Deterministic engine output — same code that powers Excel sheet, verified to the rupee.
  const engineClient = profileToClient(profile);
  const enginePlan = buildEnginePlan(engineClient);

  return NextResponse.json({
    plan,
    comparison,
    engine: { client: engineClient, plan: enginePlan },
    profile: { fullName: profile.fullName, age: profile.age },
  });
}
