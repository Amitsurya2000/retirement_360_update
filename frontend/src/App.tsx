import { useState } from "react";
import { generatePlan, streamChat, type Plan, type ChatMessage } from "./lib/api";

const fmtINR = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`;

const card: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16 };
const input: React.CSSProperties = { width: "100%", padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", marginTop: 4 };

export default function App() {
  const [form, setForm] = useState({ age: 60, corpus: 10000000, desired_monthly_income: 80000, risk_appetite: "moderate" as const, planning_horizon: 30 });
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  async function onGenerate() {
    setLoading(true); setError("");
    try { setPlan(await generatePlan(form)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function onSend() {
    if (!draft.trim()) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: draft }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setDraft("");
    try {
      await streamChat(next, (chunk) =>
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
          return copy;
        }),
      );
    } catch (e) {
      setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: `[Error: ${(e as Error).message}]` }]);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#f1f5f9", minHeight: "100vh", color: "#0f172a" }}>
      <header style={{ background: "#0f766e", color: "#fff", padding: "20px 24px" }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Retirement360</h1>
        <div style={{ opacity: 0.9, fontSize: 14 }}>Retire Easy. Plan With Specialists, Not Agents.</div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Build your plan</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>Age
              <input style={input} type="number" value={form.age}
                onChange={(e) => setForm({ ...form, age: +e.target.value })} />
            </label>
            <label>Retirement corpus (₹)
              <input style={input} type="number" value={form.corpus}
                onChange={(e) => setForm({ ...form, corpus: +e.target.value })} />
            </label>
            <label>Desired monthly income (₹)
              <input style={input} type="number" value={form.desired_monthly_income}
                onChange={(e) => setForm({ ...form, desired_monthly_income: +e.target.value })} />
            </label>
            <label>Risk appetite
              <select style={input} value={form.risk_appetite}
                onChange={(e) => setForm({ ...form, risk_appetite: e.target.value as typeof form.risk_appetite })}>
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="balanced">Balanced</option>
              </select>
            </label>
          </div>
          <button onClick={onGenerate} disabled={loading}
            style={{ marginTop: 16, background: "#0f766e", color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", cursor: "pointer" }}>
            {loading ? "Calculating…" : "Generate plan"}
          </button>
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        </section>

        {plan && (
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Your bucket strategy</h2>
            <p>Blended return <b>{plan.blended_return.toFixed(2)}%</b> · Year-1 net income <b>{fmtINR(plan.summary.monthly_income_year1)}/mo</b> ·{" "}
              {plan.shortfall_year ? <span style={{ color: "#dc2626" }}>corpus runs out at year {plan.shortfall_year}</span>
                : <span style={{ color: "#16a34a" }}>sustainable for the full horizon</span>}</p>
            {plan.buckets.map((b) => (
              <div key={b.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <b>{b.name}</b> <span style={{ color: "#64748b" }}>({b.years_covered}) — {fmtINR(b.amount)} @ {b.blended_return.toFixed(1)}%</span>
                <ul style={{ margin: "8px 0 0" }}>
                  {b.instruments.map((i) => (
                    <li key={i.name}>{i.name}: {fmtINR(i.amount)} @ {i.expected_return}%</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>AI Retirement Specialist</h2>
          <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginBottom: 10 }}>
            {messages.length === 0 && <p style={{ color: "#94a3b8" }}>Ask about your plan, taxes, or retirement choices. Replies in your language.</p>}
            {messages.map((m, i) => (
              <div key={i} style={{ margin: "8px 0", textAlign: m.role === "user" ? "right" : "left" }}>
                <span style={{ display: "inline-block", background: m.role === "user" ? "#0f766e" : "#e2e8f0", color: m.role === "user" ? "#fff" : "#0f172a", borderRadius: 10, padding: "8px 12px", whiteSpace: "pre-wrap", maxWidth: "85%" }}>
                  {m.content || "…"}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...input, marginTop: 0 }} value={draft} placeholder="Type a message…"
              onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend()} />
            <button onClick={onSend} style={{ background: "#0f766e", color: "#fff", border: 0, borderRadius: 8, padding: "0 18px", cursor: "pointer" }}>Send</button>
          </div>
        </section>

        <footer style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: 16 }}>
          ⚠ Educational guidance, not investment advice. Confirm specifics with a registered adviser.
        </footer>
      </main>
    </div>
  );
}
