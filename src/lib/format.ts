// Indian number formatting: lakhs (1L = 1,00,000) and crores (1Cr = 1,00,00,000).

export function formatINR(value: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  const { compact = false, decimals = 0 } = opts;
  if (!isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (compact) {
    if (abs >= 1_00_00_000) {
      return `${sign}₹${(abs / 1_00_00_000).toFixed(abs >= 10_00_00_000 ? 1 : 2)} Cr`;
    }
    if (abs >= 1_00_000) {
      return `${sign}₹${(abs / 1_00_000).toFixed(abs >= 10_00_000 ? 1 : 2)} L`;
    }
    if (abs >= 1_000) {
      return `${sign}₹${(abs / 1_000).toFixed(1)}k`;
    }
  }

  return `${sign}₹${abs.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  })}`;
}

export function formatLakhCr(value: number): string {
  return formatINR(value, { compact: true });
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Parse user input that may contain commas, ₹ symbol, "L"/"Cr" suffixes.
export function parseINR(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[₹,\s]/g, "").toLowerCase().trim();
  if (cleaned.endsWith("cr")) {
    return parseFloat(cleaned.replace("cr", "")) * 1_00_00_000;
  }
  if (
    cleaned.endsWith("lac") || cleaned.endsWith("lacs") ||
    cleaned.endsWith("lakh") || cleaned.endsWith("lakhs") ||
    cleaned.endsWith("l")
  ) {
    return parseFloat(cleaned.replace(/lacs?|lakhs?|l$/g, "")) * 1_00_000;
  }
  if (cleaned.endsWith("k")) {
    return parseFloat(cleaned.replace("k", "")) * 1_000;
  }
  return parseFloat(cleaned) || 0;
}
