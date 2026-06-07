import type {
  DocumentFactExtraction,
  EvidenceRef,
  ExtractedDocument,
  FieldStatus,
  InferredField,
} from "@notarity-lens/shared";
import {
  collectEvidenceFindings,
  evidenceForKind,
  type EvidenceFinding,
  type EvidenceKind,
} from "./document-evidence.js";

const COUNTRY_LABELS: Record<string, string> = {
  AT: "Austria",
  CA: "Canada",
  DE: "Germany",
  ES: "Spain",
  GB: "United Kingdom",
  IT: "Italy",
  JP: "Japan",
  LT: "Lithuania",
  NL: "Netherlands",
  US: "United States",
};

const PRODUCT_LABELS: Record<string, string> = {
  flexco_incorporation: "FlexCo incorporation",
  nie_number_application: "NIE number application",
  signature_notarisation: "Signature notarisation",
};

function uniqueByValue(findings: EvidenceFinding[]) {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.kind}:${finding.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function byKind(findings: EvidenceFinding[], kind: EvidenceKind) {
  return findings.filter((finding) => finding.kind === kind);
}

function values(findings: EvidenceFinding[]) {
  return [...new Set(findings.map((finding) => finding.value))];
}

function averageConfidence(evidence: EvidenceRef[]) {
  const confidences = evidence.flatMap((item) =>
    item.confidence === undefined ? [] : [item.confidence],
  );
  if (!confidences.length) return undefined;
  return confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
}

function field<T>({
  key,
  label,
  value,
  status,
  evidence,
  explanation,
  requiresConfirmation,
}: {
  key: string;
  label: string;
  value: T;
  status: FieldStatus;
  evidence: EvidenceRef[];
  explanation: string;
  requiresConfirmation: boolean;
}): InferredField<T> {
  return {
    key,
    label,
    value,
    status,
    confidence: averageConfidence(evidence),
    evidence,
    explanation,
    requiresConfirmation,
  };
}

function routeCountry(findings: EvidenceFinding[]) {
  const routeCountries = uniqueByValue(findings).flatMap((finding) => {
    if (finding.value === "nie_number_application") return ["ES"];
    if (finding.value === "flexco_incorporation") return ["AT"];
    return [];
  });
  return [...new Set(routeCountries)];
}

function countryName(countryCode: string) {
  return COUNTRY_LABELS[countryCode] ?? countryCode;
}

function inferCountryOfUse(findings: EvidenceFinding[]) {
  const missingCountry = byKind(findings, "missing_country");
  const explicitCountry = uniqueByValue(byKind(findings, "country_of_use"));
  const explicitCountryValues = values(explicitCountry);
  const productRoutes = byKind(findings, "product_route");
  const productRouteCountries = routeCountry(productRoutes);
  const mentionedCountry = uniqueByValue(byKind(findings, "country"));
  const mentionedCountryValues = values(mentionedCountry);

  if (missingCountry.length) {
    const fallbackValue = explicitCountryValues[0] ?? productRouteCountries[0] ?? "missing";
    return field({
      key: "countryOfUse",
      label: "Country of use",
      value: fallbackValue,
      status: "missing",
      evidence: evidenceForKind(findings, "missing_country"),
      explanation:
        "The uploaded PDF says the country of use is not stated. Confirm the destination country from information outside the PDF before booking.",
      requiresConfirmation: true,
    });
  }

  if (explicitCountryValues.length === 1) {
    const countryCode = explicitCountryValues[0] ?? "missing";
    return field({
      key: "countryOfUse",
      label: "Country of use",
      value: countryCode,
      status: "inferred",
      evidence: explicitCountry.map((finding) => finding.evidence),
      explanation: `The uploaded PDF explicitly states ${countryName(countryCode)} as the country where the notarised document will be used.`,
      requiresConfirmation: false,
    });
  }

  if (explicitCountryValues.length > 1) {
    return field({
      key: "countryOfUse",
      label: "Country of use",
      value: explicitCountryValues[0] ?? "conflict",
      status: "conflict",
      evidence: explicitCountry.map((finding) => finding.evidence),
      explanation:
        "The uploaded PDFs explicitly name more than one country of use. Choose the destination country before booking.",
      requiresConfirmation: true,
    });
  }

  if (productRouteCountries.length === 1) {
    const countryCode = productRouteCountries[0] ?? "missing";
    return field({
      key: "countryOfUse",
      label: "Country of use",
      value: countryCode,
      status: "needs_review",
      evidence: productRoutes.map((finding) => finding.evidence),
      explanation: `The detected product route usually points to ${countryName(countryCode)}, but the PDF does not explicitly state the country of use.`,
      requiresConfirmation: true,
    });
  }

  if (mentionedCountryValues.length === 1) {
    const countryCode = mentionedCountryValues[0] ?? "missing";
    return field({
      key: "countryOfUse",
      label: "Country of use",
      value: countryCode,
      status: "needs_review",
      evidence: mentionedCountry.map((finding) => finding.evidence),
      explanation: `The uploaded PDFs mention ${countryName(countryCode)}, but do not explicitly say this is the country of use.`,
      requiresConfirmation: true,
    });
  }

  if (mentionedCountryValues.length > 1) {
    return field({
      key: "countryOfUse",
      label: "Country of use",
      value: mentionedCountryValues[0] ?? "conflict",
      status: "conflict",
      evidence: mentionedCountry.map((finding) => finding.evidence),
      explanation:
        "The uploaded PDFs mention multiple countries without a clear destination-country phrase.",
      requiresConfirmation: true,
    });
  }

  return field({
    key: "countryOfUse",
    label: "Country of use",
    value: "missing",
    status: "missing",
    evidence: [],
    explanation:
      "No country-of-use evidence was found in the uploaded PDFs. Confirm the destination country before booking.",
    requiresConfirmation: true,
  });
}

function inferProducts(findings: EvidenceFinding[]) {
  const productRoutes = uniqueByValue(byKind(findings, "product_route"));
  const products = productRoutes.map((finding) =>
    field({
      key: "recommendedProduct",
      label: "Recommended product",
      value: finding.value,
      status: "inferred",
      evidence: [finding.evidence],
      explanation: `${PRODUCT_LABELS[finding.value] ?? finding.value} was detected from the uploaded PDF text.`,
      requiresConfirmation: false,
    }),
  );

  if (productRoutes.some((finding) => finding.value === "nie_number_application")) {
    const nieEvidence = productRoutes
      .filter((finding) => finding.value === "nie_number_application")
      .map((finding) => finding.evidence);
    products.push(
      field({
        key: "requiredCompanionDocument",
        label: "Required companion document",
        value: "nie_personal_data",
        status: "inferred",
        evidence: nieEvidence,
        explanation:
          "Because the NIE number application route was detected, Notarity also needs the NIE Personal Data form.",
        requiresConfirmation: false,
      }),
    );
  }

  return products;
}

function inferPeople(findings: EvidenceFinding[]) {
  const participants = uniqueByValue(byKind(findings, "participant")).map((finding) =>
    field({
      key: "participant",
      label: "Participant",
      value: finding.value,
      status: "inferred",
      evidence: [finding.evidence],
      explanation: `${finding.value} appears as an applicant, signer, or named participant in the uploaded PDF text.`,
      requiresConfirmation: false,
    }),
  );
  const emails = uniqueByValue(byKind(findings, "email")).map((finding) =>
    field({
      key: "participantEmail",
      label: "Participant email",
      value: finding.value,
      status: "inferred",
      evidence: [finding.evidence],
      explanation: "The participant email was found in the uploaded PDF text.",
      requiresConfirmation: false,
    }),
  );
  const ambiguity = uniqueByValue(byKind(findings, "participant_ambiguity")).map(
    (finding) =>
      field({
        key: "participantAmbiguity",
        label: "Participant ambiguity",
        value: finding.value,
        status: "needs_review",
        evidence: [finding.evidence],
        explanation:
          "The uploaded PDF indicates another person may also need to participate or sign.",
        requiresConfirmation: true,
      }),
  );

  return [...participants, ...emails, ...ambiguity];
}

function inferBooleanSignal(
  findings: EvidenceFinding[],
  kind: "apostille" | "hard_copy",
) {
  const evidence = evidenceForKind(findings, kind);
  if (!evidence.length) return undefined;
  return field({
    key: kind === "apostille" ? "apostille" : "hardCopy",
    label: kind === "apostille" ? "Apostille" : "Hard copy",
    value: true,
    status: "needs_review",
    evidence,
    explanation:
      kind === "apostille"
        ? "Apostille language appears in the uploaded PDF text."
        : "Hard-copy language appears in the uploaded PDF text.",
    requiresConfirmation: true,
  });
}

function uncertaintiesFor(inference: Omit<DocumentFactExtraction, "uncertainties">) {
  const uncertainties: string[] = [];
  if (inference.countryOfUse.status === "missing") {
    uncertainties.push("Country of use is missing from the uploaded PDFs.");
  }
  if (inference.countryOfUse.status === "conflict") {
    uncertainties.push("Country of use is conflicting across the uploaded PDFs.");
  }
  if (!inference.products.length) {
    uncertainties.push("No supported Notarity product route was detected.");
  }
  if (!inference.people.some((fieldItem) => fieldItem.key === "participant")) {
    uncertainties.push("No participant name was detected.");
  }
  if (inference.people.some((fieldItem) => fieldItem.key === "participantAmbiguity")) {
    uncertainties.push("Participant list may be incomplete.");
  }
  return uncertainties;
}

export function inferFactsFromUploadedDocuments(
  documents: ExtractedDocument[],
): DocumentFactExtraction {
  const findings = collectEvidenceFindings(documents);
  const inferenceWithoutUncertainties = {
    persona: "upload",
    documents,
    countryOfUse: inferCountryOfUse(findings),
    products: inferProducts(findings),
    people: inferPeople(findings),
    hardCopy: inferBooleanSignal(findings, "hard_copy"),
    apostille: inferBooleanSignal(findings, "apostille"),
  };

  return {
    ...inferenceWithoutUncertainties,
    uncertainties: uncertaintiesFor(inferenceWithoutUncertainties),
  };
}
