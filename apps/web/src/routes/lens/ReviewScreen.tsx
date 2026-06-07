import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Globe2,
  PackageCheck,
  Receipt as ReceiptIcon,
  Send,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayloadPreview } from "@/features/lens/components/PayloadPreview";
import { ReviewSection } from "@/features/lens/components/ReviewSection";
import { StatusBadge } from "@/features/lens/components/StatusBadge";
import { formatEuro } from "@/features/lens/format";
import { readyForSubmit, unresolvedConfirmationFields } from "@/features/lens/readiness";
import { useLensStore } from "@/features/lens/store";
import {
  DemoError,
  RequireFixture,
  ScreenFrame,
  SubmissionDocumentPreview,
  fixtureBillingSummary,
  fixtureCountrySummary,
  fixtureFilesSummary,
  fixtureHasHardCopy,
  fixtureParticipantSummary,
  fixtureProductSummary,
  fixtureShippingSummary,
  reviewActionForField,
  reviewStatusForFields,
  reviewStatuses,
} from "./shared";

export function ReviewScreen() {
  const navigate = useNavigate();
  const submitBooking = useLensStore((state) => state.submitBooking);
  const loading = useLensStore((state) => state.loading);
  const appointmentSelection = useLensStore((state) => state.appointmentSelection);

  return (
    <RequireFixture>
      {(fixture, price) => {
        const payload = fixture.payload;
        const unresolvedFields = unresolvedConfirmationFields(fixture.inference);
        const peopleStatus = unresolvedFields.some((field) =>
          fixture.inference.people.some((personField) => personField.key === field.key),
        )
          ? "needs_review"
          : reviewStatusForFields(fixture.inference.people);
        const statuses = reviewStatuses(fixture.inference, {
          hasHardCopy: fixtureHasHardCopy(fixture),
          hasShippingDetails: Boolean(
            payload?.shippingDetails || fixture.inference.shippingAddress,
          ),
          hasPayloadProducts: Boolean(payload?.products.length),
        });
        const readyToSubmit =
          Boolean(payload) && readyForSubmit(fixture.inference, Boolean(price));
        const submitLabel = !payload
          ? "Payload not ready"
          : price?.source === "mock"
            ? "Create mock booking request"
            : "Create booking request";
        const appointmentSummary = `${appointmentSelection.dateLabel} at ${appointmentSelection.time}`;
        const summary = [
          {
            icon: Globe2,
            label: "Country of use",
            value: fixtureCountrySummary(fixture),
          },
          { icon: PackageCheck, label: "Booking", value: fixtureProductSummary(fixture) },
          { icon: CalendarDays, label: "Appointment", value: appointmentSummary },
          { icon: UserRound, label: "Client", value: fixture.name },
          {
            icon: ReceiptIcon,
            label: "Total",
            value: price ? formatEuro(price.confirmedPrice) : "Pending",
          },
        ];

        return (
          <ScreenFrame
            railAction={
              <div className="grid gap-2">
                <Button
                  type="button"
                  className="w-full"
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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/lens/appointment")}
                  disabled={loading}
                >
                  Back
                </Button>
              </div>
            }
          >
            <DemoError />
            <div className="grid gap-5">
              <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-3xl font-semibold text-foreground">
                      Final review
                    </h1>
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
                      <li
                        key={item.label}
                        className="flex items-start gap-3 rounded-lg border border-border bg-lens-surface-muted p-3"
                      >
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
                        Lens will not create a booking request while required document
                        inferences still need review.
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
                    label: "Appointment",
                    value: `${appointmentSummary} (${appointmentSelection.timezone})`,
                    status: "confirmed",
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
                    appointment details, price, and submit payload still need to be
                    generated before booking.
                  </p>
                </section>
              )}
            </div>
          </ScreenFrame>
        );
      }}
    </RequireFixture>
  );
}
