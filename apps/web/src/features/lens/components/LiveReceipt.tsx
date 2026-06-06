import { RefreshCcw } from "lucide-react";
import { formatEuro, formatEuroFromCents } from "../format";
import type { PriceResponse } from "../types";

export function LiveReceipt({ price }: { price: PriceResponse }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Price from Notarity pricing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Final price is confirmed before booking. Fixture mode uses the same
            itemized shape as the pricing endpoint.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-status-inferred px-2.5 py-1 text-xs font-medium text-status-inferred-foreground">
          <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {price.source === "mock" ? "Fixture price" : "Live price"}
        </span>
      </div>

      <div className="mt-5 divide-y divide-border rounded-lg border border-border">
        {price.lines.map((line) => (
          <div key={`${line.name}-${line.identifier ?? line.net}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-muted-foreground">{line.name}</span>
            <span className="font-semibold text-foreground">{formatEuroFromCents(line.net)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 bg-lens-surface-muted px-4 py-4 text-base">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-2xl font-semibold text-foreground">
            {formatEuro(price.confirmedPrice)}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-lens-surface-muted p-4">
        <h3 className="text-sm font-semibold text-foreground">What changes this price?</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Product route, apostille, hard copy, drafting help, proof of representation,
          shipping, and the country of use can affect the pricing endpoint.
        </p>
      </div>
    </section>
  );
}
