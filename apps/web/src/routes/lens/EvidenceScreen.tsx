import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableInferenceFieldCard } from "@/features/lens/components/EditableInferenceFieldCard";
import { PdfPreviewPanel } from "@/features/lens/components/PdfPreviewPanel";
import { getFixturePdfUrl } from "@/features/lens/api";
import { useLensStore } from "@/features/lens/store";
import { DemoError, RequireFixture, ScreenFrame } from "./shared";
import { editableEvidenceGroups } from "./inferenceFieldSpecs";

export function EvidenceScreen() {
  const navigate = useNavigate();
  const confirmEvidence = useLensStore((state) => state.confirmEvidence);
  const confirmInferenceField = useLensStore((state) => state.confirmInferenceField);
  const markInferenceFieldUnsure = useLensStore((state) => state.markInferenceFieldUnsure);
  const saveInferenceField = useLensStore((state) => state.saveInferenceField);
  const [activeEvidenceDocumentId, setActiveEvidenceDocumentId] = useState<string | undefined>();
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | undefined>();

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame sidebar={false}>
          <DemoError />
          <div className="grid gap-6 xl:grid-cols-[minmax(24rem,0.95fr)_minmax(24rem,1fr)]">
            <div className="xl:sticky xl:top-6 xl:self-start">
              <PdfPreviewPanel
                inference={fixture.inference}
                documents={fixture.documents}
                activeDocumentId={activeEvidenceDocumentId}
                activeEvidenceId={activeEvidenceId}
                onActiveDocumentChange={setActiveEvidenceDocumentId}
                pdfUrlForDocument={(document) =>
                  fixture.id === "upload"
                    ? document.previewUrl
                    : getFixturePdfUrl(fixture.id, document.id)
                }
              />
            </div>
            <section className="grid content-start gap-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <h1 className="text-3xl font-semibold text-foreground">
                  Confirm the extracted details
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Review every field Lens found, edit anything that is wrong,
                  and add required details that were not present in the PDFs.
                </p>
              </div>
              {editableEvidenceGroups(fixture.inference).map((group) => (
                <section key={group.title} className="grid gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </h2>
                  {group.fields.map(({ field, spec }) => (
                    <EditableInferenceFieldCard
                      key={field.key}
                      field={field}
                      valueType={spec.valueType}
                      addLabel={spec.addLabel}
                      onConfirm={() => confirmInferenceField(field.key)}
                      onUnsure={() => markInferenceFieldUnsure(field.key)}
                      onSave={(value) => saveInferenceField({ key: field.key, value })}
                      onEvidenceSelect={(evidence) => {
                        setActiveEvidenceDocumentId(evidence.documentId);
                        setActiveEvidenceId(evidence.id);
                      }}
                    />
                  ))}
                </section>
              ))}
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    confirmEvidence();
                    navigate("/lens/country");
                  }}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </section>
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
