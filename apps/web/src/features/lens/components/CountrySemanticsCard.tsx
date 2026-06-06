import { ArrowRight, CheckCircle2, Home, MapPinned, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import type { DocumentFactExtraction } from "../types";

export function CountrySemanticsCard({
  inference,
  onConfirm,
}: {
  inference: DocumentFactExtraction;
  onConfirm: () => void;
}) {
  const confirmed = inference.countryOfUse.status === "confirmed";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            Where will this notarised document be used or accepted?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This can be different from where you live, pay, or want the hard copy
            shipped.
          </p>
        </div>
        <StatusBadge status={inference.countryOfUse.status} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-md border border-violet-200 bg-violet-50 p-4">
          <MapPinned className="h-5 w-5 text-violet-800" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-violet-950">Country of use</p>
          <p className="mt-1 text-xl font-semibold text-violet-950">Spain</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <Home className="h-5 w-5 text-slate-700" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-600">Billing/home</p>
          <p className="mt-1 text-xl font-semibold text-slate-950">United States</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <Truck className="h-5 w-5 text-slate-700" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-600">Shipping</p>
          <p className="mt-1 text-xl font-semibold text-slate-950">Spain</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <span>
            This is valid: the document is for Spain, billing is in the US, and
            shipping is to Spain.
          </span>
        </div>
        <ArrowRight className="hidden h-4 w-4 md:block" aria-hidden="true" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onConfirm}>
          {confirmed ? "Continue with Spain" : "Confirm Spain"}
        </Button>
        <Button variant="outline">I am not sure</Button>
      </div>
    </section>
  );
}
