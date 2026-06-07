import { useEffect, useId, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileSearch,
  FileText,
  FileUp,
  Globe2,
  HelpCircle,
  Mail,
  MapPin,
  PackageCheck,
  Receipt as ReceiptIcon,
  RotateCcw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/features/lens/components/AppShell";
import { CountrySemanticsCard } from "@/features/lens/components/CountrySemanticsCard";
import { DocumentFileList } from "@/features/lens/components/DocumentFileList";
import { EmptyState } from "@/features/lens/components/EmptyState";
import { InferenceFieldCard } from "@/features/lens/components/InferenceFieldCard";
import { LiveReceipt } from "@/features/lens/components/LiveReceipt";
import { PayloadPreview } from "@/features/lens/components/PayloadPreview";
import { PdfPreviewPanel } from "@/features/lens/components/PdfPreviewPanel";
import { PreparationTimeline } from "@/features/lens/components/PreparationTimeline";
import { ProductRouteCard } from "@/features/lens/components/ProductRouteCard";
import { ReceiptSidebar } from "@/features/lens/components/ReceiptSidebar";
import {
  ReadingProgress,
  type ProgressItem,
} from "@/features/lens/components/ReadingProgress";
import { ReviewSection } from "@/features/lens/components/ReviewSection";
import { StatusBadge } from "@/features/lens/components/StatusBadge";
import {
  formatAddress,
  formatCountry,
  formatFieldValue,
  formatFilesSummary,
  formatParticipantsSummary,
  formatProductSummary,
  formatShippingSummary,
} from "@/features/lens/display";
import { formatEuro } from "@/features/lens/format";
import { getPersonaFixture } from "@/features/lens/api";
import {
  readyForSubmit,
  unresolvedConfirmationFields,
} from "@/features/lens/readiness";
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

function reviewStatusForFields(
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

function reviewActionForField(field: InferredField) {
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

function reviewStatuses(
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

function fixtureCountrySummary(fixture: LensFixture) {
  return fixture.payload
    ? formatCountry(fixture.payload.destinationCountry)
    : formatCountry(fixture.inference.countryOfUse.value);
}

function fixtureProductSummary(fixture: LensFixture) {
  if (fixture.payload) return formatProductSummary(fixture.payload);
  const products = fixture.inference.products.map(formatFieldValue);
  return products.length ? products.join("; ") : "Product route needs review";
}

function fixtureFilesSummary(fixture: LensFixture) {
  if (fixture.payload) return formatFilesSummary(fixture.payload);
  return fixture.documents.length
    ? fixture.documents.map((document) => document.canonicalName).join(", ")
    : "No files attached yet";
}

function fixtureParticipantSummary(fixture: LensFixture) {
  if (fixture.payload) return formatParticipantsSummary(fixture.payload);
  const participants = fixture.inference.people
    .filter((field) => field.key === "participantEmail" || field.key === "participant")
    .map((field) => String(field.value));
  return participants.length ? participants.join(", ") : "No participants detected";
}

function fixtureBillingSummary(fixture: LensFixture) {
  if (fixture.payload) return formatAddress(fixture.payload.billingDetails);
  return fixture.inference.billingAddress
    ? String(fixture.inference.billingAddress.value)
    : "Not extracted";
}

function fixtureHasHardCopy(fixture: LensFixture) {
  return fixture.payload
    ? fixture.payload.hardCopy.hardCopy
    : fixture.inference.hardCopy?.value === true;
}

function fixtureShippingSummary(fixture: LensFixture) {
  if (fixture.payload) return formatShippingSummary(fixture.payload);
  if (!fixtureHasHardCopy(fixture)) return "No hard copy shipment";
  return fixture.inference.shippingAddress
    ? String(fixture.inference.shippingAddress.value)
    : "Shipping details needed";
}

function SubmissionDocumentPreview({ fixture }: { fixture: LensFixture }) {
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

function DemoSampleRequests({
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
  const panelId = useId();

  const previewPersona = async (persona: PersonaFixture["id"]) => {
    setOpen(true);
    setPreviewingPersona(persona);
    setPreviewError(null);
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
          <SampleRequestGrid
            loading={loading}
            onSelect={onSelect}
            onPreview={(persona) => {
              void previewPersona(persona);
            }}
            previewingPersona={previewingPersona}
          />
          {previewError ? (
            <div className="rounded-md border border-status-conflict bg-status-conflict px-4 py-3 text-sm text-status-conflict-foreground">
              {previewError}
            </div>
          ) : null}
          {previewFixture ? (
            <section className="grid gap-4 rounded-xl border border-border bg-lens-surface-muted p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Demo PDF preview
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
              <DocumentFileList documents={previewFixture.documents} />
              <PdfPreviewPanel
                inference={previewFixture.inference}
                documents={previewFixture.documents}
                activeDocumentId={activePreviewDocumentId}
                onActiveDocumentChange={setActivePreviewDocumentId}
              />
            </section>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function useEnsureFixture() {
  const fixture = useLensStore((state) => state.fixture);
  const loadJoshuaDemo = useLensStore((state) => state.loadJoshuaDemo);
  const loading = useLensStore((state) => state.loading);
  return { fixture, loadJoshuaDemo, loading };
}

function ScreenFrame({
  children,
  sidebar = true,
}: {
  children: ReactNode;
  sidebar?: boolean;
}) {
  const price = useLensStore((state) => state.price);

  return (
    <AppShell rightRail={sidebar ? <ReceiptSidebar price={price} /> : undefined}>
      {children}
    </AppShell>
  );
}

function DemoError() {
  const error = useLensStore((state) => state.error);
  if (!error) return null;

  return (
    <div className="mb-4 rounded-md border border-status-conflict bg-status-conflict px-4 py-3 text-sm text-status-conflict-foreground">
      {error}
    </div>
  );
}

function RequireFixture({
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

export function StartScreen() {
  const navigate = useNavigate();
  const loadPersona = useLensStore((state) => state.loadPersona);
  const uploadDocuments = useLensStore((state) => state.uploadDocuments);
  const loading = useLensStore((state) => state.loading);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAndContinue = async (persona: PersonaFixture["id"]) => {
    const loaded = await loadPersona(persona);
    if (loaded) navigate("/lens/analyze");
  };

  const uploadAndContinue = async (files: FileList | File[] | null) => {
    const selectedFiles = Array.from(files ?? []).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );
    if (!selectedFiles.length) return;

    const uploaded = await uploadDocuments(selectedFiles);
    if (uploaded) navigate("/lens/analyze");
  };

  const handleDragEvent = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <AppShell>
      <DemoError />
      <section className="mx-auto flex min-h-[calc(100vh-15rem)] w-full max-w-3xl flex-col justify-center py-8">
        <div className="text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            <ShieldCheck className="h-4 w-4 text-status-confirmed-foreground" aria-hidden="true" />
            AI prepares a draft. Nothing is submitted until you confirm.
          </div>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
            Upload your document
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            We read the documents, find the likely booking route, and ask you to
            confirm the fields that matter.
          </p>
        </div>

        <div
          className={`mt-8 rounded-2xl border border-dashed p-5 text-center shadow-[var(--shadow-card)] transition-colors sm:p-8 ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-primary/35 bg-card"
          }`}
          onDragEnter={(event) => {
            handleDragEvent(event);
            setDragActive(true);
          }}
          onDragOver={(event) => {
            handleDragEvent(event);
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            handleDragEvent(event);
            if (event.currentTarget === event.target) setDragActive(false);
          }}
          onDrop={(event) => {
            handleDragEvent(event);
            setDragActive(false);
            void uploadAndContinue(Array.from(event.dataTransfer.files));
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            hidden
            aria-hidden="true"
            tabIndex={-1}
            onChange={(event) => {
              const input = event.currentTarget;
              void uploadAndContinue(input.files).finally(() => {
                input.value = "";
              });
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="group flex min-h-64 w-full flex-col items-center justify-center rounded-xl border border-border bg-secondary/60 px-6 py-10 transition-colors hover:border-primary/45 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <FileUp className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="mt-5 text-lg font-semibold text-foreground">
              {loading
                ? "Reading documents..."
                : dragActive
                  ? "Drop PDF documents"
                  : "Drop PDFs here or choose documents"}
            </span>
            <span className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Upload the notarisation documents you already have. We keep the
              route as a draft until you approve it.
            </span>
          </button>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/lens/analyze")}
              disabled={loading}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Continue without files
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <DemoSampleRequests
            loading={loading}
            onSelect={(persona) => {
              void loadAndContinue(persona);
            }}
          />
        </div>
      </section>
    </AppShell>
  );
}

const analyzeSteps: ProgressItem[] = [
  {
    label: "Receive uploaded documents",
    detail: "Store original filenames and create canonical payload names.",
    status: "pending",
  },
  {
    label: "Extract document text",
    detail: "Read each page so cited evidence can be shown beside inferences.",
    status: "pending",
  },
  {
    label: "Infer country of use",
    detail: "Look for jurisdiction evidence without mixing it up with residence or shipping.",
    status: "pending",
  },
  {
    label: "Map route to Notarity products",
    detail: "Use deterministic product IDs and companion-document rules.",
    status: "pending",
  },
  {
    label: "Prepare review draft",
    detail: "Assemble field states, evidence, price request, and payload preview.",
    status: "pending",
  },
];

export function AnalyzeScreen() {
  const navigate = useNavigate();
  const { fixture, loadJoshuaDemo, loading } = useEnsureFixture();
  const loadPersona = useLensStore((state) => state.loadPersona);
  const uploadedDocuments = useLensStore((state) => state.uploadedDocuments);
  const [activeStep, setActiveStep] = useState(0);
  const [complete, setComplete] = useState(false);

  const loadSampleInPlace = async (persona: PersonaFixture["id"]) => {
    await loadPersona(persona);
  };

  useEffect(() => {
    if (!fixture) return;

    setActiveStep(0);
    setComplete(false);
    let evidenceTimer: number | undefined;
    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        if (current >= analyzeSteps.length - 1) {
          window.clearInterval(timer);
          setComplete(true);
          evidenceTimer = window.setTimeout(() => navigate("/lens/evidence"), 500);
          return current;
        }
        return current + 1;
      });
    }, 650);

    return () => {
      window.clearInterval(timer);
      if (evidenceTimer) window.clearTimeout(evidenceTimer);
    };
  }, [fixture, navigate]);

  const progressItems = useMemo(
    () =>
      analyzeSteps.map((item, index) => ({
        ...item,
        status:
          complete || index < activeStep
            ? "done"
            : index === activeStep
              ? "active"
              : "pending",
      })) satisfies ProgressItem[],
    [activeStep, complete],
  );

  return (
    <ScreenFrame>
      <DemoError />
      <div className="grid gap-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h1 className="text-3xl font-semibold text-foreground">Reading your documents</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Lens prepares a draft route from document evidence, deterministic
            product rules, and the Notarity pricing contract.
          </p>
        </div>
        {fixture ? (
          <DocumentFileList documents={fixture.documents} />
        ) : uploadedDocuments.length ? (
          <div className="grid gap-4">
            <DocumentFileList documents={uploadedDocuments} />
            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-semibold text-foreground">
                Uploaded documents received
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                These files are stored as upload metadata. Choose a sample
                request when you need a complete route, price, and payload draft.
              </p>
            </div>
            <DemoSampleRequests
              loading={loading}
              title="Demo fallback samples"
              onSelect={(persona) => {
                void loadSampleInPlace(persona);
              }}
            />
          </div>
        ) : (
          <div className="grid gap-4">
            <EmptyState onLoad={loadJoshuaDemo} loading={loading} />
            <DemoSampleRequests
              loading={loading}
              onSelect={(persona) => {
                void loadSampleInPlace(persona);
              }}
            />
          </div>
        )}
        {fixture ? <ReadingProgress items={progressItems} /> : null}
        {complete ? (
          <div className="flex justify-end">
            <Button onClick={() => navigate("/lens/evidence")} disabled={!fixture}>
              Open evidence
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </div>
    </ScreenFrame>
  );
}

export function EvidenceScreen() {
  const navigate = useNavigate();
  const confirmEvidence = useLensStore((state) => state.confirmEvidence);
  const [activeEvidenceDocumentId, setActiveEvidenceDocumentId] = useState<string | undefined>();

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame>
          <DemoError />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)]">
            <PdfPreviewPanel
              inference={fixture.inference}
              documents={fixture.documents}
              activeDocumentId={activeEvidenceDocumentId}
              onActiveDocumentChange={setActiveEvidenceDocumentId}
            />
            <section className="grid gap-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <h1 className="text-3xl font-semibold text-foreground">We found a likely route</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This is not a black-box autofill. Every important inference has
                  evidence and must be confirmed before submit.
                </p>
              </div>
              <InferenceFieldCard
                field={fixture.inference.countryOfUse}
                onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
              />
              {fixture.inference.products.map((field) => (
                <InferenceFieldCard
                  key={field.key}
                  field={field}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ))}
              {fixture.inference.people.map((field) => (
                <InferenceFieldCard
                  key={field.key}
                  field={field}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ))}
              {fixture.inference.billingAddress ? (
                <InferenceFieldCard
                  field={fixture.inference.billingAddress}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ) : null}
              {fixture.inference.shippingAddress ? (
                <InferenceFieldCard
                  field={fixture.inference.shippingAddress}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ) : null}
              {fixture.inference.apostille ? (
                <InferenceFieldCard
                  field={fixture.inference.apostille}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ) : null}
              {fixture.inference.hardCopy ? (
                <InferenceFieldCard
                  field={fixture.inference.hardCopy}
                  onEvidenceSelect={(evidence) => setActiveEvidenceDocumentId(evidence.documentId)}
                />
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    confirmEvidence();
                    navigate("/lens/country");
                  }}
                >
                  Continue to country
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </section>
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}

export function CountryScreen() {
  const navigate = useNavigate();
  const confirmCountry = useLensStore((state) => state.confirmCountry);

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame>
          <div className="mx-auto max-w-3xl">
            <CountrySemanticsCard
              inference={fixture.inference}
              payload={fixture.payload}
              onConfirm={() => {
                confirmCountry();
                navigate("/lens/plan");
              }}
              onShowEvidence={() => navigate("/lens/evidence")}
            />
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}

export function PlanScreen() {
  const navigate = useNavigate();
  const confirmRoute = useLensStore((state) => state.confirmRoute);

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame>
          <div className="mx-auto max-w-3xl">
            <ProductRouteCard
              fixture={fixture}
              onConfirm={() => {
                confirmRoute();
                navigate("/lens/cost");
              }}
              onShowEvidence={() => navigate("/lens/evidence")}
            />
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}

export function CostScreen() {
  const navigate = useNavigate();

  return (
    <RequireFixture>
      {(fixture, price) => (
        <ScreenFrame sidebar={false}>
          <div className="mx-auto max-w-5xl">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Cost and next steps</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                See the itemized price before choosing the appointment details.
              </p>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <PreparationTimeline fixture={fixture} />
              {price ? <LiveReceipt price={price} /> : null}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => navigate("/lens/appointment")}>
                Continue to appointment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}

export function AppointmentScreen() {
  const navigate = useNavigate();
  const confirmPeople = useLensStore((state) => state.confirmPeople);
  const [participantHelpOpen, setParticipantHelpOpen] = useState(false);

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame>
          {(() => {
            const payload = fixture.payload;
            const participantEmails = payload
              ? payload.participants.map((participant) => participant.email)
              : fixture.inference.people
                  .filter((field) => field.key === "participantEmail")
                  .map((field) => String(field.value));
            const participantCount = participantEmails.length;
            const participantUnresolved = unresolvedConfirmationFields(
              fixture.inference,
            ).filter((field) =>
              fixture.inference.people.some((personField) => personField.key === field.key),
            );
            const participantStatus = participantUnresolved.length
              ? "needs_review"
              : "confirmed";

            return (
          <div className="mx-auto max-w-5xl">
            <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
              <h1 className="text-3xl font-semibold text-foreground">Add participants and pick a time</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                The draft is pre-filled for {fixture.name}. The appointment slot
                remains explicit before final review.
              </p>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="grid gap-4">
                  <article className="rounded-lg border border-border bg-lens-surface-muted p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h2 className="text-base font-semibold text-foreground">Participants</h2>
                      </div>
                      <StatusBadge status={participantStatus} />
                    </div>
                    <div className="mt-4 rounded-md border border-border bg-card px-3 py-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Participant emails</p>
                      <div className="mt-2 grid gap-2">
                        {participantEmails.length ? (
                          participantEmails.map((email) => (
                            <p
                              key={email}
                              className="break-all text-sm font-semibold text-foreground"
                            >
                              {email}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No participants added
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-primary"
                      aria-controls="participant-help"
                      aria-expanded={participantHelpOpen}
                      onClick={() => setParticipantHelpOpen((open) => !open)}
                    >
                      <HelpCircle className="h-4 w-4" aria-hidden="true" />
                      Who needs to join?
                    </Button>
                    {participantUnresolved.length ? (
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3"
                        onClick={confirmPeople}
                      >
                        Confirm listed participants
                      </Button>
                    ) : null}
                    {participantHelpOpen ? (
                      <div
                        id="participant-help"
                        className="mt-3 rounded-lg border border-border bg-card p-3 text-sm leading-6 text-muted-foreground"
                      >
                        <div className="flex items-start gap-2">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <p>
                            Every signer must be listed as a participant and verify
                            identity during the appointment. This payload currently lists
                            {` ${participantCount}`} participant
                            {participantCount === 1 ? "" : "s"}.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </article>

                  <article className="rounded-lg border border-border bg-lens-surface-muted p-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
                      <h2 className="text-base font-semibold text-foreground">Appointment slot</h2>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border border-border bg-card p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Timeslot ID</p>
                        <p className="mt-1 break-all text-sm font-semibold text-foreground">
                          {payload?.timeslots[0] ?? "Pending draft payload"}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-card p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Timezone</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {String(payload?.timezone ?? "Europe/Vienna")}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>

                <aside className="grid content-start gap-3 text-sm text-muted-foreground">
                  <div className="rounded-lg border border-border bg-lens-surface-muted p-4">
                    <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
                    <p className="mt-3">
                      Partner notaries confirm the final appointment time by email.
                      This screen keeps the slot explicit before final review.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-lens-surface-muted p-4">
                    <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                    <p className="mt-3">
                      {fixtureShippingSummary(fixture)} remains separate
                      from {fixture.name}'s billing context.
                    </p>
                  </div>
                </aside>
              </div>
            </section>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => navigate("/lens/review")}>
                Review booking
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
            );
          })()}
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}

export function ReviewScreen() {
  const navigate = useNavigate();
  const submitBooking = useLensStore((state) => state.submitBooking);
  const loading = useLensStore((state) => state.loading);

  return (
    <RequireFixture>
      {(fixture, price) => (
        <ScreenFrame>
          <DemoError />
          {(() => {
            const payload = fixture.payload;
            const unresolvedFields = unresolvedConfirmationFields(fixture.inference);
            const peopleStatus = unresolvedFields.some((field) =>
              fixture.inference.people.some((personField) => personField.key === field.key),
            )
              ? "needs_review"
              : reviewStatusForFields(fixture.inference.people);
            const statuses = reviewStatuses(
              fixture.inference,
              {
                hasHardCopy: fixtureHasHardCopy(fixture),
                hasShippingDetails: Boolean(payload?.shippingDetails || fixture.inference.shippingAddress),
                hasPayloadProducts: Boolean(payload?.products.length),
              },
            );
            const readyToSubmit = Boolean(payload) && readyForSubmit(fixture.inference, Boolean(price));
            const submitLabel =
              !payload
                ? "Payload not ready"
                : price?.source === "mock"
                ? "Create mock booking request"
                : "Create booking request";
            const summary = [
              {
                icon: Globe2,
                label: "Country of use",
                value: fixtureCountrySummary(fixture),
              },
              { icon: PackageCheck, label: "Booking", value: fixtureProductSummary(fixture) },
              { icon: UserRound, label: "Client", value: fixture.name },
              { icon: ReceiptIcon, label: "Total", value: price ? formatEuro(price.confirmedPrice) : "Pending" },
            ];

            return (
              <div className="grid gap-5">
                <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-3xl font-semibold text-foreground">Final review</h1>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Lens prepared a draft from your documents. Nothing is submitted
                        until you confirm.
                      </p>
                    </div>
                    <StatusBadge status="confirmed" />
                  </div>
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                    {summary.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.label} className="flex items-start gap-3 rounded-lg border border-border bg-lens-surface-muted p-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-foreground">
                              {item.value}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
                {unresolvedFields.length ? (
                  <section className="rounded-xl border border-status-needs-review bg-card p-5 shadow-[var(--shadow-card)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-foreground">
                          Confirm these before submit
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Lens will not create a booking request while required
                          document inferences still need review.
                        </p>
                      </div>
                      <StatusBadge status="needs_review" />
                    </div>
                    <div className="mt-4 grid gap-3">
                      {unresolvedFields.map((field) => (
                        <div
                          key={field.key}
                          className="grid gap-2 rounded-lg border border-border bg-lens-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {field.label}
                            </p>
                            {field.explanation ? (
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {field.explanation}
                              </p>
                            ) : null}
                          </div>
                          <div className="grid justify-items-start gap-2 sm:justify-items-end">
                            <StatusBadge status={field.status} />
                            {(() => {
                              const action = reviewActionForField(field);
                              return (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(action.path)}
                                >
                                  {action.label}
                                </Button>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
                <ReviewSection
                  title="Country and route"
                  disabled={loading}
                  rows={[
                    {
                      label: "Country of use",
                      value: fixtureCountrySummary(fixture),
                      status: fixture.inference.countryOfUse.status,
                      onChange: () => navigate("/lens/country"),
                    },
                    {
                      label: "Products",
                      value: fixtureProductSummary(fixture),
                      status: statuses.products,
                      onChange: () => navigate("/lens/plan"),
                    },
                    {
                      label: "Documents",
                      value: fixtureFilesSummary(fixture),
                      status: "confirmed",
                      onChange: () => navigate("/lens/evidence"),
                    },
                    {
                      label: "Hard copy",
                      value: fixtureShippingSummary(fixture),
                      status: statuses.hardCopy,
                      onChange: () => navigate("/lens/plan"),
                    },
                    {
                      label: "Price",
                      value: price ? formatEuro(price.confirmedPrice) : "Pending",
                      status: price ? "confirmed" : "missing",
                      onChange: () => navigate("/lens/cost"),
                    },
                  ]}
                />
                <ReviewSection
                  title="People and addresses"
                  disabled={loading}
                  rows={[
                    {
                      label: "Participant",
                      value: fixtureParticipantSummary(fixture),
                      status: peopleStatus,
                      onChange: () => navigate("/lens/appointment"),
                    },
                    {
                      label: "Billing",
                      value: fixtureBillingSummary(fixture),
                      status: statuses.billing,
                      onChange: () => navigate("/lens/evidence"),
                    },
                    {
                      label: "Shipping",
                      value: fixtureShippingSummary(fixture),
                      status: statuses.shipping,
                      onChange: () => navigate("/lens/country"),
                    },
                  ]}
                />
                <SubmissionDocumentPreview fixture={fixture} />
                {payload ? (
                  <PayloadPreview payload={payload} />
                ) : (
                  <section className="rounded-xl border border-status-needs-review bg-card p-5 shadow-[var(--shadow-card)]">
                    <h2 className="text-base font-semibold text-foreground">
                      Payload preview pending
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      The uploaded PDF evidence is ready for review. Product IDs,
                      appointment details, price, and submit payload still need to
                      be generated before booking.
                    </p>
                  </section>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/lens/appointment")}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={async () => {
                      const submitted = await submitBooking();
                      if (submitted) navigate("/lens/success");
                    }}
                    disabled={loading || !readyToSubmit}
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {loading
                      ? "Creating..."
                      : readyToSubmit
                        ? submitLabel
                        : "Confirm required fields first"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}

export function SuccessScreen() {
  const navigate = useNavigate();
  const submitResult = useLensStore((state) => state.submitResult);
  const reset = useLensStore((state) => state.reset);

  return (
    <RequireFixture>
      {(fixture, price) => (
        <ScreenFrame sidebar={false}>
          <div className="mx-auto max-w-3xl">
            {submitResult && fixture.payload ? (
              <section className="rounded-xl border border-status-confirmed bg-card p-8 text-center shadow-[var(--shadow-card)]">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-confirmed text-status-confirmed-foreground">
                  <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                </span>
                <h1 className="mt-4 text-3xl font-semibold text-foreground">
                  Booking request ready
                </h1>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {submitResult.id} was created in safe submit mode. The payload
                  is ready for Notarity multipart submission when live credentials
                  and live submit are enabled.
                </p>
                <div className="mt-6 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Country of use", formatCountry(fixture.payload.destinationCountry)],
                    ["Products", formatProductSummary(fixture.payload)],
                    [
                      "Price",
                      price
                        ? formatEuro(price.confirmedPrice)
                        : fixture.payload.confirmedPrice
                          ? formatEuro(fixture.payload.confirmedPrice)
                          : "Pending",
                    ],
                    ["Shipping", formatShippingSummary(fixture.payload)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border bg-lens-surface-muted p-4"
                    >
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg border border-border bg-lens-surface-muted p-4 text-left">
                  <h2 className="text-base font-semibold text-foreground">
                    What happens next
                  </h2>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>Video appointment and identity verification.</p>
                    <p>Digital original becomes available after notarisation.</p>
                    <p>{formatShippingSummary(fixture.payload)}.</p>
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-xl border border-status-needs-review bg-card p-8 text-center shadow-[var(--shadow-card)]">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-needs-review text-status-needs-review-foreground">
                  <Clock3 className="h-7 w-7" aria-hidden="true" />
                </span>
                <h1 className="mt-4 text-3xl font-semibold text-foreground">
                  No booking request created yet
                </h1>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Review the confirmed draft and create a mock booking request
                  before using the success summary.
                </p>
                <div className="mt-6 flex justify-center">
                  <Button onClick={() => navigate("/lens/review")}>
                    Return to final review
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </section>
            )}
            {submitResult && fixture.payload ? (
              <div className="mt-5">
                <PayloadPreview payload={fixture.payload} />
              </div>
            ) : null}
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  navigate("/");
                }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {submitResult ? "Start another booking" : "Start over"}
              </Button>
            </div>
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
