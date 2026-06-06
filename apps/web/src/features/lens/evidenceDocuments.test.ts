import { joshuaFixture, robertFixture } from "@notarity-lens/shared";
import { describe, expect, it } from "vitest";
import { resolveEvidenceDocuments } from "./evidenceDocuments";

describe("resolveEvidenceDocuments", () => {
  it("uses inference documents when the extractor provided them", () => {
    expect(resolveEvidenceDocuments(joshuaFixture.inference, joshuaFixture.documents)).toBe(
      joshuaFixture.inference.documents,
    );
  });

  it("falls back to fixture documents when inference documents are shallow", () => {
    const documents = resolveEvidenceDocuments(
      robertFixture.inference,
      robertFixture.documents,
    );

    expect(documents).toBe(robertFixture.documents);
    expect(documents[0]?.id).toBe(robertFixture.inference.countryOfUse.evidence[0]?.documentId);
  });
});
