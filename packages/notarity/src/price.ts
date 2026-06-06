import type { PriceLine } from "@notarity-lens/shared";

export function totalNetCents(lines: PriceLine[]) {
  return lines.reduce((sum, line) => sum + (line.net ?? 0), 0);
}

export function confirmedPriceFromLines(lines: PriceLine[]) {
  return totalNetCents(lines) / 100;
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat("en-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
