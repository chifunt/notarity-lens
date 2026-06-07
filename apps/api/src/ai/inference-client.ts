import OpenAI from "openai";
import {
  DocumentFactExtractionSchema,
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
        return `Filename: ${document.canonicalName}\n${pages}`;
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
    const parsed = DocumentFactExtractionSchema.parse(JSON.parse(content));
    return {
      inference: parsed,
      source: "live",
      warning: undefined,
    };
  } catch {
    if (hasUploadedDocuments) {
      return {
        inference: inferFactsFromUploadedDocuments(input.documents ?? []),
        source: "rule",
        warning:
          "Live AI inference failed validation. Returning deterministic uploaded-document inference.",
      };
    }

    return {
      inference: personaFixtures[persona].inference,
      source: "fallback",
      warning:
        "Live AI inference failed validation. Returning validated fixture inference.",
    };
  }
}
