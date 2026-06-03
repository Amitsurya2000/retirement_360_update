import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { profileSchema } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = profileSchema.parse(body);

    // Attach the signed-in user (verified email + id) so each plan is a real,
    // traceable lead. Falls back to null if Supabase isn't configured.
    let userId: string | null = null;
    let email: string | null = null;
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
      email = data.user?.email ?? null;
    } catch {
      // Supabase not configured — proceed without linking.
    }

    const profile = await prisma.userProfile.create({
      data: {
        ...parsed,
        userId,
        email,
        bucketListGoals: parsed.bucketListGoals ? JSON.stringify(parsed.bucketListGoals) : null,
        healthConditions: parsed.healthConditions ? JSON.stringify(parsed.healthConditions) : null,
        hobbies: parsed.hobbies ? JSON.stringify(parsed.hobbies) : null,
        relationshipFocus: parsed.relationshipFocus ? JSON.stringify(parsed.relationshipFocus) : null,
        fundsBreakdown: parsed.fundsBreakdown ? JSON.stringify(parsed.fundsBreakdown) : null,
      },
    });

    return NextResponse.json({ id: profile.id });
  } catch (error) {
    console.error("Profile save failed:", error);
    // Surface a friendly message; full zod details are in `issues` for debugging.
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
      const friendly = issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json({ error: `Validation failed — ${friendly}`, issues }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Only the owner can read their own profile (legacy ownerless rows stay open).
  if (profile.userId) {
    let viewerId: string | null = null;
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      viewerId = data.user?.id ?? null;
    } catch {
      // Supabase not configured — skip the check.
    }
    if (viewerId !== null && viewerId !== profile.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
  }

  return NextResponse.json({
    ...profile,
    bucketListGoals: profile.bucketListGoals ? JSON.parse(profile.bucketListGoals) : [],
    healthConditions: profile.healthConditions ? JSON.parse(profile.healthConditions) : [],
    hobbies: profile.hobbies ? JSON.parse(profile.hobbies) : [],
    relationshipFocus: profile.relationshipFocus ? JSON.parse(profile.relationshipFocus) : [],
    fundsBreakdown: profile.fundsBreakdown ? JSON.parse(profile.fundsBreakdown) : null,
  });
}
