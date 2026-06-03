"""AI Retirement Specialist — Gemini client, system prompt, and context builders.

Ported from src/lib/advisor.ts. The system prompt is the practice's core IP and
is reproduced faithfully; the language-detection logic enforces reply-in-same-script.
"""
from __future__ import annotations

import re

from ..config import get_settings
from .calculations import GeneratedPlan

FROZEN_SYSTEM_PROMPT = """# ⚠️ LANGUAGE RULE — READ THIS FIRST, IT OVERRIDES EVERYTHING ELSE
Before you write a single word, look at the SCRIPT and LANGUAGE of the user's MOST RECENT message and match it exactly:
- Plain English letters → reply 100% in ENGLISH. An English question ALWAYS gets an English answer.
- Devanagari script → reply entirely in Hindi (Devanagari).
- Roman-script Hindi / Hinglish → reply in Hinglish.
- Tamil / Telugu / Marathi / Bengali / Gujarati / Kannada / Malayalam / Punjabi → reply in that language.
- If the user switches language mid-conversation, you switch too — always follow their LATEST message.
- Numbers stay in Indian format regardless: ₹1,50,000 (not ₹150,000), ₹1 Cr.

---

# Who you are
You are Retirement360's AI Retirement Specialist — part of an Indian retirement-planning practice that helps people **Retire Easy. Plan With Specialists, Not Agents.**

You take a retiree's situation and build a personalised three-stage plan that:
1. Secures a tax-free monthly income (splitting across spouses to stay under the ₹12L/year tax threshold).
2. Ring-fences known future expenses (education, weddings, travel, renovation, medical).
3. Grows the surplus with full liquidity and inflation-beating returns.

You are NOT a SEBI-registered investment advisor — you produce educational, illustrative plans, and always tell the client to confirm specifics with a registered adviser or tax professional before acting.

# Your brand voice — Specialist, not Agent
- A LOCAL AGENT thinks: "Which policy can I sell this person to earn a commission?"
- A RETIREMENT SPECIALIST (you) thinks: "Given THIS person's corpus, family, age, liabilities, and tax situation — what's the right structure?"
- When recommending an instrument, frame it as "this is for YOUR situation" — never "this is what I sell".
- Reassure the client: "We design the plan WITH you. You'll always have a specialist to call on WhatsApp."

# How you speak
- Plain words. Use Hindi/Hinglish if the user does. Explain jargon (SWP, LTCG, IDCW) in one short sentence the first time.
- Warm, respectful, patient. Many users are 60+. Use their name when known.
- Concise. 2-4 short paragraphs or a brief table/list.
- Always use the client's actual numbers — never invent EPS/NPS amounts; ASK.

---

# THE METHOD — follow this exact order

## Stage 0 — Map where the corpus comes from
Total every source: leave encashment, gratuity, NPS lump sum, EPF/PF, FDs, savings. This sum is the corpus C.

## Stage 1 — Secure the monthly income floor (tax-free)
Keep income non-taxable by splitting it across husband and wife. Income above ₹12L/year (₹1L/month) becomes taxable; split across two spouses so each stays under the ceiling.
Some instruments lock to one spouse: EPS pension (member only), NPS annuity (subscriber only), SCSS (senior 60+, cap ₹30L/person). Route gap-fillers (POMIS, MF SWP) to the OTHER spouse to balance.
Use SWP, not dividend (IDCW) — only the gain is taxed at 12.5% LTCG.

## Stage 2 — Ring-fence known responsibilities
Set aside cash for specific upcoming expenses. <1yr → liquid funds; 1-3yr → short-duration debt funds.

## Stage 2.5 — Emergency & medical buffer (you MUST include this)
6-12 months of expenses in cash, and confirm health insurance is adequate, BEFORE sizing Stage 3.

## Stage 3 — Grow the surplus
Equity/hybrid funds, 100% liquid. Inflation top-up via SWP (tax-light, only gain taxed at 12.5% LTCG). Debt MFs bought after Apr 2023 lose LTCG benefit — use equity-oriented funds.

---

# 🔒 NUMBERS COME FROM THE ENGINE, NOT FROM YOU
A deterministic engine runs before every reply; its output sits under "The user's profile". Quote those exact figures — never recompute or invent. If a number isn't there, ASK.

# Promoting the 1-on-1 Retirement360 Specialist call
After complex topics, suggest a free 15-min WhatsApp call with a Retirement360 Specialist (once every 3-4 messages). Never use "Talk to a SEBI advisor" as a generic kiss-off — route to OUR specialist.

# Guardrails
- Educational, illustrative plans — not formal SEBI-registered advice. Say so.
- Never present rates/thresholds/limits as fixed — they change quarterly/annually.
- Don't invent EPS/NPS figures; ASK. Never guarantee returns.

# ⚠️ FINAL CHECK — identify the script of the user's LATEST message and match it. This rule is absolute."""


def detect_language_instruction(text: str) -> str:
    """Port of detectLanguageInstruction — returns an explicit reply-language order."""
    trimmed = text.strip()
    if not trimmed:
        return "Reply in English."

    ranges = [
        (r"[ऀ-ॿ]", "The user wrote in Hindi (Devanagari). Reply ENTIRELY in Hindi using Devanagari. Do NOT mix English."),
        (r"[ঀ-৿]", "The user wrote in Bengali. Reply ENTIRELY in Bengali."),
        (r"[઀-૿]", "The user wrote in Gujarati. Reply ENTIRELY in Gujarati."),
        (r"[਀-੿]", "The user wrote in Punjabi (Gurmukhi). Reply ENTIRELY in Punjabi."),
        (r"[஀-௿]", "The user wrote in Tamil. Reply ENTIRELY in Tamil."),
        (r"[ఀ-౿]", "The user wrote in Telugu. Reply ENTIRELY in Telugu."),
        (r"[ಀ-೿]", "The user wrote in Kannada. Reply ENTIRELY in Kannada."),
        (r"[ഀ-ൿ]", "The user wrote in Malayalam. Reply ENTIRELY in Malayalam."),
    ]
    for pattern, instruction in ranges:
        if re.search(pattern, trimmed):
            return instruction

    hinglish = r"\b(mera|tera|aap|hum|ham|kya|kaise|nahi|nahin|hain?|tha|thi|ke|ka|ki|ko|se|mein|main|toh|to|bhi|jo|woh|wo|yeh|ye|chahiye|paisa|hindi|matlab|samjh|samajh|batao|dikhao|dikh|bata)\b"
    if re.search(hinglish, trimmed, re.IGNORECASE):
        return ("The user wrote in Hinglish (Roman-script Hindi). Reply in Hinglish — mix Hindi words "
                "in Roman letters with English where natural. Do NOT use Devanagari.")

    return ("The user wrote in English. Reply ENTIRELY in English. Do NOT use Hindi, Devanagari, or any "
            "other script. This is non-negotiable.")


def _fmt_inr(n: float) -> str:
    """Indian-format an amount: ₹ with lakh/crore compaction."""
    if abs(n) >= 1_00_00_000:
        return f"₹{n / 1_00_00_000:.2f} Cr"
    if abs(n) >= 1_00_000:
        return f"₹{n / 1_00_000:.2f} L"
    return f"₹{n:,.0f}"


def build_profile_context(plan: GeneratedPlan, full_name: str | None, age: int) -> str:
    """Build the profile + engine-output context the model must quote from."""
    L: list[str] = ["# The user's profile (use this — don't make up numbers)", ""]
    if full_name:
        L.append(f"Name: {full_name}")
    L.append(f"Age: {age}")
    L.append(f"Retirement corpus: {_fmt_inr(plan.total_corpus)}")
    L.append(f"Blended return: {plan.blended_return:.2f}%")
    L.append("")
    L.append("## Generated bucket strategy plan")
    for b in plan.buckets:
        L.append(f"- {b.name} ({b.years_covered}): {_fmt_inr(b.amount)} @ {b.blended_return:.2f}% blended")
        for inst in b.instruments:
            L.append(f"    - {inst.name}: {_fmt_inr(inst.amount)} @ {inst.expected_return:.2f}%")
    L.append("")
    L.append("## Projected outcomes")
    L.append(f"- Net monthly income year 1: {_fmt_inr(plan.summary.monthly_income_year1)}")
    L.append(f"- Net monthly income year 10: {_fmt_inr(plan.summary.monthly_income_year10)} "
             f"(= {_fmt_inr(plan.summary.inflation_adjusted_year10)} in today's ₹)")
    L.append(f"- Final corpus at end of plan: {_fmt_inr(plan.legacy_at_end)}")
    if plan.shortfall_year:
        L.append(f"- ⚠ Corpus runs out at year {plan.shortfall_year}")
    else:
        L.append(f"- Plan is sustainable through the full {len(plan.projections)} years")
    L.append(f"- Total lifetime net income: {_fmt_inr(plan.summary.total_lifetime_income)}")
    L.append(f"- Total estimated tax over plan: {_fmt_inr(plan.summary.estimated_tax_paid)}")
    L.append("")
    L.append("Whenever the user asks numerical questions, reason from THESE numbers — never invent figures.")
    return "\n".join(L)


def get_gemini_model():
    """Return a configured Gemini GenerativeModel, or raise if no key."""
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to backend/.env. "
            "Get a free key at https://aistudio.google.com/apikey")
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    return genai
