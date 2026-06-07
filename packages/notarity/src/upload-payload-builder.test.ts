import {
  JOSHUA_NIE_APPLICATION_PRODUCT_ID,
  JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
  ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
  amaraFixture,
  kenjiFixture,
  noahFixture,
} from "@notarity-lens/shared";
import { describe, expect, it } from "vitest";
import { confirmedPriceFromLines, priceLinesForPayload } from "./price.js";
import { buildUploadedPayload } from "./upload-payload-builder.js";

describe("uploaded payload builder", () => {
  it("builds a generic signature payload from uploaded inference", () => {
    const draft = buildUploadedPayload({
      ...amaraFixture.inference,
      documents: amaraFixture.documents,
    });

    expect(draft.blockers).toEqual([]);
    expect(draft.payload?.destinationCountry).toBe("DE");
    expect(draft.payload?.products).toEqual([
      expect.objectContaining({
        id: ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
        apostille: false,
        files: [],
      }),
    ]);
    expect(draft.payload?.participants[0]?.email).toBe("amara.okafor@notarity.com");
    expect(draft.payload?.billingDetails).toMatchObject({
      firstName: "Amara",
      lastName: "Okafor",
      countryCode: "NL",
      city: "Amsterdam",
    });
    expect(draft.payload?.hardCopy.hardCopy).toBe(false);
    expect(draft.payload?.shippingDetails).toBeUndefined();
  });

  it("builds NIE payloads with companion product, files, apostille, and hard copy", () => {
    const draft = buildUploadedPayload({
      ...kenjiFixture.inference,
      documents: kenjiFixture.documents,
    });

    expect(draft.blockers).toEqual([]);
    expect(draft.payload?.destinationCountry).toBe("ES");
    expect(draft.payload?.products.map((product) => product.id)).toEqual([
      JOSHUA_NIE_APPLICATION_PRODUCT_ID,
      JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
    ]);
    expect(draft.payload?.products[0]?.files).toContain(
      "NIE_Application_Kenji_Tanaka.pdf",
    );
    expect(draft.payload?.products[0]?.apostille).toBe(true);
    expect(draft.payload?.hardCopy.hardCopy).toBe(true);

    const lines = priceLinesForPayload(draft.payload!);
    expect(confirmedPriceFromLines(lines)).toBe(580);
  });

  it("blocks payload generation when critical evidence is missing", () => {
    const draft = buildUploadedPayload({
      ...noahFixture.inference,
      documents: noahFixture.documents,
    });

    expect(draft.payload).toBeUndefined();
    expect(draft.blockers).toContain(
      "Country of use must be resolved before payload generation.",
    );
  });
});
