import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, ChevronDown, ExternalLink, FileSearch, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/features/lens/components/AppShell";
import { DocumentFileList } from "@/features/lens/components/DocumentFileList";
import { EmptyState } from "@/features/lens/components/EmptyState";
import { PdfPreviewPanel } from "@/features/lens/components/PdfPreviewPanel";
import { ReceiptSidebar } from "@/features/lens/components/ReceiptSidebar";
import { StatusBadge } from "@/features/lens/components/StatusBadge";
import { getFixturePdfUrl, getPersonaFixture } from "@/features/lens/api";
import {
  formatAddress,
  formatCountry,
  formatFieldValue,
  formatFilesSummary,
  formatParticipantsSummary,
  formatProductSummary,
  formatShippingSummary,
} from "@/features/lens/display";
import { useLensStore } from "@/features/lens/store";
import type {
  DocumentFactExtraction,
  FieldStatus,
  InferredField,
  LensFixture,
  PersonaFixture,
  PriceResponse,
} from "@/features/lens/types";

const sampleRequests: Array<{
  id: PersonaFixture["id"];
  name: string;
  summary: string;
  caseLabel: string;
  status: FieldStatus;
  bullets: string[];
}> = [
  {
    id: "joshua",
    name: "Joshua Timms",
    summary: "Spanish NIE route with hard-copy shipping",
    caseLabel: "Complete hard-copy route",
    status: "needs_review",
    bullets: [
      "Country of use: Spain",
      "Billing/home: United States",
      "Shipping: Barcelona, Spain",
      "NIE number application plus personal-data companion",
    ],
  },
  {
    id: "robert",
    name: "Robert Stevens",
    summary: "Lithuanian signature notarisation",
    caseLabel: "Simple generic route",
    status: "inferred",
    bullets: [
      "Country of use: Lithuania",
      "One signature notarisation product",
      "No hard-copy shipment",
      "No files attached yet",
    ],
  },
  {
    id: "elizabeth",
    name: "Elizabeth Midgley",
    summary: "Austrian FlexCo incorporation",
    caseLabel: "Participant review",
    status: "needs_review",
    bullets: [
      "Country of use: Austria",
      "FlexCo incorporation product",
      "UK billing context",
      "Participant ambiguity needs review",
    ],
  },
  {
    id: "amara",
    name: "Amara Okafor",
    summary: "German commercial-register signature route",
    caseLabel: "Complete generic route",
    status: "inferred",
    bullets: [
      "Country of use: Germany",
      "Billing/home: Netherlands",
      "Signature notarisation product",
      "Complete PDF evidence",
    ],
  },
  {
    id: "noah",
    name: "Noah Chen",
    summary: "Affidavit with missing country-of-use evidence",
    caseLabel: "Insufficient PDF data",
    status: "missing",
    bullets: [
      "Country of use: needs confirmation",
      "Billing/home: Canada",
      "Signature notarisation product",
      "PDF says country not stated",
    ],
  },
  {
    id: "sofia",
    name: "Sofia Rossi",
    summary: "Spanish bank route with Italian billing context",
    caseLabel: "Country conflict",
    status: "conflict",
    bullets: [
      "Country of use: Spain",
      "Billing/home: Italy",
      "Country conflict needs review",
      "Signature notarisation product",
    ],
  },
  {
    id: "kenji",
    name: "Kenji Tanaka",
    summary: "Spanish NIE route with apostille and hard copy",
    caseLabel: "Complete hard-copy route",
    status: "needs_review",
    bullets: [
      "Country of use: Spain",
      "Billing/home: Japan",
      "Shipping: Valencia, Spain",
      "NIE application plus companion PDF",
    ],
  },
  {
    id: "priya",
    name: "Priya Nair",
    summary: "German registry filing with possible co-signer",
    caseLabel: "Participant review",
    status: "needs_review",
    bullets: [
      "Country of use: Germany",
      "Billing/home: United Kingdom",
      "Participant ambiguity needs review",
      "Signature notarisation product",
    ],
  },
];

export function reviewStatusForFields(
  fields: Array<InferredField | undefined>,
  fallback: FieldStatus = "confirmed",
): FieldStatus {
  const statuses = fields.flatMap((field) => (field ? [field.status] : []));
  if (!statuses.length) return fallback;
  if (statuses.some((status) => status === "conflict")) return "conflict";
  if (statuses.some((status) => status === "missing")) return "missing";
  if (statuses.some((status) => status === "needs_review")) return "needs_review";
  if (statuses.some((status) => status === "edited")) return "edited";
  if (statuses.some((status) => status === "inferred")) return "inferred";
  if (statuses.every((status) => status === "not_applicable")) return "not_applicable";
  return "confirmed";
}

export function reviewActionForField(field: InferredField) {
  switch (field.key) {
    case "countryOfUse":
      return { label: "Review country", path: "/lens/country" };
    case "shippingAddress":
      return { label: "Review shipping", path: "/lens/country" };
    case "recommendedProduct":
      return { label: "Review product", path: "/lens/plan" };
    case "requiredCompanionDocument":
      return { label: "Review companion", path: "/lens/plan" };
    case "apostille":
      return { label: "Review apostille", path: "/lens/plan" };
    case "hardCopy":
      return { label: "Review hard copy", path: "/lens/plan" };
    case "participant":
    case "participantAmbiguity":
      return { label: "Review participants", path: "/lens/appointment" };
    default:
      return { label: "Review evidence", path: "/lens/evidence" };
  }
}

export function reviewStatuses(
  inference: DocumentFactExtraction,
  {
    hasHardCopy,
    hasShippingDetails,
    hasPayloadProducts,
  }: { hasHardCopy: boolean; hasShippingDetails: boolean; hasPayloadProducts: boolean },
) {
  return {
    products: inference.products.length
      ? reviewStatusForFields(inference.products)
      : hasPayloadProducts
        ? "confirmed"
        : "missing",
    billing: reviewStatusForFields([inference.billingAddress]),
    shipping: hasShippingDetails
      ? reviewStatusForFields([inference.shippingAddress], "needs_review")
      : "not_applicable",
    hardCopy: hasHardCopy
      ? reviewStatusForFields([inference.hardCopy], "needs_review")
      : "not_applicable",
  } satisfies Record<string, FieldStatus>;
}

export function fixtureCountrySummary(fixture: LensFixture) {
  return formatCountry(fixture.inference.countryOfUse.value);
}

export function fixtureProductSummary(fixture: LensFixture) {
  const products = fixture.inference.products.map(formatFieldValue);
  if (products.length) return products.join("; ");
  return fixture.payload
    ? formatProductSummary(fixture.payload)
    : "Product route needs review";
}

export function fixtureFilesSummary(fixture: LensFixture) {
  if (fixture.payload) return formatFilesSummary(fixture.payload);
  return fixture.documents.length
    ? fixture.documents.map((document) => document.canonicalName).join(", ")
    : "No files attached yet";
}

export function fixtureParticipantSummary(fixture: LensFixture) {
  const participants = fixture.inference.people
    .filter((field) => field.key === "participantEmail" || field.key === "participant")
    .map((field) => String(field.value));
  if (participants.length) return participants.join(", ");
  return fixture.payload
    ? formatParticipantsSummary(fixture.payload)
    : "No participants detected";
}

export function fixtureBillingSummary(fixture: LensFixture) {
  if (fixture.inference.billingAddress) {
    return String(fixture.inference.billingAddress.value);
  }
  return fixture.payload ? formatAddress(fixture.payload.billingDetails) : "Not extracted";
}

export function fixtureHasHardCopy(fixture: LensFixture) {
  return fixture.payload
    ? fixture.payload.hardCopy.hardCopy
    : fixture.inference.hardCopy?.value === true;
}

export function fixtureShippingSummary(fixture: LensFixture) {
  if (!fixtureHasHardCopy(fixture)) return "No hard copy shipment";
  if (fixture.inference.shippingAddress) {
    return String(fixture.inference.shippingAddress.value);
  }
  return fixture.payload ? formatShippingSummary(fixture.payload) : "Shipping details needed";
}

export function SubmissionDocumentPreview({ fixture }: { fixture: LensFixture }) {
  const [open, setOpen] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>();
  const payloadFiles = fixture.payload?.products.flatMap((product) => product.files) ?? [];

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold text-foreground">
              Documents before submit
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Preview the extracted PDFs and the payload file references before
            creating the booking request.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-status-confirmed px-2 py-1 text-status-confirmed-foreground">
              {fixture.documents.length} extracted document
              {fixture.documents.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-lens-surface-muted px-2 py-1 text-muted-foreground">
              {payloadFiles.length
                ? `${payloadFiles.length} payload file reference${
                    payloadFiles.length === 1 ? "" : "s"
                  }`
                : "No file attachment required by selected product"}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="submission-document-preview"
        >
          {open ? "Hide documents" : "Preview documents"}
        </Button>
      </div>

      {open ? (
        <div id="submission-document-preview" className="mt-5 grid gap-4">
          <DocumentFileList documents={fixture.documents} />
          {payloadFiles.length ? (
            <div className="rounded-lg border border-border bg-lens-surface-muted p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Payload file references
              </p>
              <p className="mt-2 break-words text-sm font-semibold text-foreground">
                {payloadFiles.join(", ")}
              </p>
            </div>
          ) : null}
          <PdfPreviewPanel
            inference={fixture.inference}
            documents={fixture.documents}
            activeDocumentId={activeDocumentId}
            onActiveDocumentChange={setActiveDocumentId}
          />
        </div>
      ) : null}
    </section>
  );
}

function DemoPdfViewer({
  fixture,
  activeDocumentId,
  onActiveDocumentChange,
}: {
  fixture: PersonaFixture;
  activeDocumentId?: string;
  onActiveDocumentChange: (documentId: string) => void;
}) {
  const selectedDocument =
    fixture.documents.find((document) => document.id === activeDocumentId) ??
    fixture.documents[0];
  const selectedPdfUrl = selectedDocument
    ? getFixturePdfUrl(fixture.id, selectedDocument.id)
    : undefined;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-lens-surface-muted/70 px-3 py-3">
        <div
          role="tablist"
          aria-label={`${fixture.name} PDF documents`}
          className="flex min-w-0 flex-1 flex-wrap gap-2"
        >
          {fixture.documents.map((document) => {
            const active = document.id === selectedDocument?.id;

            return (
              <button
                key={document.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onActiveDocumentChange(document.id)}
                className={`flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0 text-primary/75" aria-hidden="true" />
                <span className="max-w-[15rem] truncate">{document.filename}</span>
              </button>
            );
          })}
        </div>
        {selectedPdfUrl ? (
          <a
            href={selectedPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-8 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open PDF
          </a>
        ) : null}
      </div>

      {selectedDocument && selectedPdfUrl ? (
        <div className="bg-lens-surface-muted p-3">
          <iframe
            key={selectedDocument.id}
            title={`${selectedDocument.filename} PDF preview`}
            src={`${selectedPdfUrl}#toolbar=1&navpanes=0&view=FitH`}
            className="h-[78vh] min-h-[680px] max-h-[920px] w-full rounded-lg border border-border bg-white"
          />
        </div>
      ) : (
        <div className="grid min-h-[24rem] place-items-center p-6 text-center">
          <div>
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No fixture PDFs are available
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function SampleRequestGrid({
  loading,
  onSelect,
  onPreview,
  previewingPersona,
}: {
  loading: boolean;
  onSelect: (persona: PersonaFixture["id"]) => void;
  onPreview: (persona: PersonaFixture["id"]) => void;
  previewingPersona?: PersonaFixture["id"];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {sampleRequests.map((sample) => (
        <article
          key={sample.id}
          className="flex h-full flex-col rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]"
        >
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="text-sm font-semibold text-foreground">
                {sample.name}
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                {sample.summary}
              </span>
            </span>
            <StatusBadge status={sample.status} />
          </span>
          <span className="mt-3 inline-flex w-fit rounded-full bg-lens-surface-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            {sample.caseLabel}
          </span>
          <span className="mt-3 grid flex-1 content-start gap-2 text-sm text-muted-foreground">
            {sample.bullets.map((item) => (
              <span key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-confirmed-foreground" aria-hidden="true" />
                <span>{item}</span>
              </span>
            ))}
          </span>
          <span className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => onSelect(sample.id)}
              disabled={loading}
              aria-label={`Use ${sample.name} demo sample`}
            >
              Use demo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onPreview(sample.id)}
              disabled={loading || previewingPersona === sample.id}
              aria-label={`Preview PDFs for ${sample.name}`}
            >
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              {previewingPersona === sample.id ? "Loading..." : "Preview PDFs"}
            </Button>
          </span>
        </article>
      ))}
    </div>
  );
}

export function DemoSampleRequests({
  loading,
  onSelect,
  title = "Demo sample requests",
  defaultOpen = false,
}: {
  loading: boolean;
  onSelect: (persona: PersonaFixture["id"]) => void;
  title?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [previewFixture, setPreviewFixture] = useState<PersonaFixture | null>(null);
  const [previewingPersona, setPreviewingPersona] = useState<PersonaFixture["id"]>();
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activePreviewDocumentId, setActivePreviewDocumentId] = useState<string | undefined>();
  const previewPanelRef = useRef<HTMLElement | null>(null);
  const panelId = useId();
  const previewingSample = sampleRequests.find(
    (sample) => sample.id === previewingPersona,
  );

  useEffect(() => {
    if (!previewFixture && !previewingPersona && !previewError) return;
    previewPanelRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [previewError, previewFixture, previewingPersona]);

  const previewPersona = async (persona: PersonaFixture["id"]) => {
    setOpen(true);
    setPreviewingPersona(persona);
    setPreviewError(null);
    setPreviewFixture(null);
    setActivePreviewDocumentId(undefined);
    try {
      const fixture = await getPersonaFixture(persona);
      setPreviewFixture(fixture);
    } catch (error) {
      setPreviewFixture(null);
      setPreviewError(
        error instanceof Error ? error.message : "Unable to load demo documents",
      );
    } finally {
      setPreviewingPersona(undefined);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileSearch className="h-4 w-4 text-primary" aria-hidden="true" />
            {title}
          </span>
          <span className="mt-1 block text-sm leading-6 text-muted-foreground">
            These are demo-only fixtures for testing known scenarios. Real bookings
            should start with uploaded PDFs.
          </span>
        </span>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div id={panelId} className="grid gap-4 border-t border-border p-4">
          {previewingPersona ? (
            <section
              ref={previewPanelRef}
              className="rounded-xl border border-border bg-lens-surface-muted p-4"
            >
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Loading demo PDF preview
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {previewingSample?.name ?? "Demo sample"}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Fetching the fixture documents and original PDF files.
              </p>
            </section>
          ) : null}
          {previewError ? (
            <section
              ref={previewPanelRef}
              className="rounded-md border border-status-conflict bg-status-conflict px-4 py-3 text-sm text-status-conflict-foreground"
            >
              {previewError}
            </section>
          ) : null}
          {previewFixture ? (
            <section
              ref={previewPanelRef}
              className="grid gap-4 rounded-xl border border-border bg-lens-surface-muted p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Demo PDF viewer
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    {previewFixture.name}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {previewFixture.scenario}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSelect(previewFixture.id)}
                  disabled={loading}
                >
                  Use this demo
                </Button>
              </div>
              <DemoPdfViewer
                fixture={previewFixture}
                activeDocumentId={activePreviewDocumentId}
                onActiveDocumentChange={setActivePreviewDocumentId}
              />
            </section>
          ) : null}
          <SampleRequestGrid
            loading={loading}
            onSelect={onSelect}
            onPreview={(persona) => {
              void previewPersona(persona);
            }}
            previewingPersona={previewingPersona}
          />
        </div>
      ) : null}
    </section>
  );
}

export function useEnsureFixture() {
  const fixture = useLensStore((state) => state.fixture);
  const loadJoshuaDemo = useLensStore((state) => state.loadJoshuaDemo);
  const loading = useLensStore((state) => state.loading);
  return { fixture, loadJoshuaDemo, loading };
}

export function ScreenFrame({
  children,
  sidebar = true,
  railAction,
  rightRail,
}: {
  children: ReactNode;
  sidebar?: boolean;
  railAction?: ReactNode;
  rightRail?: ReactNode;
}) {
  const price = useLensStore((state) => state.price);
  const resolvedRightRail =
    rightRail !== undefined
      ? rightRail
      : sidebar
        ? <ReceiptSidebar price={price} action={railAction} />
        : undefined;

  return (
    <AppShell rightRail={resolvedRightRail}>
      {children}
    </AppShell>
  );
}

export function DemoError() {
  const error = useLensStore((state) => state.error);
  if (!error) return null;

  return (
    <div className="mb-4 rounded-md border border-status-conflict bg-status-conflict px-4 py-3 text-sm text-status-conflict-foreground">
      {error}
    </div>
  );
}

export function RequireFixture({
  children,
}: {
  children: (fixture: LensFixture, price: PriceResponse | null) => ReactNode;
}) {
  const { fixture, loadJoshuaDemo, loading } = useEnsureFixture();
  const loadPersona = useLensStore((state) => state.loadPersona);
  const price = useLensStore((state) => state.price);

  if (!fixture) {
    return (
      <ScreenFrame sidebar={false}>
        <DemoError />
        <div className="grid gap-4">
          <EmptyState onLoad={loadJoshuaDemo} loading={loading} />
          <DemoSampleRequests
            loading={loading}
            onSelect={(persona) => {
              void loadPersona(persona);
            }}
          />
        </div>
      </ScreenFrame>
    );
  }

  return <>{children(fixture, price)}</>;
}

export function formatDocumentSize(size: number) {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(1)} KB`;
  return `${size} B`;
}
