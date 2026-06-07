import type { ExtractedDocument } from "@notarity-lens/shared";
import { describe, expect, it } from "vitest";
import { inferFactsFromUploadedDocuments } from "./upload-inference.js";

function documentWithText(text: string): ExtractedDocument {
  return {
    id: "upload-1",
    filename: "upload.pdf",
    canonicalName: "upload.pdf",
    mimeType: "application/pdf",
    size: text.length,
    extractionStatus: "extracted",
    textByPage: [{ page: 1, text }],
  };
}

describe("uploaded document inference", () => {
  it("uses explicit country-of-use evidence over incidental country mentions", () => {
    const inference = inferFactsFromUploadedDocuments([
      documentWithText(
        [
          "Applicant: Amara Okafor.",
          "Email: amara.okafor@notarity.com.",
          "Billing residence: Amsterdam, Netherlands.",
          "Country where this notarised document will be used: Germany.",
          "Purpose: certify Amara Okafor's signature for the German Commercial Register.",
        ].join(" "),
      ),
    ]);

    expect(inference.persona).toBe("upload");
    expect(inference.countryOfUse.value).toBe("DE");
    expect(inference.countryOfUse.status).toBe("inferred");
    expect(inference.countryOfUse.evidence[0]?.quote).toContain("Germany");
    expect(inference.products.map((field) => field.value)).toContain(
      "signature_notarisation",
    );
    expect(inference.people.map((field) => [field.key, field.value])).toEqual(
      expect.arrayContaining([
        ["participant", "Amara Okafor"],
        ["participantEmail", "amara.okafor@notarity.com"],
      ]),
    );
  });

  it("marks stated missing country as missing instead of using residence country", () => {
    const inference = inferFactsFromUploadedDocuments([
      documentWithText(
        [
          "Applicant and primary signer: Noah Chen.",
          "Residence: Toronto, Canada.",
          "Country where this notarised document will be used: not stated.",
          "Purpose: certify Noah Chen's signature.",
        ].join(" "),
      ),
    ]);

    expect(inference.countryOfUse.status).toBe("missing");
    expect(inference.countryOfUse.requiresConfirmation).toBe(true);
    expect(inference.countryOfUse.evidence[0]?.quote).toContain("not stated");
    expect(inference.uncertainties).toContain(
      "Country of use is missing from the uploaded PDFs.",
    );
  });

  it("uses NIE route evidence as a review-required Spain suggestion", () => {
    const inference = inferFactsFromUploadedDocuments([
      documentWithText(
        [
          "Power of Attorney for obtaining a Foreign Identity Number (NIE).",
          "Applicant: Kenji Tanaka.",
          "Residence: Tokyo, Japan.",
          "Email: kenji.tanaka@notarity.com.",
          "Physical original and apostille required.",
        ].join(" "),
      ),
    ]);

    expect(inference.countryOfUse.value).toBe("ES");
    expect(inference.countryOfUse.status).toBe("needs_review");
    expect(inference.products.map((field) => field.value)).toEqual(
      expect.arrayContaining(["nie_number_application", "nie_personal_data"]),
    );
    expect(inference.hardCopy?.value).toBe(true);
    expect(inference.apostille?.value).toBe(true);
  });

  it("marks multiple countries without explicit destination as a conflict", () => {
    const inference = inferFactsFromUploadedDocuments([
      documentWithText(
        [
          "Name: Sofia Rossi.",
          "Residence: Milan, Italy.",
          "Representative address: Valencia, Spain.",
          "Purpose: signature notarisation.",
        ].join(" "),
      ),
    ]);

    expect(inference.countryOfUse.status).toBe("conflict");
    expect(inference.countryOfUse.requiresConfirmation).toBe(true);
    expect(inference.uncertainties).toContain(
      "Country of use is conflicting across the uploaded PDFs.",
    );
  });
});
