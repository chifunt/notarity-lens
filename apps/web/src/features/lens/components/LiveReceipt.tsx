import { useState, type ReactNode } from "react";
import { HelpCircle, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEuro, formatEuroFromCents } from "../format";
import type { PriceResponse } from "../types";

export function LiveReceipt({
  price,
  action,
}: {
  price: PriceResponse;
  action?: ReactNode;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <section className="lens-card-motion rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Price from Notarity pricing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Final price is confirmed before booking. Fixture mode uses the same
            itemized shape as the pricing endpoint.
          </p>
        </div>
        <span className="lens-status-badge inline-flex items-center gap-1 rounded-full bg-status-inferred px-2.5 py-1 text-xs font-medium text-status-inferred-foreground">
          <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {price.source === "mock" ? "Fixture price" : "Live price"}
        </span>
      </div>

      <div className="mt-5 divide-y divide-border rounded-lg border border-border">
        {price.lines.map((line, index) => (
          <div
            key={`${line.name}-${line.identifier ?? line.net}`}
            style={{ animationDelay: `${index * 55}ms` }}
            className="lens-receipt-line flex items-center justify-between gap-4 px-4 py-3 text-sm"
          >
            <span className="text-muted-foreground">{line.name}</span>
            <span className="font-semibold text-foreground">{formatEuroFromCents(line.net)}</span>
          </div>
        ))}
        <div className="lens-receipt-total flex items-center justify-between gap-4 bg-lens-surface-muted px-4 py-4 text-base">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-2xl font-semibold text-foreground">
            {formatEuro(price.confirmedPrice)}
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        aria-controls="price-help"
        aria-expanded={helpOpen}
        onClick={() => setHelpOpen((open) => !open)}
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        I am not sure about the price
      </Button>

      {action ? <div className="mt-4 border-t border-border pt-4">{action}</div> : null}

      {helpOpen ? (
        <div id="price-help" className="lens-screen-enter mt-4 rounded-lg border border-border bg-lens-surface-muted p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Why this total is used
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The total follows the Notarity pricing response shape. In live
                mode, the pricing endpoint is authoritative; Lens should not
                invent or recalculate final prices from product metadata.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border bg-card p-3">
            <h4 className="text-sm font-semibold text-foreground">What can change it?</h4>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Product route, apostille, hard copy, drafting help, proof of
              representation, shipping, and country of use can affect the
              pricing endpoint.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
