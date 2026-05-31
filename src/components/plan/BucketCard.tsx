"use client";

import { useState } from "react";
import { Bucket } from "@/lib/calculations";
import { formatINR, formatPct } from "@/lib/format";
import { getInstrumentInfo } from "@/lib/instrument-info";
import { ShieldCheck, PiggyBank, TrendingUp, ChevronDown, BookOpen, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/config";

const BUCKET_THEME = {
  1: { color: "emerald", icon: ShieldCheck },
  2: { color: "blue", icon: PiggyBank },
  3: { color: "amber", icon: TrendingUp },
} as const;

export function BucketCard({ bucket }: { bucket: Bucket }) {
  const theme = BUCKET_THEME[bucket.id];
  const Icon = theme.icon;
  const colorClasses = {
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50/40", text: "text-emerald-700", chip: "bg-emerald-100 text-emerald-700" },
    blue: { border: "border-blue-200", bg: "bg-blue-50/40", text: "text-blue-700", chip: "bg-blue-100 text-blue-700" },
    amber: { border: "border-amber-200", bg: "bg-amber-50/40", text: "text-amber-700", chip: "bg-amber-100 text-amber-700" },
  }[theme.color];

  return (
    <div className={`rounded-2xl border-2 ${colorClasses.border} ${colorClasses.bg} p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-white ${colorClasses.text} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{bucket.name}</h3>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${colorClasses.chip} mt-1`}>
              {bucket.yearsCovered}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{formatINR(bucket.amount, { compact: true })}</p>
          <p className="text-sm text-slate-500">{formatPct(bucket.targetPercent, 0)} of corpus</p>
        </div>
      </div>

      <p className="text-slate-600 text-sm mb-5">{bucket.description}</p>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wide pb-1 border-b border-slate-200">
          <span>Instrument</span>
          <span>Allocation</span>
        </div>
        {bucket.instruments.map((inst) => (
          <InstrumentRow key={inst.name} instrument={inst} accentClass={colorClasses.text} />
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-sm">
        <span className="text-slate-600">Blended return</span>
        <span className={`font-semibold ${colorClasses.text}`}>{formatPct(bucket.blendedReturn)}</span>
      </div>
    </div>
  );
}

function InstrumentRow({
  instrument,
  accentClass,
}: {
  instrument: { name: string; amount: number; expectedReturn: number; notes?: string };
  accentClass: string;
}) {
  const [open, setOpen] = useState(false);
  const info = getInstrumentInfo(instrument.name);

  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-3">
          <p className="font-medium text-slate-800 text-sm">{instrument.name}</p>
          {instrument.notes && <p className="text-xs text-slate-500 mt-0.5">{instrument.notes}</p>}
          <p className="text-xs text-slate-400 mt-0.5">Expected: {formatPct(instrument.expectedReturn)}</p>
        </div>
        <p className="font-semibold text-slate-900 text-sm whitespace-nowrap">
          {formatINR(instrument.amount, { compact: true })}
        </p>
      </div>

      {info && (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${accentClass} hover:underline`}
            aria-expanded={open}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {open ? "Hide explanation" : "What is this? Why is it good for me?"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="mt-3 bg-white rounded-xl p-4 border border-slate-200 animate-fade-in space-y-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900 mb-1">What is it?</p>
                <p className="text-slate-700 leading-relaxed">{info.whatIsIt}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900 mb-1">Why this might be good for you</p>
                <p className="text-slate-700 leading-relaxed">{info.whyGoodForYou}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900 mb-1">How to start</p>
                <p className="text-slate-700 leading-relaxed">{info.howToOpen}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-900 mb-1">Things to know</p>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {info.thingsToKnow.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              <a
                href={whatsappLink(`Hello! I want to understand ${instrument.name} better. Can you guide me?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors mt-2"
              >
                <MessageCircle className="w-4 h-4" />
                Ask a Wealth Manager about this
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
