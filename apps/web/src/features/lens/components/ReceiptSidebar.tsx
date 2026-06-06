import { Euro } from "lucide-react";
import { formatEuro, formatEuroFromCents } from "../format";
import type { PriceResponse } from "../types";

export function ReceiptSidebar({ price }: { price: PriceResponse | null }) {
  return (
    <aside className="sticky top-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Euro className="h-5 w-5 text-violet-700" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">Receipt</h2>
      </div>
      {price ? (
        <>
          <div className="mt-4 grid gap-2">
            {price.lines.map((line) => (
              <div key={`${line.name}-${line.identifier ?? line.net}`} className="flex justify-between gap-3 text-sm">
                <span className="text-slate-600">{line.name}</span>
                <span className="font-medium text-slate-950">{formatEuroFromCents(line.net)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex justify-between gap-3">
              <span className="text-sm font-semibold text-slate-950">Total</span>
              <span className="text-xl font-semibold text-slate-950">
                {formatEuro(price.confirmedPrice)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600">Load the Joshua demo to see pricing.</p>
      )}
    </aside>
  );
}
