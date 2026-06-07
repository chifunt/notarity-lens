import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
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
  Smartphone,
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
  formatFilesSummary,
  formatParticipantsSummary,
  formatProductSummary,
  formatShippingSummary,
} from "@/features/lens/display";
import { formatEuro } from "@/features/lens/format";
import {
  readyForSubmit,
  unresolvedConfirmationFields,
} from "@/features/lens/readiness";
import { useLensStore } from "@/features/lens/store";
import type {
  DocumentFactExtraction,
  FieldStatus,
  InferredField,
  PersonaFixture,
  PriceResponse,
} from "@/features/lens/types";

const sampleRequests: Array<{
  id: PersonaFixture["id"];
  name: string;
  summary: string;
  bullets: string[];
}> = [
  {
    id: "joshua",
    name: "Joshua Timms",
    summary: "Spanish NIE route with hard-copy shipping",
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
    bullets: [
      "Country of use: Austria",
      "FlexCo incorporation product",
      "UK billing context",
      "Participant ambiguity needs review",
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

function reviewStatuses(inference: DocumentFactExtraction, hasShippingDetails: boolean) {
  return {
    products: reviewStatusForFields(inference.products),
    billing: reviewStatusForFields([inference.billingAddress]),
    shipping: hasShippingDetails
      ? reviewStatusForFields([inference.shippingAddress], "needs_review")
      : "not_applicable",
    hardCopy: inference.hardCopy?.value
      ? reviewStatusForFields([inference.hardCopy], "needs_review")
      : "not_applicable",
  } satisfies Record<string, FieldStatus>;
}

function SampleRequestGrid({
  loading,
  onSelect,
}: {
  loading: boolean;
  onSelect: (persona: PersonaFixture["id"]) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {sampleRequests.map((sample) => (
        <button
          key={sample.id}
          type="button"
          onClick={() => onSelect(sample.id)}
          disabled={loading}
          aria-label={`Use ${sample.name} sample request`}
          className="rounded-lg border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-primary/35 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-60"
        >
          <span className="text-sm font-semibold text-foreground">{sample.name}</span>
          <span className="mt-1 block text-sm leading-6 text-muted-foreground">
            {sample.summary}
          </span>
          <span className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {sample.bullets.map((item) => (
              <span key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-confirmed-foreground" aria-hidden="true" />
                <span>{item}</span>
              </span>
            ))}
          </span>
        </button>
      ))}
    </div>
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
  children: (fixture: PersonaFixture, price: PriceResponse | null) => ReactNode;
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
          <section>
            <h2 className="text-sm font-semibold text-foreground">
              Or choose another sample
            </h2>
            <div className="mt-3">
              <SampleRequestGrid
                loading={loading}
                onSelect={(persona) => {
                  void loadPersona(persona);
                }}
              />
            </div>
          </section>
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAndContinue = async (persona: PersonaFixture["id"] = "joshua") => {
    const loaded = await loadPersona(persona);
    if (loaded) navigate("/lens/analyze");
  };

  const uploadAndContinue = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) return;

    const uploaded = await uploadDocuments(selectedFiles);
    if (uploaded) navigate("/lens/analyze");
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

        <div className="mt-8 rounded-2xl border border-dashed border-primary/35 bg-card p-5 text-center shadow-[var(--shadow-card)] sm:p-8">
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
              {loading ? "Reading documents..." : "Choose PDF documents"}
            </span>
            <span className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Upload the notarisation documents you already have. We keep the
              route as a draft until you approve it.
            </span>
          </button>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => navigate("/lens/analyze")}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              I will upload it later
            </Button>
            <Button variant="ghost" onClick={() => void loadAndContinue()} disabled={loading}>
              Use Joshua sample
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="rounded-xl border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-primary/35 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-60"
          >
            <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="mt-3 block text-sm font-semibold text-foreground">
              Choose from this device
            </span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
              Use the same PDF intake when the files are already available here.
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/lens/analyze")}
            disabled={loading}
            className="rounded-xl border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-primary/35 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-60"
          >
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="mt-3 block text-sm font-semibold text-foreground">
              Continue without files
            </span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">
              Start with a guided draft and attach documents before submission.
            </span>
          </button>
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">Sample requests</h2>
          <div className="mt-3">
            <SampleRequestGrid
              loading={loading}
              onSelect={(persona) => {
                void loadAndContinue(persona);
              }}
            />
          </div>
        </section>
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
    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        if (current >= analyzeSteps.length - 1) {
          window.clearInterval(timer);
          setComplete(true);
          window.setTimeout(() => navigate("/lens/evidence"), 500);
          return current;
        }
        return current + 1;
      });
    }, 650);

    return () => window.clearInterval(timer);
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
            <section>
              <h2 className="text-sm font-semibold text-foreground">
                Continue with a sample request
              </h2>
              <div className="mt-3">
                <SampleRequestGrid
                  loading={loading}
                  onSelect={(persona) => {
                    void loadSampleInPlace(persona);
                  }}
                />
              </div>
            </section>
          </div>
        ) : (
          <div className="grid gap-4">
            <EmptyState onLoad={loadJoshuaDemo} loading={loading} />
            <section>
              <h2 className="text-sm font-semibold text-foreground">
                Or choose another sample
              </h2>
              <div className="mt-3">
                <SampleRequestGrid
                  loading={loading}
                  onSelect={(persona) => {
                    void loadSampleInPlace(persona);
                  }}
                />
              </div>
            </section>
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
                The sample request is pre-filled for {fixture.name}. The appointment slot
                uses the safe fallback fixture from the Notarity docs.
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
                        {fixture.payload.participants.length ? (
                          fixture.payload.participants.map((participant) => (
                            <p
                              key={participant.email}
                              className="break-all text-sm font-semibold text-foreground"
                            >
                              {participant.email}
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
                            {` ${fixture.payload.participants.length}`} participant
                            {fixture.payload.participants.length === 1 ? "" : "s"}.
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
                          {fixture.payload.timeslots[0]}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-card p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">Timezone</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {String(fixture.payload.timezone ?? "Europe/Vienna")}
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
                      {formatShippingSummary(fixture.payload)} remains separate
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
            const unresolvedFields = unresolvedConfirmationFields(fixture.inference);
            const peopleStatus = unresolvedFields.some((field) =>
              fixture.inference.people.some((personField) => personField.key === field.key),
            )
              ? "needs_review"
              : reviewStatusForFields(fixture.inference.people);
            const statuses = reviewStatuses(
              fixture.inference,
              Boolean(fixture.payload.shippingDetails),
            );
            const readyToSubmit = readyForSubmit(fixture.inference, Boolean(price));
            const submitLabel =
              price?.source === "mock"
                ? "Create mock booking request"
                : "Create booking request";
            const summary = [
              {
                icon: Globe2,
                label: "Country of use",
                value: formatCountry(fixture.payload.destinationCountry),
              },
              { icon: PackageCheck, label: "Booking", value: formatProductSummary(fixture.payload) },
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
                  rows={[
                    {
                      label: "Country of use",
                      value: formatCountry(fixture.payload.destinationCountry),
                      status: fixture.inference.countryOfUse.status,
                      onChange: () => navigate("/lens/country"),
                    },
                    {
                      label: "Products",
                      value: formatProductSummary(fixture.payload),
                      status: statuses.products,
                      onChange: () => navigate("/lens/plan"),
                    },
                    {
                      label: "Documents",
                      value: formatFilesSummary(fixture.payload),
                      status: "confirmed",
                      onChange: () => navigate("/lens/evidence"),
                    },
                    {
                      label: "Hard copy",
                      value: formatShippingSummary(fixture.payload),
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
                  rows={[
                    {
                      label: "Participant",
                      value: formatParticipantsSummary(fixture.payload),
                      status: peopleStatus,
                      onChange: () => navigate("/lens/appointment"),
                    },
                    {
                      label: "Billing",
                      value: formatAddress(fixture.payload.billingDetails),
                      status: statuses.billing,
                      onChange: () => navigate("/lens/evidence"),
                    },
                    {
                      label: "Shipping",
                      value: formatShippingSummary(fixture.payload),
                      status: statuses.shipping,
                      onChange: () => navigate("/lens/country"),
                    },
                  ]}
                />
                <PayloadPreview payload={fixture.payload} />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={() => navigate("/lens/appointment")}>
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
            {submitResult ? (
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
            {submitResult ? (
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
