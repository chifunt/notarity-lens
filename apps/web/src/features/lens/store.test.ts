import {
  amaraFixture,
  joshuaFixture,
  kenjiFixture,
  noahFixture,
  robertFixture,
  sofiaFixture,
} from "@notarity-lens/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLensStore } from "./store";
import type { PersonaFixture } from "./types";

const webJoshuaFixture = joshuaFixture as unknown as PersonaFixture;
const webRobertFixture = robertFixture as unknown as PersonaFixture;
const webAmaraFixture = amaraFixture as unknown as PersonaFixture;

function jsonResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => data,
  } as Response);
}

function jsonErrorResponse(status: number, error: string) {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => ({ error }),
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

        if (href.endsWith("/api/fixtures/amara")) {
          return jsonResponse(amaraFixture);
        }

        if (href.endsWith("/api/fixtures/noah")) {
          return jsonResponse(noahFixture);
        }

        if (href.endsWith("/api/fixtures/sofia")) {
          return jsonResponse(sofiaFixture);
        }

        if (href.endsWith("/api/fixtures/kenji")) {
          return jsonResponse(kenjiFixture);
        }

        if (href.endsWith("/api/price")) {
          const body = init?.body ? JSON.parse(String(init.body)) : {};
          const fixture =
            [
              joshuaFixture,
              robertFixture,
              amaraFixture,
              noahFixture,
              sofiaFixture,
              kenjiFixture,
            ].find(
              (candidate) =>
                candidate.payload.destinationCountry === body.destinationCountry &&
                candidate.payload.participants[0]?.email ===
                  body.participants?.[0]?.email,
            ) ?? joshuaFixture;

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
    await expect(useLensStore.getState().loadJoshuaDemo()).resolves.toBe(true);

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
    expect(useLensStore.getState().fixture?.inference.hardCopy?.status).toBe("confirmed");

    await expect(useLensStore.getState().submitBooking()).resolves.toBe(true);
    expect(useLensStore.getState().submitResult?.id).toBe("mock_appt_test");

    useLensStore.getState().reset();
    expect(useLensStore.getState().fixture).toBeNull();
    expect(useLensStore.getState().uploadedDocuments).toEqual([]);
    expect(useLensStore.getState().price).toBeNull();
    expect(useLensStore.getState().submitResult).toBeNull();
  });

  it("loads and prices a non-Joshua fixture through the generic persona loader", async () => {
    await expect(useLensStore.getState().loadPersona("robert")).resolves.toBe(true);

    expect(useLensStore.getState().fixture?.id).toBe("robert");
    expect(useLensStore.getState().price?.confirmedPrice).toBe(120);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/fixtures/robert"),
      expect.anything(),
    );
  });

  it("loads and prices Amara through the generic persona loader", async () => {
    await expect(useLensStore.getState().loadPersona("amara")).resolves.toBe(true);

    expect(useLensStore.getState().fixture?.id).toBe("amara");
    expect(useLensStore.getState().price?.confirmedPrice).toBe(120);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/fixtures/amara"),
      expect.anything(),
    );
  });

  it("loads Noah with missing country evidence through the generic persona loader", async () => {
    await expect(useLensStore.getState().loadPersona("noah")).resolves.toBe(true);

    expect(useLensStore.getState().fixture?.id).toBe("noah");
    expect(useLensStore.getState().fixture?.inference.countryOfUse.status).toBe(
      "missing",
    );
    expect(useLensStore.getState().price?.confirmedPrice).toBe(120);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/fixtures/noah"),
      expect.anything(),
    );
  });

  it("loads Sofia with country conflict evidence through the generic persona loader", async () => {
    await expect(useLensStore.getState().loadPersona("sofia")).resolves.toBe(true);

    expect(useLensStore.getState().fixture?.id).toBe("sofia");
    expect(useLensStore.getState().fixture?.inference.countryOfUse.status).toBe(
      "conflict",
    );
    expect(useLensStore.getState().price?.confirmedPrice).toBe(120);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/fixtures/sofia"),
      expect.anything(),
    );
  });

  it("loads Kenji with the NIE hard-copy price through the generic persona loader", async () => {
    await expect(useLensStore.getState().loadPersona("kenji")).resolves.toBe(true);

    expect(useLensStore.getState().fixture?.id).toBe("kenji");
    expect(useLensStore.getState().fixture?.documents).toHaveLength(2);
    expect(useLensStore.getState().price?.confirmedPrice).toBe(580);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/fixtures/kenji"),
      expect.anything(),
    );
  });

  it("reports submit failure without creating a stale submit result", async () => {
    await expect(useLensStore.getState().loadJoshuaDemo()).resolves.toBe(true);
    useLensStore.setState({
      submitResult: {
        id: "mock_appt_previous",
        mode: "mock",
        ok: true,
        payload: joshuaFixture.payload,
      },
    });
    vi.mocked(fetch).mockImplementationOnce(() =>
      jsonErrorResponse(403, "Live submit is disabled"),
    );

    await expect(useLensStore.getState().submitBooking()).resolves.toBe(false);

    expect(useLensStore.getState().submitResult).toBeNull();
    expect(useLensStore.getState().loading).toBe(false);
    expect(useLensStore.getState().error).toBe("Live submit is disabled (403)");
  });

  it("stores uploaded document metadata without creating a sample fixture", async () => {
    const file = new File(["sample"], "Uploaded_Power_of_Attorney.pdf", {
      type: "application/pdf",
    });

    await expect(useLensStore.getState().uploadDocuments([file])).resolves.toBe(true);

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

  it("reports upload failure without navigating stale draft state", async () => {
    useLensStore.setState({
      fixture: webJoshuaFixture,
      uploadedDocuments: webAmaraFixture.documents,
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
    const file = new File(["sample"], "Uploaded_Power_of_Attorney.pdf", {
      type: "application/pdf",
    });
    vi.mocked(fetch).mockImplementationOnce(() =>
      jsonErrorResponse(400, "Only PDF documents are supported"),
    );

    await expect(useLensStore.getState().uploadDocuments([file])).resolves.toBe(false);

    expect(useLensStore.getState().fixture).toBeNull();
    expect(useLensStore.getState().uploadedDocuments).toEqual([]);
    expect(useLensStore.getState().price).toBeNull();
    expect(useLensStore.getState().submitResult).toBeNull();
    expect(useLensStore.getState().loading).toBe(false);
    expect(useLensStore.getState().error).toBe("Only PDF documents are supported (400)");
  });

  it("confirms participant inference fields", async () => {
    await expect(useLensStore.getState().loadPersona("joshua")).resolves.toBe(true);

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

    await expect(useLensStore.getState().loadPersona("robert")).resolves.toBe(false);

    expect(useLensStore.getState().fixture).toBeNull();
    expect(useLensStore.getState().uploadedDocuments).toEqual([]);
    expect(useLensStore.getState().price).toBeNull();
    expect(useLensStore.getState().submitResult).toBeNull();
    expect(useLensStore.getState().loading).toBe(false);
    expect(useLensStore.getState().error).toBe("Network unavailable");
  });

  it("clears stale draft state when sample pricing fails", async () => {
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
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse(robertFixture))
      .mockImplementationOnce(() => jsonErrorResponse(503, "Price unavailable"));

    await expect(useLensStore.getState().loadPersona("robert")).resolves.toBe(false);

    expect(useLensStore.getState().fixture).toBeNull();
    expect(useLensStore.getState().uploadedDocuments).toEqual([]);
    expect(useLensStore.getState().price).toBeNull();
    expect(useLensStore.getState().submitResult).toBeNull();
    expect(useLensStore.getState().loading).toBe(false);
    expect(useLensStore.getState().error).toBe("Price unavailable (503)");
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
