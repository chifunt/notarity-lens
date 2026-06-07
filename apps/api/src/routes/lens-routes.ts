import { Hono } from "hono";
import { z } from "zod";
import {
  AppointmentPayloadSchema,
  PersonaFixtureSchema,
  personaFixtures,
} from "@notarity-lens/shared";
import { buildJoshuaPayload } from "@notarity-lens/notarity";
import { inferDocuments } from "../ai/inference-client.js";
import { createNotarityClient } from "../clients/notarity-client.js";
import { fixtureDocuments, uploadedDocuments } from "../extraction/mock-extraction.js";
import { getApiConfig } from "../utils/env.js";

const PersonaSchema = z.enum(["joshua", "robert", "elizabeth"]);

const PersonaParamSchema = z.object({
  persona: PersonaSchema,
});

const PersonaBodySchema = z.object({
  persona: PersonaSchema.default("joshua"),
});

function jsonError(message: string, status = 400) {
  return { error: message, status };
}

export function createLensRoutes() {
  const app = new Hono();

  app.get("/fixtures/:persona", (c) => {
    const parsed = PersonaParamSchema.safeParse(c.req.param());
    if (!parsed.success) return c.json(jsonError("Unknown fixture persona", 404), 404);

    const fixture = PersonaFixtureSchema.parse(personaFixtures[parsed.data.persona]);
    return c.json(fixture);
  });

  app.post("/documents/upload", async (c) => {
    const formData = await c.req.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);
    const parsedPersona = PersonaBodySchema.safeParse({
      persona: formData.get("persona")?.toString() || undefined,
    });

    if (!parsedPersona.success) {
      return c.json(jsonError("Unknown fixture persona"), 400);
    }

    if (files.length === 0) {
      return c.json({
        sessionId: `session_${Date.now()}`,
        documents: fixtureDocuments(parsedPersona.data.persona),
        source: "fixture",
      });
    }

    return c.json({
      sessionId: `session_${Date.now()}`,
      documents: uploadedDocuments(files),
      source: "upload",
    });
  });

  app.post("/extract", async (c) => {
    const body = PersonaBodySchema.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) return c.json(jsonError("Unknown fixture persona"), 400);

    return c.json({
      documents: fixtureDocuments(body.data.persona),
      source: "fixture",
    });
  });

  app.post("/infer", async (c) => {
    const config = getApiConfig();
    const body = PersonaBodySchema.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) return c.json(jsonError("Unknown fixture persona"), 400);

    const response = await inferDocuments(body.data, config);
    return c.json(response);
  });

  app.get("/booking-form", async (c) => {
    const client = createNotarityClient(getApiConfig());
    return c.json(await client.getBookingForm());
  });

  app.get("/products", async (c) => {
    const client = createNotarityClient(getApiConfig());
    const tags = c.req.queries("_tags") ?? c.req.query("tags")?.split(",") ?? [];
    return c.json(await client.getProducts(tags.filter(Boolean)));
  });

  app.get("/timeslots", async (c) => {
    const client = createNotarityClient(getApiConfig());
    return c.json(await client.getTimeslots(c.req.query("country") ?? "ES"));
  });

  app.post("/price", async (c) => {
    const client = createNotarityClient(getApiConfig());
    const body = await c.req.json().catch(() => ({}));
    const payload = AppointmentPayloadSchema.parse(
      Object.keys(body).length ? body : buildJoshuaPayload(),
    );
    return c.json(await client.price(payload));
  });

  app.post("/submit", async (c) => {
    const client = createNotarityClient(getApiConfig());
    const body = await c.req.json().catch(() => ({}));
    const rawPayload =
      body.payload ?? (Object.keys(body).length ? body : buildJoshuaPayload());
    const payload = AppointmentPayloadSchema.parse(rawPayload);

    try {
      return c.json(await client.submit(payload));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submit failed";
      return c.json(jsonError(message, 403), 403);
    }
  });

  return app;
}
