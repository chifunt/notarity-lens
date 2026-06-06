import { FileCheck2, Link2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PersonaFixture } from "../types";
import { StatusBadge } from "./StatusBadge";

export function ProductRouteCard({
  fixture,
  onConfirm,
}: {
  fixture: PersonaFixture;
  onConfirm: () => void;
}) {
  const productFields = fixture.inference.products;
  const routeConfirmed = productFields.every((field) => field.status === "confirmed");

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Recommended booking route</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Because NIE number application was selected, Notarity also needs the
            NIE Personal Data form.
          </p>
        </div>
        <StatusBadge status={routeConfirmed ? "confirmed" : "needs_review"} />
      </div>

      <div className="mt-5 grid gap-4">
        {fixture.payload.products.map((product, index) => (
          <article key={product.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    {product.id === "UpEJ7raQEKQKFhWn12r2"
                      ? "NIE number application"
                      : "NIE Personal Data"}
                  </p>
                  <div className="mt-2 grid gap-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                      File attached: {product.files.join(", ")}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-violet-700" aria-hidden="true" />
                      Apostille: {product.apostille ? "required" : "not needed"}
                    </span>
                  </div>
                </div>
              </div>
              {index === 1 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Required companion document
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onConfirm}>
          {routeConfirmed ? "Continue with route" : "Confirm product route"}
        </Button>
        <Button variant="outline">Change</Button>
      </div>
    </section>
  );
}
