import type {
  DocumentFactExtraction,
  EvidenceRef,
  ExtractedDocument,
  InferredField,
} from "@notarity-lens/shared";

type TextDocument = {
  id: string;
  filename: string;
  text: string;
};

function evidence(
  id: string,
  document: TextDocument,
  quote: string,
  source: "rule" | "fixture" = "rule",
): EvidenceRef {
  return {
    id,
    documentId: document.id,
    filename: document.filename,
    page: 1,
    quote,
    confidence: 0.82,
    source,
  };
}

function field<T>({
  key,
  label,
  value,
  status,
  evidenceRefs,
  explanation,
  requiresConfirmation,
}: {
  key: string;
  label: string;
  value: T;
  status: InferredField<T>["status"];
  evidenceRefs: EvidenceRef[];
  explanation: string;
  requiresConfirmation: boolean;
}): InferredField<T> {
  return {
    key,
    label,
    value,
    status,
    confidence: 0.82,
    evidence: evidenceRefs,
    explanation,
    requiresConfirmation,
  };
}

function toExtractedDocument(document: TextDocument): ExtractedDocument {
  return {
    id: document.id,
    filename: document.filename,
    canonicalName: document.filename,
    mimeType: "application/pdf",
    size: document.text.length,
    extractionStatus: "fixture",
    textByPage: [{ page: 1, text: document.text }],
  };
}

export function inferFactsFromText(documents: TextDocument[]): DocumentFactExtraction {
  const joined = documents.map((document) => document.text).join("\n").toLowerCase();
  const firstDocument = documents[0] ?? {
    id: "doc",
    filename: "document.pdf",
    text: joined,
  };
  const evidenceRefs: EvidenceRef[] = [];

  if (joined.includes("nie")) {
    evidenceRefs.push(evidence("ev-nie", firstDocument, "Foreign Identity Number (NIE)"));
  }
  if (joined.includes("spanish tax authorities")) {
    evidenceRefs.push(evidence("ev-spanish-tax", firstDocument, "Spanish tax authorities"));
  }
  if (joined.includes("barcelona")) {
    evidenceRefs.push(evidence("ev-barcelona", firstDocument, "Barcelona, Spain"));
  }

  const mentionsSpain = joined.includes("spain") || joined.includes("spanish") || joined.includes("nie");
  const mentionsUnitedStates =
    joined.includes("new york") || joined.includes("united states") || joined.includes("usa");
  const mentionsAustria = joined.includes("austria") || joined.includes("vienna");
  const multipleCountries =
    [mentionsSpain, mentionsUnitedStates, mentionsAustria].filter(Boolean).length > 1;

  const countryOfUse = field({
    key: "countryOfUse",
    label: "Country of use",
    value: mentionsSpain ? "ES" : mentionsAustria ? "AT" : "missing",
    status: multipleCountries ? "needs_review" : mentionsSpain || mentionsAustria ? "inferred" : "missing",
    evidenceRefs,
    explanation: multipleCountries
      ? "Multiple countries appear in the text. Please confirm the country where the notarised document will be used or accepted."
      : "Country of use inferred from receiving authority context.",
    requiresConfirmation: multipleCountries,
  });

  const products: InferredField[] = joined.includes("nie")
    ? [
        field({
          key: "recommendedProduct",
          label: "Recommended product",
          value: "nie_number_application",
          status: "inferred",
          evidenceRefs: [evidence("ev-product-nie", firstDocument, "Foreign Identity Number (NIE)")],
          explanation: "NIE context maps semantically to the NIE number application route.",
          requiresConfirmation: false,
        }),
      ]
    : [];

  const people: InferredField[] = joined.includes("joshua timms")
    ? [
        field({
          key: "participant",
          label: "Participant",
          value: "Joshua Timms",
          status: "inferred",
          evidenceRefs: [evidence("ev-joshua", firstDocument, "Joshua Timms")],
          explanation: "Joshua Timms appears as the applicant or participant.",
          requiresConfirmation: false,
        }),
      ]
    : [];

  const billingAddress = mentionsUnitedStates
    ? field({
        key: "billingAddress",
        label: "Billing/home address",
        value: "New York, United States",
        status: "inferred",
        evidenceRefs: [evidence("ev-new-york", firstDocument, "New York, United States")],
        explanation: "New York is treated as residence or billing context, not country of use.",
        requiresConfirmation: false,
      })
    : undefined;

  const shippingAddress = joined.includes("barcelona")
    ? field({
        key: "shippingAddress",
        label: "Shipping address",
        value: "Barcelona, Spain",
        status: "needs_review",
        evidenceRefs: [evidence("ev-shipping-barcelona", firstDocument, "Barcelona, Spain")],
        explanation: "Barcelona is treated as shipping or representative evidence.",
        requiresConfirmation: true,
      })
    : undefined;

  return {
    persona: "rule-mapper",
    documents: documents.map(toExtractedDocument),
    countryOfUse,
    products,
    people,
    billingAddress,
    shippingAddress,
    hardCopy: joined.includes("hard copy")
      ? field({
          key: "hardCopy",
          label: "Hard copy",
          value: true,
          status: "needs_review",
          evidenceRefs: [evidence("ev-hard-copy", firstDocument, "hard copy")],
          explanation: "Hard copy language appears in the document.",
          requiresConfirmation: true,
        })
      : undefined,
    apostille: joined.includes("apostille")
      ? field({
          key: "apostille",
          label: "Apostille",
          value: true,
          status: "needs_review",
          evidenceRefs: [evidence("ev-apostille", firstDocument, "apostille")],
          explanation: "Apostille language appears in the document.",
          requiresConfirmation: true,
        })
      : undefined,
    uncertainties: multipleCountries
      ? ["Multiple countries appear; country of use needs user confirmation."]
      : [],
  };
}
