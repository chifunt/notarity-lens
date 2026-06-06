import { joshuaFixture } from "@notarity-lens/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLensStore } from "./store";

function jsonResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => data,
  } as Response);
}

function resetStore() {
  useLensStore.setState({
    fixture: null,
    price: null,
    submitResult: null,
    loading: false,
    error: null,
  });
}

describe("Lens store sample flow", () => {
  beforeEach(() => {
    resetStore();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string | URL | Request, init?: RequestInit) => {
        const href = String(url);

        if (href.endsWith("/api/fixtures/joshua")) {
          return jsonResponse(joshuaFixture);
        }

        if (href.endsWith("/api/price")) {
          return jsonResponse({
            confirmedPrice: 580,
            lines: joshuaFixture.priceLines,
            source: "mock",
          });
        }

        if (href.endsWith("/api/submit")) {
          const body = init?.body ? JSON.parse(String(init.body)) : {};
          return jsonResponse({
            id: "mock_appt_test",
            mode: "mock",
            ok: true,
            payload: body.payload,
          });
        }

        return jsonResponse({ ok: true });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetStore();
  });

  it("loads Joshua, prices the payload, confirms required gates, submits, and resets", async () => {
    await useLensStore.getState().loadJoshuaDemo();

    expect(useLensStore.getState().fixture?.id).toBe("joshua");
    expect(useLensStore.getState().price?.confirmedPrice).toBe(580);

    useLensStore.getState().confirmCountry();
    expect(useLensStore.getState().fixture?.inference.countryOfUse.status).toBe(
      "confirmed",
    );

    useLensStore.getState().confirmRoute();
    expect(
      useLensStore
        .getState()
        .fixture?.inference.products.every((field) => field.status === "confirmed"),
    ).toBe(true);
    expect(useLensStore.getState().fixture?.inference.hardCopy?.status).toBe(
      "confirmed",
    );

    await useLensStore.getState().submitBooking();
    expect(useLensStore.getState().submitResult?.id).toBe("mock_appt_test");

    useLensStore.getState().reset();
    expect(useLensStore.getState().fixture).toBeNull();
    expect(useLensStore.getState().price).toBeNull();
    expect(useLensStore.getState().submitResult).toBeNull();
  });
});
