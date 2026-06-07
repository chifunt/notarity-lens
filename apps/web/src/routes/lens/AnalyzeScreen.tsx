import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/features/lens/components/EmptyState";
import { ReadingProgress, type ProgressItem } from "@/features/lens/components/ReadingProgress";
import { useLensStore, type AnalysisStage } from "@/features/lens/store";
import type { ExtractedDocument, PersonaFixture } from "@/features/lens/types";
import {
  DemoError,
  DemoSampleRequests,
  ScreenFrame,
  formatDocumentSize,
  useEnsureFixture,
} from "./shared";

type AnalyzeProgressStep = Omit<ProgressItem, "status"> & {
  stage: Extract<AnalysisStage, "uploading" | "inferring" | "drafting" | "pricing">;
};

const analyzeSteps: AnalyzeProgressStep[] = [
  {
    stage: "uploading",
    label: "Upload and extract text",
    detail: "Receive PDFs, normalize filenames, and read page-level text.",
  },
  {
    stage: "inferring",
    label: "Run AI inference",
    detail: "Send extracted text to DeepSeek and validate the returned evidence.",
  },
  {
    stage: "drafting",
    label: "Prepare route draft",
    detail: "Map inferred fields to Notarity product and payload rules.",
  },
  {
    stage: "pricing",
    label: "Request price estimate",
    detail: "Ask the pricing endpoint for the draft route total.",
  },
];

function progressItemsForStage({
  stage,
  loading,
  error,
}: {
  stage: AnalysisStage;
  loading: boolean;
  error: string | null;
}): ProgressItem[] {
  const currentIndex = analyzeSteps.findIndex((item) => item.stage === stage);

  return analyzeSteps.map((item, index) => {
    let status: ProgressItem["status"] = "pending";

    if (stage === "ready") {
      status = "done";
    } else if (currentIndex >= 0) {
      if (index < currentIndex) {
        status = "done";
      } else if (index === currentIndex) {
        status = !loading && error ? "failed" : "active";
      }
    }

    return {
      label: item.label,
      detail: item.detail,
      status,
    };
  });
}

function AnalyzeDocumentRail({
  documents,
  canContinue,
  onContinue,
}: {
  documents: ExtractedDocument[];
  canContinue: boolean;
  onContinue: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Uploaded documents
        </h2>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            canContinue
              ? "bg-status-confirmed text-status-confirmed-foreground"
              : "bg-status-inferred text-status-inferred-foreground"
          }`}
        >
          {canContinue ? "Ready" : "Reading"}
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        {documents.length ? (
          documents.map((document, index) => (
            <div
              key={document.id}
              className={`flex items-start gap-3 bg-card px-4 py-3 ${
                index === documents.length - 1 ? "" : "border-b border-border"
              }`}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {document.canonicalName || document.filename}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {document.mimeType || "application/pdf"} - {formatDocumentSize(document.size)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-card px-4 py-3 text-sm text-muted-foreground">
            No documents loaded yet.
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <Button
          type="button"
          className="w-full"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Continue
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}

export function AnalyzeScreen() {
  const navigate = useNavigate();
  const { fixture, loadJoshuaDemo, loading } = useEnsureFixture();
  const loadPersona = useLensStore((state) => state.loadPersona);
  const uploadedDocuments = useLensStore((state) => state.uploadedDocuments);
  const analysisStage = useLensStore((state) => state.analysisStage);
  const error = useLensStore((state) => state.error);

  const loadSampleInPlace = async (persona: PersonaFixture["id"]) => {
    await loadPersona(persona);
  };

  const progressItems = useMemo(
    () => progressItemsForStage({ stage: analysisStage, loading, error }),
    [analysisStage, error, loading],
  );
  const analyzeDocuments = fixture?.documents ?? uploadedDocuments;
  const hasAnalysisRun =
    analyzeDocuments.length > 0 ||
    analysisStage === "uploading" ||
    analysisStage === "inferring" ||
    analysisStage === "drafting" ||
    analysisStage === "pricing" ||
    analysisStage === "ready";
  const canContinue = Boolean(fixture) && analysisStage === "ready";

  return (
    <ScreenFrame
      rightRail={
        <AnalyzeDocumentRail
          documents={analyzeDocuments}
          canContinue={canContinue}
          onContinue={() => navigate("/lens/evidence")}
        />
      }
    >
      <DemoError />
      <div className="grid gap-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h1 className="text-3xl font-semibold text-foreground">Reading your documents</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Lens prepares a draft route from document evidence, deterministic
            product rules, and the Notarity pricing contract.
          </p>
        </div>
        {hasAnalysisRun ? (
          <ReadingProgress items={progressItems} />
        ) : (
          <div className="grid gap-4">
            <EmptyState onLoad={loadJoshuaDemo} loading={loading} />
            <DemoSampleRequests
              loading={loading}
              onSelect={(persona) => {
                void loadSampleInPlace(persona);
              }}
            />
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
