import { personaFixtures, type DocumentFactExtraction, type PersonaId } from "@notarity-lens/shared";
import type { ApiConfig } from "../utils/env.js";

export type InferInput = {
  persona?: PersonaId;
};

export type InferResponse = {
  inference: DocumentFactExtraction;
  source: "mock" | "fallback";
  warning?: string;
};

export async function inferDocuments(
  input: InferInput,
  config: ApiConfig,
): Promise<InferResponse> {
  const persona = input.persona ?? "joshua";

  if (config.mockAi) {
    return {
      inference: personaFixtures[persona].inference,
      source: "mock",
    };
  }

  return {
    inference: personaFixtures[persona].inference,
    source: "fallback",
    warning:
      "Live AI inference is not enabled in this sprint. Returning validated fixture inference.",
  };
}
