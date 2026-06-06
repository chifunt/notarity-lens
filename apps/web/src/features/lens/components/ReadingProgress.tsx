import { CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ProgressItem = {
  label: string;
  detail: string;
  status: "pending" | "active" | "done";
};

const defaultItems: ProgressItem[] = [
  {
    label: "Extract text from uploaded PDFs",
    detail: "Normalize filenames and read page-level text.",
    status: "done",
  },
  {
    label: "Find country of use evidence",
    detail: "Separate country of use from home, billing, and shipping.",
    status: "done",
  },
  {
    label: "Identify route and companion documents",
    detail: "Map evidence to Notarity product definitions.",
    status: "done",
  },
  {
    label: "Prepare booking payload",
    detail: "Build deterministic fields the user can confirm.",
    status: "done",
  },
  {
    label: "Request itemized price",
    detail: "Use the authoritative pricing endpoint or a safe fixture fallback.",
    status: "done",
  },
];

export function ReadingProgress({ items = defaultItems }: { items?: ProgressItem[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-base font-semibold text-foreground">Reading documents</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-3 py-3 text-sm transition-colors",
              item.status === "done" && "border-status-confirmed/60 bg-status-confirmed/50",
              item.status === "active" && "border-primary/35 bg-status-inferred",
              item.status === "pending" && "border-border bg-muted/50 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                item.status === "done" && "text-status-confirmed-foreground",
                item.status === "active" && "text-primary",
                item.status === "pending" && "text-muted-foreground",
              )}
            >
              {item.status === "done" ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : item.status === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <span>
              <span className="block font-medium text-foreground">{item.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                {item.detail}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
