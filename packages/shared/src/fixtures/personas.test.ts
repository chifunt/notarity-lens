import { describe, expect, it } from "vitest";
import { AppointmentPayloadSchema, PersonaFixtureSchema } from "../schemas.js";
import {
  amaraPayload,
  joshuaPayload,
  kenjiFixture,
  kenjiPayload,
  noahFixture,
  noahPayload,
  personaFixtures,
  priyaFixture,
  priyaPayload,
  sofiaFixture,
  sofiaPayload,
} from "./personas.js";

describe("persona fixtures", () => {
  it("validates every persona fixture against the shared schema", () => {
    for (const fixture of Object.values(personaFixtures)) {
      expect(() => PersonaFixtureSchema.parse(fixture)).not.toThrow();
    }
  });

  it("covers the intended original and generated persona scenario mix", () => {
    expect(Object.keys(personaFixtures).sort()).toEqual([
      "amara",
      "elizabeth",
      "joshua",
      "kenji",
      "noah",
      "priya",
      "robert",
      "sofia",
    ]);
    expect(personaFixtures.amara.inference.countryOfUse.status).toBe("inferred");
    expect(personaFixtures.noah.inference.countryOfUse.status).toBe("missing");
    expect(personaFixtures.sofia.inference.countryOfUse.status).toBe("conflict");
    expect(personaFixtures.kenji.payload.hardCopy.hardCopy).toBe(true);
    expect(
      personaFixtures.priya.inference.people.some(
        (field) => field.key === "participantAmbiguity",
      ),
    ).toBe(true);
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

  it("keeps Robert named in evidence-backed participant output", () => {
    expect(personaFixtures.robert.inference.people[0]?.value).toBe("Robert Stevens");
    expect(personaFixtures.robert.documents[0]?.textByPage[0]?.text).toContain(
      "Applicant: Robert Stevens",
    );
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

  it("keeps Noah as an insufficient country-evidence case", () => {
    const payload = AppointmentPayloadSchema.parse(noahPayload);

    expect(noahFixture.inference.countryOfUse.status).toBe("missing");
    expect(noahFixture.inference.countryOfUse.evidence[0]?.quote).toContain(
      "not stated",
    );
    expect(payload.destinationCountry).toBe("DE");
    expect(payload.billingDetails.countryCode).toBe("CA");
    expect(payload.confirmedPrice).toBe(120);
  });

  it("keeps Sofia as a conflicting country-semantics case", () => {
    const payload = AppointmentPayloadSchema.parse(sofiaPayload);

    expect(sofiaFixture.inference.countryOfUse.status).toBe("conflict");
    expect(
      sofiaFixture.inference.countryOfUse.evidence.map((item) => item.quote),
    ).toEqual([
      "Country where this notarised document will be used: Spain",
      "Via Torino 12, 20123 Milan, Italy",
    ]);
    expect(payload.destinationCountry).toBe("ES");
    expect(payload.billingDetails.countryCode).toBe("IT");
    expect(payload.confirmedPrice).toBe(120);
  });

  it("keeps Kenji on the complete NIE hard-copy route", () => {
    const payload = AppointmentPayloadSchema.parse(kenjiPayload);

    expect(kenjiFixture.documents).toHaveLength(2);
    expect(payload.destinationCountry).toBe("ES");
    expect(payload.billingDetails.countryCode).toBe("JP");
    expect(payload.shippingDetails?.countryCode).toBe("ES");
    expect(payload.confirmedPrice).toBe(580);
    expect(payload.hardCopy).toEqual({ expressShipping: false, hardCopy: true });
    expect(payload.products.map((product) => product.id)).toEqual([
      "UpEJ7raQEKQKFhWn12r2",
      "xK5IkgPX1LTYdWLFzW8X",
    ]);
    expect(payload.products[0]?.apostille).toBe(true);
    expect(payload.products.flatMap((product) => product.files)).toEqual([
      "NIE_Application_Kenji_Tanaka.pdf",
      "NIE_Personal_Details_Kenji_Tanaka.pdf",
    ]);
  });

  it("keeps Priya as a participant-ambiguity case", () => {
    const payload = AppointmentPayloadSchema.parse(priyaPayload);
    const ambiguity = priyaFixture.inference.people.find(
      (field) => field.key === "participantAmbiguity",
    );

    expect(ambiguity?.status).toBe("needs_review");
    expect(ambiguity?.evidence[0]?.quote).toContain("Possible co-signer");
    expect(payload.destinationCountry).toBe("DE");
    expect(payload.billingDetails.countryCode).toBe("GB");
    expect(payload.participants).toEqual([
      { email: "priya.nair@notarity.com", client: true, supervisor: false },
    ]);
    expect(payload.confirmedPrice).toBe(120);
  });
});
