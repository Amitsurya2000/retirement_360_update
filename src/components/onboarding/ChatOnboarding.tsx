"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileData, defaultProfile } from "@/lib/types";
import { formatINR, parseINR } from "@/lib/format";
import { Sparkles, User as UserIcon, Check, Minus, Plus, ArrowLeft } from "lucide-react";
import { Language, LANGUAGES, Strings, t } from "@/lib/translations";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface Liability {
  name: string;
  amount: number;
  year: number;
}

interface FundsBreakdown {
  pf: number;
  govScheme: number;
  leaveEncashment: number;
  gratuity: number;
  nps: number;
  savings: number;
}

type AnswerValue = string | number | string[] | Liability[] | FundsBreakdown;

type StepType = "text" | "stepper" | "choice" | "money" | "chips" | "liabilities" | "funds";

interface Step {
  id: string;
  type: StepType;
  question: (d: ProfileData) => string;
  options?: { value: string; label: string; description?: string }[];
  presets?: { label: string; value: number }[];
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
  initial?: (d: ProfileData) => number;
  prefill?: (d: ProfileData) => string;
  digitsOnly?: boolean;
  maxLength?: number;
  validate?: (v: string) => string | null; // returns an error message, or null if valid
  skippable?: boolean;
  showIf?: (d: ProfileData) => boolean;
  apply: (d: ProfileData, value: AnswerValue) => Partial<ProfileData>;
  answerLabel: (value: AnswerValue, d: ProfileData) => string;
}

const firstName = (full?: string | null) => (full ? full.trim().split(/\s+/)[0] : "");

// Build the step list for the chosen language.
function buildSteps(s: Strings): Step[] {
  return [
    {
      id: "name",
      type: "text",
      skippable: true,
      placeholder: s.nameInputPlaceholder,
      prefill: (d) => d.fullName ?? "",
      question: () => s.greetingForName,
      apply: (_d, v) => ({ fullName: String(v).trim() }),
      answerLabel: (v) => (String(v).trim() ? String(v).trim() : s.answerNameSkipped),
    },
    {
      id: "phone",
      type: "text",
      digitsOnly: true,
      maxLength: 10,
      validate: (v) => (/^\d{10}$/.test(v) ? null : "Please enter a valid 10-digit mobile number."),
      placeholder: "10-digit mobile number",
      question: (d) => `${firstName(d.fullName) ? `Thanks, ${firstName(d.fullName)}! ` : ""}What's the best phone number to reach you on?`,
      apply: (_d, v) => ({ phone: String(v).trim() }),
      answerLabel: (v) => String(v).trim(),
    },
    {
      id: "company",
      type: "text",
      skippable: true,
      placeholder: "Company name (optional)",
      question: () => "Which company do you work for, or did you retire from?",
      apply: (_d, v) => ({ companyName: String(v).trim() }),
      answerLabel: (v) => (String(v).trim() ? String(v).trim() : "Skipped"),
    },
    {
      id: "age",
      type: "stepper",
      min: 40,
      max: 95,
      suffix: s.ageSuffix,
      initial: (d) => d.age,
      question: (d) => s.ageQuestion(firstName(d.fullName)),
      apply: (_d, v) => ({ age: Number(v) }),
      answerLabel: (v) => `${v} ${s.ageSuffix}`,
    },
    {
      id: "gender",
      type: "choice",
      question: () => s.genderQuestion,
      options: [
        { value: "male", label: s.optMale },
        { value: "female", label: s.optFemale },
        { value: "other", label: s.optOther },
      ],
      apply: (_d, v) => ({ gender: String(v) as ProfileData["gender"] }),
      answerLabel: (v) => ({ male: s.optMale, female: s.optFemale, other: s.optOther }[String(v)] ?? String(v)),
    },
    {
      id: "marital",
      type: "choice",
      question: () => s.maritalQuestion,
      options: [
        { value: "married", label: s.optMarried },
        { value: "widowed", label: s.optWidowed },
        { value: "single", label: s.optSingle },
        { value: "divorced", label: s.optDivorced },
      ],
      apply: (_d, v) => ({ maritalStatus: String(v) as ProfileData["maritalStatus"] }),
      answerLabel: (v) => ({ married: s.optMarried, widowed: s.optWidowed, single: s.optSingle, divorced: s.optDivorced }[String(v)] ?? String(v)),
    },
    {
      id: "spouseAge",
      type: "stepper",
      min: 30,
      max: 100,
      suffix: s.spouseAgeSuffix,
      initial: (d) => d.spouseAge ?? 58,
      showIf: (d) => d.maritalStatus === "married",
      question: () => s.spouseAgeQuestion,
      apply: (_d, v) => ({ spouseAge: Number(v) }),
      answerLabel: (v) => `${v} ${s.spouseAgeSuffix}`,
    },
    {
      id: "city",
      type: "choice",
      question: () => s.cityQuestion,
      options: [
        { value: "metro", label: s.optCityMetro, description: s.optCityMetroDesc },
        { value: "tier2", label: s.optCityTier2, description: s.optCityTier2Desc },
        { value: "tier3", label: s.optCityTier3, description: s.optCityTier3Desc },
      ],
      apply: (_d, v) => ({ cityTier: String(v) as ProfileData["cityTier"] }),
      answerLabel: (v) => ({ metro: s.optCityMetro, tier2: s.optCityTier2, tier3: s.optCityTier3 }[String(v)] ?? String(v)),
    },
    {
      // Itemized fund breakdown — matches the FUNDS table in the R C Singh Excel template.
      // The engine needs to know each source separately to build the plan correctly.
      id: "funds",
      type: "funds",
      question: () => s.fundsQuestion,
      apply: (_d, v) => {
        const f = v as FundsBreakdown;
        const total = f.pf + f.govScheme + f.leaveEncashment + f.gratuity + f.nps + f.savings;
        return {
          fundsBreakdown: f,
          corpus: total,
          npsLumpSum: f.nps, // keep the explicit NPS field in sync so the mapper still works
        };
      },
      answerLabel: (v) => {
        const f = v as FundsBreakdown;
        const total = f.pf + f.govScheme + f.leaveEncashment + f.gratuity + f.nps + f.savings;
        return `Total ${formatINR(total, { compact: true })}`;
      },
    },
    {
      id: "other",
      type: "money",
      question: () => s.otherIncomeQuestion,
      presets: [
        { label: s.presetNone, value: 0 },
        { label: "₹10,000", value: 10_000 },
        { label: "₹25,000", value: 25_000 },
        { label: "₹50,000", value: 50_000 },
      ],
      apply: (_d, v) => ({ pensionMonthly: Number(v), rentalMonthly: 0, dividendMonthly: 0 }),
      answerLabel: (v) => (Number(v) === 0 ? s.answerNoOtherIncome : `${formatINR(Number(v))} / mo`),
    },
    {
      id: "desired",
      type: "money",
      question: () => s.desiredIncomeQuestion,
      presets: [
        { label: "₹30,000", value: 30_000 },
        { label: "₹50,000", value: 50_000 },
        { label: "₹75,000", value: 75_000 },
        { label: "₹1 L", value: 1_00_000 },
      ],
      apply: (_d, v) => {
        const n = Number(v);
        return { desiredMonthlyIncome: Number.isFinite(n) && n >= 1000 ? n : _d.desiredMonthlyIncome };
      },
      answerLabel: (v) => `${formatINR(Number(v) || 0)} / mo`,
    },
    {
      id: "risk",
      type: "choice",
      question: () => s.riskQuestion,
      options: [
        { value: "conservative", label: s.optRiskConservative, description: s.optRiskConservativeDesc },
        { value: "moderate", label: s.optRiskModerate, description: s.optRiskModerateDesc },
        { value: "balanced", label: s.optRiskBalanced, description: s.optRiskBalancedDesc },
      ],
      apply: (_d, v) => ({ riskAppetite: String(v) as ProfileData["riskAppetite"] }),
      answerLabel: (v) => ({ conservative: s.optRiskConservative, moderate: s.optRiskModerate, balanced: s.optRiskBalanced }[String(v)] ?? String(v)),
    },
    {
      id: "health",
      type: "choice",
      question: () => s.healthInsuranceQuestion,
      options: [
        { value: "yes", label: s.optHealthYes },
        { value: "no", label: s.optHealthNo },
      ],
      apply: (_d, v) => ({ hasHealthInsurance: v === "yes" }),
      answerLabel: (v) => (v === "yes" ? s.answerHealthYes : s.answerHealthNo),
    },
    {
      // EPS pension — fixed monthly amount; locked to the EPS member (usually husband).
      id: "eps",
      type: "money",
      question: () => s.epsQuestion,
      presets: [
        { label: s.presetNone, value: 0 },
        { label: "₹3,000", value: 3_000 },
        { label: "₹5,000", value: 5_000 },
        { label: "₹10,000", value: 10_000 },
      ],
      apply: (_d, v) => ({ epsMonthly: Number(v) }),
      answerLabel: (v) => (Number(v) === 0 ? s.answerNoEPS : `${formatINR(Number(v))} / mo`),
    },
    {
      id: "liabilities",
      type: "liabilities",
      question: () => s.liabilitiesQuestion,
      apply: (_d, v) => ({ bucketListGoals: v as Liability[] }),
      answerLabel: (v) => {
        const list = v as Liability[];
        if (!list.length) return s.answerNoLiabilities;
        return list.map((l) => `${l.name}: ${formatINR(l.amount, { compact: true })}`).join("; ");
      },
    },
  ];
}

interface Turn {
  role: "bot" | "user";
  text: string;
}

const LANGUAGE_STORAGE_KEY = "retirewell.language";

export function ChatOnboarding() {
  const router = useRouter();
  const [lang, setLang] = useState<Language | null>(null);
  const [data, setData] = useState<ProfileData>(defaultProfile);
  const [idx, setIdx] = useState(0);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  const s = t(lang ?? "en");
  const STEPS = buildSteps(s);
  const step = STEPS[idx];

  // Pre-fill the name from the signed-in Google account (less typing for users).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const name =
        (user?.user_metadata?.full_name as string) ||
        (user?.user_metadata?.name as string) ||
        "";
      if (name) setData((d) => (d.fullName ? d : { ...d, fullName: name }));
    });
  }, []);

  useEffect(() => {
    // While building the plan, scroll to the spinner at the bottom.
    // Otherwise scroll so the CURRENT QUESTION sits at the top — the user
    // reads the question first, then the options below it.
    if (submitting) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [idx, submitting, lang]);

  const nextVisibleIndex = (from: number, d: ProfileData): number => {
    let i = from;
    while (i < STEPS.length && STEPS[i].showIf && !STEPS[i].showIf!(d)) i++;
    return i;
  };

  const handlePickLanguage = (chosen: Language) => {
    setLang(chosen);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, chosen);
    } catch {
      // ignore
    }
  };

  const handleAnswer = async (value: AnswerValue) => {
    const patch = step.apply(data, value);
    const updated = { ...data, ...patch };
    const userText = step.answerLabel(value, updated);

    const newTranscript: Turn[] = [
      ...transcript,
      { role: "bot", text: step.question(data) },
      { role: "user", text: userText },
    ];
    setTranscript(newTranscript);
    setData(updated);

    const next = nextVisibleIndex(idx + 1, updated);
    if (next >= STEPS.length) {
      await submit(updated);
    } else {
      setIdx(next);
    }
  };

  const handleBack = () => {
    if (transcript.length < 2) return;
    const trimmed = transcript.slice(0, -2);
    setTranscript(trimmed);
    let prev = idx - 1;
    while (prev >= 0 && STEPS[prev].showIf && !STEPS[prev].showIf!(data)) prev--;
    if (prev >= 0) setIdx(prev);
  };

  const submit = async (finalData: ProfileData) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Couldn't save (HTTP ${res.status})`);
      }
      const { id } = await res.json();
      localStorage.setItem("retirewell.profileId", id);
      router.push(`/plan?id=${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const totalVisible = STEPS.filter((st) => !st.showIf || st.showIf(data)).length;
  const answered = transcript.filter((tr) => tr.role === "user").length;
  const progress = lang ? Math.min(100, Math.round((answered / totalVisible) * 100)) : 0;

  // Show language picker first
  if (!lang) {
    return <LanguagePicker onPick={handlePickLanguage} />;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex flex-col">
      <div className="sticky top-[73px] z-10 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-3">
            {transcript.length >= 2 && !submitting && (
              <button
                onClick={handleBack}
                className="shrink-0 text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 text-sm"
                aria-label={s.backBtn}
              >
                <ArrowLeft className="w-4 h-4" /> {s.backBtn}
              </button>
            )}
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progress, 6)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
        {transcript.map((tr, i) => (
          <Bubble key={i} role={tr.role} text={tr.text} />
        ))}

        {!submitting && (
          <div ref={questionRef} className="space-y-5 scroll-mt-32">
            <Bubble role="bot" text={step.question(data)} />
            <div className="pl-12 animate-fade-in">
              <StepInput key={step.id} step={step} data={data} onAnswer={handleAnswer} strings={s} />
            </div>
          </div>
        )}

        {submitting && (
          <div className="pl-12 py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-3" />
            <p className="text-lg text-slate-700 font-medium">{s.buildingPlan(firstName(data.fullName))}</p>
            <p className="text-sm text-slate-500 mt-1">{s.justAMoment}</p>
          </div>
        )}

        {error && (
          <div className="pl-12">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-base">{error}</div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}

function LanguagePicker({ onPick }: { onPick: (l: Language) => void }) {
  // Use English title initially; the welcome bubble shows the native greeting.
  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light text-primary mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Namaste! 🙏</h1>
          <p className="text-lg text-slate-600 max-w-md mx-auto">
            Which language would you like to continue in?
          </p>
          <p className="text-sm text-slate-500 mt-1">आप किस भाषा में बात करना चाहते हैं?</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => onPick(l.code)}
              className="rounded-2xl border-2 border-slate-200 bg-white hover:border-primary hover:bg-primary-light px-4 py-5 text-center transition-all active:scale-[0.98]"
            >
              <p className="text-xl font-bold text-slate-900">{l.nativeName}</p>
              {l.code !== "en" && <p className="text-xs text-slate-500 mt-1">{l.englishName}</p>}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mt-8">
          You can switch language anytime — your AI advisor speaks all of these.
        </p>
      </div>
    </div>
  );
}

function Bubble({ role, text }: { role: "bot" | "user"; text: string }) {
  const isBot = role === "bot";
  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"} animate-fade-in`}>
      <div
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          isBot ? "bg-primary text-white" : "bg-slate-200 text-slate-700"
        }`}
      >
        {isBot ? <Sparkles className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3 text-lg leading-relaxed whitespace-pre-wrap ${
          isBot ? "bg-white border border-slate-200 text-slate-900 shadow-sm" : "bg-primary text-white"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function StepInput({
  step,
  data,
  onAnswer,
  strings,
}: {
  step: Step;
  data: ProfileData;
  onAnswer: (v: AnswerValue) => void;
  strings: Strings;
}) {
  if (step.type === "text") return <TextInput step={step} data={data} onAnswer={onAnswer} strings={strings} />;
  if (step.type === "stepper") return <StepperInput step={step} data={data} onAnswer={onAnswer} strings={strings} />;
  if (step.type === "choice") return <ChoiceInput step={step} onAnswer={onAnswer} />;
  if (step.type === "money") return <MoneyInput step={step} onAnswer={onAnswer} strings={strings} />;
  if (step.type === "liabilities") return <LiabilitiesForm onAnswer={onAnswer} strings={strings} />;
  if (step.type === "funds") return <FundsForm onAnswer={onAnswer} strings={strings} />;
  return null;
}

const BIG_BTN =
  "w-full text-left rounded-2xl border-2 px-5 py-4 text-lg font-medium transition-all border-slate-200 bg-white hover:border-primary hover:bg-primary-light active:scale-[0.99]";

function TextInput({ step, data, onAnswer, strings }: { step: Step; data: ProfileData; onAnswer: (v: AnswerValue) => void; strings: Strings }) {
  const [value, setValue] = useState(step.prefill ? step.prefill(data) : "");
  const [touched, setTouched] = useState(false);
  const error = step.validate ? step.validate(value) : null;

  const handleChange = (raw: string) => {
    let v = raw;
    if (step.digitsOnly) v = v.replace(/\D/g, "");
    if (step.maxLength) v = v.slice(0, step.maxLength);
    setValue(v);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (error) {
          setTouched(true);
          return;
        }
        onAnswer(value);
      }}
      className="space-y-3"
    >
      <input
        autoFocus
        type="text"
        inputMode={step.digitsOnly ? "numeric" : "text"}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={step.placeholder}
        className={`w-full rounded-2xl border-2 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
          touched && error ? "border-red-400" : "border-slate-300"
        }`}
      />
      {touched && error && <p className="text-sm text-red-600 px-1">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!!error}
          className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl px-6 py-4 text-lg transition-colors"
        >
          {strings.continueBtn}
        </button>
        {step.skippable && (
          <button type="button" onClick={() => onAnswer("")} className="px-6 py-4 rounded-2xl border-2 border-slate-300 text-slate-600 hover:bg-slate-100 text-lg font-medium">
            {strings.skipBtn}
          </button>
        )}
      </div>
    </form>
  );
}

function StepperInput({ step, data, onAnswer, strings }: { step: Step; data: ProfileData; onAnswer: (v: AnswerValue) => void; strings: Strings }) {
  const [value, setValue] = useState<number>(step.initial ? step.initial(data) : step.min ?? 0);
  const min = step.min ?? 0;
  const max = step.max ?? 999;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-6 bg-white border-2 border-slate-200 rounded-2xl py-6">
        <button type="button" onClick={() => setValue((v) => Math.max(min, v - 1))} className="w-14 h-14 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all" aria-label="−">
          <Minus className="w-7 h-7" />
        </button>
        <div className="text-center min-w-[120px]">
          <div className="text-5xl font-bold text-slate-900 tabular-nums">{value}</div>
          {step.suffix && <div className="text-sm text-slate-500 mt-1">{step.suffix}</div>}
        </div>
        <button type="button" onClick={() => setValue((v) => Math.min(max, v + 1))} className="w-14 h-14 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all" aria-label="+">
          <Plus className="w-7 h-7" />
        </button>
      </div>
      <button onClick={() => onAnswer(value)} className="w-full bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl px-6 py-4 text-lg transition-colors">
        {strings.continueBtn}
      </button>
    </div>
  );
}

function ChoiceInput({ step, onAnswer }: { step: Step; onAnswer: (v: AnswerValue) => void }) {
  return (
    <div className="space-y-3">
      {step.options!.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onAnswer(opt.value)} className={BIG_BTN}>
          <div className="font-semibold text-slate-900 text-lg">{opt.label}</div>
          {opt.description && <div className="text-sm text-slate-500 mt-1 font-normal">{opt.description}</div>}
        </button>
      ))}
    </div>
  );
}

function MoneyInput({ step, onAnswer, strings }: { step: Step; onAnswer: (v: AnswerValue) => void; strings: Strings }) {
  const [custom, setCustom] = useState(false);
  const [amount, setAmount] = useState("");

  if (custom) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = parseINR(amount);
          if (n > 0 || amount.trim() === "0") onAnswer(n);
        }}
        className="space-y-3"
      >
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-xl">₹</span>
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={strings.enterAmountPlaceholder}
            className="w-full rounded-2xl border-2 border-slate-300 pl-10 pr-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {parseINR(amount) > 0 && (
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              {formatINR(parseINR(amount), { compact: true })}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">{strings.amountTip}</p>
        <div className="flex gap-3">
          <button type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl px-6 py-4 text-lg transition-colors">
            {strings.continueBtn}
          </button>
          <button type="button" onClick={() => setCustom(false)} className="px-6 py-4 rounded-2xl border-2 border-slate-300 text-slate-600 hover:bg-slate-100 text-lg">
            {strings.backBtn}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {step.presets!.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => onAnswer(p.value)}
          className="rounded-2xl border-2 border-slate-200 bg-white hover:border-primary hover:bg-primary-light px-4 py-5 text-xl font-bold text-slate-900 transition-all active:scale-[0.98]"
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setCustom(true)}
        className="col-span-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-primary px-4 py-4 text-lg font-medium text-slate-600 transition-all"
      >
        {strings.enterDifferentAmount}
      </button>
    </div>
  );
}

function LiabilitiesForm({ onAnswer, strings }: { onAnswer: (v: AnswerValue) => void; strings: Strings }) {
  const CATEGORIES = [
    { id: "wedding", icon: "💐", label: strings.liabilityWedding },
    { id: "education", icon: "🎓", label: strings.liabilityEducation },
    { id: "travel", icon: "✈️", label: strings.liabilityTravel },
    { id: "renovation", icon: "🏠", label: strings.liabilityRenovation },
    { id: "medical", icon: "🏥", label: strings.liabilityMedical },
    { id: "vehicle", icon: "🚗", label: strings.liabilityVehicle },
  ];
  const AMOUNT_PRESETS = [
    { label: "₹2 L", value: 2_00_000 },
    { label: "₹5 L", value: 5_00_000 },
    { label: "₹10 L", value: 10_00_000 },
    { label: "₹25 L", value: 25_00_000 },
    { label: "₹50 L", value: 50_00_000 },
    { label: "₹1 Cr", value: 1_00_00_000 },
  ];
  const YEAR_PRESETS = [
    { label: strings.yearThisYear, value: 0 },
    { label: strings.yearIn2, value: 2 },
    { label: strings.yearIn5, value: 5 },
    { label: strings.yearIn10, value: 10 },
    { label: strings.yearIn15, value: 15 },
  ];

  const [rows, setRows] = useState<Record<string, { enabled: boolean; amount: number; year: number }>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, { enabled: false, amount: 0, year: 5 }]))
  );

  const toggle = (id: string) => setRows((prev) => ({ ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } }));
  const setAmount = (id: string, amount: number) => setRows((prev) => ({ ...prev, [id]: { ...prev[id], amount, enabled: true } }));
  const setYear = (id: string, year: number) => setRows((prev) => ({ ...prev, [id]: { ...prev[id], year, enabled: true } }));

  const handleDone = () => {
    const result: Liability[] = CATEGORIES
      .filter((c) => rows[c.id].enabled && rows[c.id].amount > 0)
      .map((c) => ({ name: c.label, amount: rows[c.id].amount, year: rows[c.id].year }));
    onAnswer(result);
  };

  const activeCount = CATEGORIES.filter((c) => rows[c.id].enabled && rows[c.id].amount > 0).length;

  return (
    <div className="space-y-3">
      {CATEGORIES.map((cat) => {
        const row = rows[cat.id];
        const isActive = row.enabled;
        return (
          <div
            key={cat.id}
            className={`rounded-2xl border-2 transition-all overflow-hidden ${
              isActive ? "border-primary bg-primary-light shadow-sm" : "border-slate-200 bg-white"
            }`}
          >
            <button type="button" onClick={() => toggle(cat.id)} className="w-full flex items-center gap-3 px-4 py-4 text-left">
              <span className="text-3xl">{cat.icon}</span>
              <span className="flex-1 font-semibold text-base text-slate-900">{cat.label}</span>
              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isActive ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"}`}>
                {isActive && <Check className="w-4 h-4" />}
              </span>
            </button>
            {isActive && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{strings.amountLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {AMOUNT_PRESETS.map((a) => (
                      <button key={a.value} type="button" onClick={() => setAmount(cat.id, a.value)} className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${row.amount === a.value ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{strings.whenLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {YEAR_PRESETS.map((y) => (
                      <button key={y.value} type="button" onClick={() => setYear(cat.id, y.value)} className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${row.year === y.value ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
                        {y.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={handleDone} className="w-full bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl px-6 py-4 text-lg transition-colors mt-4">
        {activeCount > 0
          ? strings.liabilityDoneWithCount(activeCount, activeCount > 1)
          : strings.liabilityDoneSkip}
      </button>
    </div>
  );
}

// The itemized fund-breakdown form — mirrors the FUNDS table in the advisor's Excel template.
// One row per source: PF/EPF/CPF, Govt scheme (CSSS/GPF), Leave Encashment, Gratuity, NPS, Existing savings.
function FundsForm({ onAnswer, strings }: { onAnswer: (v: AnswerValue) => void; strings: Strings }) {
  const CATEGORIES = [
    { id: "pf",              icon: "🏦", label: strings.fundPF,              hint: strings.fundPFHint },
    { id: "govScheme",       icon: "🏛️", label: strings.fundGovScheme,        hint: strings.fundGovSchemeHint },
    { id: "leaveEncashment", icon: "🌴", label: strings.fundLeaveEncashment, hint: strings.fundLeaveEncashmentHint },
    { id: "gratuity",        icon: "💼", label: strings.fundGratuity,         hint: strings.fundGratuityHint },
    { id: "nps",             icon: "📈", label: strings.fundNPS,              hint: strings.fundNPSHint },
    { id: "savings",         icon: "💰", label: strings.fundSavings,          hint: strings.fundSavingsHint },
  ] as const;

  const AMOUNT_PRESETS = [
    { label: "₹5 L",  value: 5_00_000 },
    { label: "₹10 L", value: 10_00_000 },
    { label: "₹25 L", value: 25_00_000 },
    { label: "₹50 L", value: 50_00_000 },
    { label: "₹1 Cr", value: 1_00_00_000 },
    { label: "₹2 Cr", value: 2_00_00_000 },
  ];

  const [rows, setRows] = useState<Record<string, { amount: number; custom: boolean; customText: string }>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, { amount: 0, custom: false, customText: "" }]))
  );

  const setAmount = (id: string, amount: number) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], amount, custom: false, customText: "" } }));

  const enableCustom = (id: string) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], custom: true } }));

  const onCustomChange = (id: string, text: string) => {
    const n = parseINR(text);
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], amount: n, customText: text } }));
  };

  const total = CATEGORIES.reduce((s, c) => s + (rows[c.id].amount || 0), 0);

  const handleDone = () => {
    const out: FundsBreakdown = {
      pf:              rows.pf.amount,
      govScheme:       rows.govScheme.amount,
      leaveEncashment: rows.leaveEncashment.amount,
      gratuity:        rows.gratuity.amount,
      nps:             rows.nps.amount,
      savings:         rows.savings.amount,
    };
    onAnswer(out);
  };

  return (
    <div className="space-y-3">
      {CATEGORIES.map((cat) => {
        const row = rows[cat.id];
        const isSet = row.amount > 0;
        return (
          <div
            key={cat.id}
            className={`rounded-2xl border-2 transition-all overflow-hidden ${
              isSet ? "border-primary bg-primary-light shadow-sm" : "border-slate-200 bg-white"
            }`}
          >
            <div className="px-4 pt-4 pb-2 flex items-center gap-3">
              <span className="text-3xl">{cat.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-base text-slate-900">{cat.label}</p>
                {cat.hint && <p className="text-xs text-slate-500">{cat.hint}</p>}
              </div>
              {isSet && (
                <span className="font-bold text-primary text-lg whitespace-nowrap">
                  {formatINR(row.amount, { compact: true })}
                </span>
              )}
            </div>

            <div className="px-4 pb-4 space-y-2">
              <div className="flex flex-wrap gap-2">
                {AMOUNT_PRESETS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAmount(cat.id, a.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                      !row.custom && row.amount === a.value
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => enableCustom(cat.id)}
                  className={`px-3 py-2 rounded-xl border-2 border-dashed text-sm font-medium transition-all ${
                    row.custom ? "border-primary bg-primary-light text-primary" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  ✏️ {strings.enterDifferentAmount.replace(/^.*?\s/, "")}
                </button>
              </div>
              {row.custom && (
                <div className="relative animate-fade-in">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">₹</span>
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    value={row.customText}
                    onChange={(e) => onCustomChange(cat.id, e.target.value)}
                    placeholder={strings.enterAmountPlaceholder}
                    className="w-full rounded-xl border-2 border-slate-300 pl-9 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {row.amount > 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      {formatINR(row.amount, { compact: true })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="rounded-2xl bg-gradient-to-br from-primary-light to-white border-2 border-primary p-4 flex items-center justify-between sticky bottom-2 shadow-md">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{strings.fundsTotalLabel}</p>
          <p className="text-2xl font-bold text-slate-900">{formatINR(total, { compact: true })}</p>
        </div>
        <button
          onClick={handleDone}
          disabled={total < 1_00_000}
          className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl px-6 py-4 text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {strings.continueBtn}
        </button>
      </div>
    </div>
  );
}
