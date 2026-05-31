"use client";

import { BuiltPlan } from "@/lib/retirement-engine";
import { formatINR } from "@/lib/format";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart, Legend } from "recharts";

export function SWPCorpusChart({ plan }: { plan: BuiltPlan }) {
  const data = plan.swp.rows.map((r) => ({
    age: r.age,
    corpus: Math.max(0, Math.round(r.yearEndCorpus)),
    monthly: Math.round(r.monthly),
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="corpusEngineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#0f766e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="age" stroke="#64748b" fontSize={12} label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 12 }} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINR(v, { compact: true })} />
          <Tooltip
            formatter={(v) => formatINR(Number(v), { compact: true })}
            labelFormatter={(age) => `Age ${age}`}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Area type="monotone" dataKey="corpus" stroke="#0f766e" strokeWidth={2.5} fill="url(#corpusEngineGradient)" name="Year-end corpus" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SWPMonthlyChart({ plan }: { plan: BuiltPlan }) {
  const data = plan.swp.rows
    .filter((r) => r.monthly > 0)
    .map((r) => ({ age: r.age, monthly: Math.round(r.monthly) }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="age" stroke="#64748b" fontSize={12} label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 12 }} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINR(v, { compact: true })} />
          <Tooltip formatter={(v) => formatINR(Number(v))} labelFormatter={(age) => `Age ${age}`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="monthly" stroke="#ca8a04" strokeWidth={2.5} name="Monthly SWP withdrawal" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
