import { CheckCircle2 } from "lucide-react";
import { formatBooleanChoice, formatCountry, formatFilesSummary } from "../display";
import type { LensFixture } from "../types";

export function PreparationTimeline({ fixture }: { fixture: LensFixture }) {
  const payload = fixture.payload;
  const country = payload
    ? formatCountry(payload.destinationCountry)
    : formatCountry(fixture.inference.countryOfUse.value);
  const filesSummary = payload
    ? formatFilesSummary(payload)
    : fixture.documents.map((document) => document.canonicalName).join(", ");
  const apostilleSummary = payload
    ? payload.products.some((product) => product.apostille)
      ? "Apostille is prepared"
      : "No apostille selected"
    : `Apostille: ${formatBooleanChoice(fixture.inference.apostille?.value)}`;
  const hardCopySummary = payload
    ? payload.hardCopy.hardCopy
      ? "Hard copy is prepared for shipment"
      : "No hard copy shipment selected"
    : `Hard copy: ${formatBooleanChoice(fixture.inference.hardCopy?.value)}`;
  const timeline = [
    {
      title: "Before appointment",
      items: [
        `Confirm ${country} as country of use`,
        `Attach ${filesSummary}`,
        "Confirm apostille and hard copy",
      ],
    },
    {
      title: "During appointment",
      items: ["Join video appointment", "Verify identity", "Sign with the notary"],
    },
    {
      title: "After appointment",
      items: [
        "Receive digital original",
        apostilleSummary,
        hardCopySummary,
      ],
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-2xl font-semibold text-foreground">Preparation timeline</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {timeline.map((section) => (
          <article key={section.title} className="rounded-lg border border-border bg-lens-surface-muted p-4">
            <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
            <div className="mt-3 grid gap-2">
              {section.items.map((item) => (
                <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-confirmed-foreground" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
