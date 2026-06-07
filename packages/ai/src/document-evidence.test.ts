import type { ExtractedDocument } from "@notarity-lens/shared";
import { describe, expect, it } from "vitest";
import { collectEvidenceFindings, evidenceForKind } from "./document-evidence.js";

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

describe("document evidence", () => {
  it("collects country, product, participant, and email evidence", () => {
    const findings = collectEvidenceFindings([
      documentWithText(
        [
          "Applicant: Amara Okafor.",
          "Email: amara.okafor@notarity.com.",
          "Country where this notarised document will be used: Germany.",
          "Purpose: certify Amara Okafor's signature for the German Commercial Register.",
        ].join(" "),
      ),
    ]);

    expect(findings.map((finding) => [finding.kind, finding.value])).toEqual(
      expect.arrayContaining([
        ["country", "DE"],
        ["product_route", "signature_notarisation"],
        ["participant", "Amara Okafor"],
        ["email", "amara.okafor@notarity.com"],
      ]),
    );
    expect(evidenceForKind(findings, "country")[0]?.quote).toContain("Germany");
  });

  it("marks missing country and possible co-signer evidence", () => {
    const findings = collectEvidenceFindings([
      documentWithText(
        [
          "Applicant and primary signer: Priya Nair.",
          "Country where this notarised document will be used: not stated.",
          "Possible co-signer: Arjun Mehta may also need to sign.",
        ].join(" "),
      ),
    ]);

    expect(findings.map((finding) => [finding.kind, finding.value])).toEqual(
      expect.arrayContaining([
        ["missing_country", "country_of_use_not_stated"],
        ["participant_ambiguity", "possible_additional_signer"],
      ]),
    );
  });

  it("keeps page-level citations from multi-page documents", () => {
    const findings = collectEvidenceFindings([
      {
        ...documentWithText(""),
        textByPage: [
          { page: 1, text: "Residence: Tokyo, Japan." },
          { page: 2, text: "Address for hard copy: Valencia, Spain. Apostille required." },
        ],
      },
    ]);

    expect(evidenceForKind(findings, "hard_copy")[0]).toMatchObject({
      page: 2,
      quote: "hard copy",
    });
    expect(evidenceForKind(findings, "apostille")[0]).toMatchObject({
      page: 2,
      quote: "Apostille",
    });
  });
});
