import type { AppointmentPayload, ExtractedDocument } from "@notarity-lens/shared";

const KNOWN_FILENAME_MAP: Record<string, string> = {
  "nie_personal_details-joshuatimms.pdf": "nie_personal_details.pdf",
};

function normalizeKey(filename: string) {
  return filename.trim().toLowerCase();
}

export function canonicalizeFilename(filename: string) {
  const trimmed = filename.trim();
  return KNOWN_FILENAME_MAP[normalizeKey(trimmed)] ?? trimmed;
}

export function normalizeDocumentFilenames(documents: ExtractedDocument[]) {
  return documents.map((document) => ({
    ...document,
    canonicalName: canonicalizeFilename(document.canonicalName || document.filename),
  }));
}

export function payloadProductFilenames(payload: AppointmentPayload) {
  return payload.products.flatMap((product) => product.files);
}

export function multipartFilenamesForDocuments(documents: ExtractedDocument[]) {
  return normalizeDocumentFilenames(documents).map((document) => document.canonicalName);
}

export function productFilesMatchMultipartFiles(
  payload: AppointmentPayload,
  documents: ExtractedDocument[],
) {
  const multipartNames = new Set(multipartFilenamesForDocuments(documents));
  return payloadProductFilenames(payload).every((filename) => multipartNames.has(filename));
}

export function assertProductFilesMatchMultipartFiles(
  payload: AppointmentPayload,
  documents: ExtractedDocument[],
) {
  if (!productFilesMatchMultipartFiles(payload, documents)) {
    const payloadFiles = payloadProductFilenames(payload);
    const multipartFiles = multipartFilenamesForDocuments(documents);
    throw new Error(
      `Payload product files must match multipart filenames. Payload: ${payloadFiles.join(
        ", ",
      )}. Multipart: ${multipartFiles.join(", ")}.`,
    );
  }
}
