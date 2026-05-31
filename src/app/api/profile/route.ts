import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { profileSchema } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = profileSchema.parse(body);

    const profile = await prisma.userProfile.create({
      data: {
        ...parsed,
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

  return NextResponse.json({
    ...profile,
    bucketListGoals: profile.bucketListGoals ? JSON.parse(profile.bucketListGoals) : [],
    healthConditions: profile.healthConditions ? JSON.parse(profile.healthConditions) : [],
    hobbies: profile.hobbies ? JSON.parse(profile.hobbies) : [],
    relationshipFocus: profile.relationshipFocus ? JSON.parse(profile.relationshipFocus) : [],
    fundsBreakdown: profile.fundsBreakdown ? JSON.parse(profile.fundsBreakdown) : null,
  });
}
