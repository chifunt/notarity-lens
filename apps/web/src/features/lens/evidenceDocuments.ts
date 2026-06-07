import type { DocumentFactExtraction, ExtractedDocument } from "./types";

function matchesDocument(document: ExtractedDocument, fallback: ExtractedDocument) {
  return (
    document.id === fallback.id ||
    document.filename === fallback.filename ||
    document.canonicalName === fallback.canonicalName
  );
}

export function resolveEvidenceDocuments(
  inference: Pick<DocumentFactExtraction, "documents">,
  fallbackDocuments: ExtractedDocument[] = [],
) {
  if (!inference.documents.length) return fallbackDocuments;
  if (!fallbackDocuments.length) return inference.documents;

  return inference.documents.map((document) => {
    const fallback = fallbackDocuments.find((candidate) =>
      matchesDocument(document, candidate),
    );
    if (!fallback) return document;

    return {
      ...fallback,
      ...document,
      previewUrl: document.previewUrl ?? fallback.previewUrl,
    };
  });
}
