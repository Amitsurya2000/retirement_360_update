"use client";

import { ReactNode } from "react";
import { formatINR, parseINR } from "@/lib/format";

interface FieldProps {
  label: string;
  helper?: string;
  children: ReactNode;
}

export function Field({ label, helper, children }: FieldProps) {
  return (
    <div>
      <label className="label-text">{label}</label>
      {children}
      {helper && <p className="helper-text">{helper}</p>}
    </div>
  );
}

interface MoneyInputProps {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}

export function MoneyInput({ value, onChange, placeholder }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">₹</span>
      <input
        type="text"
        inputMode="numeric"
        value={value === 0 ? "" : value.toLocaleString("en-IN")}
        onChange={(e) => onChange(parseINR(e.target.value))}
        placeholder={placeholder}
        className="input-field pl-9"
      />
      {value > 0 && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          {formatINR(value, { compact: true })}
        </span>
      )}
    </div>
  );
}

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}

export function NumberInput({ value, onChange, min, max, suffix }: NumberInputProps) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        className="input-field"
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>
      )}
    </div>
  );
}

interface ChoiceProps<T extends string> {
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: 2 | 3 | 4;
}

export function Choice<T extends string>({ options, value, onChange, cols = 3 }: ChoiceProps<T>) {
  const gridClass = cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-4";
  return (
    <div className={`grid ${gridClass} gap-3`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`text-left rounded-xl border-2 px-4 py-3 transition-all ${
            value === opt.value
              ? "border-primary bg-primary-light"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="font-semibold text-slate-900">{opt.label}</div>
          {opt.description && <div className="text-xs text-slate-500 mt-1">{opt.description}</div>}
        </button>
      ))}
    </div>
  );
}

interface ChipMultiProps {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}

export function ChipMulti({ options, values, onChange }: ChipMultiProps) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
            values.includes(opt)
              ? "border-primary bg-primary text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
