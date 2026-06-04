// Admin-only PDF download (key-gated) — lets you grab any lead's plan PDF from
// the Leads page. /api/admin/plan-pdf?id=<profileId>&key=<ADMIN_KEY>
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const key = req.nextUrl.searchParams.get("key");

  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Prefer the stored file; if it hasn't been generated yet, build it on the fly.
  let bytes: Uint8Array;
  let fileName: string;
  if (profile.planPdf) {
    bytes = new Uint8Array(profile.planPdf);
    fileName = profile.planPdfName || `Retirement360-${id}.pdf`;
  } else {
    const { generatePlanPdf } = await import("@/lib/plan-pdf");
    bytes = await generatePlanPdf(profile);
    fileName = `Retirement360-${id}.pdf`;
  }

  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
