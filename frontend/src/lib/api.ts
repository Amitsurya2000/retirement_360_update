// Thin client for the Retirement360 FastAPI backend.
// VITE_API_BASE defaults to "/api" (same-origin via the Nginx gateway / Vite proxy).
const BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

export interface PlanRequest {
  age: number;
  corpus: number;
  desired_monthly_income: number;
  other_monthly_income?: number;
  inflation_rate?: number;
  planning_horizon?: number;
  risk_appetite?: "conservative" | "moderate" | "balanced";
}

export interface Instrument { name: string; amount: number; expected_return: number; notes?: string }
export interface Bucket {
  id: number; name: string; description: string; years_covered: string;
  target_percent: number; amount: number; blended_return: number; instruments: Instrument[];
}
export interface Plan {
  buckets: Bucket[];
  total_corpus: number;
  blended_return: number;
  shortfall_year: number | null;
  legacy_at_end: number;
  summary: {
    monthly_income_year1: number;
    monthly_income_year10: number;
    inflation_adjusted_year10: number;
    total_lifetime_income: number;
    estimated_tax_paid: number;
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const generatePlan = (req: PlanRequest) => post<Plan>("/plan", req);

export interface ChatMessage { role: "user" | "assistant"; content: string }

// Streams the AI advisor reply, calling onChunk for each token.
export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  profileId?: string,
): Promise<void> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile_id: profileId, messages }),
  });
  if (!res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
