import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayloadPreview } from "@/features/lens/components/PayloadPreview";
import { formatCountry, formatProductSummary, formatShippingSummary } from "@/features/lens/display";
import { formatEuro } from "@/features/lens/format";
import { useLensStore } from "@/features/lens/store";
import { RequireFixture, ScreenFrame } from "./shared";

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
