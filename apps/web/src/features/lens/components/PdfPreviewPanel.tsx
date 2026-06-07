import { useMemo, useState, type ReactNode } from "react";
import { FileText, Quote } from "lucide-react";
import { cn } from "@/lib/cn";
import { resolveEvidenceDocuments } from "../evidenceDocuments";
import type { DocumentFactExtraction, EvidenceRef, ExtractedDocument } from "../types";
import { EvidenceChip } from "./EvidenceChip";

type HighlightRange = {
  start: number;
  end: number;
  evidence: EvidenceRef[];
};

function collectEvidence(inference: DocumentFactExtraction) {
  return [
    inference.countryOfUse,
    ...inference.products,
    ...inference.people,
    inference.billingAddress,
    inference.shippingAddress,
    inference.apostille,
    inference.hardCopy,
  ].flatMap((field) => field?.evidence ?? []);
}

function evidenceForDocument(evidence: EvidenceRef[], document: ExtractedDocument) {
  return evidence.filter((item) => item.documentId === document.id);
}

function evidenceForPage(evidence: EvidenceRef[], page: number) {
  return evidence.filter((item) => item.page === page);
}

function buildHighlightRanges(text: string, evidence: EvidenceRef[]): HighlightRange[] {
  const lowerText = text.toLowerCase();
  const rawRanges = evidence
    .map((item) => {
      const quote = item.quote.trim().toLowerCase();
      const start = lowerText.indexOf(quote);
      if (start === -1) return null;
      return {
        start,
        end: start + quote.length,
        evidence: [item],
      };
    })
    .filter((range): range is HighlightRange => Boolean(range))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  return rawRanges.reduce<HighlightRange[]>((ranges, range) => {
    const previous = ranges.at(-1);
    if (!previous || range.start > previous.end) {
      ranges.push(range);
      return ranges;
    }

    previous.end = Math.max(previous.end, range.end);
    previous.evidence.push(...range.evidence);
    return ranges;
  }, []);
}

function HighlightedText({ text, evidence }: { text: string; evidence: EvidenceRef[] }) {
  const ranges = buildHighlightRanges(text, evidence);
  if (!ranges.length) return <>{text}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (cursor < range.start) {
      parts.push(text.slice(cursor, range.start));
    }

    const label = range.evidence.map((item) => item.quote).join(" | ");
    parts.push(
      <mark
        key={`${range.start}-${range.end}-${index}`}
        className="rounded-sm bg-accent/70 px-1 text-foreground ring-1 ring-primary/15"
        title={label}
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}

export function PdfPreviewPanel({
  inference,
  documents: fallbackDocuments = [],
  activeDocumentId,
  onActiveDocumentChange,
  pdfUrlForDocument,
}: {
  inference: DocumentFactExtraction;
  documents?: ExtractedDocument[];
  activeDocumentId?: string;
  onActiveDocumentChange?: (documentId: string) => void;
  pdfUrlForDocument?: (document: ExtractedDocument) => string | undefined;
}) {
  const allEvidence = useMemo(() => collectEvidence(inference), [inference]);
  const documents = useMemo(
    () => resolveEvidenceDocuments(inference, fallbackDocuments),
    [fallbackDocuments, inference],
  );
  const initialDocument = documents[0];
  const [internalDocumentId, setInternalDocumentId] = useState(initialDocument?.id);
  const selectedDocumentId = activeDocumentId ?? internalDocumentId ?? initialDocument?.id;
  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? initialDocument;
  const selectedEvidence = selectedDocument
    ? evidenceForDocument(allEvidence, selectedDocument)
    : [];
  const selectedPdfUrl = selectedDocument
    ? pdfUrlForDocument?.(selectedDocument) ?? selectedDocument.previewUrl
    : undefined;

  const selectDocument = (documentId: string) => {
    setInternalDocumentId(documentId);
    onActiveDocumentChange?.(documentId);
  };

  return (
    <section className="flex h-full min-h-[460px] flex-col rounded-xl border border-border bg-card shadow-[var(--shadow-card)] lg:min-h-[680px]">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-lens-surface-muted/60 px-2 py-2">
        {documents.map((document) => {
          const documentEvidence = evidenceForDocument(allEvidence, document);
          const active = document.id === selectedDocument?.id;

          return (
            <button
              key={document.id}
              type="button"
              onClick={() => selectDocument(document.id)}
              className={cn(
                "flex min-w-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-primary/75" aria-hidden="true" />
              <span className="max-w-[13rem] truncate">{document.filename}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  active
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
                aria-label={`${documentEvidence.length} cited quotes`}
              >
                {documentEvidence.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden rounded-b-xl bg-lens-surface-muted">
        {selectedDocument ? (
          <div className="grid content-start gap-4 overflow-auto p-4">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Document evidence
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Highlighted text is cited by one or more inferred fields.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-status-inferred px-2 py-1 text-xs font-medium text-status-inferred-foreground">
                  <Quote className="h-3.5 w-3.5" aria-hidden="true" />
                  {selectedEvidence.length} cited quotes
                </span>
              </div>
              <p className="mt-3 truncate text-sm font-medium text-foreground">
                {selectedDocument.canonicalName}
              </p>
            </div>

            {selectedPdfUrl ? (
              <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <iframe
                  key={selectedDocument.id}
                  title={`${selectedDocument.filename} PDF preview`}
                  src={`${selectedPdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                  className="h-[62vh] min-h-[540px] w-full bg-white"
                />
              </section>
            ) : (
              <section className="rounded-lg border border-border bg-card p-4 text-sm leading-6 text-muted-foreground shadow-sm">
                The original PDF binary is not available in this browser session,
                so Lens is showing extracted text with AI highlights.
              </section>
            )}

            <div className="grid gap-3">
              {selectedDocument.textByPage.map((page) => {
                const pageEvidence = evidenceForPage(selectedEvidence, page.page);

                return (
                  <article
                    key={page.page}
                    className="rounded-lg border border-border bg-card p-4 text-sm leading-7 text-foreground shadow-sm"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Page {page.page}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {pageEvidence.length} citations
                      </span>
                    </div>
                    <p>
                      <HighlightedText text={page.text} evidence={pageEvidence} />
                    </p>
                    {pageEvidence.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {pageEvidence.map((evidence) => (
                          <EvidenceChip key={evidence.id} evidence={evidence} compact />
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <section className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-medium text-foreground">All cited evidence in this document</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedEvidence.map((evidence) => (
                  <EvidenceChip key={evidence.id} evidence={evidence} compact />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="grid h-full min-h-[18rem] place-items-center p-6 text-center">
            <div>
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-foreground">
                No extracted document text is available
              </p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                The inferred fields can still be reviewed, but inline quote
                highlighting needs extracted document pages.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
