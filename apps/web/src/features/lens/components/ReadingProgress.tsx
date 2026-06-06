import { CheckCircle2 } from "lucide-react";

const items = [
  "Extract text from uploaded PDFs",
  "Find country of use evidence",
  "Identify NIE route and companion document",
  "Prepare Notarity payload",
  "Request itemized price",
];

export function ReadingProgress() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Reading documents</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
