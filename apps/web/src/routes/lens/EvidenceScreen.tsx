import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InferenceFieldCard } from "@/features/lens/components/InferenceFieldCard";
import { PdfPreviewPanel } from "@/features/lens/components/PdfPreviewPanel";
import { useLensStore } from "@/features/lens/store";
import { DemoError, RequireFixture, ScreenFrame } from "./shared";

export function EvidenceScreen() {
  const navigate = useNavigate();
  const confirmEvidence = useLensStore((state) => state.confirmEvidence);
  const [activeEvidenceDocumentId, setActiveEvidenceDocumentId] = useState<string | undefined>();

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame
          railAction={
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                confirmEvidence();
                navigate("/lens/country");
              }}
            >
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
        >
          <DemoError />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)]">
            <PdfPreviewPanel
              inference={fixture.inference}
              documents={fixture.documents}
              activeDocumentId={activeEvidenceDocumentId}
              onActiveDocumentChange={setActiveEvidenceDocumentId}
            />
            <section className="grid gap-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <h1 className="text-3xl font-semibold text-foreground">We found a likely route</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This is not a black-box autofill. Every important inference has
                  evidence and must be confirmed before submit.
                </p>
              </div>
              <InferenceFieldCard
                field={fixture.inference.countryOfUse}
                onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
              />
              {fixture.inference.products.map((field) => (
                <InferenceFieldCard
                  key={field.key}
                  field={field}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ))}
              {fixture.inference.people.map((field) => (
                <InferenceFieldCard
                  key={field.key}
                  field={field}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ))}
              {fixture.inference.billingAddress ? (
                <InferenceFieldCard
                  field={fixture.inference.billingAddress}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ) : null}
              {fixture.inference.shippingAddress ? (
                <InferenceFieldCard
                  field={fixture.inference.shippingAddress}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ) : null}
              {fixture.inference.apostille ? (
                <InferenceFieldCard
                  field={fixture.inference.apostille}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ) : null}
              {fixture.inference.hardCopy ? (
                <InferenceFieldCard
                  field={fixture.inference.hardCopy}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ) : null}
            </section>
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
