import { joshuaFixture, robertFixture } from "@notarity-lens/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLensStore } from "./store";
import type { PersonaFixture } from "./types";

const webJoshuaFixture = joshuaFixture as unknown as PersonaFixture;
const webRobertFixture = robertFixture as unknown as PersonaFixture;

function jsonResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => data,
  } as Response);
}

function resetStore() {
  useLensStore.setState({
    fixture: null,
    uploadedDocuments: [],
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

        if (href.endsWith("/api/fixtures/robert")) {
          return jsonResponse(robertFixture);
        }

        if (href.endsWith("/api/price")) {
          const body = init?.body ? JSON.parse(String(init.body)) : {};
          const fixture =
            body.destinationCountry === robertFixture.payload.destinationCountry
              ? robertFixture
              : joshuaFixture;

          return jsonResponse({
            confirmedPrice: body.confirmedPrice ?? fixture.payload.confirmedPrice ?? 0,
            lines: fixture.priceLines,
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

        if (href.endsWith("/api/documents/upload")) {
          return jsonResponse({
            sessionId: "session_test",
            documents: [
              {
                id: "upload-test-0",
                filename: "Uploaded_Power_of_Attorney.pdf",
                canonicalName: "Uploaded_Power_of_Attorney.pdf",
                mimeType: "application/pdf",
                size: 12,
                extractionStatus: "pending",
                textByPage: [],
              },
            ],
            source: "upload",
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

    await expect(useLensStore.getState().submitBooking()).resolves.toBe(true);
    expect(useLensStore.getState().submitResult?.id).toBe("mock_appt_test");

    useLensStore.getState().reset();
    expect(useLensStore.getState().fixture).toBeNull();
    expect(useLensStore.getState().uploadedDocuments).toEqual([]);
    expect(useLensStore.getState().price).toBeNull();
    expect(useLensStore.getState().submitResult).toBeNull();
  });

  it("loads and prices a non-Joshua fixture through the generic persona loader", async () => {
    await useLensStore.getState().loadPersona("robert");

    expect(useLensStore.getState().fixture?.id).toBe("robert");
    expect(useLensStore.getState().price?.confirmedPrice).toBe(120);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/fixtures/robert"),
      expect.anything(),
    );
  });

  it("reports submit failure without creating a stale submit result", async () => {
    await useLensStore.getState().loadJoshuaDemo();
    useLensStore.setState({
      submitResult: {
        id: "mock_appt_previous",
        mode: "mock",
        ok: true,
        payload: joshuaFixture.payload,
      },
    });
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Submit unavailable"));

    await expect(useLensStore.getState().submitBooking()).resolves.toBe(false);

    expect(useLensStore.getState().submitResult).toBeNull();
    expect(useLensStore.getState().loading).toBe(false);
    expect(useLensStore.getState().error).toBe("Submit unavailable");
  });

  it("stores uploaded document metadata without creating a sample fixture", async () => {
    const file = new File(["sample"], "Uploaded_Power_of_Attorney.pdf", {
      type: "application/pdf",
    });

    await useLensStore.getState().uploadDocuments([file]);

    expect(useLensStore.getState().fixture).toBeNull();
    expect(useLensStore.getState().price).toBeNull();
    expect(useLensStore.getState().uploadedDocuments).toHaveLength(1);
    expect(useLensStore.getState().uploadedDocuments[0]?.filename).toBe(
      "Uploaded_Power_of_Attorney.pdf",
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/documents/upload"),
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });

  it("confirms participant inference fields", async () => {
    await useLensStore.getState().loadPersona("joshua");

    useLensStore.setState((state) => ({
      fixture: state.fixture
        ? {
            ...state.fixture,
            inference: {
              ...state.fixture.inference,
              people: state.fixture.inference.people.map((field) => ({
                ...field,
                requiresConfirmation: true,
                status: "needs_review",
              })),
            },
          }
        : state.fixture,
    }));

    useLensStore.getState().confirmPeople();

    expect(
      useLensStore
        .getState()
        .fixture?.inference.people.every((field) => field.status === "confirmed"),
    ).toBe(true);
  });

  it("clears stale draft state before loading a new persona", async () => {
    useLensStore.setState({
      fixture: webJoshuaFixture,
      uploadedDocuments: webRobertFixture.documents,
      price: {
        confirmedPrice: 580,
        lines: joshuaFixture.priceLines,
        source: "mock",
      },
      submitResult: {
        id: "mock_appt_previous",
        mode: "mock",
        ok: true,
        payload: joshuaFixture.payload,
      },
    });
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network unavailable"));

    await useLensStore.getState().loadPersona("robert");

    expect(useLensStore.getState().fixture).toBeNull();
    expect(useLensStore.getState().uploadedDocuments).toEqual([]);
    expect(useLensStore.getState().price).toBeNull();
    expect(useLensStore.getState().submitResult).toBeNull();
    expect(useLensStore.getState().loading).toBe(false);
    expect(useLensStore.getState().error).toBe("Network unavailable");
  });

  it("reset clears loading as well as draft data", () => {
    useLensStore.setState({
      fixture: webJoshuaFixture,
      uploadedDocuments: webRobertFixture.documents,
      price: {
        confirmedPrice: 580,
        lines: joshuaFixture.priceLines,
        source: "mock",
      },
      submitResult: {
        id: "mock_appt_previous",
        mode: "mock",
        ok: true,
        payload: joshuaFixture.payload,
      },
      loading: true,
      error: "Previous error",
    });

    useLensStore.getState().reset();

    expect(useLensStore.getState().fixture).toBeNull();
    expect(useLensStore.getState().uploadedDocuments).toEqual([]);
    expect(useLensStore.getState().price).toBeNull();
    expect(useLensStore.getState().submitResult).toBeNull();
    expect(useLensStore.getState().loading).toBe(false);
    expect(useLensStore.getState().error).toBeNull();
  });
});
