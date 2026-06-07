import { joshuaFixture, robertFixture } from "@notarity-lens/shared";
import { describe, expect, it } from "vitest";
import { resolveEvidenceDocuments } from "./evidenceDocuments";

describe("resolveEvidenceDocuments", () => {
  it("uses inference documents when the extractor provided them", () => {
    expect(
      resolveEvidenceDocuments(joshuaFixture.inference, joshuaFixture.documents),
    ).toEqual(joshuaFixture.inference.documents);
  });

  it("preserves preview URLs from matching fallback documents", () => {
    const inferenceDocument = {
      id: "upload-1",
      filename: "Upload.pdf",
      canonicalName: "Upload.pdf",
      mimeType: "application/pdf",
      size: 123,
      textByPage: [{ page: 1, text: "Extracted text from inference." }],
      extractionStatus: "extracted",
    };
    const fallbackDocument = {
      ...inferenceDocument,
      textByPage: [],
      previewUrl: "http://localhost:8787/api/documents/uploads/session/upload-1/pdf",
    };

    const documents = resolveEvidenceDocuments({ documents: [inferenceDocument] }, [
      fallbackDocument,
    ]);

    expect(documents[0]).toMatchObject({
      textByPage: [{ page: 1, text: "Extracted text from inference." }],
      previewUrl: fallbackDocument.previewUrl,
    });
  });

  it("falls back to fixture documents when inference documents are shallow", () => {
    const documents = resolveEvidenceDocuments(
      robertFixture.inference,
      robertFixture.documents,
    );

    expect(documents).toBe(robertFixture.documents);
    expect(documents[0]?.id).toBe(
      robertFixture.inference.countryOfUse.evidence[0]?.documentId,
    );
  });
});
