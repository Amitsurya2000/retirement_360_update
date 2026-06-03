// Simple leads view — protected by a secret key in the URL: /admin?key=YOUR_KEY
// (Set ADMIN_KEY in your environment.) This page is server-rendered, so the key
// is never exposed in the browser bundle.
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const key = searchParams.key;

  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Restricted</h1>
        <p className="text-slate-600">
          Add your admin key to the address: <code className="bg-slate-100 px-1.5 py-0.5 rounded">/admin?key=YOUR_KEY</code>
        </p>
      </div>
    );
  }

  const leads = await prisma.userProfile.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      fullName: true,
      email: true,
      phone: true,
      companyName: true,
      age: true,
      corpus: true,
      desiredMonthlyIncome: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-1">Leads</h1>
      <p className="text-slate-600 mb-6">{leads.length} signup{leads.length === 1 ? "" : "s"}</p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Name</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-3">Phone</th>
              <th className="py-3 px-3">Company</th>
              <th className="py-3 px-3 text-right">Age</th>
              <th className="py-3 px-3 text-right">Corpus</th>
              <th className="py-3 px-3 text-right">Wants/mo</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">No signups yet.</td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    {new Date(l.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900">{l.fullName || "—"}</td>
                  <td className="py-3 px-3">{l.email || "—"}</td>
                  <td className="py-3 px-3 whitespace-nowrap">{l.phone || "—"}</td>
                  <td className="py-3 px-3">{l.companyName || "—"}</td>
                  <td className="py-3 px-3 text-right">{l.age}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">{formatINR(l.corpus, { compact: true })}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">{formatINR(l.desiredMonthlyIncome, { compact: true })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Showing all saved plans. Each row is one person who completed the planner.
      </p>
    </div>
  );
}
