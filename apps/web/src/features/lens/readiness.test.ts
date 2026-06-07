import {
  amaraFixture,
  elizabethFixture,
  joshuaFixture,
  noahFixture,
  robertFixture,
} from "@notarity-lens/shared";
import { describe, expect, it } from "vitest";
import {
  readyForSubmit,
  requiredConfirmationFields,
  unresolvedConfirmationFields,
} from "./readiness";
import type { DocumentFactExtraction } from "./types";

const joshuaInference = joshuaFixture.inference as unknown as DocumentFactExtraction;
const elizabethInference =
  elizabethFixture.inference as unknown as DocumentFactExtraction;
const robertInference = robertFixture.inference as unknown as DocumentFactExtraction;
const amaraInference = amaraFixture.inference as unknown as DocumentFactExtraction;
const noahInference = noahFixture.inference as unknown as DocumentFactExtraction;

describe("review readiness", () => {
  it("finds Joshua fields that must be confirmed before submit", () => {
    expect(
      requiredConfirmationFields(joshuaInference).map((field) => field.label),
    ).toEqual([
      "Country of use",
      "Recommended product",
      "Required companion document",
      "Shipping address",
      "Apostille",
      "Hard copy",
    ]);
  });

  it("treats confirmed Joshua route fields as resolved", () => {
    const confirmed: DocumentFactExtraction = {
      ...joshuaInference,
      countryOfUse: { ...joshuaInference.countryOfUse, status: "confirmed" },
      products: joshuaInference.products.map((field) => ({
        ...field,
        status: "confirmed",
      })),
      shippingAddress: {
        ...joshuaInference.shippingAddress!,
        status: "confirmed",
      },
      apostille: { ...joshuaInference.apostille!, status: "confirmed" },
      hardCopy: { ...joshuaInference.hardCopy!, status: "confirmed" },
    };

    expect(unresolvedConfirmationFields(confirmed)).toEqual([]);
    expect(readyForSubmit(confirmed, true)).toBe(true);
    expect(readyForSubmit(confirmed, false)).toBe(false);
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

  it("shows Robert country inference as unresolved before explicit confirmation", () => {
    expect(
      unresolvedConfirmationFields(robertInference).map((field) => field.label),
    ).toEqual(["Country of use"]);
    expect(readyForSubmit(robertInference, true)).toBe(false);
  });

  it("treats Amara as complete after country and route confirmation", () => {
    const confirmed: DocumentFactExtraction = {
      ...amaraInference,
      countryOfUse: { ...amaraInference.countryOfUse, status: "confirmed" },
      products: amaraInference.products.map((field) => ({
        ...field,
        status: "confirmed",
      })),
    };

    expect(
      unresolvedConfirmationFields(amaraInference).map((field) => field.label),
    ).toEqual(["Country of use", "Recommended product"]);
    expect(unresolvedConfirmationFields(confirmed)).toEqual([]);
    expect(readyForSubmit(confirmed, true)).toBe(true);
  });

  it("keeps Noah blocked while missing country evidence is unresolved", () => {
    expect(noahInference.countryOfUse.status).toBe("missing");
    expect(
      unresolvedConfirmationFields(noahInference).map((field) => field.label),
    ).toEqual(["Country of use", "Recommended product"]);

    const confirmed: DocumentFactExtraction = {
      ...noahInference,
      countryOfUse: { ...noahInference.countryOfUse, status: "confirmed" },
      products: noahInference.products.map((field) => ({
        ...field,
        status: "confirmed",
      })),
    };

    expect(unresolvedConfirmationFields(confirmed)).toEqual([]);
    expect(readyForSubmit(confirmed, true)).toBe(true);
  });
});
