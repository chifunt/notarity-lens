import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiConfig } from "../utils/env.js";
import { inferDocuments } from "./inference-client.js";
import type { ExtractedDocument } from "@notarity-lens/shared";

const liveConfig = {
  notarityApiBaseUrl: "https://staging-api.notarity.com",
  bookingFormSlug: "test",
  bookingFormId: "form",
  notarityOrigin: "https://staging.notarity.com",
  notarityDraftId: "draft",
  mockNotarity: true,
  mockAi: false,
  allowLiveSubmit: false,
  deepseekApiKey: "test-key",
  deepseekBaseUrl: "https://deepseek.test",
  deepseekModelFast: "deepseek-v4-flash",
  deepseekModelReview: "deepseek-v4-pro",
} satisfies ApiConfig;

function documentWithText(text: string): ExtractedDocument {
  return {
    id: "upload-1",
    filename: "upload.pdf",
    canonicalName: "upload.pdf",
    mimeType: "application/pdf",
    size: text.length,
    extractionStatus: "extracted",
    textByPage: [{ page: 1, text }],
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("live inference client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses DeepSeek-compatible chat completions and attaches extracted documents locally", async () => {
    const document = documentWithText(
      "This notarised document will be used in Germany. Applicant: Jane Doe.",
    );
    const liveInference = {
      persona: "upload",
      countryOfUse: {
        key: "countryOfUse",
        label: "Country of use",
        value: "DE",
        status: "inferred",
        confidence: 0.94,
        evidence: [
          {
            documentId: "upload-1",
            filename: "upload.pdf",
            page: 1,
            quote: "used in Germany",
            confidence: 0.94,
          },
        ],
        explanation: "We found Germany as the destination country in the document.",
        requiresConfirmation: false,
      },
      products: [
        {
          key: "recommendedProduct",
          label: "Recommended product",
          value: "signature_notarisation",
          status: "inferred",
          confidence: 0.82,
          evidence: [],
          explanation: "The document asks for a signature notarisation route.",
          requiresConfirmation: false,
        },
      ],
      people: [
        {
          key: "participant",
          label: "Participant",
          value: "Jane Doe",
          status: "inferred",
          confidence: 0.9,
          evidence: [],
          explanation: "Jane Doe appears as the applicant.",
          requiresConfirmation: false,
        },
      ],
      billingAddress: null,
      shippingAddress: null,
      uncertainties: [],
    };

    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const requestBody = JSON.parse(String(init?.body));
      expect(requestBody.model).toBe("deepseek-v4-flash");
      expect(requestBody.messages[1].content).toContain("Document id: upload-1");
      expect(requestBody.messages[1].content).toContain("Filename: upload.pdf");

      return jsonResponse({
        id: "chatcmpl-test",
        object: "chat.completion",
        created: 1,
        model: "deepseek-v4-flash",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(liveInference),
            },
            finish_reason: "stop",
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await inferDocuments({ documents: [document] }, liveConfig);

    expect(response.source).toBe("live");
    expect(response.warning).toBeUndefined();
    expect(response.inference.documents).toEqual([document]);
    expect(response.inference.countryOfUse.value).toBe("DE");
    expect(response.inference.countryOfUse.evidence[0]).toMatchObject({
      id: "countryOfUse-evidence-1",
      source: "llm",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("falls back to deterministic rules when live inference cannot be parsed", async () => {
    const document = documentWithText(
      "Country where this notarised document will be used: Germany. Applicant: Jane Doe.",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1,
          model: "deepseek-v4-flash",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "{ invalid" },
              finish_reason: "stop",
            },
          ],
        }),
      ),
    );

    const response = await inferDocuments({ documents: [document] }, liveConfig);

    expect(response.source).toBe("rule");
    expect(response.warning).toContain("Live AI inference failed");
    expect(response.inference.countryOfUse.value).toBe("DE");
  });
});
