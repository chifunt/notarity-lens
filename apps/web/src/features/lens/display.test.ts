import { joshuaFixture, robertFixture } from "@notarity-lens/shared";
import { describe, expect, it } from "vitest";
import {
  formatBooleanChoice,
  formatCountry,
  formatFilesSummary,
  formatFieldValue,
  formatParticipantsSummary,
  formatProductFiles,
  formatShippingSummary,
} from "./display";

describe("Lens display helpers", () => {
  it("summarizes missing product files without empty strings", () => {
    expect(formatProductFiles(robertFixture.payload.products[0]?.files ?? [])).toBe(
      "No files attached yet",
    );
    expect(formatFilesSummary(robertFixture.payload)).toBe("No files attached yet");
  });

  it("summarizes hard-copy shipping from the payload", () => {
    expect(formatShippingSummary(joshuaFixture.payload)).toContain("Hard copy to");
    expect(formatShippingSummary(robertFixture.payload)).toBe("No hard copy shipment");
  });

  it("labels nullable boolean choices as not applicable", () => {
    expect(formatBooleanChoice(null)).toBe("Not applicable");
  });

  it("formats Amara country and product labels", () => {
    expect(formatCountry("CA")).toBe("Canada");
    expect(formatCountry("DE")).toBe("Germany");
    expect(formatCountry("IT")).toBe("Italy");
    expect(formatCountry("NL")).toBe("Netherlands");
    expect(
      formatFieldValue({
        key: "recommendedProduct",
        label: "Recommended product",
        value: "signature_notarisation",
        status: "inferred",
        evidence: [],
        requiresConfirmation: false,
      }),
    ).toBe("Signature notarisation");
  });

  it("summarizes all participant emails", () => {
    expect(
      formatParticipantsSummary({
        ...robertFixture.payload,
        participants: [
          { email: "first@example.com", client: true, supervisor: false },
          { email: "second@example.com", client: false, supervisor: true },
        ],
      }),
    ).toBe("first@example.com, second@example.com");
  });
});
