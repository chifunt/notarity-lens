import { Euro } from "lucide-react";
import { formatEuro, formatEuroFromCents } from "../format";
import type { PriceResponse } from "../types";

export function ReceiptSidebar({ price }: { price: PriceResponse | null }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <Euro className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="text-base font-semibold text-foreground">Receipt</h2>
      </div>
      {price ? (
        <>
          <div className="mt-4 grid gap-2">
            {price.lines.map((line) => (
              <div key={`${line.name}-${line.identifier ?? line.net}`} className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{line.name}</span>
                <span className="font-medium text-foreground">{formatEuroFromCents(line.net)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-xl font-semibold text-foreground">
                {formatEuro(price.confirmedPrice)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Use the sample request or upload documents to see pricing.
        </p>
      )}
    </div>
  );
}
