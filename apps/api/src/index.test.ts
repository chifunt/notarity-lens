import { describe, expect, it } from "vitest";
import { buildJoshuaPayload } from "@notarity-lens/notarity";
import { amaraPayload, noahPayload, sofiaPayload } from "@notarity-lens/shared";
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

  it("returns Amara fixture data", async () => {
    const response = await app.request("/api/fixtures/amara");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("amara");
    expect(body.payload.destinationCountry).toBe("DE");
    expect(body.payload.billingDetails.countryCode).toBe("NL");
  });

  it("returns Noah fixture data with missing country evidence", async () => {
    const response = await app.request("/api/fixtures/noah");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("noah");
    expect(body.inference.countryOfUse.status).toBe("missing");
    expect(body.payload.billingDetails.countryCode).toBe("CA");
  });

  it("returns Sofia fixture data with country conflict evidence", async () => {
    const response = await app.request("/api/fixtures/sofia");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("sofia");
    expect(body.inference.countryOfUse.status).toBe("conflict");
    expect(body.payload.destinationCountry).toBe("ES");
    expect(body.payload.billingDetails.countryCode).toBe("IT");
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

  it("returns normalized mock price for Amara by exact fixture payload", async () => {
    const response = await app.request("/api/price", {
      method: "POST",
      body: JSON.stringify(amaraPayload),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.confirmedPrice).toBe(120);
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0].name).toBe("Signature notarisation");
  });

  it("returns normalized mock price for Noah by exact fixture payload", async () => {
    const response = await app.request("/api/price", {
      method: "POST",
      body: JSON.stringify(noahPayload),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.confirmedPrice).toBe(120);
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0].name).toBe("Signature notarisation");
  });

  it("returns normalized mock price for Sofia by exact fixture payload", async () => {
    const response = await app.request("/api/price", {
      method: "POST",
      body: JSON.stringify(sofiaPayload),
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.confirmedPrice).toBe(120);
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0].name).toBe("Signature notarisation");
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
