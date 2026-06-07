import {
  mockBookingForm,
  personaFixtures,
  productFixtures,
  ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
  type AppointmentPayload,
  type PersonaId,
  type PriceLine,
  type ProductFixture,
} from "@notarity-lens/shared";
import { confirmedPriceFromLines } from "@notarity-lens/notarity";
import type { ApiConfig } from "../utils/env.js";

export type TimeslotFixture = {
  id: string;
  startTime: string;
  endTime: string;
  available: number;
  taken: number;
  _timeslotLabel: string;
  deleted: boolean;
};

export type NormalizedPriceResponse = {
  lines: PriceLine[];
  confirmedPrice: number;
  source: "mock" | "live";
};

export type SubmissionResult = {
  ok: boolean;
  id: string;
  mode: "mock" | "live";
  payload: AppointmentPayload;
};

export interface NotarityClient {
  getBookingForm(): Promise<typeof mockBookingForm | unknown>;
  getProducts(tags?: string[]): Promise<ProductFixture[] | unknown>;
  getTimeslots(country?: string): Promise<TimeslotFixture[] | unknown>;
  price(payload: AppointmentPayload): Promise<NormalizedPriceResponse>;
  submit(payload: AppointmentPayload): Promise<SubmissionResult>;
}

function personaForPayload(payload: AppointmentPayload): PersonaId {
  const matchingFixture = Object.values(personaFixtures).find((fixture) => {
    const fixtureProducts = fixture.payload.products.map((product) => product.id);
    const payloadProducts = payload.products.map((product) => product.id);
    const sameProducts =
      fixtureProducts.length === payloadProducts.length &&
      fixtureProducts.every((id, index) => id === payloadProducts[index]);
    const samePrimaryParticipant =
      fixture.payload.participants[0]?.email === payload.participants[0]?.email;

    return (
      fixture.payload.destinationCountry === payload.destinationCountry &&
      sameProducts &&
      samePrimaryParticipant
    );
  });

  if (matchingFixture) return matchingFixture.id;
  if (payload.destinationCountry === "LT") return "robert";
  if (payload.destinationCountry === "AT") return "elizabeth";
  if (
    payload.products.some((product) => product.id === ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID)
  ) {
    return "robert";
  }
  return "joshua";
}

export class MockNotarityClient implements NotarityClient {
  async getBookingForm() {
    return mockBookingForm;
  }

  async getProducts(tags?: string[]) {
    if (!tags || tags.length === 0) return productFixtures;
    return productFixtures.filter((product) => product.tag && tags.includes(product.tag));
  }

  async getTimeslots(country = "ES"): Promise<TimeslotFixture[]> {
    if (country === "AT") {
      return [
        {
          id: "Y02Z3MWC8Jjqqvn0jbgX",
          startTime: "2026-06-08T08:00:00.000Z",
          endTime: "2026-06-08T08:10:00.000Z",
          available: 1,
          taken: 0,
          _timeslotLabel: mockBookingForm.timeslotLabels.AT,
          deleted: false,
        },
      ];
    }

    return [
      {
        id: "xitTkTMC18R0ZfCNtqyW",
        startTime: "2026-06-08T06:00:00.000Z",
        endTime: "2026-06-08T06:10:00.000Z",
        available: 2,
        taken: 0,
        _timeslotLabel: mockBookingForm.timeslotLabels.default,
        deleted: false,
      },
    ];
  }

  async price(payload: AppointmentPayload): Promise<NormalizedPriceResponse> {
    const fixture = personaFixtures[personaForPayload(payload)];
    return {
      lines: fixture.priceLines,
      confirmedPrice: confirmedPriceFromLines(fixture.priceLines),
      source: "mock",
    };
  }

  async submit(payload: AppointmentPayload): Promise<SubmissionResult> {
    return {
      ok: true,
      id: `mock_appt_${Date.now()}`,
      mode: "mock",
      payload,
    };
  }
}

export class RealNotarityClient implements NotarityClient {
  constructor(private readonly config: ApiConfig) {}

  private headers(contentType?: string): HeadersInit {
    const headers: HeadersInit = {
      accept: "application/json, text/plain, */*",
      "cache-control": "no-cache",
      origin: "https://staging.notarity.com",
      referer: "https://staging.notarity.com/",
    };

    if (contentType) {
      headers["content-type"] = contentType;
    }

    if (this.config.bearerToken) {
      headers.authorization = `Bearer ${this.config.bearerToken}`;
    } else if (this.config.basicAuthUsername && this.config.basicAuthPassword) {
      const token = Buffer.from(
        `${this.config.basicAuthUsername}:${this.config.basicAuthPassword}`,
      ).toString("base64");
      headers.authorization = `Basic ${token}`;
    }

    return headers;
  }

  async getBookingForm() {
    const url = new URL("/booking-form/slug", this.config.notarityApiBaseUrl);
    url.searchParams.set("slug", this.config.bookingFormSlug);
    const response = await fetch(url, { headers: this.headers() });
    if (!response.ok) throw new Error(`Booking form request failed: ${response.status}`);
    return response.json();
  }

  async getProducts(tags: string[] = []) {
    const url = new URL("/products/tags", this.config.notarityApiBaseUrl);
    for (const tag of tags) {
      url.searchParams.append("_tags", tag);
    }
    const response = await fetch(url, { headers: this.headers() });
    if (!response.ok) throw new Error(`Products request failed: ${response.status}`);
    return response.json();
  }

  async getTimeslots(country = "ES") {
    const url = new URL("/appointment-requests/timeslots", this.config.notarityApiBaseUrl);
    const label =
      country === "AT" ? mockBookingForm.timeslotLabels.AT : mockBookingForm.timeslotLabels.default;
    url.searchParams.set("_timeslotLabel", label);
    url.searchParams.set("startDate", "2026-06-08T00:00:00.000Z");
    url.searchParams.set("endDate", "2026-06-12T00:00:00.000Z");
    const response = await fetch(url, { headers: this.headers() });
    if (!response.ok) throw new Error(`Timeslots request failed: ${response.status}`);
    return response.json();
  }

  async price(payload: AppointmentPayload): Promise<NormalizedPriceResponse> {
    const response = await fetch(
      new URL("/appointment-requests/price", this.config.notarityApiBaseUrl),
      {
        method: "POST",
        headers: this.headers("application/json"),
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) throw new Error(`Price request failed: ${response.status}`);
    const lines = (await response.json()) as PriceLine[];
    return {
      lines,
      confirmedPrice: confirmedPriceFromLines(lines),
      source: "live",
    };
  }

  async submit(payload: AppointmentPayload): Promise<SubmissionResult> {
    void payload;

    if (!this.config.allowLiveSubmit) {
      throw new Error("Live submit is disabled. Set ALLOW_LIVE_SUBMIT=true to enable it.");
    }

    throw new Error("Live multipart submit is not implemented in this safe skeleton yet.");
  }
}

export function createNotarityClient(config: ApiConfig): NotarityClient {
  if (config.mockNotarity) return new MockNotarityClient();
  return new RealNotarityClient(config);
}
