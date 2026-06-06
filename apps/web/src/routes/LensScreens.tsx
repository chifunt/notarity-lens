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
import { formatEuro } from "@/features/lens/format";
import { useLensStore } from "@/features/lens/store";
import type { PersonaFixture, PriceResponse } from "@/features/lens/types";

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
  const price = useLensStore((state) => state.price);

  if (!fixture) {
    return (
      <ScreenFrame sidebar={false}>
        <DemoError />
        <EmptyState onLoad={loadJoshuaDemo} loading={loading} />
      </ScreenFrame>
    );
  }

  return <>{children(fixture, price)}</>;
}

export function StartScreen() {
  const navigate = useNavigate();
  const loadJoshuaDemo = useLensStore((state) => state.loadJoshuaDemo);
  const loading = useLensStore((state) => state.loading);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAndContinue = async () => {
    await loadJoshuaDemo();
    navigate("/lens/analyze");
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
            onChange={() => {
              void loadAndContinue();
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
            <Button variant="ghost" onClick={loadAndContinue} disabled={loading}>
              Use sample request
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-primary/35 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            className="rounded-xl border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:border-primary/35 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

        <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-foreground">Sample request output</h2>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {[
              "Country of use: Spain",
              "Billing/home: United States",
              "Shipping: Barcelona, Spain",
              "NIE number application plus NIE Personal Data",
            ].map((item) => (
              <div key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-confirmed-foreground" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
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
  const [activeStep, setActiveStep] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!fixture && !loading) {
      void loadJoshuaDemo();
    }
  }, [fixture, loadJoshuaDemo, loading]);

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
        {fixture ? <DocumentFileList documents={fixture.documents} /> : <EmptyState onLoad={loadJoshuaDemo} loading={loading} />}
        <ReadingProgress items={progressItems} />
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
      {(_fixture, price) => (
        <ScreenFrame sidebar={false}>
          <div className="mx-auto max-w-5xl">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Cost and next steps</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                See the itemized price before choosing the appointment details.
              </p>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <PreparationTimeline />
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
  const [participantHelpOpen, setParticipantHelpOpen] = useState(false);

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame>
          <div className="mx-auto max-w-5xl">
            <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
              <h1 className="text-3xl font-semibold text-foreground">Add participants and pick a time</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                The sample request is pre-filled for Joshua. The appointment slot
                uses the safe fallback fixture from the Notarity docs.
              </p>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="grid gap-4">
                  <article className="rounded-lg border border-border bg-lens-surface-muted p-4">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
                      <h2 className="text-base font-semibold text-foreground">Participants</h2>
                    </div>
                    <div className="mt-4 rounded-md border border-border bg-card px-3 py-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Client email</p>
                      <p className="mt-1 break-all text-sm font-semibold text-foreground">
                        {fixture.payload.participants[0]?.email}
                      </p>
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
                    {participantHelpOpen ? (
                      <div
                        id="participant-help"
                        className="mt-3 rounded-lg border border-border bg-card p-3 text-sm leading-6 text-muted-foreground"
                      >
                        <div className="flex items-start gap-2">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <p>
                            Every signer must be listed as a participant and verify
                            identity during the appointment. Joshua is the only
                            signer in this sample request.
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
                      Hard copy delivery remains Barcelona, Spain, separate from
                      Joshua's US billing context.
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
          {(() => {
            const readyToSubmit =
              fixture.inference.countryOfUse.status === "confirmed" &&
              fixture.inference.products.every((field) => field.status === "confirmed") &&
              Boolean(price);
            const summary = [
              { icon: Globe2, label: "Country of use", value: "Spain" },
              { icon: PackageCheck, label: "Booking", value: "NIE application + Personal Data" },
              { icon: UserRound, label: "Client", value: "Joshua Timms" },
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
                <ReviewSection
                  title="Country and route"
                  rows={[
                    {
                      label: "Country of use",
                      value: "Spain",
                      status: fixture.inference.countryOfUse.status,
                      onChange: () => navigate("/lens/country"),
                    },
                    {
                      label: "Products",
                      value: "NIE number application; NIE Personal Data",
                      status: "confirmed",
                      onChange: () => navigate("/lens/plan"),
                    },
                    {
                      label: "Documents",
                      value: fixture.payload.products.flatMap((product) => product.files).join(", "),
                      status: "confirmed",
                      onChange: () => navigate("/lens/evidence"),
                    },
                    {
                      label: "Hard copy",
                      value: "Yes, standard shipping",
                      status: "confirmed",
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
                      value: fixture.payload.participants[0]?.email ?? "",
                      status: "confirmed",
                      onChange: () => navigate("/lens/appointment"),
                    },
                    {
                      label: "Billing",
                      value: "Joshua Timms, New York, United States",
                      status: "confirmed",
                      onChange: () => navigate("/lens/evidence"),
                    },
                    {
                      label: "Shipping",
                      value: "Joshua Timms, Carrer de Mallorca 401, Barcelona, Spain",
                      status: "confirmed",
                      onChange: () => navigate("/lens/evidence"),
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
                      await submitBooking();
                      navigate("/lens/success");
                    }}
                    disabled={loading || !readyToSubmit}
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {loading
                      ? "Creating..."
                      : readyToSubmit
                        ? "Create booking request"
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
            <section className="rounded-xl border border-status-confirmed bg-card p-8 text-center shadow-[var(--shadow-card)]">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-confirmed text-status-confirmed-foreground">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-3xl font-semibold text-foreground">Booking request ready</h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {submitResult?.id ?? "appointment request"} was created in safe
                submit mode. The payload is ready for Notarity multipart submission
                when live credentials and live submit are enabled.
              </p>
              <div className="mt-6 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Country of use", "Spain"],
                  ["Products", "NIE application + Personal Data"],
                  ["Price", price ? formatEuro(price.confirmedPrice) : "EUR 580"],
                  ["Shipping", "Hard copy to Barcelona"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border bg-lens-surface-muted p-4">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
                    <p className="mt-1 font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-border bg-lens-surface-muted p-4 text-left">
                <h2 className="text-base font-semibold text-foreground">What happens next</h2>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <p>Video appointment and identity verification.</p>
                  <p>Digital original becomes available after notarisation.</p>
                  <p>Apostilled hard copy ships to Barcelona.</p>
                </div>
              </div>
            </section>
            <div className="mt-5">
              <PayloadPreview payload={fixture.payload} />
            </div>
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  navigate("/");
                }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Start another booking
              </Button>
            </div>
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
