import type { EvidenceRef, ExtractedDocument } from "@notarity-lens/shared";

export type EvidenceKind =
  | "apostille"
  | "country"
  | "email"
  | "hard_copy"
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

const COUNTRY_PATTERNS: PatternDefinition[] = [
  { kind: "country", value: "AT", pattern: /\b(Austria|Austrian|Vienna)\b/i },
  { kind: "country", value: "CA", pattern: /\b(Canada|Toronto)\b/i },
  { kind: "country", value: "DE", pattern: /\b(Germany|German)\b/i },
  { kind: "country", value: "ES", pattern: /\b(Spain|Spanish|NIE|Madrid|Valencia|Barcelona)\b/i },
  { kind: "country", value: "GB", pattern: /\b(United Kingdom|London|UK)\b/i },
  { kind: "country", value: "IT", pattern: /\b(Italy|Italian|Milan)\b/i },
  { kind: "country", value: "JP", pattern: /\b(Japan|Tokyo)\b/i },
  { kind: "country", value: "LT", pattern: /\b(Lithuania|Lithuanian)\b/i },
  { kind: "country", value: "NL", pattern: /\b(Netherlands|Amsterdam)\b/i },
  { kind: "country", value: "US", pattern: /\b(United States|New York|USA)\b/i },
];

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
    kind: "apostille",
    value: "required",
    pattern: /\bapostill(?:e|ed)\b/i,
  },
  {
    kind: "hard_copy",
    value: "required",
    pattern: /\b(hard copy|physical original)\b/i,
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
      ...collectPatternFindings(document, page, ROUTE_PATTERNS),
      ...collectPatternFindings(document, page, SIGNAL_PATTERNS),
      ...collectPatternFindings(document, page, PARTICIPANT_PATTERNS),
    ]),
  );

  return dedupeFindings(findings);
}

export function evidenceForKind(findings: EvidenceFinding[], kind: EvidenceKind) {
  return findings
    .filter((finding) => finding.kind === kind)
    .map((finding) => finding.evidence);
}
