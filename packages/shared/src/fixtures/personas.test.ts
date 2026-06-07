import { describe, expect, it } from "vitest";
import { AppointmentPayloadSchema, PersonaFixtureSchema } from "../schemas.js";
import { amaraPayload, joshuaPayload, personaFixtures } from "./personas.js";

describe("persona fixtures", () => {
  it("validates every persona fixture against the shared schema", () => {
    for (const fixture of Object.values(personaFixtures)) {
      expect(() => PersonaFixtureSchema.parse(fixture)).not.toThrow();
    }
  });

  it("keeps the Joshua payload at the expected critical route", () => {
    const payload = AppointmentPayloadSchema.parse(joshuaPayload);

    expect(payload.destinationCountry).toBe("ES");
    expect(payload.confirmedPrice).toBe(580);
    expect(payload.products.map((product) => product.id)).toEqual([
      "UpEJ7raQEKQKFhWn12r2",
      "xK5IkgPX1LTYdWLFzW8X",
    ]);
    expect(payload.products[1]?.files).toEqual(["nie_personal_details.pdf"]);
  });

  it("keeps Amara on the complete generic signature route", () => {
    const payload = AppointmentPayloadSchema.parse(amaraPayload);

    expect(payload.destinationCountry).toBe("DE");
    expect(payload.confirmedPrice).toBe(120);
    expect(payload.billingDetails.countryCode).toBe("NL");
    expect(payload.hardCopy).toEqual({ expressShipping: false, hardCopy: false });
    expect(payload.products.map((product) => product.id)).toEqual([
      "ujwBkZleJLPEzByCnPCS",
    ]);
  });
});
