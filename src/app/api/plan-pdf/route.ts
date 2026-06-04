import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { generatePlanPdf } from "@/lib/plan-pdf";

// GET /api/plan-pdf?id=<profileId>
// Generates the plan PDF, stores it (file + link + contact info) in the PlanPdf
// table, and returns it as a downloadable file.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Identify the signed-in viewer (for the owner check + the Storage folder).
  let supabase: ReturnType<typeof createClient> | null = null;
  let viewerId: string | null = null;
  try {
    supabase = createClient();
    const { data } = await supabase.auth.getUser();
    viewerId = data.user?.id ?? null;
  } catch {
    supabase = null;
  }

  // Only the owner can generate/download their own plan (legacy rows stay open).
  if (profile.userId && viewerId !== null && viewerId !== profile.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const bytes = await generatePlanPdf(profile);
  const buffer = Buffer.from(bytes);

  const safeName =
    (profile.fullName || "plan").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "plan";
  const fileName = `Retirement360-${safeName}.pdf`;

  // Upload to Supabase Storage so it shows with a native Download button in the
  // Supabase dashboard (Storage -> plans), stored under the user's own folder.
  if (supabase && viewerId) {
    try {
      await supabase.storage
        .from("plans")
        .upload(`${viewerId}/${id}.pdf`, buffer, { contentType: "application/pdf", upsert: true });
    } catch (e) {
      console.error("Storage upload failed:", e);
    }
  }

  // One-click download link (admin-keyed so it works straight from the table view).
  const downloadUrl = `${req.nextUrl.origin}/api/admin/plan-pdf?id=${id}&key=${process.env.ADMIN_KEY ?? ""}`;

  // Store / refresh the PDF file + link in the UserProfile row (last columns).
  try {
    await prisma.userProfile.update({
      where: { id },
      data: { planPdf: buffer, planPdfName: fileName, planPdfUrl: downloadUrl },
    });
  } catch (e) {
    console.error("Plan PDF store failed:", e);
  }

  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
