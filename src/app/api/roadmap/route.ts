import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildPlan } from "@/lib/retirement-engine";
import { profileToClient } from "@/lib/profile-to-engine";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });

  const client = profileToClient(profile);
  const plan = buildPlan(client);

  return NextResponse.json({
    profile: { fullName: profile.fullName, age: profile.age },
    client,
    plan,
  });
}
