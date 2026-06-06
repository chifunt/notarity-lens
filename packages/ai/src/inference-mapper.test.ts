import { describe, expect, it } from "vitest";
import { inferFactsFromText } from "./inference-mapper.js";

describe("inference mapper", () => {
  it("maps NIE plus Spanish tax authorities to ES country of use", () => {
    const inference = inferFactsFromText([
      {
        id: "doc-1",
        filename: "nie.pdf",
        text: "Foreign Identity Number (NIE) for Spanish tax authorities in Spain.",
      },
    ]);

    expect(inference.countryOfUse.value).toBe("ES");
    expect(inference.countryOfUse.evidence.map((item) => item.quote)).toContain(
      "Spanish tax authorities",
    );
  });

  it("maps New York to billing/residence, not country of use", () => {
    const inference = inferFactsFromText([
      {
        id: "doc-1",
        filename: "nie.pdf",
        text: "Joshua Timms lives in New York, United States. The document is for NIE.",
      },
    ]);

    expect(inference.countryOfUse.value).toBe("ES");
    expect(inference.billingAddress?.value).toBe("New York, United States");
    expect(inference.billingAddress?.explanation).toContain("not country of use");
  });

  it("maps Barcelona to shipping or representative evidence", () => {
    const inference = inferFactsFromText([
      {
        id: "doc-1",
        filename: "nie.pdf",
        text: "Representative address: Carrer de Mallorca 401, Barcelona, Spain.",
      },
    ]);

    expect(inference.shippingAddress?.value).toBe("Barcelona, Spain");
    expect(inference.shippingAddress?.status).toBe("needs_review");
  });

  it("marks multiple countries as needs_review rather than blind confirmation", () => {
    const inference = inferFactsFromText([
      {
        id: "doc-1",
        filename: "mixed.pdf",
        text: "NIE for Spain. Applicant lives in New York, United States. Company seat Vienna, Austria.",
      },
    ]);

    expect(inference.countryOfUse.status).toBe("needs_review");
    expect(inference.countryOfUse.requiresConfirmation).toBe(true);
    expect(inference.uncertainties.length).toBeGreaterThan(0);
  });
});
