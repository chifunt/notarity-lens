import { describe, expect, it } from "vitest";
import { joshuaDocuments } from "@notarity-lens/shared";
import {
  assertProductFilesMatchMultipartFiles,
  canonicalizeFilename,
  productFilesMatchMultipartFiles,
} from "./file-map.js";
import { buildJoshuaPayload } from "./payload-builder.js";

describe("buildJoshuaPayload", () => {
  it("builds the expected Joshua route payload", () => {
    const payload = buildJoshuaPayload();

    expect(payload.destinationCountry).toBe("ES");
    expect(payload.products.map((product) => product.id)).toContain(
      "UpEJ7raQEKQKFhWn12r2",
    );
    expect(payload.products.map((product) => product.id)).toContain(
      "xK5IkgPX1LTYdWLFzW8X",
    );
    expect(payload.products[0]?.apostille).toBe(true);
    expect(payload.products[1]?.apostille).toBeNull();
    expect(payload.hardCopy.hardCopy).toBe(true);
    expect(payload.hardCopy.expressShipping).toBe(false);
    expect(payload.billingDetails.countryCode).toBe("US");
    expect(payload.shippingDetails?.countryCode).toBe("ES");
    expect(payload.confirmedPrice).toBe(580);
  });

  it("normalizes product files so payload names match multipart filenames", () => {
    const payload = buildJoshuaPayload({ documents: joshuaDocuments });

    expect(canonicalizeFilename("nie_personal_details-joshuatimms.pdf")).toBe(
      "nie_personal_details.pdf",
    );
    expect(payload.products[0]?.files).toEqual(["nie-application-demo-joshua_timms.pdf"]);
    expect(payload.products[1]?.files).toEqual(["nie_personal_details.pdf"]);
    expect(productFilesMatchMultipartFiles(payload, joshuaDocuments)).toBe(true);
    expect(() =>
      assertProductFilesMatchMultipartFiles(payload, joshuaDocuments),
    ).not.toThrow();
  });
});
