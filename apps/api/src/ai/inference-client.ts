import OpenAI from "openai";
import { z } from "zod";
import {
  DocumentFactExtractionSchema,
  ExtractedDocumentSchema,
  InferredFieldSchema,
  inferFactsFromUploadedDocuments,
  NOTARITY_LENS_EXTRACTION_PROMPT,
} from "@notarity-lens/ai";
import {
  personaFixtures,
  type DocumentFactExtraction,
  type ExtractedDocument,
  type PersonaId,
} from "@notarity-lens/shared";
import type { ApiConfig } from "../utils/env.js";

export type InferInput = {
  persona?: PersonaId;
  documents?: ExtractedDocument[];
};

export type InferResponse = {
  inference: DocumentFactExtraction;
  source: "mock" | "live" | "fallback" | "rule";
  warning?: string;
};

const LiveInferenceSchema = DocumentFactExtractionSchema.omit({
  documents: true,
  billingAddress: true,
  shippingAddress: true,
  hardCopy: true,
  apostille: true,
}).extend({
  documents: z.array(ExtractedDocumentSchema).optional(),
  billingAddress: z.preprocess(
    (value) => (value === null ? undefined : value),
    InferredFieldSchema.optional(),
  ),
  shippingAddress: z.preprocess(
    (value) => (value === null ? undefined : value),
    InferredFieldSchema.optional(),
  ),
  hardCopy: z.preprocess(
    (value) => (value === null ? undefined : value),
    InferredFieldSchema.optional(),
  ),
  apostille: z.preprocess(
    (value) => (value === null ? undefined : value),
    InferredFieldSchema.optional(),
  ),
});

const optionalFieldKeys = [
  "billingAddress",
  "shippingAddress",
  "hardCopy",
  "apostille",
] as const;

const allowedEvidenceSources = new Set(["pdf_text", "ocr", "llm", "rule", "fixture"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function documentForEvidence(
  evidence: Record<string, unknown>,
  documents: ExtractedDocument[],
) {
  return (
    documents.find((document) => document.id === evidence.documentId) ??
    documents.find(
      (document) =>
        document.filename === evidence.filename ||
        document.canonicalName === evidence.filename,
    ) ??
    documents[0]
  );
}

function normalizeEvidence(
  evidence: unknown,
  documents: ExtractedDocument[],
  fieldKey: string,
  index: number,
) {
  const input = isRecord(evidence) ? evidence : {};
  const document = documentForEvidence(input, documents);
  const source =
    typeof input.source === "string" && allowedEvidenceSources.has(input.source)
      ? input.source
      : "llm";
  const normalized: Record<string, unknown> = {
    ...input,
    id:
      typeof input.id === "string" && input.id.trim()
        ? input.id
        : `${fieldKey}-evidence-${index + 1}`,
    documentId:
      typeof input.documentId === "string" && input.documentId.trim()
        ? input.documentId
        : (document?.id ?? "unknown-document"),
    filename:
      typeof input.filename === "string" && input.filename.trim()
        ? input.filename
        : (document?.filename ?? "unknown.pdf"),
    quote: typeof input.quote === "string" ? input.quote : "",
    source,
  };

  if (typeof input.page !== "number") delete normalized.page;
  if (typeof input.confidence !== "number") delete normalized.confidence;

  return normalized;
}

function normalizeField(
  field: unknown,
  documents: ExtractedDocument[],
  fallbackKey: string,
) {
  if (!isRecord(field)) return field;

  const fieldKey =
    typeof field.key === "string" && field.key.trim() ? field.key : fallbackKey;
  const evidence = Array.isArray(field.evidence) ? field.evidence : [];
  const normalized: Record<string, unknown> = {
    ...field,
    key: fieldKey,
    evidence: evidence.map((item, index) =>
      normalizeEvidence(item, documents, fieldKey, index),
    ),
  };

  if (typeof normalized.requiresConfirmation !== "boolean") {
    normalized.requiresConfirmation = normalized.status !== "inferred";
  }

  return normalized;
}

function normalizeLiveInferenceShape(value: unknown, documents: ExtractedDocument[]) {
  if (!isRecord(value)) return value;

  const normalized: Record<string, unknown> = {
    ...value,
    countryOfUse: normalizeField(value.countryOfUse, documents, "countryOfUse"),
    products: Array.isArray(value.products)
      ? value.products.map((field) => normalizeField(field, documents, "recommendedProduct"))
      : value.products,
    people: Array.isArray(value.people)
      ? value.people.map((field) => normalizeField(field, documents, "participant"))
      : value.people,
  };

  for (const key of optionalFieldKeys) {
    if (normalized[key] === null) {
      delete normalized[key];
    } else {
      normalized[key] = normalizeField(normalized[key], documents, key);
    }
  }

  return normalized;
}

function parseJsonObject(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object found");
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  }
}

function parseLiveInference(content: string, documents: ExtractedDocument[]) {
  const parsed = LiveInferenceSchema.parse(
    normalizeLiveInferenceShape(parseJsonObject(content), documents),
  );
  return DocumentFactExtractionSchema.parse({
    ...parsed,
    documents,
  });
}

function errorSummary(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.replace(/\s+/g, " ").slice(0, 220);
  }
  return "Unknown error";
}

export async function inferDocuments(
  input: InferInput,
  config: ApiConfig,
): Promise<InferResponse> {
  const persona = input.persona ?? "joshua";
  const hasUploadedDocuments = Boolean(input.documents?.length);

  if (hasUploadedDocuments && config.mockAi) {
    return {
      inference: inferFactsFromUploadedDocuments(input.documents ?? []),
      source: "rule",
    };
  }

  if (config.mockAi) {
    return {
      inference: personaFixtures[persona].inference,
      source: "mock",
    };
  }

  if (!config.deepseekApiKey) {
    if (hasUploadedDocuments) {
      return {
        inference: inferFactsFromUploadedDocuments(input.documents ?? []),
        source: "rule",
        warning:
          "DEEPSEEK_API_KEY is not configured. Returning deterministic uploaded-document inference.",
      };
    }

    return {
      inference: personaFixtures[persona].inference,
      source: "fallback",
      warning:
        "DEEPSEEK_API_KEY is not configured. Returning validated fixture inference.",
    };
  }

  try {
    const client = new OpenAI({
      apiKey: config.deepseekApiKey,
      baseURL: config.deepseekBaseUrl,
    });
    const documents = input.documents?.length
      ? input.documents
      : personaFixtures[persona].documents;
    const documentText = documents
      .map((document) => {
        const pages = document.textByPage
          .map((page) => `Page ${page.page}: ${page.text}`)
          .join("\n");
        return [
          `Document id: ${document.id}`,
          `Filename: ${document.filename}`,
          `Canonical filename: ${document.canonicalName}`,
          pages,
        ].join("\n");
      })
      .join("\n\n---\n\n");

    const completion = await client.chat.completions.create({
      model: config.deepseekModelFast,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: NOTARITY_LENS_EXTRACTION_PROMPT },
        { role: "user", content: documentText },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) throw new Error("DeepSeek returned no JSON content");
    const parsed = parseLiveInference(content, documents);
    return {
      inference: parsed,
      source: "live",
      warning: undefined,
    };
  } catch (error) {
    const reason = errorSummary(error);

    if (hasUploadedDocuments) {
      return {
        inference: inferFactsFromUploadedDocuments(input.documents ?? []),
        source: "rule",
        warning: `Live AI inference failed (${reason}). Returning deterministic uploaded-document inference.`,
      };
    }

    return {
      inference: personaFixtures[persona].inference,
      source: "fallback",
      warning: `Live AI inference failed (${reason}). Returning validated fixture inference.`,
    };
  }
}
