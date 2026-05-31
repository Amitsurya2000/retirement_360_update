"use client";

import { GeneratedPlan } from "@/lib/calculations";
import { formatINR } from "@/lib/format";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  Legend,
} from "recharts";

const BUCKET_COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

export function BucketPieChart({ plan }: { plan: GeneratedPlan }) {
  const data = plan.buckets.map((b) => ({
    name: b.name,
    value: b.amount,
    percent: b.targetPercent,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={55}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            label={({ percent }) => `${(percent ?? 0) > 0 ? ((percent ?? 0) * 100).toFixed(0) : 0}%`}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={BUCKET_COLORS[idx]} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatINR(Number(value), { compact: true })}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14 }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 13 }}
            formatter={(value, _entry, idx) => (
              <span style={{ color: "#334155" }}>
                {value} · {data[idx]?.percent.toFixed(0)}%
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyIncomeChart({ plan }: { plan: GeneratedPlan }) {
  const data = plan.projections.map((p) => ({
    year: `Y${p.year}`,
    age: p.age,
    gross: Math.round(p.grossMonthlyIncome),
    net: Math.round(p.netMonthlyIncome),
    needed: Math.round(p.expensesRequired),
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" stroke="#64748b" fontSize={12} interval={1} />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(v) => formatINR(v, { compact: true })}
          />
          <Tooltip
            formatter={(v) => formatINR(Number(v))}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="gross" stroke="#0f766e" strokeWidth={2.5} name="Gross income" dot={false} />
          <Line type="monotone" dataKey="net" stroke="#16a34a" strokeWidth={2.5} name="After-tax income" dot={false} />
          <Line type="monotone" dataKey="needed" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" name="Inflation-adjusted need" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CorpusDepletionChart({ plan }: { plan: GeneratedPlan }) {
  const data = [
    { year: "Y0", corpus: plan.totalCorpus, age: plan.projections[0]?.age - 1 || 0 },
    ...plan.projections.map((p) => ({
      year: `Y${p.year}`,
      age: p.age,
      corpus: Math.round(p.corpusEndOfYear),
    })),
  ];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="corpusGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#0f766e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" stroke="#64748b" fontSize={12} interval={1} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINR(v, { compact: true })} />
          <Tooltip
            formatter={(v) => formatINR(Number(v), { compact: true })}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Area type="monotone" dataKey="corpus" stroke="#0f766e" strokeWidth={2.5} fill="url(#corpusGradient)" name="Remaining corpus" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PurchasingPowerChart({ plan }: { plan: GeneratedPlan }) {
  const data = plan.projections.map((p) => ({
    year: `Y${p.year}`,
    nominal: Math.round(p.netMonthlyIncome),
    real: Math.round(p.inflationAdjusted),
  }));
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" stroke="#64748b" fontSize={12} interval={1} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatINR(v, { compact: true })} />
          <Tooltip
            formatter={(v) => formatINR(Number(v))}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="nominal" stroke="#0f766e" strokeWidth={2.5} name="Money in hand" dot={false} />
          <Line type="monotone" dataKey="real" stroke="#ca8a04" strokeWidth={2.5} name="Real purchasing power (today's ₹)" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
