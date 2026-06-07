import { elizabethFixture, joshuaFixture } from "@notarity-lens/shared";
import { describe, expect, it } from "vitest";
import {
  requiredConfirmationFields,
  unresolvedConfirmationFields,
} from "./readiness";
import type { DocumentFactExtraction } from "./types";

const joshuaInference =
  joshuaFixture.inference as unknown as DocumentFactExtraction;
const elizabethInference =
  elizabethFixture.inference as unknown as DocumentFactExtraction;

describe("review readiness", () => {
  it("finds Joshua fields that must be confirmed before submit", () => {
    expect(
      requiredConfirmationFields(joshuaInference).map((field) => field.label),
    ).toEqual(["Country of use", "Shipping address", "Apostille", "Hard copy"]);
  });

  it("treats confirmed Joshua route fields as resolved", () => {
    const confirmed: DocumentFactExtraction = {
      ...joshuaInference,
      countryOfUse: { ...joshuaInference.countryOfUse, status: "confirmed" },
      shippingAddress: {
        ...joshuaInference.shippingAddress!,
        status: "confirmed",
      },
      apostille: { ...joshuaInference.apostille!, status: "confirmed" },
      hardCopy: { ...joshuaInference.hardCopy!, status: "confirmed" },
    };

    expect(unresolvedConfirmationFields(confirmed)).toEqual([]);
  });

  it("keeps Elizabeth participant ambiguity unresolved after country confirmation", () => {
    const countryConfirmed: DocumentFactExtraction = {
      ...elizabethInference,
      countryOfUse: { ...elizabethInference.countryOfUse, status: "confirmed" },
    };

    expect(
      unresolvedConfirmationFields(countryConfirmed).map((field) => field.label),
    ).toEqual(["Participant ambiguity"]);
  });
});
