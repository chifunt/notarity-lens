import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  HelpCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableInferenceFieldCard } from "@/features/lens/components/EditableInferenceFieldCard";
import { StatusBadge } from "@/features/lens/components/StatusBadge";
import { unresolvedConfirmationFields } from "@/features/lens/readiness";
import { useLensStore } from "@/features/lens/store";
import { RequireFixture, ScreenFrame } from "./shared";
import { editableFieldsForKeys } from "./inferenceFieldSpecs";

const appointmentDates = [
  { label: "Tue, Jun 09", value: "2026-06-09" },
  { label: "Wed, Jun 10", value: "2026-06-10" },
  { label: "Thu, Jun 11", value: "2026-06-11" },
];

const appointmentTimes = [
  { label: "09:00", value: "09:00" },
  { label: "10:30", value: "10:30" },
  { label: "14:00", value: "14:00" },
  { label: "16:30", value: "16:30" },
];

const timezoneOptions = ["Europe/Vienna", "UTC", "Europe/London"];

export function AppointmentScreen() {
  const navigate = useNavigate();
  const confirmPeople = useLensStore((state) => state.confirmPeople);
  const confirmInferenceField = useLensStore((state) => state.confirmInferenceField);
  const markInferenceFieldUnsure = useLensStore(
    (state) => state.markInferenceFieldUnsure,
  );
  const saveInferenceField = useLensStore((state) => state.saveInferenceField);
  const appointmentSelection = useLensStore((state) => state.appointmentSelection);
  const selectAppointmentSlot = useLensStore((state) => state.selectAppointmentSlot);
  const [participantHelpOpen, setParticipantHelpOpen] = useState(false);
  const selectedDateIndex = Math.max(
    0,
    appointmentDates.findIndex((date) => date.value === appointmentSelection.date),
  );
  const timezoneValues = timezoneOptions.includes(appointmentSelection.timezone)
    ? timezoneOptions
    : [appointmentSelection.timezone, ...timezoneOptions];

  const chooseDate = (date: (typeof appointmentDates)[number]) => {
    selectAppointmentSlot({
      ...appointmentSelection,
      date: date.value,
      dateLabel: date.label,
    });
  };

  const chooseAdjacentDate = (offset: -1 | 1) => {
    const nextDate = appointmentDates[selectedDateIndex + offset];
    if (nextDate) chooseDate(nextDate);
  };

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
            const editableParticipantFields = editableFieldsForKeys(fixture.inference, [
              "participant",
              "participantEmail",
            ]);
            const participantCount = participantEmails.length;
            const participantUnresolved = unresolvedConfirmationFields(
              fixture.inference,
            ).filter((field) =>
              fixture.inference.people.some(
                (personField) => personField.key === field.key,
              ),
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
                    Everyone who signs needs to verify their identity. Then pick a date
                    that suits you. Our partner notaries confirm the final time by email.
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
                            Review the signer details and email addresses for everyone who
                            needs to join the notary appointment.
                          </p>
                        </div>
                        <StatusBadge status={participantStatus} />
                      </div>

                      <div className="mt-6 grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          Participant details
                        </p>
                        {editableParticipantFields.map(({ field, spec }) => (
                          <EditableInferenceFieldCard
                            key={field.key}
                            field={field}
                            valueType={spec.valueType}
                            addLabel={spec.addLabel}
                            onConfirm={() => confirmInferenceField(field.key)}
                            onUnsure={() => markInferenceFieldUnsure(field.key)}
                            onSave={(value) =>
                              saveInferenceField({ key: field.key, value })
                            }
                            onEvidenceSelect={() => navigate("/lens/evidence")}
                          />
                        ))}
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
                            <Mail
                              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                            <p className="min-w-0">
                              This draft currently lists {participantCount} participant
                              {participantCount === 1 ? "" : "s"}. Every signer must be
                              listed and verify identity during the appointment.
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </section>

                    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <CalendarDays
                            className="h-5 w-5 text-primary"
                            aria-hidden="true"
                          />
                          <h2 className="text-xl font-semibold text-foreground">
                            Choose a date
                          </h2>
                        </div>
                        <StatusBadge status="confirmed" />
                      </div>

                      <label className="mt-6 grid gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Time zone
                        </span>
                        <span className="relative">
                          <select
                            value={appointmentSelection.timezone}
                            onChange={(event) =>
                              selectAppointmentSlot({
                                ...appointmentSelection,
                                timezone: event.currentTarget.value,
                              })
                            }
                            className="min-h-11 w-full appearance-none rounded-md border border-input bg-card px-3 py-2 pr-10 text-sm font-medium text-foreground shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {timezoneValues.map((timezone) => (
                              <option key={timezone} value={timezone}>
                                {timezone}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </span>
                      </label>

                      <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Previous date"
                          onClick={() => chooseAdjacentDate(-1)}
                          disabled={selectedDateIndex === 0}
                        >
                          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <p className="min-w-0 text-center text-sm font-semibold text-foreground">
                          Tue, Jun 09, 2026 - Thu, Jun 11, 2026
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Next date"
                          onClick={() => chooseAdjacentDate(1)}
                          disabled={selectedDateIndex === appointmentDates.length - 1}
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {appointmentDates.map((date) => (
                          <button
                            key={date.value}
                            type="button"
                            aria-pressed={appointmentSelection.date === date.value}
                            onClick={() => chooseDate(date)}
                            className={`min-h-16 rounded-lg border p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              appointmentSelection.date === date.value
                                ? "border-primary bg-primary/10"
                                : "border-border bg-lens-surface-muted hover:border-primary/35"
                            }`}
                          >
                            <span className="block break-words text-sm font-semibold text-foreground">
                              {date.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="mt-6">
                        <h3 className="text-base font-semibold text-foreground">
                          Choose a time
                        </h3>
                        <div className="mt-3 grid gap-3 sm:grid-cols-4">
                          {appointmentTimes.map((time) => (
                            <button
                              key={time.value}
                              type="button"
                              aria-pressed={appointmentSelection.time === time.value}
                              onClick={() =>
                                selectAppointmentSlot({
                                  ...appointmentSelection,
                                  time: time.value,
                                })
                              }
                              className={`min-h-12 rounded-lg border px-3 py-2 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                appointmentSelection.time === time.value
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-lens-surface-muted text-foreground hover:border-primary/35"
                              }`}
                            >
                              {time.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          Selected appointment
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-foreground">
                          {appointmentSelection.dateLabel} at {appointmentSelection.time}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({appointmentSelection.timezone})
                          </span>
                        </p>
                        {payload?.timeslots[0] ? (
                          <p className="mt-2 break-all text-xs text-muted-foreground">
                            Draft timeslot ID: {payload.timeslots[0]}
                          </p>
                        ) : null}
                      </div>

                      <p className="mt-5 break-words text-sm leading-6 text-muted-foreground">
                        Our partner notaries will confirm the final date and time of your
                        appointment by email.
                      </p>
                    </section>
                  </div>

                  <aside className="grid content-start gap-4 text-sm leading-6 text-muted-foreground">
                    <div className="rounded-xl border border-border bg-lens-surface-muted p-5">
                      <p>
                        Every person who signs on one or more documents has to verify
                        their identity. Without verification, the signature cannot be
                        notarised.
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-lens-surface-muted p-5">
                      <p>
                        Pick a date and time that suits you best. The selected option is
                        held for review before the booking request is created.
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
