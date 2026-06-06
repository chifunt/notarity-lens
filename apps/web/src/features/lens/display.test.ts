import { joshuaFixture, robertFixture } from "@notarity-lens/shared";
import { describe, expect, it } from "vitest";
import {
  formatBooleanChoice,
  formatFilesSummary,
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
});
