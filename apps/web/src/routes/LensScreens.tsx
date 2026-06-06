import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileUp,
  Send,
  ShieldCheck,
  Truck,
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
import { ReadingProgress } from "@/features/lens/components/ReadingProgress";
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
    <AppShell>
      <div className={sidebar ? "grid gap-6 lg:grid-cols-[1fr_20rem]" : ""}>
        <div>{children}</div>
        {sidebar ? <ReceiptSidebar price={price} /> : null}
      </div>
    </AppShell>
  );
}

function DemoError() {
  const error = useLensStore((state) => state.error);
  if (!error) return null;

  return (
    <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
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

  const loadAndContinue = async () => {
    await loadJoshuaDemo();
    navigate("/lens/analyze");
  };

  return (
    <AppShell>
      <DemoError />
      <section className="grid min-h-[calc(100vh-12rem)] items-center gap-8 lg:grid-cols-[1fr_26rem]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-sm text-violet-900">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Nothing is submitted until you confirm.
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-normal text-slate-950">
            Upload your document
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            We will read it, suggest the right booking route, and show what needs
            your confirmation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={loadAndContinue} disabled={loading}>
              <FileUp className="h-4 w-4" aria-hidden="true" />
              {loading ? "Loading Joshua demo..." : "Load Joshua demo"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/lens/analyze")}>
              I will upload it later
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Joshua demo path</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            {[
              "Country of use: Spain",
              "Billing/home: United States",
              "Shipping: Barcelona, Spain",
              "NIE number application plus NIE Personal Data",
              "Receipt total: EUR 580",
            ].map((item) => (
              <div key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export function AnalyzeScreen() {
  const navigate = useNavigate();
  const { fixture, loadJoshuaDemo, loading } = useEnsureFixture();

  useEffect(() => {
    if (!fixture && !loading) {
      void loadJoshuaDemo();
    }
  }, [fixture, loadJoshuaDemo, loading]);

  return (
    <ScreenFrame>
      <DemoError />
      <div className="grid gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-950">Analyze documents</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            For demo reliability, this loads fixture extraction from the Joshua PDFs.
            Uploaded files use the same canonical filename mapping before submit.
          </p>
        </div>
        {fixture ? <DocumentFileList documents={fixture.documents} /> : <EmptyState onLoad={loadJoshuaDemo} loading={loading} />}
        <ReadingProgress />
        <div className="flex justify-end">
          <Button onClick={() => navigate("/lens/evidence")} disabled={!fixture}>
            Review evidence
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </ScreenFrame>
  );
}

export function EvidenceScreen() {
  const navigate = useNavigate();
  const confirmEvidence = useLensStore((state) => state.confirmEvidence);

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame>
          <DemoError />
          <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
            <PdfPreviewPanel inference={fixture.inference} />
            <section className="grid gap-4">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h1 className="text-3xl font-semibold text-slate-950">We found a likely route</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This is not a black-box autofill. Every important inference has
                  evidence and must be confirmed before submit.
                </p>
              </div>
              <InferenceFieldCard field={fixture.inference.countryOfUse} />
              {fixture.inference.products.map((field) => (
                <InferenceFieldCard key={field.key} field={field} />
              ))}
              {fixture.inference.people.map((field) => (
                <InferenceFieldCard key={field.key} field={field} />
              ))}
              {fixture.inference.billingAddress ? <InferenceFieldCard field={fixture.inference.billingAddress} /> : null}
              {fixture.inference.shippingAddress ? <InferenceFieldCard field={fixture.inference.shippingAddress} /> : null}
              {fixture.inference.apostille ? <InferenceFieldCard field={fixture.inference.apostille} /> : null}
              {fixture.inference.hardCopy ? <InferenceFieldCard field={fixture.inference.hardCopy} /> : null}
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
          <CountrySemanticsCard
            inference={fixture.inference}
            onConfirm={() => {
              confirmCountry();
              navigate("/lens/plan");
            }}
          />
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
          <ProductRouteCard
            fixture={fixture}
            onConfirm={() => {
              confirmRoute();
              navigate("/lens/cost");
            }}
          />
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
        <ScreenFrame>
          {price ? <LiveReceipt price={price} /> : null}
          <div className="mt-6">
            <PreparationTimeline />
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => navigate("/lens/appointment")}>
              Continue to appointment
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}

export function AppointmentScreen() {
  const navigate = useNavigate();

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-950">Appointment details</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Joshua is pre-filled for the hackathon demo. Timeslot is the mock
              fallback fixture from the Notarity docs.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <UserRound className="h-5 w-5 text-violet-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-slate-500">Participant</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {fixture.payload.participants[0]?.email}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <CalendarDays className="h-5 w-5 text-violet-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-slate-500">Timeslot</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {fixture.payload.timeslots[0]}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <Truck className="h-5 w-5 text-violet-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-slate-500">Shipping</p>
                <p className="mt-1 font-semibold text-slate-950">
                  Barcelona, Spain
                </p>
              </div>
            </div>
          </section>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => navigate("/lens/review")}>
              Review booking
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
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

            return (
          <div className="grid gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-semibold text-slate-950">Final review</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    AI prepared a draft from your documents. Nothing is submitted
                    until you confirm.
                  </p>
                </div>
                <StatusBadge status="confirmed" />
              </div>
            </section>
            <ReviewSection
              title="Country and route"
              rows={[
                { label: "Country of use", value: "Spain", status: fixture.inference.countryOfUse.status },
                { label: "Products", value: "NIE number application; NIE Personal Data", status: "confirmed" },
                { label: "Documents", value: fixture.payload.products.flatMap((product) => product.files).join(", "), status: "confirmed" },
                { label: "Hard copy", value: "Yes, standard shipping", status: "confirmed" },
                { label: "Price", value: price ? formatEuro(price.confirmedPrice) : "Pending", status: price ? "confirmed" : "missing" },
              ]}
            />
            <ReviewSection
              title="People and addresses"
              rows={[
                { label: "Participant", value: fixture.payload.participants[0]?.email ?? "", status: "confirmed" },
                { label: "Billing", value: "Joshua Timms, New York, United States", status: "confirmed" },
                { label: "Shipping", value: "Joshua Timms, Carrer de Mallorca 401, Barcelona, Spain", status: "confirmed" },
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
                    ? "Create mock booking request"
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

  return (
    <RequireFixture>
      {(fixture, price) => (
        <ScreenFrame sidebar={false}>
          <section className="rounded-lg border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" aria-hidden="true" />
            <h1 className="mt-4 text-3xl font-semibold text-slate-950">Booking created</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {submitResult?.id ?? "mock appointment request"} was created in mock
              mode. The payload is ready for Notarity multipart submission when
              live credentials and live submit are enabled.
            </p>
            <div className="mt-6 grid gap-4 text-left lg:grid-cols-4">
              {[
                ["Country of use", "Spain"],
                ["Products", "NIE application + Personal Data"],
                ["Price", price ? formatEuro(price.confirmedPrice) : "EUR 580"],
                ["Shipping", "Hard copy to Barcelona"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-1 font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-md bg-slate-50 p-4 text-left">
              <h2 className="text-base font-semibold text-slate-950">What happens next</h2>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p>Video appointment and identity verification.</p>
                <p>Digital original becomes available after notarisation.</p>
                <p>Apostilled hard copy ships to Barcelona.</p>
              </div>
            </div>
            <PayloadPreview payload={fixture.payload} />
            <div className="mt-6">
              <Button variant="outline" onClick={() => navigate("/")}>
                Start over
              </Button>
            </div>
          </section>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
