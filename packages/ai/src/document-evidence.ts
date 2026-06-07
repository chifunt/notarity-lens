import type { EvidenceRef, ExtractedDocument } from "@notarity-lens/shared";

export type EvidenceKind =
  | "apostille"
  | "apostille_not_required"
  | "billing_address"
  | "country"
  | "country_of_use"
  | "email"
  | "hard_copy"
  | "hard_copy_not_required"
  | "missing_country"
  | "participant"
  | "participant_ambiguity"
  | "product_route";

export type EvidenceFinding = {
  kind: EvidenceKind;
  value: string;
  evidence: EvidenceRef;
};

type PatternDefinition = {
  kind: EvidenceKind;
  value: string;
  pattern: RegExp;
  confidence?: number;
};

type CountryPatternDefinition = {
  value: string;
  genericPattern: RegExp;
  destinationPattern: RegExp;
};

const countryUsePrefix =
  String.raw`(?:country where this notarised document will be used|country of use|used or accepted in|will be used in|for use in)`;

const COUNTRY_DEFINITIONS: CountryPatternDefinition[] = [
  {
    value: "AT",
    genericPattern: /\b(Austria|Austrian|Vienna)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(Austria|Vienna)\b`, "i"),
  },
  {
    value: "CA",
    genericPattern: /\b(Canada|Toronto)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(Canada|Toronto)\b`, "i"),
  },
  {
    value: "DE",
    genericPattern: /\b(Germany|German)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(Germany|German)\b`, "i"),
  },
  {
    value: "ES",
    genericPattern: /\b(Spain|Spanish|NIE|Madrid|Valencia|Barcelona)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(Spain|Spanish|Madrid|Valencia|Barcelona)\b`, "i"),
  },
  {
    value: "GB",
    genericPattern: /\b(United Kingdom|London|UK)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(United Kingdom|London|UK)\b`, "i"),
  },
  {
    value: "IT",
    genericPattern: /\b(Italy|Italian|Milan)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(Italy|Italian|Milan)\b`, "i"),
  },
  {
    value: "JP",
    genericPattern: /\b(Japan|Tokyo)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(Japan|Tokyo)\b`, "i"),
  },
  {
    value: "LT",
    genericPattern: /\b(Lithuania|Lithuanian)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(Lithuania|Lithuanian)\b`, "i"),
  },
  {
    value: "NL",
    genericPattern: /\b(Netherlands|Amsterdam)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(Netherlands|Amsterdam)\b`, "i"),
  },
  {
    value: "US",
    genericPattern: /\b(United States|New York|USA)\b/i,
    destinationPattern: new RegExp(String.raw`\b${countryUsePrefix}\s*:?\s*(?:the\s+)?(United States|New York|USA)\b`, "i"),
  },
];

const COUNTRY_PATTERNS: PatternDefinition[] = COUNTRY_DEFINITIONS.map(
  (definition) => ({
    kind: "country",
    value: definition.value,
    pattern: definition.genericPattern,
  }),
);

const COUNTRY_OF_USE_PATTERNS: PatternDefinition[] = COUNTRY_DEFINITIONS.map(
  (definition) => ({
    kind: "country_of_use",
    value: definition.value,
    pattern: definition.destinationPattern,
    confidence: 0.9,
  }),
);

const ROUTE_PATTERNS: PatternDefinition[] = [
  {
    kind: "product_route",
    value: "nie_number_application",
    pattern: /\b(Foreign Identity Number \(?NIE\)?|NIE number|Spanish Foreign Identity Number)\b/i,
  },
  {
    kind: "product_route",
    value: "signature_notarisation",
    pattern: /\b(certify .*signature|signature notarisation|signature authorisation)\b/i,
  },
  {
    kind: "product_route",
    value: "flexco_incorporation",
    pattern: /\b(FlexCo|incorporation)\b/i,
  },
];

const SIGNAL_PATTERNS: PatternDefinition[] = [
  {
    kind: "missing_country",
    value: "country_of_use_not_stated",
    pattern: /country where this notarised document will be used:\s*not stated/i,
    confidence: 0.25,
  },
  {
    kind: "apostille_not_required",
    value: "not_required",
    pattern: /\b(no apostille requested|apostille not required|without apostille)\b/i,
    confidence: 0.86,
  },
  {
    kind: "hard_copy_not_required",
    value: "not_required",
    pattern: /\b(no hard copy shipment required|no hard copy required|digital notarised copy is sufficient)\b/i,
    confidence: 0.86,
  },
  {
    kind: "apostille",
    value: "required",
    pattern: /\b(apostille required|required apostille|apostilled hard copy)\b/i,
  },
  {
    kind: "hard_copy",
    value: "required",
    pattern:
      /\b(address for hard copy|(?<!no )(?:hard copy|physical original)[^.]{0,60}\brequired|required[^.]{0,60}\b(?:hard copy|physical original))\b/i,
  },
  {
    kind: "participant_ambiguity",
    value: "possible_additional_signer",
    pattern: /\b(possible co-signer|may also need to sign|co-founder)\b/i,
    confidence: 0.64,
  },
];

const PARTICIPANT_PATTERNS: PatternDefinition[] = [
  {
    kind: "participant",
    value: "$1",
    pattern:
      /\b(?:Applicant|Name|Applicant and primary signer):\s*([A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+)+)(?=\.|,|$)/,
  },
  {
    kind: "email",
    value: "$1",
    pattern: /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i,
  },
];

const ADDRESS_PATTERNS: PatternDefinition[] = [
  {
    kind: "billing_address",
    value: "$1",
    pattern:
      /\b(?:Residence and billing address|Billing residence|Billing address|Residence|Address):\s*([^.\n]+)/i,
    confidence: 0.78,
  },
];

function evidenceId(kind: EvidenceKind, documentId: string, page: number, index: number) {
  return `ev-upload-${kind}-${documentId}-${page}-${index}`;
}

function quoteForMatch(text: string, match: RegExpMatchArray) {
  const start = Math.max(0, match.index ?? 0);
  const raw = text.slice(start, start + match[0].length);
  return raw.replace(/\s+/g, " ").trim();
}

function valueForMatch(definition: PatternDefinition, match: RegExpMatchArray) {
  if (definition.value === "$1") return String(match[1] ?? match[0]).trim();
  return definition.value;
}

function collectPatternFindings(
  document: ExtractedDocument,
  page: ExtractedDocument["textByPage"][number],
  definitions: PatternDefinition[],
) {
  return definitions.flatMap((definition, index): EvidenceFinding[] => {
    const match = page.text.match(definition.pattern);
    if (!match) return [];

    return [
      {
        kind: definition.kind,
        value: valueForMatch(definition, match),
        evidence: {
          id: evidenceId(definition.kind, document.id, page.page, index),
          documentId: document.id,
          filename: document.canonicalName || document.filename,
          page: page.page,
          quote: quoteForMatch(page.text, match),
          confidence: definition.confidence ?? 0.82,
          source: "rule",
        },
      },
    ];
  });
}

function dedupeFindings(findings: EvidenceFinding[]) {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.kind}:${finding.value}:${finding.evidence.documentId}:${finding.evidence.page}:${finding.evidence.quote}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function collectEvidenceFindings(documents: ExtractedDocument[]) {
  const findings = documents.flatMap((document) =>
    document.textByPage.flatMap((page) => [
      ...collectPatternFindings(document, page, COUNTRY_PATTERNS),
      ...collectPatternFindings(document, page, COUNTRY_OF_USE_PATTERNS),
      ...collectPatternFindings(document, page, ROUTE_PATTERNS),
      ...collectPatternFindings(document, page, SIGNAL_PATTERNS),
      ...collectPatternFindings(document, page, PARTICIPANT_PATTERNS),
      ...collectPatternFindings(document, page, ADDRESS_PATTERNS),
    ]),
  );

  return dedupeFindings(findings);
}

export function evidenceForKind(findings: EvidenceFinding[], kind: EvidenceKind) {
  return findings
    .filter((finding) => finding.kind === kind)
    .map((finding) => finding.evidence);
}
