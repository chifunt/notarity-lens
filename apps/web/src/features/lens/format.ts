import type { FieldStatus } from "./types";

export function formatEuroFromCents(cents: number) {
  return new Intl.NumberFormat("en-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat("en-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function statusLabel(status: FieldStatus) {
  const labels: Record<FieldStatus, string> = {
    inferred: "Found in document",
    confirmed: "Confirmed",
    needs_review: "Please confirm",
    conflict: "Needs attention",
    missing: "Missing",
    edited: "Edited by you",
    not_applicable: "Not needed",
  };
  return labels[status];
}
