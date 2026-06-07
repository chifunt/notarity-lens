import { readFile } from "node:fs/promises";
import { Hono } from "hono";
import { z } from "zod";
import {
  AppointmentPayloadSchema,
  DocumentFactExtractionSchema,
  ExtractedDocumentSchema,
  PersonaFixtureSchema,
  personaFixtures,
} from "@notarity-lens/shared";
import { buildJoshuaPayload, buildUploadedPayload } from "@notarity-lens/notarity";
import { inferDocuments } from "../ai/inference-client.js";
import { createNotarityClient } from "../clients/notarity-client.js";
import { fixtureDocuments, uploadedDocuments } from "../extraction/mock-extraction.js";
import { getApiConfig } from "../utils/env.js";

const PersonaSchema = z.enum([
  "joshua",
  "robert",
  "elizabeth",
  "amara",
  "noah",
  "sofia",
  "kenji",
  "priya",
]);

const PersonaParamSchema = z.object({
  persona: PersonaSchema,
});

const PersonaDocumentParamSchema = PersonaParamSchema.extend({
  documentId: z.string().min(1),
});

const PersonaBodySchema = z.object({
  persona: PersonaSchema.default("joshua"),
});

const InferBodySchema = z.object({
  persona: PersonaSchema.optional(),
  documents: z.array(ExtractedDocumentSchema).optional(),
});

const DraftBodySchema = z.object({
  inference: DocumentFactExtractionSchema,
});

function jsonError(message: string, status = 400) {
  return { error: message, status };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

type Persona = z.infer<typeof PersonaSchema>;

const referencePdfDirectories: Partial<Record<Persona, string>> = {
  joshua: "joshua",
  robert: "robert",
  elizabeth: "elizabeth",
};

const generatedPdfDirectories: Partial<Record<Persona, string>> = {
  amara: "amara-okafor",
  noah: "noah-chen",
  sofia: "sofia-rossi",
  kenji: "kenji-tanaka",
  priya: "priya-nair",
};

function fixturePdfUrls(persona: Persona, filename: string) {
  const urls: URL[] = [];
  const referenceDirectory = referencePdfDirectories[persona];
  const generatedDirectory = generatedPdfDirectories[persona];

  if (referenceDirectory) {
    urls.push(
      new URL(
        `../../../../_context/notarity-reference-materials/personas/${referenceDirectory}/documents/${filename}`,
        import.meta.url,
      ),
    );
  }

  if (generatedDirectory) {
    urls.push(
      new URL(
        `../../../../docs/generated-personas/${generatedDirectory}/${filename}`,
        import.meta.url,
      ),
    );
  }

  return urls;
}

async function readFixturePdf(persona: Persona, filename: string) {
  for (const url of fixturePdfUrls(persona, filename)) {
    try {
      return await readFile(url);
    } catch {
      // Try the next configured source for this fixture document.
    }
  }

  throw new Error("Fixture PDF is not available");
}

function contentDispositionFilename(filename: string) {
  return filename.replace(/["\\]/g, "_");
}

export function createLensRoutes() {
  const app = new Hono();

  app.get("/fixtures/:persona", (c) => {
    const parsed = PersonaParamSchema.safeParse(c.req.param());
    if (!parsed.success) return c.json(jsonError("Unknown fixture persona", 404), 404);

    const fixture = PersonaFixtureSchema.parse(personaFixtures[parsed.data.persona]);
    return c.json(fixture);
  });

  app.get("/fixtures/:persona/documents/:documentId/pdf", async (c) => {
    const parsed = PersonaDocumentParamSchema.safeParse(c.req.param());
    if (!parsed.success) return c.json(jsonError("Unknown fixture document", 404), 404);

    const fixture = PersonaFixtureSchema.parse(personaFixtures[parsed.data.persona]);
    const document = fixture.documents.find(
      (candidate) => candidate.id === parsed.data.documentId,
    );

    if (!document) return c.json(jsonError("Unknown fixture document", 404), 404);

    try {
      const pdf = await readFixturePdf(parsed.data.persona, document.filename);
      return new Response(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `inline; filename="${contentDispositionFilename(
            document.filename,
          )}"`,
          "cache-control": "public, max-age=300",
        },
      });
    } catch {
      return c.json(jsonError("Fixture PDF is not available", 404), 404);
    }
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

    if (files.some((file) => !isPdfFile(file))) {
      return c.json(jsonError("Only PDF documents are supported"), 400);
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
      documents: await uploadedDocuments(files),
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
    const body = InferBodySchema.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) return c.json(jsonError("Unknown fixture persona"), 400);

    const response = await inferDocuments(body.data, config);
    return c.json(response);
  });

  app.post("/draft", async (c) => {
    const body = DraftBodySchema.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) return c.json(jsonError("Invalid inference draft"), 400);

    return c.json(buildUploadedPayload(body.data.inference));
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
    const rawPayload =
      isRecord(body) && Object.keys(body).length === 0 ? buildJoshuaPayload() : body;
    const payload = AppointmentPayloadSchema.safeParse(rawPayload);
    if (!payload.success) return c.json(jsonError("Invalid appointment payload"), 400);

    return c.json(await client.price(payload.data));
  });

  app.post("/submit", async (c) => {
    const client = createNotarityClient(getApiConfig());
    const body = await c.req.json().catch(() => ({}));
    const rawPayload =
      isRecord(body) && "payload" in body
        ? body.payload
        : isRecord(body) && Object.keys(body).length === 0
          ? buildJoshuaPayload()
          : body;
    const payload = AppointmentPayloadSchema.safeParse(rawPayload);
    if (!payload.success) return c.json(jsonError("Invalid appointment payload"), 400);

    try {
      return c.json(await client.submit(payload.data));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submit failed";
      return c.json(jsonError(message, 403), 403);
    }
  });

  return app;
}
