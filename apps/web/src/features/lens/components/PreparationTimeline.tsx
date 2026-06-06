import { CheckCircle2 } from "lucide-react";

const timeline = [
  {
    title: "Before appointment",
    items: ["Confirm Spain as country of use", "Attach NIE application and personal data form", "Confirm apostille and hard copy"],
  },
  {
    title: "During appointment",
    items: ["Join video appointment", "Verify identity", "Sign with the notary"],
  },
  {
    title: "After appointment",
    items: ["Receive digital original", "Apostille is prepared", "Hard copy ships to Barcelona"],
  },
];

export function PreparationTimeline() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-950">Preparation timeline</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {timeline.map((section) => (
          <article key={section.title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-slate-950">{section.title}</h3>
            <div className="mt-3 grid gap-2">
              {section.items.map((item) => (
                <div key={item} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
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
