import { RefreshCcw } from "lucide-react";
import { formatEuro, formatEuroFromCents } from "../format";
import type { PriceResponse } from "../types";

export function LiveReceipt({ price }: { price: PriceResponse }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Estimated price from Notarity pricing</h2>
          <p className="mt-2 text-sm text-slate-600">
            Final price is confirmed before booking. This demo uses the mock pricing endpoint.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-900">
          <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {price.source === "mock" ? "Demo price" : "Live price"}
        </span>
      </div>

      <div className="mt-5 divide-y divide-slate-200 rounded-md border border-slate-200">
        {price.lines.map((line) => (
          <div key={`${line.name}-${line.identifier ?? line.net}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-slate-700">{line.name}</span>
            <span className="font-semibold text-slate-950">{formatEuroFromCents(line.net)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 bg-slate-50 px-4 py-4 text-base">
          <span className="font-semibold text-slate-950">Total</span>
          <span className="text-2xl font-semibold text-slate-950">
            {formatEuro(price.confirmedPrice)}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-950">What changes this price?</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Product route, apostille, hard copy, drafting help, proof of representation,
          shipping, and the country of use can affect the pricing endpoint.
        </p>
      </div>
    </section>
  );
}
