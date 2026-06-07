import { describe, expect, it } from "vitest";
import { buildJoshuaPayload } from "@notarity-lens/notarity";
import { createApiApp } from "./index.js";

describe("api routes", () => {
  const app = createApiApp();

  it("returns health", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns Joshua fixture data", async () => {
    const response = await app.request("/api/fixtures/joshua");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("joshua");
    expect(body.payload.destinationCountry).toBe("ES");
  });

  it("rejects unknown fixture personas", async () => {
    const response = await app.request("/api/fixtures/unknown");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Unknown fixture persona");
  });

  it("returns mock inference", async () => {
    const response = await app.request("/api/infer", {
      method: "POST",
      body: JSON.stringify({ persona: "joshua" }),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("mock");
    expect(body.inference.countryOfUse.value).toBe("ES");
  });

  it("rejects unknown inference personas", async () => {
    const response = await app.request("/api/infer", {
      method: "POST",
      body: JSON.stringify({ persona: "unknown" }),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Unknown fixture persona");
  });

  it("rejects unknown upload fixture personas", async () => {
    const formData = new FormData();
    formData.append("persona", "unknown");

    const response = await app.request("/api/documents/upload", {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Unknown fixture persona");
  });

  it("rejects non-PDF uploads", async () => {
    const formData = new FormData();
    formData.append("files", new File(["hello"], "notes.txt", { type: "text/plain" }));

    const response = await app.request("/api/documents/upload", {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Only PDF documents are supported");
  });

  it("returns normalized mock price", async () => {
    const response = await app.request("/api/price", {
      method: "POST",
      body: JSON.stringify(buildJoshuaPayload()),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.confirmedPrice).toBe(580);
    expect(body.lines).toHaveLength(3);
  });

  it("rejects invalid price payloads", async () => {
    const response = await app.request("/api/price", {
      method: "POST",
      body: JSON.stringify({ destinationCountry: "ES" }),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid appointment payload");
  });

  it("returns mock submit success", async () => {
    const response = await app.request("/api/submit", {
      method: "POST",
      body: JSON.stringify({ payload: buildJoshuaPayload() }),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.mode).toBe("mock");
    expect(body.payload.destinationCountry).toBe("ES");
  });

  it("rejects invalid submit payloads", async () => {
    const response = await app.request("/api/submit", {
      method: "POST",
      body: JSON.stringify({ payload: { destinationCountry: "ES" } }),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid appointment payload");
  });
});
