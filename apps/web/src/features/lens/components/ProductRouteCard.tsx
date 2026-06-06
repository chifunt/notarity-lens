import { useState } from "react";
import { FileCheck2, HelpCircle, Info, Link2, PackageCheck, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatProductName } from "../display";
import type { PersonaFixture } from "../types";
import { EvidenceChip } from "./EvidenceChip";
import { StatusBadge } from "./StatusBadge";

export function ProductRouteCard({
  fixture,
  onConfirm,
  onShowEvidence,
}: {
  fixture: PersonaFixture;
  onConfirm: () => void;
  onShowEvidence?: () => void;
}) {
  const productFields = fixture.inference.products;
  const routeConfirmed = productFields.every((field) => field.status === "confirmed");
  const [helpOpen, setHelpOpen] = useState(false);
  const productEvidence = productFields.flatMap((field) => field.evidence);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Your booking route</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Lens shows each Notarity product, attached file, and route-required
            companion document before pricing.
          </p>
        </div>
        <StatusBadge status={routeConfirmed ? "confirmed" : "needs_review"} />
      </div>

      <div className="mt-5 grid gap-4">
        {fixture.payload.products.map((product, index) => (
          <article key={product.id} className="rounded-lg border border-border bg-lens-surface-muted p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {formatProductName(product.id)}
                  </p>
                  <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-status-confirmed-foreground" aria-hidden="true" />
                      File attached: {product.files.join(", ")}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                      Apostille: {product.apostille ? "required" : "not needed"}
                    </span>
                  </div>
                </div>
              </div>
              {index === 1 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-status-inferred px-2 py-1 text-xs font-medium text-status-inferred-foreground">
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Required companion document
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-accent/30 px-4 py-3 text-sm text-foreground/80">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          The second document is easy to miss in a normal booking form. Lens
          adds it because this Notarity route requires it.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onConfirm}>
          {routeConfirmed ? "Continue with route" : "Confirm product route"}
        </Button>
        <Button
          variant="outline"
          aria-controls="route-unsure-help"
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen((open) => !open)}
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          I am not sure
        </Button>
      </div>

      {helpOpen ? (
        <div
          id="route-unsure-help"
          className="mt-5 rounded-xl border border-border bg-lens-surface-muted p-4"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SearchCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                Why this route is selected
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Document evidence maps to deterministic Notarity products. When
                the route requires a companion product, Lens shows it before the
                payload is submitted.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {fixture.payload.products.map((product) => (
              <div key={product.id} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Product ID</p>
                <p className="mt-1 break-all font-mono text-xs text-foreground">{product.id}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Files: {product.files.join(", ")}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {productEvidence.map((evidence) => (
              <EvidenceChip key={evidence.id} evidence={evidence} compact />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={onConfirm}>
              Confirm route
            </Button>
            {onShowEvidence ? (
              <Button size="sm" variant="outline" onClick={onShowEvidence}>
                Show cited evidence
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
