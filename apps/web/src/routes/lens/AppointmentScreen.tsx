import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, HelpCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/lens/components/StatusBadge";
import { unresolvedConfirmationFields } from "@/features/lens/readiness";
import { useLensStore } from "@/features/lens/store";
import { RequireFixture, ScreenFrame } from "./shared";

export function AppointmentScreen() {
  const navigate = useNavigate();
  const confirmPeople = useLensStore((state) => state.confirmPeople);
  const [participantHelpOpen, setParticipantHelpOpen] = useState(false);

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame sidebar={false}>
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
              <div className="mx-auto max-w-6xl">
                <div>
                  <h1 className="text-3xl font-semibold text-foreground">
                    Add participants and pick a time
                  </h1>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                    Everyone who signs needs to verify their identity. The draft
                    appointment details remain explicit before final review.
                  </p>
                </div>

                <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                  <div className="grid min-w-0 gap-6">
                    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-xl font-semibold text-foreground">
                            Participants
                          </h2>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Review the email addresses for every signer who needs
                            to join the notary appointment.
                          </p>
                        </div>
                        <StatusBadge status={participantStatus} />
                      </div>

                      <div className="mt-6 grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          Participant emails
                        </p>
                        {participantEmails.length ? (
                          participantEmails.map((email) => (
                            <div
                              key={email}
                              className="min-w-0 rounded-md border border-input bg-card px-3 py-2 shadow-[var(--shadow-card)]"
                            >
                              <p className="min-w-0 break-all text-sm leading-6 text-foreground">
                                {email}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-md border border-input bg-card px-3 py-2 shadow-[var(--shadow-card)]">
                            <p className="text-sm leading-6 text-muted-foreground">
                              No participants added
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-primary"
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
                          className="mt-3 rounded-lg border border-border bg-lens-surface-muted p-3 text-sm leading-6 text-muted-foreground"
                        >
                          <div className="flex items-start gap-2">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            <p className="min-w-0">
                              This draft currently lists {participantCount} participant
                              {participantCount === 1 ? "" : "s"}. Every signer
                              must be listed and verify identity during the appointment.
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </section>

                    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h2 className="text-xl font-semibold text-foreground">
                          Appointment slot
                        </h2>
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border border-input bg-card p-3 shadow-[var(--shadow-card)]">
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Timeslot ID
                          </p>
                          <p className="mt-1 break-all text-sm font-semibold text-foreground">
                            {payload?.timeslots[0] ?? "Pending draft payload"}
                          </p>
                        </div>
                        <div className="rounded-md border border-input bg-card p-3 shadow-[var(--shadow-card)]">
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Timezone
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold text-foreground">
                            {String(payload?.timezone ?? "Europe/Vienna")}
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <aside className="grid content-start gap-4 text-sm leading-6 text-muted-foreground">
                    <div className="rounded-xl border border-border bg-lens-surface-muted p-5">
                      <p>
                        Every person who signs on one or more documents has to
                        verify their identity. Without verification, the signature
                        cannot be notarised.
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-lens-surface-muted p-5">
                      <p>
                        Partner notaries confirm the final appointment time by email.
                        This screen keeps the slot explicit before final review.
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        confirmPeople();
                        navigate("/lens/review");
                      }}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </aside>
                </div>
              </div>
            );
          })()}
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
