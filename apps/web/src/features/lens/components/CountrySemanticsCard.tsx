import { useState } from "react";
import { ArrowRight, CheckCircle2, HelpCircle, Home, MapPinned, SearchCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCountry } from "../display";
import { EvidenceChip } from "./EvidenceChip";
import { StatusBadge } from "./StatusBadge";
import type { AppointmentPayload, DocumentFactExtraction } from "../types";

export function CountrySemanticsCard({
  inference,
  payload,
  onConfirm,
  onShowEvidence,
}: {
  inference: DocumentFactExtraction;
  payload: AppointmentPayload;
  onConfirm: () => void;
  onShowEvidence?: () => void;
}) {
  const confirmed = inference.countryOfUse.status === "confirmed";
  const [helpOpen, setHelpOpen] = useState(false);
  const countryOfUse = formatCountry(inference.countryOfUse.value);
  const billingCountry = formatCountry(payload.billingDetails.countryCode);
  const hasHardCopy = payload.hardCopy?.hardCopy === true;
  const shippingCountry = hasHardCopy
    ? payload.shippingDetails
      ? formatCountry(payload.shippingDetails.countryCode)
      : "Shipping details needed"
    : "No hard copy shipment";
  const semanticSummary = hasHardCopy
    ? `This can be valid: the document is for ${countryOfUse}, billing is in ${billingCountry}, and shipping is to ${shippingCountry}.`
    : `This can be valid: the document is for ${countryOfUse}, billing is in ${billingCountry}, and no hard copy shipment is requested.`;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Where will this notarised document be used or accepted?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            This can be different from where you live, pay, or want the hard copy
            shipped.
          </p>
        </div>
        <StatusBadge status={inference.countryOfUse.status} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <MapPinned className="h-5 w-5 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-primary">Country of use</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{countryOfUse}</p>
        </div>
        <div className="rounded-lg border border-border bg-lens-surface-muted p-4">
          <Home className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Billing/home</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{billingCountry}</p>
        </div>
        <div className="rounded-lg border border-border bg-lens-surface-muted p-4">
          <Truck className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Shipping</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{shippingCountry}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-status-confirmed bg-status-confirmed/60 px-4 py-3 text-sm text-status-confirmed-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <span>{semanticSummary}</span>
        </div>
        <ArrowRight className="hidden h-4 w-4 md:block" aria-hidden="true" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onConfirm}>
          {confirmed ? `Continue with ${countryOfUse}` : `Confirm ${countryOfUse}`}
        </Button>
        <Button
          variant="outline"
          aria-controls="country-unsure-help"
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen((open) => !open)}
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          I am not sure
        </Button>
      </div>

      {helpOpen ? (
        <div
          id="country-unsure-help"
          className="mt-5 rounded-xl border border-border bg-lens-surface-muted p-4"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SearchCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                Why Lens suggests {countryOfUse}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Country of use means where the notarised document will be used or
                accepted. Lens suggests {countryOfUse} from the cited document
                evidence while keeping billing/home and shipping separate.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {inference.countryOfUse.evidence.map((evidence) => (
              <EvidenceChip key={evidence.id} evidence={evidence} compact />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={onConfirm}>
              Confirm {countryOfUse}
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
