import type { DocumentFactExtraction, ExtractedDocument } from "./types";

export function resolveEvidenceDocuments(
  inference: Pick<DocumentFactExtraction, "documents">,
  fallbackDocuments: ExtractedDocument[] = [],
) {
  return inference.documents.length ? inference.documents : fallbackDocuments;
}
