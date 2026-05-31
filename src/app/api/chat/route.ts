import { NextRequest } from "next/server";
import type { Content } from "@google/genai";
import { prisma } from "@/lib/db";
import { generatePlan, PlanInputs, RiskAppetite } from "@/lib/calculations";
import {
  FROZEN_SYSTEM_PROMPT,
  buildProfileContext,
  buildEngineContext,
  getGeminiClient,
  ProfileExtras,
} from "@/lib/advisor";
import { buildPlan as buildEnginePlan } from "@/lib/retirement-engine";
import { profileToClient } from "@/lib/profile-to-engine";

export const runtime = "nodejs";
export const maxDuration = 300; // Allow long structured responses (tables + multi-stage plans) to stream fully.

// Detect the dominant script of a text and return a Gemini-friendly instruction
// telling the model exactly which language to reply in.
function detectLanguageInstruction(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "Reply in English.";

  // Unicode script ranges
  const ranges: Array<{ name: string; regex: RegExp; instruction: string }> = [
    { name: "Hindi", regex: /[ऀ-ॿ]/, instruction: "The user wrote in Hindi (Devanagari script). Reply ENTIRELY in Hindi using Devanagari. Do NOT mix English." },
    { name: "Bengali", regex: /[ঀ-৿]/, instruction: "The user wrote in Bengali. Reply ENTIRELY in Bengali." },
    { name: "Gujarati", regex: /[઀-૿]/, instruction: "The user wrote in Gujarati. Reply ENTIRELY in Gujarati." },
    { name: "Punjabi", regex: /[਀-੿]/, instruction: "The user wrote in Punjabi (Gurmukhi script). Reply ENTIRELY in Punjabi." },
    { name: "Tamil", regex: /[஀-௿]/, instruction: "The user wrote in Tamil. Reply ENTIRELY in Tamil." },
    { name: "Telugu", regex: /[ఀ-౿]/, instruction: "The user wrote in Telugu. Reply ENTIRELY in Telugu." },
    { name: "Kannada", regex: /[ಀ-೿]/, instruction: "The user wrote in Kannada. Reply ENTIRELY in Kannada." },
    { name: "Malayalam", regex: /[ഀ-ൿ]/, instruction: "The user wrote in Malayalam. Reply ENTIRELY in Malayalam." },
    { name: "Marathi", regex: /[ऀ-ॿ]/, instruction: "" }, // Marathi also uses Devanagari → caught by Hindi rule
  ];

  for (const r of ranges) {
    if (r.instruction && r.regex.test(trimmed)) return r.instruction;
  }

  // No Indic script detected → Latin alphabet. Distinguish English from Hinglish.
  const hinglishMarkers = /\b(mera|tera|aap|hum|ham|kya|kaise|nahi|nahin|hain?|tha|thi|ke|ka|ki|ko|se|mein|main|toh|to|bhi|jo|woh|wo|yeh|ye|chahiye|paisa|hindi|matlab|samjh|samajh|batao|dikhao|dikh|bata)\b/i;
  if (hinglishMarkers.test(trimmed)) {
    return "The user wrote in Hinglish (Roman-script Hindi). Reply in Hinglish — mix Hindi words written in Roman/Latin letters with English where natural. Do NOT use Devanagari script.";
  }

  return "The user wrote in English. Reply ENTIRELY in English. Do NOT use Hindi, Devanagari, or any other script. Even though the topic is Indian retirement, your reply MUST be in English because the user wrote in English. This is non-negotiable.";
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  profileId: string;
  messages: ChatMessage[];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequest;
  const { profileId, messages } = body;

  if (!profileId || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "profileId and messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const profile = await prisma.userProfile.findUnique({ where: { id: profileId } });
  if (!profile) {
    return new Response(JSON.stringify({ error: "profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let ai;
  try {
    ai = getGeminiClient();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Gemini client unavailable" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const planInputs: PlanInputs = {
    age: profile.age,
    corpus: profile.corpus,
    desiredMonthlyIncome: profile.desiredMonthlyIncome,
    otherMonthlyIncome: profile.pensionMonthly + profile.rentalMonthly + profile.dividendMonthly,
    inflationRate: profile.inflationRate,
    planningHorizon: profile.planningHorizon,
    riskAppetite: profile.riskAppetite as RiskAppetite,
    legacyAmount: profile.legacyAmount,
  };
  const plan = generatePlan(planInputs);

  const profileExtras: ProfileExtras = {
    maritalStatus: profile.maritalStatus,
    spouseAge: profile.spouseAge,
    dependents: profile.dependents,
    cityTier: profile.cityTier,
    corpus: profile.corpus,
    otherMonthlyIncome: planInputs.otherMonthlyIncome,
    desiredMonthlyIncome: profile.desiredMonthlyIncome,
    inflationRate: profile.inflationRate,
    riskAppetite: profile.riskAppetite,
    planningHorizon: profile.planningHorizon,
    hasHealthInsurance: profile.hasHealthInsurance,
    healthCover: profile.healthCover,
    bucketListGoals: profile.bucketListGoals ? JSON.parse(profile.bucketListGoals) : [],
    hobbies: profile.hobbies ? JSON.parse(profile.hobbies) : [],
    healthConditions: profile.healthConditions ? JSON.parse(profile.healthConditions) : [],
  };

  const profileContext = buildProfileContext(plan, { fullName: profile.fullName, age: profile.age }, profileExtras);

  // ── Deterministic engine output — the AI must reference THESE numbers, not compute its own.
  const engineClient = profileToClient(profile);
  const enginePlan = buildEnginePlan(engineClient);
  const engineContext = buildEngineContext(engineClient, enginePlan);

  // Detect the script of the user's MOST RECENT message and inject an explicit language instruction.
  // This is the bulletproof way to enforce language matching — the prompt-only approach is unreliable
  // when the system prompt has heavy Indian financial content that biases the model toward Hindi.
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const languageInstruction = detectLanguageInstruction(lastUserMessage);

  const systemInstruction = `${FROZEN_SYSTEM_PROMPT}\n\n---\n\n${profileContext}\n\n---\n\n${engineContext}\n\n---\n\n# 🔒 LANGUAGE FOR THIS REPLY (MACHINE-DETECTED, NON-NEGOTIABLE)\n${languageInstruction}`;

  // Gemini uses { role: "user" | "model", parts: [{text}] } shape.
  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });

        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[chat] Gemini stream error:", err);
        const msg = err instanceof Error ? `[Error: ${err.message}]` : "[Error: something went wrong]";
        controller.enqueue(encoder.encode(`\n\n${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
